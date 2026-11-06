# 14. Concurrencia, transacciones y rendimiento

KAFFA opera con varios baristas y clientes simultáneos. Este capítulo explica cómo evita sobreventa, cierres dobles, facturas duplicadas y consultas lentas.

## 14.1 Transacciones

Toda operación que toca más de una tabla usa `TransactionService::run`:

- Pedido: pedido + detalles + pagos + factura + movimientos + stock.
- Compra: compra + detalles + pagos + stock + movimientos.
- Gasto: gasto + pagos + movimientos.
- Merma: merma + stock.
- Caja: apertura/cierre + arqueo.

Si cualquier paso lanza una excepción, PostgreSQL hace rollback. Esto evita estados parciales.

## 14.2 Bloqueos pesimistas

**Tabla.** _Bloqueos pesimistas por recurso_

| Recurso | Lock | Motivo |
|---|---|---|
| Caja | `lockForUpdate` | Evitar doble cierre/uso concurrente |
| Insumos | `lockForUpdate` | Evitar sobreventa |
| Contador de facturas | `lockForUpdate` | Evitar números duplicados |
| Insumo en compra/merma | `lockForUpdate` | Evitar stock negativo |

`lockForUpdate` bloquea la fila hasta el commit/rollback. Mantenga las transacciones cortas: no envíe correos ni llame APIs externas dentro.

## 14.3 Deadlocks

Un deadlock ocurre cuando dos transacciones se bloquean mutuamente. PostgreSQL aborta una con `40P01`. `DB::transaction($callback, 3)` reintenta hasta 3 veces.

Para reducir deadlocks:

- Bloquee filas en orden consistente (por ID ascendente).
- Agrupe consumos por insumo antes de bloquear.
- Evite transacciones largas.
- No mezcle operaciones de distintos dominios en una misma transacción.

## 14.4 Inventario atómico

El listener usa:

```sql
UPDATE insumos
SET stock_actual = GREATEST(0, stock_actual - ?)
WHERE id = ?
```

Ventajas:

- Un solo statement por insumo.
- Sin `SELECT` + `UPDATE` propenso a carrera.
- `GREATEST` evita negativos.
- Bindings parametrizados, sin SQL injection.

La validación previa y el descuento ocurren en la misma transacción, pero el `UPDATE` es la última barrera.

## 14.5 Facturación sin carreras

Secuencia:

1. `UPSERT` del contador `(nombre, anio)`.
2. `SELECT ... FOR UPDATE`.
3. Incremento en memoria.
4. `UPDATE`.
5. Retorno del número.

El bloqueo se libera al commit. Si dos pedidos intentan facturar a la vez, el segundo espera y obtiene el siguiente número.

## 14.6 Paginación y filtros

`HasBasicQueries::consultar`:

- `per_page` por defecto 15, máximo 100.
- Filtros exactos por columnas `fillable` + PK.
- `LIKE` para `nombre`, `descripcion`, `correo`, `nit`, `direccion`, `motivo`.
- `fecha_desde`/`fecha_hasta` sobre `created_at`.
- `sort_by` y `sort_order` validados.
- `eagerRelations` para evitar N+1.

Ejemplo:

```http
GET /api/v1/pedidos?estado=pagado&fecha_desde=2026-10-01&sort_by=created_at&sort_order=desc&per_page=50
```

## 14.7 Índices

La migración `2026_07_31_000000_add_performance_indexes_to_tables.php` añade índices a:

- `pedidos(estado)`, `pedidos(created_at)`
- `pago__pedidos(created_at)`
- `compras(created_at)`, `compras(numero_factura_proveedor)`
- `gastos(created_at)`, `gastos(categoria)`
- `mermas(created_at)`
- `movimiento__cajas(created_at)`, `movimiento__cajas(tipo)`
- `factura__ventas(created_at)`
- `cajas(estado)`

Además hay únicos en `factura__ventas(pedido_id, numero_factura)`, `proveedors.nit`, `turnos(fecha,tipo)`, etc.

> **Recomendación.** Antes de añadir un índice, mida con `EXPLAIN (ANALYZE, BUFFERS)`. Un índice en una columna de baja cardinalidad (p. ej. `activo`) puede no usarse.

## 14.8 Caché

`Medio_Pago::virtualIds()` cachea los IDs de medios virtuales 5 minutos con la clave `medios_pago:virtual_ids`. Se invalida al guardar/eliminar un medio.

Si cambia `CACHE_DRIVER` a Redis, revise la serialización y la expiración. No cachee datos sensibles por usuario sin una clave que incluya el usuario.

## 14.9 Capacidad y límites

**Tabla.** _Límites de capacidad y cuellos de botella_

| Recurso | Límite actual | Cuello de botella |
|---|---|---|
| API global | 60/min por usuario/IP | Picos de sondeo |
| Escrituras operativas | 10/min | Flujo de caja |
| Conexiones PostgreSQL | Según `max_connections` | Workers PHP-FPM |
| Correo | `MAIL_TIMEOUT=10` | SMTP lento |
| Imágenes | 5 MB | Cloudinary/disco |

Para una cafetería pequeña, un servidor de 2 vCPU/4 GB y PostgreSQL local es suficiente. Para varias sedes, separe la base y use Redis para caché/colas.

## 14.10 Pruebas de carga recomendadas

1. Login concurrente de 50 usuarios.
2. 20 pedidos simultáneos sobre el mismo insumo.
3. Dos cierres de caja simultáneos.
4. 100 facturas concurrentes.
5. Sondeo de pedidos/chat durante 10 minutos.

Mida latencia p95, errores 5xx, deadlocks y uso de CPU/IO. No ejecute pruebas de carga contra producción sin autorización.

## 14.11 Antipatrones prohibidos

- `SELECT` de stock y `UPDATE` posterior sin lock.
- Generar número de factura con `MAX(numero)+1`.
- Abrir transacción y enviar correo dentro.
- Reintentar un `POST` sin idempotencia.
- Consultar relaciones dentro de un bucle (N+1).
- Usar `float` para sumas contables críticas.
- Desactivar `lockForUpdate` “para que sea más rápido”.

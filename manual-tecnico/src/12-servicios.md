# 12. Servicios de negocio

Los servicios son el corazón del backend. Este capítulo explica su algoritmo, las tablas que tocan, los bloqueos que usan y los errores que producen. Está pensado para modificar código sin romper invariantes.

## 12.1 `TransactionService`

```php
public static function run(Closure $callback, int $attempts = 3)
{
    return DB::transaction($callback, $attempts);
}
```

`DB::transaction` hace commit si el callback termina y rollback si lanza una excepción. `$attempts=3` reintenta ante **deadlocks** (PostgreSQL `40P01`, MySQL `1213`). No reintenta errores de validación ni de negocio.

> **Advertencia.** El callback debe ser idempotente ante reintentos. No envíe correos ni llame APIs externas dentro de una transacción con reintentos.

## 12.2 `PedidoService::crear`

### 12.2.1 Algoritmo

```text
1. Abrir transacción.
2. Obtener usuario autenticado; si no, 401.
3. Validar estado permitido.
4. Resolver autoría:
   - admin: cliente_id/barista_id del payload
   - barista: barista_id = Auth::id(); cliente_id opcional
   - cliente: cliente_id = Auth::id(); estado = pendiente
5. Si caja_id:
   - lockForUpdate
   - existe, abierta, propia del barista
6. Crear pedido.
7. Cargar productos y recetas; agregar consumo por insumo.
8. lockForUpdate insumos; validar stock.
9. Crear detalles; sumar subtotales.
10. Crear pagos; sumar montos.
11. Validar Σ pagos ≈ total (±0.01).
12. Si estado=pagado y no hay pagos: 422.
13. Si factura: generar número y crear factura.
14. Si caja: crear movimiento ingreso por cada pago.
15. Actualizar total si corresponde.
16. Disparar PedidoCreado → DeducirInventario.
17. Devolver pedido con relaciones.
```

### 12.2.2 Errores de negocio

**Tabla.** _Errores de negocio de PedidoService_

| Código | HTTP | Condición |
|---|---|---|
| `PERMISO_DENEGADO` | 403 | Rol no autorizado |
| `CAJA_NO_EXISTE` | 422 | `caja_id` inexistente |
| `CAJA_CERRADA` | 422 | Caja no abierta |
| `CAJA_AJENA` | 422 | Barista usa caja de otro |
| — | 422 | Stock insuficiente |
| — | 422 | Σ pagos ≠ total |
| — | 422 | Pedido pagado sin pagos |

### 12.2.3 Pseudocódigo de stock

```text
consumo = {}
for detalle in detalles:
    producto = Producto::with('insumos')->find(detalle.producto_id)
    for insumo in producto.insumos:
        consumo[insumo.id] += detalle.cantidad * insumo.pivot.cantidad

insumos = Insumo::lockForUpdate()->whereIn('id', consumo.keys())->get()
for id, cantidad in consumo:
    if insumos[id].stock_actual < cantidad:
        throw Stock insuficiente
```

### 12.2.4 Eliminación

`PedidoService::eliminar` borra detalles, movimientos de caja, pagos y factura, y hace soft delete del pedido. **No repone stock.** Si el pedido fue un error, registre una merma o un ajuste.

## 12.3 `CompraService::crear`

```text
1. Transacción.
2. Validar caja (si se envía) con lockForUpdate.
3. Crear compra.
4. Por cada detalle:
   - lockForUpdate insumo
   - crear detalle
   - incrementar stock_actual
5. Crear pagos.
6. Validar Σ pagos = total_compra (±0.01).
7. Crear movimientos egreso por pago.
8. Devolver compra.
```

Al eliminar:

```text
1. Transacción.
2. lockForUpdate insumos de los detalles.
3. Verificar que stock_actual - cantidad >= 0 para cada uno.
4. Restar stock.
5. Borrar detalles, pagos, movimientos y compra (soft delete).
```

Si la reversión dejaría stock negativo, lanza `BusinessRuleException` y no elimina.

## 12.4 `GastoService`

- Fuerza `usuario_id = Auth::id()`.
- Crea el gasto y sus pagos.
- Valida comprobante en medios virtuales.
- Genera movimientos `egreso` si hay caja.
- Al eliminar, borra pagos y movimientos y hace soft delete.

El monto del gasto **no** vive en `gastos`; se calcula sumando `gasto__pagos`. Las consultas de reportes deben agregar esa tabla.

## 12.5 `MermaService`

```text
1. Transacción.
2. lockForUpdate insumo.
3. Validar cantidad <= stock_actual.
4. Crear merma con usuario_id = Auth::id().
5. Restar stock.
6. Al eliminar: sumar stock y borrar merma.
```

La merma no genera movimiento de caja; es una pérdida de inventario, no un egreso monetario.

## 12.6 `Caja`

### 12.6.1 Apertura (`Caja::crearRegistro`)

```php
$data['abierta_por'] = Auth::id();
$data['estado'] = $data['estado'] ?? 'abierta';
$data['fecha_apertura'] = $data['fecha_apertura'] ?? now();
$data['turno_id'] = TurnoService::getActiveTurno(Auth::user())?->id;
$data['monto_apertura_sistema'] = $data['monto_apertura_fisico'] ?? 0;
```

El `turno_id` es `null` para admin. El desglose efectivo/digital es opcional; si falta, todo el físico se asume efectivo.

### 12.6.2 Cierre (`Caja::actualizarRegistro`)

```php
$vaACerrar = ($data['estado'] ?? null) === 'cerrada' || isset($data['monto_cierre_fisico']);
if ($vaACerrar) {
    $data['cerrada_por'] = Auth::id();
    $data['fecha_cierre'] = $data['fecha_cierre'] ?? now();
    unset($data['monto_cierre_sistema']);
    $caja = self::with('movimientos')->findOrFail($id);
    $apertura = (float) $caja->monto_apertura_sistema;
    $ingresos = $caja->movimientos->where('tipo','ingreso')->sum('monto');
    $egresos  = $caja->movimientos->where('tipo','egreso')->sum('monto');
    $data['monto_cierre_sistema'] = $apertura + $ingresos - $egresos;
}
```

El cliente puede declarar `monto_cierre_fisico`, efectivo y digital, pero **no** el sistema.

### 12.6.3 Eliminación

Si `movimientos()->exists()`, lanza 422. No hay borrado en cascada de movimientos.

## 12.7 `FacturaService::generarNumeroFactura`

```php
DB::table('factura_contadores')->upsert(
    ['nombre' => 'F', 'anio' => $anio, 'valor' => 0],
    ['nombre', 'anio'],
    ['nombre', 'anio']
);
$contador = DB::table('factura_contadores')
    ->where('nombre', 'F')->where('anio', $anio)
    ->lockForUpdate()->first();
$siguiente = (int) $contador->valor + 1;
DB::table('factura_contadores')->where('id', $contador->id)
    ->update(['valor' => $siguiente, 'updated_at' => now()]);
return 'F' . $anio . str_pad($siguiente, 6, '0', STR_PAD_LEFT);
```

Propiedades:

- UPSERT + `SELECT ... FOR UPDATE` evita carreras.
- El contador es por año.
- No hay huecos si la transacción falla (rollback).
- El formato es `F{AÑO}{NNNNNN}`.

> **Advertencia.** No llame `generarNumeroFactura` fuera de una transacción; el bloqueo se libera al terminar la sentencia y podría duplicar números.

## 12.8 `TurnoService`

### 12.8.1 Horarios

**Tabla.** _Horarios de TurnoService_

| Tipo | Inicio | Fin |
|---|---|---|
| `mañana` | 07:00 | 13:00 |
| `tarde` | 13:00 | 18:00 |
| `abierto` | 05:00 | 22:00 |

### 12.8.2 Turno activo

```text
ahora = now(America/Bogota)
if 05:00 <= hora < 22:00:
    buscar turno 'abierto' del barista que cubra hoy
    if existe: return
tipo = 'mañana' si 07:00–13:00; 'tarde' si 13:00–18:00; null fuera
buscar turno del tipo que cubra hoy
```

Un turno cubre hoy si `fecha <= hoy <= fecha_fin` o `fecha_fin` es nula y `fecha = hoy`.

### 12.8.3 Minutos restantes

`minutosRestantes` usa la hora fin del tipo y la hora actual. Puede ser negativo si el turno ya terminó; el middleware responde `TURNO_EXPIRADO`.

## 12.9 `RegistrationService` y `OtpService`

### 12.9.1 Registro

```text
iniciar(nombre, correo, password):
  if usuario existe: validar unique (422)
  upsert registros_pendientes (password hashed)
  generar OTP tipo verificacion
  enviar correo
```

Si el correo ya existe como usuario, `Store` falla por `unique:users,correo`. Si existe como pendiente, se actualiza y se reenvía.

### 12.9.2 Confirmación

```text
confirmar(correo, codigo):
  buscar pendiente
  validar OTP
  DB::transaction:
    crear User verificado (email_verified_at=now)
    asignar rol cliente
    eliminar pendiente
```

### 12.9.3 OTP

- `generar`: `updateOrCreate` por `(correo,tipo)`, hash, expiración, intentos=0, enviado_at=now.
- `validar`: no encontrado, expirado, demasiados, incorrecto (incrementa), ok (elimina).
- `puedeReenviar`: compara `enviado_at` con el cooldown.

Los parámetros se leen de `config/otp.php`, que a su vez lee `.env`.

## 12.10 `AsistenteService`

El servicio es local y deterministico:

```text
responder(pregunta, usuarioId, rol):
  persistir mensaje user
  respuesta = generarRespuesta(pregunta, rol)
  persistir mensaje assistant
  return {respuesta, mensaje_id, created_at}
```

Detección de intención por palabras clave normalizadas (sin tildes, minúsculas). Staff:

**Tabla.** _Intenciones detectadas por el AsistenteService_

| Intención | Palabras | Respuesta |
|---|---|---|
| Predicción | predice, pronóstico, tendencia | Promedio móvil 7 días (solo admin) |
| Promoción | marketing, descuento, oferta | Recomendaciones (solo admin) |
| Gastos | gasto, egreso, margen | Resumen de gastos (solo admin) |
| Inventario | insumo, stock, reponer | Insumos bajo mínimo |
| Productos | más vendido, top, ranking | Top de productos |
| Pedidos | pedido, pendiente, cola | Conteo por estado |
| Ventas | venta, ingreso, factura, caja | Resumen hoy/7 días/mes |

Cliente: menú, medios de pago, cómo pedir, eventos, sede. No recibe métricas internas.

> **Recomendación.** Si se conecta un LLM, mantenga la detección de intención y el filtro por rol; no envíe el contexto completo de la base al proveedor.

## 12.11 Tabla resumen de servicios

**Tabla.** _Resumen transaccional de los servicios_

| Servicio | Transacción | Locks | Efectos |
|---|---|---|---|
| PedidoService | Sí | Caja, insumos | Pedido, pagos, factura, caja, stock |
| CompraService | Sí | Caja, insumos | Compra, stock, pagos, caja |
| GastoService | Sí | Caja | Gasto, pagos, caja |
| MermaService | Sí | Insumo | Merma, stock |
| FacturaService | Requiere | Contador | Número de factura |
| TurnoService | Sí (crear/editar) | — | Turno y baristas |
| RegistrationService | Sí (confirmar) | — | Usuario, rol, pendiente |
| OtpService | No | — | Código OTP |
| AsistenteService | No | — | Mensajes |

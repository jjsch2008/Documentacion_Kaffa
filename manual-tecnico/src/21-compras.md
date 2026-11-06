# 21. API de compras, proveedores, gastos y mermas

Estos recursos operan inventario y egresos. Todos exigen `role:admin,barista` y `turno.activo`; las escrituras tienen throttle 10/min y ability específica.

## 21.1 Endpoints

**Tabla.** _Endpoints de compras, proveedores, gastos y mermas_

| Recurso | Métodos | Ability | Efecto |
|---|---|---|---|
| `/compras` | CRUD | `compras:manage` | Aumenta stock y egresa caja |
| `/detalle-compras` | CRUD | `compras:manage` | Líneas de compra |
| `/compra-pagos` | CRUD | `compras:manage` | Pagos de compra |
| `/proveedores` | CRUD | `proveedores:manage` (solo admin para escritura) | Catálogo de proveedores |
| `/gastos` | CRUD | `gastos:manage` | Egreso operativo |
| `/gasto-pagos` | CRUD | `gastos:manage` | Pagos de gasto |
| `/mermas` | CRUD | `mermas:manage` | Reduce stock |

## 21.2 Compras

### Crear

```json
{
  "proveedor_id": 1,
  "numero_factura_proveedor": "FV-2026-001",
  "fecha_compra": "2026-10-20",
  "total_compra": 250000,
  "detalles": [
    { "insumo_id": 3, "cantidad": 10, "precio_costo": 12000 },
    { "insumo_id": 4, "cantidad": 5, "precio_costo": 26000 }
  ],
  "pagos": [
    { "medio_pago_id": 4, "monto": 250000, "comprobante_url": "https://..." }
  ]
}
```

Reglas:

- `detalles` obligatorio, al menos 1.
- `cantidad` ≥ 0.01, `precio_costo` ≥ 0.
- `total_compra` ≥ 0.
- Σ pagos = total (±0.01).
- Comprobante si medio virtual.
- Incrementa stock por cada detalle.
- Cada pago genera egreso de caja si se usa caja.
- Si no se envía `caja_id`, no hay movimiento de caja.

### Eliminar

Revierte stock. Si el stock quedaría negativo, responde 422 y no elimina.

## 21.3 Proveedores

```json
{
  "nit": "900123456-7",
  "nombre": "Distribuidora Andina",
  "telefono": "+57 300 000 0000",
  "correo": "ventas@andina.example",
  "direccion": "Popayán",
  "activo": true
}
```

- `nit` único.
- Lectura admin/barista; escritura solo admin (`proveedores:manage`).
- Soft delete.

## 21.4 Gastos

```json
{
  "descripcion": "Servicios públicos",
  "categoria": "Servicios",
  "pagos": [
    { "medio_pago_id": 1, "monto": 180000 }
  ]
}
```

Reglas:

- `usuario_id` forzado al autenticado.
- El monto vive en `gasto__pagos`.
- Cada pago genera egreso de caja si se usa caja.
- Al eliminar, se borran pagos y movimientos.

## 21.5 Mermas

```json
{
  "insumo_id": 3,
  "cantidad": 1.5,
  "motivo": "Derrame en preparación"
}
```

Reglas:

- `usuario_id` forzado.
- `cantidad` no puede superar el stock.
- Reduce `stock_actual`.
- Al eliminar, restaura stock.
- No genera movimiento de caja.

## 21.6 Stock: reglas de oro

**Tabla.** _Reglas de stock por acción_

| Acción | Stock |
|---|---|
| Compra | + cantidad |
| Venta | − consumo por receta |
| Merma | − cantidad |
| Eliminar compra | − cantidad (revierte) |
| Eliminar merma | + cantidad (restaura) |
| Editar compra | **No** ajusta stock automáticamente |

> **Advertencia.** `PUT /compras/{id}` actualiza la cabecera, pero no recalcula stock por cambios en detalles. Si necesita corregir una compra, elimínela y créela de nuevo, o implemente un ajuste explícito.

## 21.7 Caja en compras/gastos

Si se envía `caja_id`:

- Debe existir y estar abierta.
- Un barista solo puede usar su caja.
- Se genera un movimiento `egreso` por cada pago.

Si no se envía, el egreso no afecta ninguna caja y el arqueo no lo verá.

## 21.8 Errores

**Tabla.** _Errores frecuentes de compras y mermas_

| HTTP | Causa |
|---|---|
| 403 | Barista sin turno |
| 403 | Token sin ability |
| 422 | Σ pagos ≠ total |
| 422 | Comprobante faltante |
| 422 | Stock insuficiente al revertir |
| 422 | Caja ajena/cerrada |
| 422 | Merma mayor al stock |

## 21.9 Ejemplo `curl`

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"barista@kaffa.com","password":"barista123"}' | jq -r .access_token)

curl -s -X POST http://127.0.0.1:8000/api/v1/compras \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "numero_factura_proveedor":"FV-2026-001",
    "total_compra":120000,
    "detalles":[{"insumo_id":3,"cantidad":10,"precio_costo":12000}],
    "pagos":[{"medio_pago_id":1,"monto":120000}]
  }' | jq
```

## 21.10 Reportería

Para calcular gastos totales, agregue `gasto__pagos`, no `gastos` (no tiene monto). Para compras, use `compras.total_compra` o sume `detalle__compras`. Documente qué fuente usa cada reporte para evitar cifras inconsistentes.

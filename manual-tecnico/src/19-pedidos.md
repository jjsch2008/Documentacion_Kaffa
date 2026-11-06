# 19. API de pedidos, pagos y facturas

Este es el módulo más crítico: mueve dinero, stock, caja y facturación. Cualquier cambio debe ir acompañado de pruebas y revisión de los invariantes del capítulo 9.

## 19.1 Endpoints

**Tabla.** _Endpoints de pedidos, pagos y facturas_

| Método | Endpoint | Roles | Middleware |
|---|---|---|---|
| GET | `/pedidos` | Admin/barista: todos; cliente: propios | `auth` |
| POST | `/pedidos` | Admin/barista/cliente | `role`, `turno.activo`, `throttle:10,1`, `ability:pedidos:create,pedidos:manage` |
| GET | `/pedidos/{id}` | Admin/barista; cliente propio | `auth` |
| PUT | `/pedidos/{id}` | Admin/barista | `role`, `turno.activo`, `throttle:10,1`, `ability:pedidos:manage` |
| DELETE | `/pedidos/{id}` | Admin/barista | Ídem |
| GET | `/pago-pedidos` | Admin/barista | `role` |
| POST | `/pago-pedidos` | Admin/barista | `role`, `turno.activo`, `throttle`, `ability` |
| PUT/DELETE | `/pago-pedidos/{id}` | Admin/barista | Ídem |
| GET | `/factura-ventas` | Admin | `role:admin` |
| POST/PUT/DELETE | `/factura-ventas` | Admin | `ability:facturas:manage` |

## 19.2 `POST /pedidos`

### Payload completo

```json
{
  "cliente_id": 3,
  "barista_id": 2,
  "total": 25500,
  "propina": 2000,
  "estado": "pendiente",
  "caja_id": 1,
  "descripcion_movimiento": "Venta de café",
  "detalles": [
    {
      "producto_id": 1,
      "cantidad": 2,
      "precio_unitario": 10000,
      "subtotal": 20000,
      "nota": "sin azúcar"
    }
  ],
  "pagos": [
    {
      "medio_pago_id": 4,
      "monto": 25500,
      "comprobante_url": "https://res.cloudinary.com/roffd6et/image/upload/.../recibo.jpg"
    }
  ],
  "factura": {
    "subtotal": 23000,
    "impuestos": 2500,
    "total": 25500
  }
}
```

### Reglas

- `estado` ∈ `pendiente | pagado | cancelado | entregado`.
- `detalles[].cantidad` entero ≥ 1.
- `nota` máx. 500.
- `pagos[].monto` ≥ 0.01.
- Comprobante obligatorio si el medio es virtual.
- Σ pagos ≈ total (±0.01).
- `pagado` exige ≥ 1 pago.
- Caja existente, abierta y propia del barista.
- Stock validado por receta antes de crear.
- Factura generada por el servidor.
- Cada pago genera movimiento de caja `ingreso`.
- El evento `PedidoCreado` descuenta stock.

### Response 201

```json
{
  "data": {
    "id": 101,
    "cliente_id": 3,
    "barista_id": null,
    "total": "25500.00",
    "propina": "2000.00",
    "estado": "pendiente",
    "detalles": [
      {
        "id": 201,
        "producto_id": 1,
        "cantidad": "2.00",
        "precio_unitario": "10000.00",
        "subtotal": "20000.00",
        "nota": "sin azúcar",
        "producto": { "id": 1, "nombre": "Capuchino" }
      }
    ],
    "pagos": [
      {
        "id": 301,
        "medio_pago_id": 4,
        "monto": "25500.00",
        "comprobante_url": "https://..."
      }
    ],
    "factura_venta": {
      "id": 401,
      "numero_factura": "F2026000042",
      "total": "25500.00"
    }
  }
}
```

Los importes se serializan como strings decimales.

## 19.3 Autoría por rol

**Tabla.** _Autoría y comportamiento por rol_

| Rol | Comportamiento |
|---|---|
| Cliente | `cliente_id = Auth::id()`, `estado = pendiente`, sin barista |
| Barista | `barista_id = Auth::id()`, `cliente_id` opcional |
| Admin | Puede asignar ambos libremente |

Un cliente que envíe `cliente_id` de otro será ignorado y se usará su propio ID.

## 19.4 `PUT /pedidos/{id}`

Solo acepta:

```json
{ "total": 26000, "propina": 2500, "estado": "pagado" }
```

No se puede cambiar `cliente_id` ni `barista_id` (autoría inmutable). Si un barista actualiza un pedido sin barista, el backend lo autoasigna.

## 19.5 `DELETE /pedidos/{id}`

Elimina detalles, movimientos de caja, pagos y factura; soft delete del pedido. **No restaura stock**. Devuelve:

```json
{ "message": "Registro eliminado" }
```

## 19.6 Pagos de pedido

### Crear

```json
{
  "pedido_id": 101,
  "medio_pago_id": 1,
  "monto": 5000,
  "comprobante_url": null
}
```

Reglas:

- `pedido_id` existente.
- `medio_pago_id` existente.
- `monto` ≥ 0.01.
- Comprobante si el medio es virtual.
- Requiere turno activo para barista.

> **Advertencia.** Crear un pago por separado **no** recalcula automáticamente el total del pedido ni valida la suma global. Use `POST /pedidos` para el flujo completo o agregue la lógica de conciliación en el servicio.

## 19.7 Facturas

### Listar

```http
GET /api/v1/factura-ventas?per_page=20
```

Solo admin. El cliente ve la factura de sus pedidos a través de `GET /pedidos` (`factura_venta`).

### Crear

```json
{
  "pedido_id": 101,
  "subtotal": 23000,
  "impuestos": 2500,
  "total": 25500,
  "fecha_emision": "2026-10-20"
}
```

El `numero_factura` **no se envía**; lo genera `FacturaService`. Si intenta enviarlo, se ignora.

## 19.8 Errores frecuentes

**Tabla.** _Errores frecuentes de pedidos_

| HTTP | Código/mensaje | Causa |
|---|---|---|
| 403 | `TURNO_INACTIVO` | Barista sin turno |
| 403 | `TOKEN_SIN_ABILITY` | Token sin `pedidos:manage` |
| 422 | `CAJA_CERRADA` | Caja no abierta |
| 422 | `CAJA_AJENA` | Caja de otro barista |
| 422 | `Stock insuficiente...` | Receta sin stock |
| 422 | `La suma de pagos no coincide...` | Total inconsistente |
| 422 | `El comprobante es obligatorio...` | Medio virtual sin URL |
| 422 | `Un pedido pagado debe tener...` | Estado pagado sin pagos |

## 19.9 Ejemplo `curl`

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"cliente@kaffa.com","password":"cliente123"}' | jq -r .access_token)

curl -s -X POST http://127.0.0.1:8000/api/v1/pedidos \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "total": 17000,
    "detalles": [
      {"producto_id": 1, "cantidad": 2, "precio_unitario": 8500, "subtotal": 17000}
    ],
    "pagos": [
      {"medio_pago_id": 1, "monto": 17000}
    ]
  }' | jq
```

El cliente no envía `cliente_id`; el backend lo fuerza.

## 19.10 Recomendaciones de integración

- Muestre el total calculado por el backend, no solo el del carrito.
- Para medios virtuales, suba el comprobante antes de crear el pedido.
- Tras un timeout, consulte `GET /pedidos` antes de reintentar.
- No use `DELETE` para “corregir” una venta; registre el ajuste correspondiente.
- Si implementa pagos en línea, añada idempotencia y conciliación.

# 20. API de caja y movimientos

La caja es el control de efectivo por sesión. El backend calcula el arqueo y bloquea la eliminación de cajas con movimientos.

## 20.1 Endpoints

**Tabla.** _Endpoints de caja y movimientos_

| Método | Endpoint | Roles | Notas |
|---|---|---|---|
| GET | `/cajas` | Admin/barista | Barista ve todas; la SPA filtra por `abierta_por` |
| POST | `/cajas` | Admin/barista | `turno.activo`, throttle 10/min, ability |
| GET | `/cajas/{id}` | Admin/barista | Incluye movimientos |
| PUT | `/cajas/{id}` | Admin/barista | Cierre/actualización |
| DELETE | `/cajas/{id}` | Admin/barista | 422 si hay movimientos |
| GET | `/movimiento-cajas` | Admin/barista | Lectura |
| POST/PUT/DELETE | `/movimiento-cajas` | Admin | Escritura manual |
| GET | `/turno-activo` | Autenticados | Turno actual |

## 20.2 Apertura

Request:

```json
{
  "monto_apertura_fisico": 100000,
  "monto_apertura_efectivo": 80000,
  "monto_apertura_digital": 20000
}
```

Response 201:

```json
{
  "data": {
    "id": 12,
    "abierta_por": 2,
    "turno_id": 4,
    "estado": "abierta",
    "monto_apertura_sistema": "100000.00",
    "monto_apertura_fisico": "100000.00",
    "monto_apertura_efectivo": "80000.00",
    "monto_apertura_digital": "20000.00",
    "fecha_apertura": "2026-10-20T08:00:00-05:00"
  }
}
```

Campos que el cliente **no** envía: `abierta_por`, `turno_id`, `estado`, `fecha_apertura`, `monto_apertura_sistema`.

## 20.3 Cierre

Request:

```json
{
  "estado": "cerrada",
  "monto_cierre_fisico": 150000,
  "monto_cierre_efectivo": 120000,
  "monto_cierre_digital": 30000
}
```

El servidor calcula:

```text
monto_cierre_sistema = apertura + ingresos - egresos
```

Response:

```json
{
  "data": {
    "id": 12,
    "estado": "cerrada",
    "cerrada_por": 2,
    "monto_cierre_sistema": "150000.00",
    "monto_cierre_fisico": "150000.00",
    "fecha_cierre": "2026-10-20T18:05:00-05:00"
  }
}
```

Si `monto_cierre_fisico` no coincide, la diferencia es faltante/sobrante; el backend no la corrige.

## 20.4 Movimientos

Tipos:

- `ingreso`: pagos de pedidos.
- `egreso`: pagos de compras/gastos.

Campos:

**Tabla.** _Campos de un movimiento de caja_

| Campo | Uso |
|---|---|
| `caja_id` | Caja asociada |
| `tipo` | `ingreso`/`egreso` |
| `monto` | Importe |
| `pedido_pago_id` | Pago de pedido (si aplica) |
| `compra_pago_id` | Pago de compra |
| `gasto_pago_id` | Pago de gasto |
| `descripcion` | Texto libre |

Los movimientos operativos los crean los servicios. El barista **no** debe crearlos manualmente; solo el admin puede escribir en `/movimiento-cajas`.

## 20.5 Reglas

- Una caja se abre con monto físico; el sistema toma ese valor como apertura.
- Solo se puede operar una caja abierta.
- Un barista solo opera su propia caja.
- No se elimina una caja con movimientos.
- El cierre exige turno activo para barista.
- Admin puede abrir/cerrar sin turno; `turno_id` queda `null`.

## 20.6 Arqueo

```text
sistema = apertura + ingresos - egresos
diferencia = fisico - sistema
```

**Tabla.** _Interpretación de la diferencia de arqueo_

| Diferencia | Interpretación |
|---|---|
| 0 | Perfecto |
| < 0 | Faltante |
| > 0 | Sobrante |

La SPA muestra el resultado. El backend guarda los montos, no una bandera de “cuadre”.

## 20.7 Errores

**Tabla.** _Errores frecuentes de caja_

| HTTP | Causa |
|---|---|
| 403 | Barista sin turno |
| 422 | Caja con movimientos al eliminar |
| 422 | Datos de cierre inválidos |
| 422 | Barista intenta usar caja ajena (en pedido/compra/gasto) |
| 404 | Caja inexistente |

## 20.8 Ejemplo `curl`

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"barista@kaffa.com","password":"barista123"}' | jq -r .access_token)

curl -s -X POST http://127.0.0.1:8000/api/v1/cajas \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"monto_apertura_fisico":100000}' | jq

curl -s -X PUT http://127.0.0.1:8000/api/v1/cajas/12 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"estado":"cerrada","monto_cierre_fisico":150000}' | jq
```

> **Advertencia.** Cerrar una caja con un `monto_cierre_fisico` incorrecto no falla: se registra el faltante/sobrante. La validación es humana; el sistema solo calcula.

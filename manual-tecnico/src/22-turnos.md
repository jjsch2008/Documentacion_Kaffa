# 22. API de turnos

Los turnos definen quién trabaja y cuándo. El backend usa `America/Bogota` y aplica el middleware `turno.activo` a las operaciones de barista.

## 22.1 Endpoints

**Tabla.** _Endpoints de turnos_

| Método | Endpoint | Roles | Descripción |
|---|---|---|---|
| GET | `/turnos` | Admin | Lista con baristas |
| POST | `/turnos` | Admin | Crea turno y asigna baristas |
| GET | `/turnos/{id}` | Admin | Detalle |
| PUT | `/turnos/{id}` | Admin | Actualiza y reemplaza baristas |
| DELETE | `/turnos/{id}` | Admin | 422 si tiene cajas |
| GET | `/mis-turnos` | Barista | Turnos propios |
| GET | `/turno-activo` | Autenticados | Turno actual |

## 22.2 Crear

```json
{
  "fecha": "2026-10-20",
  "fecha_fin": "2026-10-27",
  "tipo": "abierto",
  "barista_ids": [2, 5]
}
```

Reglas:

- `fecha` `Y-m-d`.
- `fecha_fin` opcional, ≥ `fecha`; si se omite, dura un día.
- `tipo` ∈ `mañana | tarde | abierto`.
- `barista_ids` ≥ 1.
- Único por `fecha + tipo` (restricción de BD).
- `abierto` tiene prioridad sobre mañana/tarde.

## 22.3 Horarios

**Tabla.** _Horarios por tipo de turno_

| Tipo | Horario |
|---|---|
| `mañana` | 07:00–13:00 |
| `tarde` | 13:00–18:00 |
| `abierto` | 05:00–22:00 |

Fuera de 05:00–22:00 no hay turno esperado. Un turno `abierto` cubre toda la jornada extendida.

## 22.4 Turno activo

`GET /turno-activo` devuelve:

```json
{
  "turno_activo": true,
  "turno_info": {
    "id": 4,
    "fecha": "2026-10-20",
    "fecha_fin": "2026-10-20",
    "tipo": "mañana",
    "minutos_restantes": 95,
    "hora_inicio": "07:00",
    "hora_fin": "13:00"
  }
}
```

Para admin/cliente:

```json
{ "turno_activo": false, "turno_info": null }
```

## 22.5 `mis-turnos`

Barista autenticado. Paginación 15, orden `fecha,tipo asc`.

```json
{
  "data": [
    { "id": 4, "fecha": "2026-10-20", "tipo": "mañana", "baristas": [...] }
  ],
  "links": { ... },
  "meta": { ... }
}
```

## 22.6 Reglas de negocio

- Un turno no se puede eliminar si tiene cajas asociadas (422).
- El admin puede crear/editar turnos sin restricción de turno.
- El barista solo consulta; no crea turnos.
- Un turno con rango cubre cada día entre `fecha` y `fecha_fin`.
- El tipo `abierto` se busca primero; si existe, gana.

## 22.7 Errores

**Tabla.** _Errores frecuentes de turnos_

| HTTP | Código | Causa |
|---|---|---|
| 403 | `FUERA_HORARIO` | Barista fuera de horario |
| 403 | `TURNO_INACTIVO` | Sin turno asignado |
| 403 | `TURNO_EXPIRADO` | Turno terminado |
| 422 | — | `fecha_fin` < `fecha`, tipo inválido, sin baristas |
| 422 | — | Eliminar turno con cajas |

## 22.8 Ejemplo `curl`

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@kaffa.com","password":"admin123"}' | jq -r .access_token)

curl -s -X POST http://127.0.0.1:8000/api/v1/turnos \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"fecha":"2026-10-21","tipo":"mañana","barista_ids":[2]}' | jq
```

## 22.9 Operación diaria

1. El admin crea turnos del día o de la semana.
2. El barista inicia sesión; `login` devuelve `turno_activo`.
3. Si no tiene turno, no puede cobrar ni abrir caja.
4. Al terminar, cierra caja.
5. El admin puede reasignar baristas si hay ausencias.

> **Recomendación.** Cree turnos con anticipación y valide la zona horaria del servidor. Un desfase de una hora puede dejar al barista fuera de turno o permitirle operar cuando no debe.

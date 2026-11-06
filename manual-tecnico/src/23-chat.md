# 23. API de chat y reportes

El chat conecta clientes con baristas/admin. Los reportes permiten al barista informar novedades al admin.

## 23.1 Chat: endpoints

**Tabla.** _Endpoints de chat_

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/mensajes` | Bandeja de contactos o hilo con `?con={id}` |
| GET | `/mensajes/contactos` | Sugerencias según rol |
| POST | `/mensajes` | Enviar mensaje |
| POST | `/mensajes/leer` | Marcar leídos de un contacto |

## 23.2 Bandeja

Sin `?con`:

```json
{
  "contactos": [
    {
      "id": 2,
      "nombre": "Barista Demo",
      "ultimo_mensaje": "Tu pedido está listo",
      "ultima_hora": "2026-10-20T15:30:00-05:00",
      "no_leidos": 2
    }
  ]
}
```

Con `?con=2`:

```json
{
  "contacto": { "id": 2, "nombre": "Barista Demo" },
  "data": [
    { "id": 10, "remitente_id": 2, "destinatario_id": 3, "mensaje": "Hola", "leido": true, "created_at": "..." }
  ],
  "links": { ... },
  "meta": { ... }
}
```

El hilo se pagina de 50 en 50, descendente.

## 23.3 Enviar

```json
{
  "destinatario_id": 2,
  "mensaje": "¿Mi pedido está listo?"
}
```

Reglas:

- `mensaje` requerido, máx. 1000.
- No auto-mensajes.
- No cliente→cliente.
- Destinatario debe existir y estar activo.
- Barista/admin pueden escribir a clientes; cliente a barista/admin.

Errores 422: destinatario inexistente/inactivo, auto-mensaje, cliente→cliente.

## 23.4 Marcar leídos

```json
{ "con": 2 }
```

Marca como leídos todos los mensajes no leídos de ese contacto para el usuario autenticado.

## 23.5 Contactos sugeridos

`GET /mensajes/contactos` devuelve usuarios activos según rol:

- Cliente → baristas y admins.
- Barista/admin → clientes.

No expone correos ni datos sensibles.

## 23.6 Reportes

**Tabla.** _Endpoints de reportes_

| Método | Endpoint | Rol |
|---|---|---|
| POST | `/reportes` | Admin/barista |
| GET | `/reportes` | Admin |
| GET | `/reportes/{id}` | Admin |
| PUT/PATCH | `/reportes/{id}` | Admin |
| DELETE | `/reportes/{id}` | Admin |

Crear:

```json
{
  "mensaje": "Falta leche entera",
  "prioridad": "alta"
}
```

Reglas:

- `barista_id` forzado al autenticado.
- `prioridad` ∈ `baja | media | alta`.
- `leido` default `false`.
- Admin puede editar mensaje, prioridad y leído.

## 23.7 Sondeo

La SPA usa:

- Chat/no leídos: 5 s.
- Reportes: según vista.

Respete el throttle global. No sondee el hilo completo si solo necesita no leídos; use `GET /mensajes` (bandeja).

## 23.8 Errores

**Tabla.** _Errores frecuentes de chat y reportes_

| HTTP | Causa |
|---|---|
| 401 | Sin token |
| 403 | Cliente intenta gestionar reportes |
| 422 | Mensaje vacío o >1000 |
| 422 | Auto-mensaje o cliente→cliente |
| 422 | Destinatario inactivo |

## 23.9 Ejemplo `curl`

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"cliente@kaffa.com","password":"cliente123"}' | jq -r .access_token)

curl -s -X POST http://127.0.0.1:8000/api/v1/mensajes \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"destinatario_id":2,"mensaje":"¿Mi pedido está listo?"}' | jq

curl -s "http://127.0.0.1:8000/api/v1/mensajes?con=2" \
  -H "Authorization: Bearer $TOKEN" | jq
```

> **Recomendación.** Para soporte, muestre primero la bandeja y solo cargue el hilo al abrir la conversación. Evita consultas innecesarias y mejora la privacidad.

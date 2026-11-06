# 25. Asistente KAFFA

El Asistente KAFFA es un chatbot **local** disponible para todos los usuarios autenticados. No usa un proveedor externo: interpreta la pregunta por palabras clave y responde con consultas reales a la base, adaptando el contenido al rol.

## 25.1 Endpoints

**Tabla.** _Endpoints del Asistente KAFFA_

| Método | Endpoint | Roles | Throttle |
|---|---|---|---|
| GET | `/asistente/mensajes` | Todos los autenticados | 30/min |
| POST | `/asistente/chat` | Todos los autenticados | 30/min |
| DELETE | `/asistente/mensajes` | Todos los autenticados | 30/min |

No exige ability específica. La separación de datos se hace por rol dentro del servicio.

## 25.2 Enviar mensaje

```json
{ "mensaje": "¿Cómo van las ventas de esta semana?" }
```

Response 200:

```json
{
  "respuesta": "**Ventas de los últimos 7 días**...",
  "mensaje_id": 42,
  "created_at": "2026-10-20T15:47:46-05:00"
}
```

Reglas:

- `mensaje` requerido, máx. 2000.
- Se persiste el turno `user` y el turno `assistant`.
- El historial se aísla por `usuario_id`.
- Sin token ⇒ 401.
- Throttle 30/min ⇒ 429.

## 25.3 Historial

```http
GET /api/v1/asistente/mensajes?per_page=15
```

Response:

```json
{
  "data": [
    { "id": 42, "rol": "assistant", "contenido": "...", "created_at": "..." },
    { "id": 41, "rol": "user", "contenido": "...", "created_at": "..." }
  ],
  "links": { ... },
  "meta": { ... }
}
```

Orden: más reciente primero. `per_page` 1–100, por defecto 15.

## 25.4 Reiniciar

```http
DELETE /api/v1/asistente/mensajes
```

Borra el hilo del usuario autenticado. Response:

```json
{ "message": "Conversación eliminada" }
```

No afecta a otros usuarios.

## 25.5 Capacidades por rol

### Admin

- Ventas hoy/7 días/mes.
- Productos más vendidos.
- Inventario por reponer.
- Pedidos por estado.
- Gastos y margen.
- Predicción de ventas por promedio móvil 7 días.
- Recomendaciones de promoción.

### Barista

- Ventas.
- Productos más vendidos.
- Inventario.
- Pedidos del día.

No recibe gastos, predicciones ni marketing.

### Cliente

- Menú y precios.
- Medios de pago.
- Cómo hacer un pedido.
- Eventos próximos.
- Sede/ubicación/horario.

**Nunca** recibe ventas, gastos, inventario ni predicciones.

## 25.6 Cómo detecta la intención

`AsistenteService` normaliza la pregunta (minúsculas, sin tildes) y busca palabras clave:

**Tabla.** _Intenciones y ejemplos de pregunta_

| Intención | Ejemplos |
|---|---|
| Saludo | “hola”, “buenas tardes” |
| Ayuda | “qué puedes hacer”, “funciones” |
| Ventas | “ventas”, “ingresos”, “cómo va” |
| Productos | “más vendido”, “top”, “ranking” |
| Inventario | “stock”, “reponer”, “insumos” |
| Pedidos | “pedidos pendientes”, “cola” |
| Gastos | “gastos”, “margen”, “utilidad” (admin) |
| Predicción | “predice”, “próximos 7 días” (admin) |
| Promoción | “marketing”, “descuento”, “oferta” (admin) |
| Menú (cliente) | “productos”, “precio”, “carta” |
| Pagos (cliente) | “medios de pago”, “tarjeta”, “nequi” |
| Pedido (cliente) | “cómo comprar”, “carrito” |
| Eventos (cliente) | “eventos”, “taller” |
| Sede (cliente) | “dónde queda”, “horario” |

Si no entiende, devuelve una guía de opciones.

## 25.7 Privacidad

- El servicio es local; no envía datos a Gemini/OpenAI.
- Las claves `GEMINI_*` están reservadas y no se usan.
- El cliente no recibe métricas internas.
- El historial se limita al usuario autenticado.
- Si se conecta un LLM, envíe solo datos agregados y anonimizados.

## 25.8 Limitaciones

- No es un modelo generativo: respuestas basadas en reglas.
- No mantiene contexto profundo entre mensajes; cada pregunta se interpreta por separado.
- La predicción es un promedio móvil simple, no un modelo estadístico.
- No ejecuta acciones (no crea pedidos ni cambia precios).
- No responde preguntas fuera del dominio de la cafetería.

## 25.9 Ejemplos `curl`

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@kaffa.com","password":"admin123"}' | jq -r .access_token)

curl -s -X POST http://127.0.0.1:8000/api/v1/asistente/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"mensaje":"¿Cuáles son los productos más vendidos?"}' | jq

curl -s http://127.0.0.1:8000/api/v1/asistente/mensajes \
  -H "Authorization: Bearer $TOKEN" | jq

curl -s -X DELETE http://127.0.0.1:8000/api/v1/asistente/mensajes \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 25.10 Errores

**Tabla.** _Errores frecuentes del asistente_

| HTTP | Causa |
|---|---|
| 401 | Sin token |
| 422 | Mensaje vacío o >2000 |
| 429 | Más de 30 mensajes/min |

> **Recomendación.** Use el Asistente como ayuda operativa, no como fuente contable oficial. Para cifras financieras, consulte los reportes y la base; el Asistente agrega datos con fines informativos.

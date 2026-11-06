# 17. Endpoints públicos

Los endpoints públicos permiten que un visitante vea la landing y el menú sin iniciar sesión. No exponen datos sensibles ni permiten escritura.

## 17.1 Listado

**Tabla.** _Endpoints públicos_

| Método | Endpoint | Throttle | Descripción |
|---|---|---|---|
| GET | `/equipo` | 60/min | Administradora y baristas por fecha/turno |
| GET | `/categorias` | 60/min | Categorías activas |
| GET | `/categorias/{id}` | 60/min | Detalle de categoría |
| GET | `/productos` | 60/min | Productos del menú |
| GET | `/productos/{id}` | 60/min | Detalle de producto |
| GET | `/eventos` | 60/min | Eventos publicados |
| GET | `/eventos/{id}` | 60/min | Detalle de evento publicado |

## 17.2 `GET /equipo`

Parámetros:

**Tabla.** _Parámetros de GET /equipo_

| Parámetro | Valor | Default |
|---|---|---|
| `fecha` | `YYYY-MM-DD` | Hoy en `America/Bogota` |
| `tipo` | `mañana`, `tarde`, `abierto` | `mañana` |

Response:

```json
{
  "administradora": { "id": 1, "nombre": "Ana", "foto": "https://..." },
  "baristas": [
    { "id": 2, "nombre": "Santiago", "foto": "https://..." }
  ],
  "fecha": "2026-10-20",
  "tipo": "mañana"
}
```

Reglas:

- La administradora es el primer admin activo.
- Los baristas son los asignados al turno que cubre `fecha` y su tipo.
- Solo se exponen `id`, `nombre`, `foto`; nunca correos.
- `tipo` inválido o `fecha` inválida ⇒ 422.
- Si no hay turno, `baristas` puede ser `[]`.

## 17.3 `GET /categorias`

Response paginada:

```json
{
  "data": [
    { "id": 1, "nombre": "Cafés", "created_at": "...", "updated_at": "..." }
  ],
  "links": { ... },
  "meta": { ... }
}
```

Solo lectura. Las escrituras están en el grupo admin del capítulo 18.

## 17.4 `GET /productos`

Filtros útiles:

```http
GET /api/v1/productos?activo=1&categoria_id=1&per_page=20
```

Response:

```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Capuchino",
      "descripcion": "Café espresso con leche vaporizada",
      "imagen": "https://res.cloudinary.com/...",
      "precio_venta": "8500.00",
      "categoria_id": 1,
      "activo": true
    }
  ],
  "links": { ... },
  "meta": { ... }
}
```

> **Nota.** El campo `precio_venta` se serializa como string decimal (`"8500.00"`) por el cast `decimal:2`. El cliente debe parsearlo.

## 17.5 `GET /eventos`

Solo eventos con `publicado=true`, ordenados por `fecha`, `hora` ascendente.

```json
{
  "data": [
    {
      "id": 7,
      "titulo": "Feria del café",
      "descripcion": "Catas y talleres",
      "lugar": "Salón principal",
      "fecha": "2026-11-05",
      "hora": "10:00:00",
      "publicado": true,
      "imagenes": [
        { "id": 1, "url": "https://...", "orden": 0 }
      ]
    }
  ],
  "links": { ... },
  "meta": { ... }
}
```

`GET /eventos/{id}` devuelve 404 si el evento no está publicado. La ruta usa `whereNumber('id')` para no chocar con `/eventos/admin`.

## 17.6 Seguridad de los endpoints públicos

- No incluyen correos, teléfonos, tokens ni métricas internas.
- Están limitados por throttle 60/min por IP.
- No permiten escritura.
- El catálogo público no expone insumos, recetas ni medios de pago.
- Los eventos borradores solo se ven con `GET /eventos/admin` (admin).

## 17.7 Ejemplos `curl`

```bash
curl -s http://127.0.0.1:8000/api/v1/equipo | jq
curl -s "http://127.0.0.1:8000/api/v1/equipo?fecha=2026-10-20&tipo=tarde" | jq
curl -s "http://127.0.0.1:8000/api/v1/productos?activo=1" | jq
curl -s http://127.0.0.1:8000/api/v1/eventos | jq
```

> **Recomendación.** Para el Home móvil, cachee el catálogo unos minutos en el cliente y respete el throttle. No sondee `/productos` cada segundo.

# 15. Convenciones de la API

Esta parte es la referencia práctica para integrar clientes. La fuente de verdad es `routes/api.php` + `openapi.json`; la matriz completa está en el capítulo 26.

## 15.1 Base URL y versionado

**Tabla.** _Base URL por entorno_

| Entorno | Base URL |
|---|---|
| Desarrollo | `http://127.0.0.1:8000/api/v1` |
| Producción | `https://api.dominio.com/api/v1` |
| SPA en el mismo dominio | `/api/v1` (proxy) |

El prefijo `api/v1` se registra en `RouteServiceProvider`. No hay versión por cabecera. Para cambios incompatibles, cree `/api/v2`.

## 15.2 Autenticación

```http
Authorization: Bearer 1|xxxxxxxxxxxxxxxxxxxxxxxx
Accept: application/json
Content-Type: application/json
```

- El token se obtiene en `POST /login`.
- Sin token, las rutas protegidas responden `401` JSON.
- El token expira según `SANCTUM_EXPIRATION` (1440 min por defecto).
- `POST /auth/refresh` rota el token; `POST /logout` revoca el actual.

## 15.3 Formato de datos

- JSON UTF-8.
- Fechas en ISO 8601 (`2026-10-20T15:47:46-05:00`); conformidad evaluada en §32.8.
- Fechas de negocio (`fecha` de turno/evento) en `YYYY-MM-DD`.
- Hora en `HH:MM` o `HH:MM:SS`.
- Dinero como número decimal (COP sin decimales en la práctica, pero el esquema admite 2).
- Booleanos JSON (`true`/`false`), no `1`/`0`.

## 15.4 Paginación

Todas las listas usan la envoltura de Laravel:

```json
{
  "data": [ ... ],
  "links": {
    "first": "http://.../api/v1/pedidos?page=1",
    "last": "http://.../api/v1/pedidos?page=3",
    "prev": null,
    "next": "http://.../api/v1/pedidos?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "per_page": 15,
    "to": 15,
    "total": 42
  }
}
```

**Tabla.** _Parámetros de paginación_

| Parámetro | Valor |
|---|---|
| `page` | Página (1..n) |
| `per_page` | 1–100; por defecto 15 |
| `sort_by` | Columna permitida |
| `sort_order` | `asc`/`desc` (por defecto `desc`) |
| `fecha_desde` | `YYYY-MM-DD` sobre `created_at` |
| `fecha_hasta` | `YYYY-MM-DD` sobre `created_at` |

## 15.5 Filtros

Filtros exactos por columnas `fillable` y PK:

```http
GET /api/v1/pedidos?estado=pagado&cliente_id=3
GET /api/v1/productos?categoria_id=2&activo=1
GET /api/v1/usuarios?rol=barista
```

Búsqueda parcial (`LIKE`) en `nombre`, `descripcion`, `correo`, `nit`, `direccion`, `motivo`:

```http
GET /api/v1/productos?nombre=capu
```

Los filtros desconocidos se ignoran; no producen error. Si necesita un filtro nuevo, agréguelo al modelo y a la matriz.

## 15.6 Ordenamiento

```http
GET /api/v1/pedidos?sort_by=created_at&sort_order=desc
```

Por defecto ordena por PK descendente. `sort_by` debe ser una columna permitida; si no, se ignora y se usa la PK.

## 15.7 Códigos de estado y errores

**Tabla.** _Códigos de estado y su significado_

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Creado |
| 204 | Sin contenido (no usado de forma general) |
| 401 | No autenticado |
| 403 | Sin permiso/rol/ability/turno |
| 404 | No encontrado |
| 422 | Validación o regla de negocio |
| 429 | Throttle |
| 500 | Error interno |

El cuerpo de error se describe en el capítulo 13.

## 15.8 Throttle

**Tabla.** _Límites de throttle de la API_

| Grupo | Límite |
|---|---|
| Global | 60/min por usuario/IP |
| Login | 5/min |
| Registro | 10/min |
| Recuperación | 5/min |
| Verify-code | 10/min |
| Escrituras de catálogo/eventos | 30/min |
| Escrituras operativas | 10/min |
| Asistente | 30/min |

Si recibe 429, espere y aplique backoff. No reintente inmediatamente.

## 15.9 Ejemplo `curl` completo

```bash
BASE=http://127.0.0.1:8000/api/v1

# 1. Login
TOKEN=$(curl -s -X POST "$BASE/login" \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@kaffa.com","password":"admin123"}' | jq -r .access_token)

# 2. Perfil
curl -s "$BASE/me" -H "Authorization: Bearer $TOKEN" | jq

# 3. Listar productos
curl -s "$BASE/productos?per_page=5" -H "Authorization: Bearer $TOKEN" | jq

# 4. Crear categoría
curl -s -X POST "$BASE/categorias" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Tés"}' | jq

# 5. Caja
curl -s -X POST "$BASE/cajas" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"monto_apertura_fisico":100000,"monto_apertura_efectivo":80000,"monto_apertura_digital":20000}' | jq
```

## 15.10 Idempotencia y reintentos

La API **no** implementa `Idempotency-Key`. Un reintento de `POST /pedidos` puede duplicar la venta. Recomendaciones para clientes:

- No reintentar automáticamente escrituras no idempotentes.
- Si hay timeout, consultar primero si el recurso se creó (por ejemplo, pedidos del cliente en los últimos minutos).
- Para pagos, usar una referencia externa y conciliación manual.
- Implementar idempotencia en el backend si se integra una pasarela.

## 15.11 Zona horaria y dinero

- La aplicación opera en `America/Bogota`; los timestamps se serializan con offset.
- Los reportes “de hoy” usan la fecha local, no UTC.
- Los importes se guardan como `decimal(10,2)`; evite aritmética de punto flotante en el cliente para totales fiscales.
- El redondeo de pagos se valida con tolerancia ±0.01.

## 15.12 Content-Type y archivos

- JSON para la mayoría de endpoints.
- `multipart/form-data` solo en `POST /eventos/imagen`.
- Las imágenes web se suben a Cloudinary y se envía la URL.
- Tamaño máximo de imagen de evento: 5 MB.

## 15.13 Encabezados recomendados

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {token}
X-Requested-With: XMLHttpRequest
```

`X-Requested-With` no es obligatorio, pero ayuda a Laravel a responder JSON en algunos errores.

## 15.14 Versionado de OpenAPI

`docs/openapi.json` se genera con Scramble. Si cambia una ruta, request o response:

1. Actualice el código.
2. Regenerar `openapi.json`.
3. Actualice la matriz del capítulo 26.
4. Añada una prueba.
5. Registre el cambio en `CHANGELOG.md`.

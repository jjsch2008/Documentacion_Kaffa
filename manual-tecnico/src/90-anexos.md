# 90. Anexos

## A. Plantilla de entorno comentada

```env
# ── Aplicación ─────────────────────────────────────────────
APP_NAME=KAFFA
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://api.kaffa.example
FRONTEND_URL=https://app.kaffa.example

# ── Base de datos PostgreSQL ──────────────────────────────
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kaffa
DB_USERNAME=kaffa_app
DB_PASSWORD=<secreto>

# ── Sanctum / sesión ──────────────────────────────────────
SANCTUM_EXPIRATION=1440
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# ── CORS ──────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS=https://app.kaffa.example

# ── Caché / colas ─────────────────────────────────────────
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
FILESYSTEM_DISK=local

# ── OTP ───────────────────────────────────────────────────
OTP_LENGTH=6
OTP_EXPIRA_MINUTOS=15
OTP_MAX_INTENTOS=5
OTP_REENVIO_SEGUNDOS=60

# ── Correo (Brevo) ────────────────────────────────────────
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.sendinblue.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=<login>@smtp-brevo.com
MAIL_PASSWORD=<smtp-key>
MAIL_FROM_ADDRESS=<remitente-verificado>
MAIL_FROM_NAME=KAFFA
MAIL_TIMEOUT=10
MAIL_VERIFY_PEER=true

# ── Cloudinary ────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=roffd6et
CLOUDINARY_UPLOAD_PRESET=KAFFACCYS
CLOUDINARY_FOLDER=samples/ecommerce
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── Logs / docs ───────────────────────────────────────────
LOG_CHANNEL=daily
LOG_LEVEL=warning
SCRAMBLE_ENABLED=false
```

## B. Catálogo OpenAPI

`docs/openapi.json` documenta **69 paths**. Los más relevantes:

**Tabla.** _Catálogo OpenAPI por grupo de rutas_

| Grupo | Paths |
|---|---|
| Auth | `/login`, `/registro`, `/forgot-password`, `/reset-password`, `/email/verify-code`, `/email/verification-notification`, `/me`, `/user`, `/perfil`, `/logout`, `/auth/refresh`, `/auth/logout-all`, `/health` |
| Público | `/equipo`, `/categorias`, `/productos`, `/eventos` |
| Catálogo | `/insumos`, `/recetas`, `/medios-pago` |
| Pedidos | `/pedidos`, `/pago-pedidos`, `/factura-ventas` |
| Caja | `/cajas`, `/movimiento-cajas`, `/turno-activo` |
| Compras | `/compras`, `/detalle-compras`, `/compra-pagos`, `/proveedores` |
| Gastos | `/gastos`, `/gasto-pagos`, `/mermas` |
| Turnos | `/turnos`, `/mis-turnos` |
| Chat | `/mensajes`, `/mensajes/contactos`, `/mensajes/leer` |
| Reportes | `/reportes` |
| Usuarios | `/usuarios`, `/usuario-roles`, `/roles` |
| Eventos admin | `/eventos/admin`, `/eventos/imagen` |
| Asistente | `/asistente/mensajes`, `/asistente/chat` |

Para la lista completa con métodos y middleware, use el capítulo 26.

## C. SQL útil

### C.1 Crear base y usuario

```sql
CREATE ROLE kaffa_app WITH LOGIN PASSWORD '<secreto>';
CREATE DATABASE kaffa OWNER kaffa_app ENCODING 'UTF8' TEMPLATE template0;
CREATE DATABASE kaffa_test OWNER kaffa_app ENCODING 'UTF8' TEMPLATE template0;
```

### C.2 Respaldo/restauración

```bash
pg_dump -h 127.0.0.1 -U kaffa_app -d kaffa -Fc -f kaffa.dump
pg_restore -h 127.0.0.1 -U kaffa_app -d kaffa_restore --clean --if-exists kaffa.dump
```

### C.3 Ventas y stock

```sql
-- Ventas de hoy
SELECT count(*) AS pedidos, coalesce(sum(total),0) AS total
FROM pedidos
WHERE deleted_at IS NULL
  AND estado IN ('pagado','entregado')
  AND created_at >= CURRENT_DATE;

-- Stock bajo
SELECT nombre, stock_actual, stock_minimo
FROM insumos
WHERE deleted_at IS NULL AND stock_actual <= stock_minimo
ORDER BY stock_actual - stock_minimo;

-- Arqueo
SELECT c.id,
       c.monto_apertura_sistema
       + coalesce(sum(CASE WHEN m.tipo='ingreso' THEN m.monto ELSE 0 END),0)
       - coalesce(sum(CASE WHEN m.tipo='egreso' THEN m.monto ELSE 0 END),0) AS sistema
FROM cajas c
LEFT JOIN movimiento__cajas m ON m.caja_id = c.id
WHERE c.id = :caja_id
GROUP BY c.id;
```

### C.4 Tokens y pendientes

```sql
DELETE FROM personal_access_tokens
WHERE expires_at IS NOT NULL AND expires_at < now() - interval '30 days';

SELECT correo, nombre, created_at
FROM registros_pendientes
WHERE created_at < now() - interval '24 hours';
```

## D. Configuraciones de servidor

Los ejemplos completos de Nginx, Apache y PHP-FPM están en el capítulo 27. Puntos clave:

- `DocumentRoot` debe apuntar a `backend-kaffa/public`, nunca a la raíz del proyecto.
- `client_max_body_size` ≥ 12 MB para imágenes de evento.
- `try_files` para Laravel.
- `fastcgi_pass` al socket de PHP-FPM.
- HTTPS obligatorio.
- `storage/` servido como archivo estático, sin ejecución PHP.

## E. Catálogo de errores

**Tabla.** _Catálogo de errores de negocio_

| Código | HTTP | Acción |
|---|---|---|
| `EMAIL_NOT_VERIFIED` | 403 | Verificar correo |
| `FUERA_HORARIO` | 403 | Esperar turno |
| `TURNO_INACTIVO` | 403 | Asignar turno |
| `TURNO_EXPIRADO` | 403 | Cerrar caja |
| `PERMISO_DENEGADO` | 403 | Revisar rol |
| `CAJA_NO_EXISTE` | 422 | Corregir caja |
| `CAJA_CERRADA` | 422 | Abrir caja |
| `CAJA_AJENA` | 422 | Usar caja propia |
| `TOKEN_SIN_ABILITY` | 403 | Rotar token |
| — | 401 | Enviar token |
| — | 404 | Revisar ruta/ID |
| — | 422 | Revisar `errors` |
| — | 429 | Backoff |
| — | 500 | Revisar logs |

## F. Trazabilidad de pruebas

**Tabla.** _Trazabilidad entre requisitos y pruebas_

| Requisito | Prueba |
|---|---|
| Login/token | `ApiTest`, `TokenSessionTest` |
| Registro/OTP | `EmailVerificationTest` |
| Reset | `PasswordResetTest` |
| Catálogo público | `ApiTest` |
| Equipo | `EquipoTest` |
| Pedidos | `PedidoTest` |
| Caja | `CajaTest` |
| Compras/mermas | `CompraMermaTest` |
| Turnos | `TurnoMiddlewareTest` |
| Chat/reportes | `ChatReporteTest` |
| Asistente | `AsistenteTest` |
| Eventos | `EventoTest` |

## G. Correspondencia documento-código

**Tabla.** _Correspondencia entre documentos y código_

| Documento | Código |
|---|---|
| `01-arquitectura.md` | `routes/api.php`, `app/Providers`, `config` |
| `02-base-datos.md` | `database/migrations`, `app/Models` |
| `03-api.md` | `routes/api.php`, `app/Http/Controllers` |
| `04-modulos.md` | `app/Services`, `app/Models` |
| `05-seguridad.md` | `app/Http/Middleware`, `app/Policies` |
| `06-instalacion.md` | `.env.example`, `composer.json` |
| `07-despliegue.md` | `config`, `.env.example` |
| `08-pruebas.md` | `tests/Feature` |
| `10-requisitos.md` | Rutas + pruebas |
| `openapi.json` | Scramble |

## H. Glosario

**Tabla.** _Glosario de términos_

| Término | Definición |
|---|---|
| **Ability** | Permiso acuñado en un token Sanctum (`pedidos:manage`, `catalogo:read`, etc.). |
| **Arqueo** | Conciliación de caja: apertura + ingresos − egresos. |
| **Barista** | Rol operativo; requiere turno activo. |
| **Comprobante** | Imagen que acredita un pago virtual. |
| **Medio virtual** | Medio con `es_virtual=true`; exige comprobante. |
| **Merma** | Pérdida de insumo; reduce stock. |
| **Pivote** | Tabla N:M (`usuario__rols`, `recetas`, `barista_turno`). |
| **POS** | Punto de venta. |
| **Receta** | Consumo de insumo por producto. |
| **RBAC** | Control de acceso por roles. |
| **Sanctum** | Paquete de tokens Bearer. |
| **Scope** | Filtro de datos por rol (`scopeByUser`). |
| **Soft delete** | Borrado lógico con `deleted_at`. |
| **Throttle** | Límite de peticiones. |
| **Turno** | Bloque de trabajo con horario y fecha. |
| **OTP** | Código de un solo uso. |

# 5. Configuración del backend

La configuración se concentra en `.env` y en `config/*.php`. Este capítulo documenta **cada variable que el proyecto usa**, su valor de desarrollo, el valor recomendado en producción y el efecto de cambiarla. No es una lista exhaustiva de la plantilla de Laravel: solo se incluyen variables con impacto real en KAFFA.

## 5.1 Regla de oro

**Tabla.** _Gestión de secretos por entorno_

| Entorno | `.env` | Secretos |
|---|---|---|
| Desarrollo | `.env` local, `APP_DEBUG=true` | Pueden ser placeholders |
| Producción | `.env` en el servidor, permisos `640`, propietario del servicio | Nunca en Git, nunca en el frontend |

```bash
chmod 640 .env
chown kaffa:www-data .env
```

Laravel lee `.env` al arrancar. Después de cambiarlo:

```bash
php artisan config:clear
php artisan config:cache   # solo producción
```

> **Advertencia.** `php artisan config:cache` congela los valores. Si cambia `.env` y no limpia la caché, seguirá viendo la configuración anterior.

## 5.2 Variables de aplicación

**Tabla.** _Variables de aplicación_

| Variable | Dev | Producción | Efecto |
|---|---|---|---|
| `APP_NAME` | `Laravel` | `KAFFA` | Nombre en correos y logs |
| `APP_ENV` | `local` | `production` | Comportamiento de Laravel |
| `APP_KEY` | generada | generada y respaldada | Cifrado; no cambiar sin migrar datos cifrados |
| `APP_DEBUG` | `true` | **`false`** | Con `true` expone trazas y rutas internas |
| `APP_URL` | `http://localhost` | `https://api.dominio.com` | URL base para enlaces y assets |
| `FRONTEND_URL` | `http://localhost:5173` | `https://app.dominio.com` | Contexto de correos y redirecciones |
| `LOG_CHANNEL` | `stack` | `stack` o `daily` | Canal de logs |
| `LOG_LEVEL` | `debug` | `warning`/`error` | Volumen de logs |
| `TIMEZONE` | `America/Bogota` (config) | Igual | Zona de la aplicación |

`config/app.php` fija `timezone => 'America/Bogota'`. No confíe solo en la zona del sistema operativo; Laravel usa esta configuración para `now()`, turnos y facturas.

## 5.3 Base de datos

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kaffa
DB_USERNAME=kaffa_app
DB_PASSWORD=<secreto>
```

**Tabla.** _Variables de conexión a la base de datos_

| Variable | Nota |
|---|---|
| `DB_CONNECTION` | Debe ser `pgsql`; el proyecto no soporta MySQL/SQLite |
| `DB_HOST` | `127.0.0.1` o host interno; nunca expuesto a Internet |
| `DB_PORT` | `5432` por defecto |
| `DB_DATABASE` | `kaffa`; tests usan `kaffa_test` |
| `DB_USERNAME` | Usuario dedicado, no `postgres` |
| `DB_PASSWORD` | Obligatoria en producción |

Opcionales para TLS:

```env
DB_SSLMODE=require
```

Si usa un pooler (PgBouncer), revise el modo de transacción: los `lockForUpdate` y las transacciones largas pueden comportarse distinto.

## 5.4 Sanctum y sesión

```env
SANCTUM_EXPIRATION=1440
SESSION_DRIVER=file
SESSION_LIFETIME=120
```

**Tabla.** _Variables de Sanctum y sesión_

| Variable | Dev | Producción | Efecto |
|---|---|---|---|
| `SANCTUM_EXPIRATION` | `1440` | `1440` o menos | Minutos de vida del token; `null` = sin expiración |
| `SESSION_DRIVER` | `file` | `redis` o `file` | Solo afecta flujos web; la API usa tokens |
| `SESSION_LIFETIME` | `120` | `120` | Minutos de sesión web |

`config/sanctum.php` lee `SANCTUM_EXPIRATION` y lo aplica al crear tokens. Si el valor es `null`, el token no expira: es cómodo en desarrollo y peligroso en producción. `POST /auth/refresh` rota el token sin pedir credenciales.

> **Advertencia.** La documentación antigua decía “por defecto no expira”; el `.env.example` actual fija 1440 minutos. Verifique siempre el valor efectivo con `php artisan tinker --execute="echo config('sanctum.expiration');"`.

## 5.5 CORS

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

`config/cors.php`:

- Rutas: `api/*`, `sanctum/csrf-cookie`.
- Métodos: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Orígenes: lista separada por comas desde `CORS_ALLOWED_ORIGINS`.
- `supports_credentials = false`.

En producción:

```env
CORS_ALLOWED_ORIGINS=https://app.dominio.com,https://admin.dominio.com
```

Nunca use `*` si la API maneja datos de negocio. Si la SPA y la API comparten dominio, CORS no interviene; el proxy de `/api` evita el preflight.

## 5.6 OTP y verificación

```env
OTP_LENGTH=6
OTP_EXPIRA_MINUTOS=15
OTP_MAX_INTENTOS=5
OTP_REENVIO_SEGUNDOS=60
```

**Tabla.** _Variables del servicio OTP_

| Variable | Efecto | Rango seguro |
|---|---|---|
| `OTP_LENGTH` | Dígitos del código | 6 (mínimo 4) |
| `OTP_EXPIRA_MINUTOS` | Vigencia | 10–15 |
| `OTP_MAX_INTENTOS` | Intentos fallidos antes de bloquear | 3–5 |
| `OTP_REENVIO_SEGUNDOS` | Cooldown entre envíos | 60 |

`config/otp.php` aplica mínimos: longitud ≥4, expiración ≥1, intentos ≥1, reenvío ≥0. Los códigos se guardan hasheados en `codigos_otp` y se eliminan al validarse.

## 5.7 Correo

### 5.7.1 Desarrollo con Mailpit

```env
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="KAFFA"
MAIL_TIMEOUT=10
MAIL_VERIFY_PEER=true
```

Si Mailpit corre en Docker y el backend en el host, use `MAIL_HOST=127.0.0.1` y publique el puerto 1025. Si ambos están en la misma red Docker, use `mailpit`.

Alternativa sin SMTP:

```env
MAIL_MAILER=log
```

Los correos se escriben en `storage/logs/laravel.log`; útil para probar OTP sin servidor.

### 5.7.2 Producción con Brevo

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.sendinblue.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=<login>@smtp-brevo.com
MAIL_PASSWORD=<smtp-key>
MAIL_FROM_ADDRESS=<remitente-verificado>
MAIL_FROM_NAME="KAFFA"
MAIL_TIMEOUT=10
MAIL_VERIFY_PEER=true
```

Brevo exige un remitente verificado y una **SMTP key** (no la API key). Use `smtp-relay.sendinblue.com` porque su certificado TLS coincide con el host; con `smtp-relay.brevo.com` algunos nodos regionales presentan un CN distinto y fallan con `Peer certificate CN ... did not match`.

> **Advertencia.** `MAIL_VERIFY_PEER=false` desactiva la validación TLS. Úselo solo como diagnóstico temporal, nunca como configuración permanente.

## 5.8 Cloudinary

```env
CLOUDINARY_CLOUD_NAME=roffd6et
CLOUDINARY_UPLOAD_PRESET=KAFFACCYS
CLOUDINARY_FOLDER=samples/ecommerce
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Tabla.** _Variables de Cloudinary_

| Variable | Uso | Exposición |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cuenta de entrega | Pública |
| `CLOUDINARY_UPLOAD_PRESET` | Preset unsigned para el navegador | Pública por diseño |
| `CLOUDINARY_FOLDER` | Carpeta destino | Pública |
| `CLOUDINARY_API_KEY` | API firmada/Admin | Secreta |
| `CLOUDINARY_API_SECRET` | Firma/Admin | **Nunca** en el frontend |

El backend solo valida que las URLs de `res.cloudinary.com` pertenezcan a la cuenta configurada (`App\Rules\CloudinaryUrl`). No recibe el archivo en el flujo web. La excepción es `POST /eventos/imagen`, que usa el disco local.

## 5.9 Caché, colas y sistema de archivos

```env
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
```

**Tabla.** _Variables de caché, colas y almacenamiento_

| Variable | Dev | Producción | Efecto |
|---|---|---|---|
| `CACHE_DRIVER` | `file` | `redis` | `Medio_Pago::virtualIds()` cachea 5 min |
| `QUEUE_CONNECTION` | `sync` | `redis`/`database` | Con `sync` los correos y listeners se ejecutan en la petición |
| `FILESYSTEM_DISK` | `local` | `local` | `storage/app`; el disco `public` se usa para eventos |

Con `QUEUE_CONNECTION=sync`, un SMTP lento bloquea el registro. `MAIL_TIMEOUT=10` acota la espera. Si cambia a cola asíncrona, debe ejecutar un worker:

```bash
php artisan queue:work --tries=3 --timeout=60
```

No hay jobs programados en el código; si añade tareas, configure el scheduler y el cron.

## 5.10 Logging y errores

```env
LOG_CHANNEL=stack
LOG_LEVEL=debug
```

En producción:

```env
LOG_CHANNEL=daily
LOG_LEVEL=warning
LOG_DAILY_DAYS=14
```

Los fallos de envío de correo se registran explícitamente en `AuthController` con el correo y el error. No se registra la contraseña ni el código OTP en claro.

`Handler` devuelve JSON uniforme para 404 y `BusinessRuleException`. En `APP_DEBUG=true`, las trazas pueden incluir rutas y parámetros; no las exponga.

## 5.11 OpenAPI / Scramble

Scramble está en `require-dev`. La UI vive en `GET /docs/api` y el JSON en `/docs/api.json`.

```env
SCRAMBLE_ENABLED=true
```

En producción:

```env
SCRAMBLE_ENABLED=false
```

Para regenerar `docs/openapi.json`:

```bash
php artisan serve
curl -s http://localhost:8000/docs/api.json -o ../docs/openapi.json
```

> **Recomendación.** No publique la UI de Scramble en producción. Si necesita documentación pública, genere el JSON en CI y publíquelo como archivo estático.

## 5.12 Variables reservadas

**Tabla.** _Variables reservadas o sin uso_

| Variable | Estado | Nota |
|---|---|---|
| `GEMINI_API_KEY` | Reservada | El Asistente actual es local; no se usa |
| `GEMINI_MODEL` | Reservada | Solo si se conecta un LLM |
| `GEMINI_FALLBACK_MODEL` | Reservada | Ídem |
| `GEMINI_BASE_URL` | Reservada | Ídem |
| `AWS_*` | Plantilla | No se usa para imágenes |
| `PUSHER_*` | Plantilla | No hay websockets |
| `REDIS_*` | Opcional | Necesarias si usa Redis |

## 5.13 Plantilla mínima de producción

```env
APP_NAME=KAFFA
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://api.kaffa.example
FRONTEND_URL=https://app.kaffa.example

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kaffa
DB_USERNAME=kaffa_app
DB_PASSWORD=<secreto>

SANCTUM_EXPIRATION=1440
CORS_ALLOWED_ORIGINS=https://app.kaffa.example

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.sendinblue.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=<login>@smtp-brevo.com
MAIL_PASSWORD=<smtp-key>
MAIL_FROM_ADDRESS=<remitente-verificado>
MAIL_FROM_NAME=KAFFA

LOG_CHANNEL=daily
LOG_LEVEL=warning
SCRAMBLE_ENABLED=false
```

## 5.14 Checklist de configuración

- [ ] `APP_DEBUG=false` y `APP_ENV=production`.
- [ ] `APP_KEY` respaldada en un gestor de secretos.
- [ ] `DB_PASSWORD` fuerte y usuario dedicado.
- [ ] `SANCTUM_EXPIRATION` definido.
- [ ] `CORS_ALLOWED_ORIGINS` con dominios exactos.
- [ ] SMTP probado con un registro real.
- [ ] Cloudinary con preset restringido.
- [ ] `LOG_CHANNEL` y rotación configurados.
- [ ] Scramble desactivado.
- [ ] `.env` con permisos `640` y fuera de Git.

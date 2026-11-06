# 4. Instalación paso a paso

Este capítulo describe una instalación reproducible en un entorno limpio. Al finalizar, la API debe responder en `http://localhost:8000/api/v1`, la base debe tener las 34 tablas y los datos semilla, y las pruebas deben ejecutarse sobre `kaffa_test`.

## 4.1 Obtener el código

```bash
cd /var/www
sudo git clone <url-del-repositorio> kaffa
sudo chown -R kaffa:kaffa kaffa
cd kaffa/backend-kaffa
```

La estructura esperada es:

```text
kaffa/
├── backend-kaffa/
├── docs/
└── REACT_clean/REACT_kaffa/
```

> **Nota.** El repositorio puede entregarse como archivo comprimido. En ese caso, descomprima y verifique que `backend-kaffa/composer.json` exista antes de continuar.

## 4.2 Instalar dependencias PHP

```bash
composer install --no-interaction --prefer-dist
```

Esto crea `vendor/` y ejecuta `php artisan package:discover`. Si falla por memoria:

```bash
COMPOSER_MEMORY_LIMIT=-1 composer install
```

## 4.3 Crear el archivo de entorno

```bash
cp .env.example .env
php artisan key:generate
```

`php artisan key:generate` escribe `APP_KEY`. Sin esa clave, Laravel no puede cifrar cookies, sesiones ni datos sensibles. **Nunca** comparta el `.env` ni lo versione.

Verifique que el archivo no esté en Git:

```bash
git check-ignore -v .env
git ls-files | grep -x '.env' || echo "OK: .env no versionado"
```

## 4.4 Configurar la base de datos

Edite `.env`:

```env
APP_NAME=KAFFA
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kaffa
DB_USERNAME=kaffa_app
DB_PASSWORD=<tu-contraseña>
```

Cree la base y el usuario (si aún no existen):

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE kaffa_app WITH LOGIN PASSWORD 'cambia-esta-clave';
CREATE DATABASE kaffa OWNER kaffa_app ENCODING 'UTF8' TEMPLATE template0;
SQL
```

Pruebe la conexión antes de migrar:

```bash
psql "host=127.0.0.1 port=5432 dbname=kaffa user=kaffa_app password=<tu-contraseña>" -c "select version();"
```

> **Advertencia.** Si `DB_PASSWORD` queda vacía y PostgreSQL usa `scram-sha-256`, la conexión fallará. No copie credenciales de ejemplos ni de ramas antiguas.

## 4.5 Migrar y sembrar

```bash
php artisan migrate --seed
```

El comando ejecuta las 44 migraciones y luego, en orden:

1. `RolSeeder`: roles `admin`, `barista`, `cliente`.
2. `MedioPagoSeeder`: 6 medios (3 virtuales).
3. `UserSeeder`: usuarios de prueba verificados.
4. `TurnoSeeder`: turnos de hoy para todos los baristas.
5. `CatalogSeeder`: 3 categorías, 20 insumos, 10 productos y recetas.

Verificación rápida:

```bash
php artisan tinker --execute="echo \App\Models\User::count().' usuarios'.PHP_EOL;"
php artisan tinker --execute="echo \App\Models\Producto::count().' productos'.PHP_EOL;"
```

Para reconstruir desde cero en desarrollo:

```bash
php artisan migrate:fresh --seed
```

> **Advertencia.** `migrate:fresh` elimina **todas** las tablas de la base configurada. Nunca lo ejecute en producción ni en una base con datos reales.

## 4.6 Enlazar el disco público

Las imágenes de eventos subidas desde el móvil se guardan en `storage/app/public/eventos`. Para que sean accesibles por URL:

```bash
php artisan storage:link
```

Esto crea `public/storage` como enlace simbólico. Verifique:

```bash
ls -l public/storage
```

Si el servidor web no sigue enlaces simbólicos, configure `disable_symlinks off` (Nginx) o `Options FollowSymLinks` (Apache).

## 4.7 Permisos de escritura

Laravel necesita escribir en:

- `storage/` (logs, caché, sesiones, archivos públicos)
- `bootstrap/cache/`

```bash
sudo chown -R kaffa:www-data storage bootstrap/cache
sudo find storage bootstrap/cache -type d -exec chmod 775 {} \;
sudo find storage bootstrap/cache -type f -exec chmod 664 {} \;
```

No use `chmod -R 777`; es un riesgo de seguridad y no es necesario.

## 4.8 Levantar el servidor de desarrollo

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

La API queda en `http://127.0.0.1:8000/api/v1`. Pruebe:

```bash
curl -s http://127.0.0.1:8000/api/v1/productos | head -c 400
curl -s http://127.0.0.1:8000/api/v1/eventos | head -c 400
curl -s http://127.0.0.1:8000/api/v1/equipo | head -c 400
```

Las tres rutas son públicas y deben devolver JSON. Si recibe HTML o un error 500, revise `storage/logs/laravel.log`.

## 4.9 Probar el login

```bash
curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@kaffa.com","password":"admin123"}'
```

Respuesta esperada (resumida):

```json
{
  "access_token": "1|...",
  "token_type": "Bearer",
  "usuario": { "id": 1, "nombre": "Administrador", "roles": [...] },
  "turno_activo": false,
  "turno_info": null
}
```

Guarde el token en una variable para las siguientes pruebas:

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@kaffa.com","password":"admin123"}' | jq -r .access_token)
curl -s http://127.0.0.1:8000/api/v1/me -H "Authorization: Bearer $TOKEN" | jq
```

## 4.10 Usuarios de prueba

**Tabla.** _Usuarios de prueba creados por los seeders_

| Rol | Correo | Contraseña | Acceso |
|---|---|---|---|
| Admin | `admin@kaffa.com` | `admin123` | Panel completo |
| Barista | `barista@kaffa.com` | `barista123` | POS, inventario, chat, caja |
| Cliente | `cliente@kaffa.com` | `cliente123` | Sitio público, pedidos, chat |

> **Advertencia.** Estas credenciales son de desarrollo y están sembradas en el código. En producción: elimine o cambie los usuarios semilla, use contraseñas fuertes y desactive `UserSeeder`/`CatalogSeeder` si no corresponden.

## 4.11 Frontend opcional

```bash
cd ../../REACT_clean/REACT_kaffa
pnpm install
pnpm run dev
```

La SPA queda en `http://localhost:5173` y proxya `/api` a `http://localhost:8000` (`vite.config.js`). Para producción:

```bash
pnpm run build
# publicar dist/ en el servidor web
```

## 4.12 Base de pruebas y PHPUnit

`phpunit.xml` usa PostgreSQL con base `kaffa_test`, `BCRYPT_ROUNDS=4` y caché/cola/sesión en `array`. Cree la base una vez:

```bash
sudo -u postgres createdb -O kaffa_app kaffa_test
```

Ejecute:

```bash
php artisan test
# o
vendor/bin/phpunit
```

Las pruebas usan `RefreshDatabase` y migran por ejecución. No apuntan a `kaffa`: es seguro ejecutarlas, pero consumen tiempo y conexiones.

## 4.13 Smoke test completo

**Tabla.** _Smoke test posterior a la instalación_

| # | Prueba | Comando / acción | Resultado esperado |
|---|---|---|---|
| 1 | Catálogo público | `GET /productos` sin token | 200 con `{data, links, meta}` |
| 2 | Login admin | `POST /login` | 200 con `access_token` |
| 3 | Perfil | `GET /me` con Bearer | 200 con roles |
| 4 | Recurso protegido sin token | `GET /insumos` | 401 JSON |
| 5 | Catálogo admin | `POST /categorias` con token | 201 |
| 6 | Turno activo | `GET /turno-activo` | 200 con `turno_activo` |
| 7 | Caja | `POST /cajas` con `monto_apertura_fisico` | 201 con `estado=abierta` |
| 8 | Pedido | `POST /pedidos` con detalles y pago | 201, stock descontado |
| 9 | Correo | Registro público | 201 y código en Mailpit/Brevo |
| 10 | OpenAPI | `GET /docs/api` en local | UI de Scramble |

## 4.14 Problemas comunes de instalación

**Tabla.** _Problemas comunes de instalación y solución_

| Síntoma | Causa probable | Solución |
|---|---|---|
| `could not find driver` | Falta `pdo_pgsql` | Instalar extensión y reiniciar PHP-FPM |
| `SQLSTATE[08006]` | Host/puerto/credenciales incorrectos | Revisar `DB_*`; probar con `psql` |
| `No application encryption key` | Falta `APP_KEY` | `php artisan key:generate` |
| `Permission denied` en storage | Propietario incorrecto | `chown` a usuario de PHP-FPM |
| `404` en `/api/v1` | DocumentRoot apunta a otra carpeta | Apuntar a `backend-kaffa/public` |
| `419` o CSRF | Cliente intenta flujo por cookies | Usar Bearer; la API no usa CSRF |
| `429` al listar | Throttle compartido | Esperar; no reducir el límite sin analizar |
| Correo no llega | Mailpit no está en `mailpit` o SMTP mal configurado | Usar `127.0.0.1` o configurar Brevo |
| `storage:link` falla | Enlace existente | Borrar `public/storage` y repetir |
| `migrate` falla por extensión | Falta `bcmath`/`xml` | Instalar extensiones requeridas |

> **Recomendación.** Automatice este capítulo en un script idempotente (`scripts/install.sh`) y valide con un `healthcheck` que compruebe base, correo y almacenamiento. El repositorio actual no incluye Docker ni CI; un script reduce el error humano.

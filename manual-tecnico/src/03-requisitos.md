# 3. Requisitos de instalación

Este capítulo enumera **todo lo que debe existir antes de ejecutar la primera migración**. La lista distingue entre requisitos verificados en el código y recomendaciones de operación. Si falta un componente, la instalación fallará en un punto identificable; la columna “síntoma” ayuda a diagnosticarlo.

## 3.1 Resumen ejecutivo

**Tabla.** _Requisitos mínimos y recomendados por categoría_

| Categoría | Mínimo | Recomendado |
|---|---|---|
| Sistema operativo | Linux x86_64 (Ubuntu/Debian, Fedora, Arch) | Ubuntu 22.04/24.04 LTS |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 2 GB | 4–8 GB |
| Disco | 10 GB libres | 40 GB SSD + respaldos |
| PHP | 8.1 | 8.2 u 8.3 (estable) |
| PostgreSQL | 13 | 15 o 16 |
| Composer | 2.x | última 2.x |
| Node.js (solo frontend) | 18 | 20/22 LTS |
| pnpm (solo frontend) | 8 | 9+ |
| Servidor web | — | Nginx o Apache con PHP-FPM |
| TLS | — | Certificado válido (Let's Encrypt) |

> **Verificado.** El backend se ejecutó con PHP 8.5.11 y PostgreSQL 18.6 durante la auditoría. Sin embargo, para producción se recomienda una versión PHP con soporte activo y probada con Laravel 10 (8.2/8.3), no la última experimental.

## 3.2 Sistema operativo y usuario

El backend es una aplicación PHP estándar; no requiere extensiones de sistema exóticas. En Linux se recomienda:

- Crear un usuario de servicio sin privilegios (`kaffa`) para PHP-FPM.
- No ejecutar `php artisan` como `root`.
- Mantener el reloj sincronizado con NTP: la lógica de turnos y cierres depende de `America/Bogota`.
- Configurar `locale` UTF-8 (`es_CO.UTF-8` o `en_US.UTF-8`) para que PostgreSQL y los correos manejen tildes correctamente.

```bash
sudo adduser --system --group --home /var/www/kaffa kaffa
sudo timedatectl set-timezone America/Bogota
locale -a | grep -i utf
```

En Windows, el proyecto puede ejecutarse con Laragon, XAMPP o WSL2. Para producción no se recomienda Windows/IIS sin una validación específica de permisos y PHP-FPM.

## 3.3 PHP y extensiones

### 3.3.1 Versión

`composer.json` exige `"php": "^8.1"`. Laravel 10 es compatible con PHP 8.1–8.3 de forma estable. PHP 8.4/8.5 puede funcionar, pero genera avisos de deprecación en dependencias antiguas.

```bash
php -v
php -m
```

### 3.3.2 Extensiones necesarias

**Tabla.** _Extensiones PHP requeridas y opcionales_

| Extensión | Uso | ¿Obligatoria? |
|---|---|---|
| `pdo_pgsql` | Conexión a PostgreSQL | **Sí** |
| `pgsql` | Funciones PostgreSQL de bajo nivel | **Sí** |
| `mbstring` | Cadenas UTF-8 | **Sí** |
| `openssl` | HTTPS, cifrado, tokens | **Sí** |
| `tokenizer` | Laravel/Composer | **Sí** |
| `xml` / `dom` | PHPUnit y dependencias | **Sí** |
| `ctype`, `json`, `filter` | Núcleo de Laravel | **Sí** |
| `bcmath` | Cálculos monetarios auxiliares | Recomendada |
| `fileinfo` | Validación de archivos | **Sí** |
| `curl` | Cliente HTTP (Guzzle) | **Sí** |
| `gd` o `imagick` | Procesamiento de imágenes local | Opcional |
| `intl` | Formateo internacional | Recomendada |
| `zip` | Composer y despliegues | Recomendada |

Instalación en Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y php8.2-cli php8.2-fpm php8.2-pgsql php8.2-mbstring \
  php8.2-xml php8.2-curl php8.2-bcmath php8.2-zip php8.2-intl \
  php8.2-gd unzip git curl
```

Verificación:

```bash
php -r "var_dump(extension_loaded('pdo_pgsql'), extension_loaded('mbstring'));"
```

> **Advertencia.** El error `could not find driver` al migrar casi siempre significa que falta `pdo_pgsql`, no que PostgreSQL esté apagado.

### 3.3.3 Límites de PHP recomendados

```ini
memory_limit = 256M
upload_max_filesize = 10M
post_max_size = 12M
max_execution_time = 60
date.timezone = America/Bogota
```

El backend acepta imágenes de eventos de hasta 5 MB; el límite de 10 MB deja margen para multipart.

## 3.4 PostgreSQL

### 3.4.1 Versión y codificación

Se recomienda PostgreSQL 13 o superior. La base debe crearse con UTF-8 y, preferiblemente, `LC_COLLATE` español o `C` para ordenamientos predecibles.

```sql
CREATE ROLE kaffa_app WITH LOGIN PASSWORD '<contraseña-segura>';
CREATE DATABASE kaffa
  WITH OWNER kaffa_app
       ENCODING 'UTF8'
       LC_COLLATE 'es_CO.UTF-8'
       LC_CTYPE 'es_CO.UTF-8'
       TEMPLATE template0;
CREATE DATABASE kaffa_test
  WITH OWNER kaffa_app
       ENCODING 'UTF8'
       TEMPLATE template0;
```

Si `es_CO.UTF-8` no está instalado, use `C.UTF-8` o `en_US.UTF-8`; no mezcle collations entre bases.

### 3.4.2 Acceso y permisos

- El usuario de la aplicación debe ser dueño de la base (para migraciones) o tener permisos `CREATE`, `ALTER`, `INSERT`, `UPDATE`, `DELETE`, `SELECT` y uso de secuencias.
- No use el superusuario `postgres` en producción.
- Restrinja `pg_hba.conf` a la red de la aplicación; no exponga el puerto 5432 a Internet.
- Si la aplicación y la base están en hosts distintos, habilite TLS (`sslmode=require`).

### 3.4.3 Zona horaria

Laravel guarda timestamps en UTC por convención y la aplicación opera en `America/Bogota`. No cambie la zona horaria de PostgreSQL sin revisar los cálculos de turnos y reportes. La zona se define en `config/app.php` y `TurnoService`.

## 3.5 Composer y dependencias PHP

```bash
composer --version
cd backend-kaffa
composer install --no-interaction --prefer-dist
```

Para producción:

```bash
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
```

**Tabla.** _Dependencias PHP declaradas en composer.json_

| Paquete | Uso |
|---|---|
| `laravel/framework` | Núcleo |
| `laravel/sanctum` | Tokens Bearer |
| `guzzlehttp/guzzle` | Cliente HTTP |
| `laravel/tinker` | Consola interactiva (dev) |
| `dedoc/scramble` | OpenAPI (dev) |
| `phpunit/phpunit` | Pruebas (dev) |

> **Nota.** `composer.lock` debe versionarse. No ejecute `composer update` en producción sin una ventana de pruebas.

## 3.6 Node.js, pnpm y frontend

El backend no necesita Node para funcionar. Solo se requiere si va a compilar la SPA:

```bash
node -v
pnpm -v
cd REACT_clean/REACT_kaffa
pnpm install
pnpm run build
```

**Tabla.** _Herramientas de Node.js para el frontend_

| Herramienta | Uso |
|---|---|
| Node.js 20/22 LTS | Build de Vite |
| pnpm 9+ | Gestor único (`pnpm-lock.yaml`) |
| Vite | Servidor de desarrollo y build |
| ESLint | Calidad de código (no hay tests de frontend) |

No use `npm install` en paralelo: el proyecto fijó `pnpm-lock.yaml` como fuente única. Si aparece un `package-lock.json`, elimínelo para evitar resoluciones divergentes.

## 3.7 Puertos y red

**Tabla.** _Puertos y exposición de red_

| Puerto | Servicio | Exposición |
|---|---|---|
| 80/443 | Servidor web | Público |
| 8000 | `php artisan serve` | Solo desarrollo/local |
| 5173 | Vite dev server | Solo desarrollo/local |
| 5432 | PostgreSQL | Solo red interna |
| 1025 | Mailpit SMTP | Solo desarrollo/local |
| 8025 | Mailpit UI | Solo desarrollo/local |
| 6379 | Redis (opcional) | Solo red interna |

Reglas de firewall recomendadas:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80,443/tcp
sudo ufw deny 5432/tcp
sudo ufw enable
```

## 3.8 Dominio, DNS y TLS

- Un registro `A`/`AAAA` para el dominio de la API o de la SPA.
- Certificado TLS válido; los tokens viajan en cada cabecera.
- Redirección permanente de HTTP a HTTPS.
- `APP_URL` y `FRONTEND_URL` deben coincidir con el esquema y dominio reales.
- Si la SPA y la API comparten dominio, `/api/v1` se proxya al backend; si están en dominios distintos, configure `CORS_ALLOWED_ORIGINS` con el origen exacto.

## 3.9 Cuentas de servicios externos

**Tabla.** _Cuentas de servicios externos necesarias_

| Servicio | ¿Obligatorio? | Qué se necesita |
|---|---|---|
| SMTP | **Sí** para registro y reseteo | Host, puerto, usuario, contraseña, remitente verificado |
| Mailpit | Solo desarrollo | Contenedor o binario local; `MAIL_HOST=127.0.0.1` si no usa Docker |
| Brevo | Recomendado en producción | SMTP key, remitente verificado, host `smtp-relay.sendinblue.com` |
| Cloudinary | **Sí** para imágenes web | `cloud_name`, `upload_preset` unsigned; API key/secret solo si se firma |
| Gemini | No | Claves reservadas; el Asistente actual es local |
| Sentry/APM | No | Opcional para observabilidad |

> **Advertencia.** El preset *unsigned* de Cloudinary es público por diseño. Cualquiera que lo conozca puede subir archivos a su cuenta. Restrinja formato/tamaño en el preset y monitoree el consumo.

## 3.10 Checklist previo a la instalación

- [ ] PHP 8.1+ con `pdo_pgsql`, `mbstring`, `openssl`, `xml`, `curl`, `fileinfo`.
- [ ] Composer 2.x disponible.
- [ ] PostgreSQL 13+ en ejecución y accesible.
- [ ] Base `kaffa` y usuario dedicado creados.
- [ ] Reloj sincronizado y zona `America/Bogota`.
- [ ] Repositorio clonado con permisos de escritura en `storage/` y `bootstrap/cache/`.
- [ ] `.env` con credenciales válidas (nunca versionado).
- [ ] SMTP o Mailpit configurado.
- [ ] Cuenta Cloudinary y preset disponibles (si se usará la web).
- [ ] Dominio/TLS definidos (si es producción).

## 3.11 Matriz de compatibilidad

**Tabla.** _Matriz de compatibilidad de versiones_

| Combinación | Estado | Nota |
|---|---|---|
| PHP 8.1 + PostgreSQL 13 + Laravel 10 | Soportada | Mínimo teórico |
| PHP 8.2 + PostgreSQL 15/16 + Laravel 10 | **Recomendada** | Equilibrio soporte/estabilidad |
| PHP 8.3 + PostgreSQL 16 | Soportada | Verificar extensiones |
| PHP 8.4/8.5 | Funcional con avisos | Puede requerir ajustes de dependencias |
| MySQL/MariaDB | **No soportada** | El esquema y `phpunit.xml` usan `pgsql` |
| SQLite | **No soportada** | Hay SQL específico de PostgreSQL (`GREATEST`, locks) |
| Windows + IIS | No verificada | Use WSL2 o un servidor Linux |

> **Recomendación.** No intente “probar” con SQLite. El listener de inventario usa `GREATEST` y los servicios usan `lockForUpdate`; el comportamiento no sería equivalente y las pruebas perderían valor.

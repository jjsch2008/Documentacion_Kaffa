# 06 — Instalación

Instrucciones verificadas contra `composer.json`, `package.json`, `.env.example`, seeders y scripts del proyecto.

## 1. Requisitos previos

**Tabla 1.** _Requisitos previos_

| Componente | Versión requerida | Verificado en |
|-------------|-------------------|----------------|
| PHP | ≥ 8.1 | `composer.json` (`"php": "^8.1"`) |
| Composer | 2.x | gestión de `vendor/` |
| PostgreSQL | servidor 5432 en ejecución | `.env` y `phpunit.xml` (`pgsql`) |
| Node.js + pnpm | — (gestor del proyecto: `pnpm-lock.yaml`) | `package.json`, `pnpm-lock.yaml` |
| Extensiones PHP habituales de Laravel (pdo_pgsql, mbstring, …) | — | `[NO VERIFICADO]` no hay documento de extensiones; instalar las requeridas por Laravel 10 |

> **Base de datos: PostgreSQL (pgsql)**. `.env.example` ya viene configurado con `DB_CONNECTION=pgsql` / puerto 5432 / base `kaffa` (corregido en la pasada de seguridad de 2026-09); solo hay que ajustar credenciales si el entorno difiere.

## 2. Backend (`backend-kaffa/`)

```bash
# 1. Dependencias
composer install

# 2. Variables de entorno
cp .env.example .env

# 3. Clave de aplicación
php artisan key:generate
```

4. Verificar la conexión en `.env` (los valores de `.env.example` ya apuntan a PostgreSQL; ajustar credenciales si difieren):

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kaffa
DB_USERNAME=postgres
DB_PASSWORD=<tu-contraseña>
```

5. Crear la base de datos (si no existe) y migrar con datos semilla:

```bash
php artisan migrate --seed
```

6. Levantar el servidor de desarrollo:

```bash
php artisan serve    # http://localhost:8000  → API en /api/v1
```

### 2.1 Datos sembrados

- Roles: `admin`, `barista`, `cliente`.
- 6 medios de pago (3 virtuales: Transferencia Bancaria, Pago Móvil, QR (Pago Digital)).
- Usuarios de prueba (verificados, con foto demo).
- Turnos de hoy (mañana y tarde) con todos los baristas.
- Catálogo: 3 categorías, 20 insumos, 10 productos con imágenes y recetas.

### 2.2 Correo en desarrollo

`.env.example` apunta a **Mailpit** (`MAIL_HOST=mailpit`, `MAIL_PORT=1025`): los correos de verificación y reseteo pueden inspeccionarse en `http://localhost:8025` (interfaz de Mailpit). `[NO VERIFICADO]` no hay contenedor docker-compose para Mailpit en el repositorio; si no se usa Mailpit, configurar un SMTP real o un `MAIL_MAILER=log` para verlos en `storage/logs/laravel.log`.

## 3. Frontend (`REACT_clean/REACT_kaffa/`)

```bash
npm install        # o: pnpm install
npm run dev        # http://localhost:5173
```

- La SPA llama a `/api/v1` relativa; **Vite la proxiexa** a `http://localhost:8000` (`vite.config.js`). Requiere que el backend esté corriendo.
- Compilación de producción: `npm run build` (salida en `dist/`).
- Lint: `npm run lint` (ESLint plano).

## 4. Usuarios de prueba

**Tabla 2.** _Usuarios de prueba sembrados_

| Rol | Correo | Contraseña | Acceso SPA |
|-----|--------|------------|------------|
| Admin | `admin@kaffa.com` | `admin123` | `/admin-dashboard` |
| Barista | `barista@kaffa.com` | `barista123` | `/barista-dashboard` (requiere turno activo para operar; el seeder crea turnos de hoy) |
| Cliente | `cliente@kaffa.com` | `cliente123` | sitio público + carrito + `/pedidos` + `/chat` |

## 5. Problemas comunes

**Tabla 3.** _Problemas comunes y solución_

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `could not find driver` al migrar | falta `pdo_pgsql` en PHP | instalar la extensión y reiniciar el servidor |
| Errores de conexión a BD | credenciales/puerto distintos en el entorno | revisar el bloque `DB_*` de `.env` (debe ser `pgsql`/5432) |
| SPA no carga datos de la API | backend apagado o proxy mal apuntado | levantar `php artisan serve` en `:8000`; verificar proxy en `vite.config.js` |
| Login responde 403 `EMAIL_NOT_VERIFIED` | cuenta sin verificar | abrir el enlace del correo (Mailpit/log) o reenviar desde `/verify-email` |
| Barista recibe 403 `TURNO_INACTIVO`/`FUERA_HORARIO` | fuera de 07:00–18:00 America/Bogota o sin asignación de turno | crear/asignar turno desde el panel admin (Turnos) |
| 429 en escrituras | límites de throttle (10/min operativas) | esperar o ajustar límites |

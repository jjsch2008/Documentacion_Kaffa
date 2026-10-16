# 05 — Seguridad

Este documento describe **mecanismos implementados y verificados**. La existencia de mecanismos no debe leerse como una certificación de seguridad.

## 1. Autenticación

- **Modelo**: tokens personales Sanctum (SPA tokens no se usan: `EnsureFrontendRequestsAreStateful` está comentado en `Kernel.php`; la API es *pure bearer token*).
- Emisión: `POST /login` valida `correo`+`password` (bcrypt), exige usuario `activo` y **correo verificado** (`MustVerifyEmail`), y emite token `auth_token`.
- Expiración: `SANCTUM_EXPIRATION` (`.env.example` fija **1440 min = 24 h** por defecto; null en un `.env` heredado ⇒ sin expiración). Rota sesiones largas con `POST /auth/refresh`.
- Rotación/revocación: `POST /auth/refresh` (rota el actual), `POST /logout` (revoca el actual), `POST /auth/logout-all` (todos los dispositivos).
- El restablecimiento de contraseña **revoca todos los tokens** (`PasswordResetController`).
- 401 siempre como JSON (middleware `Authenticate` devuelve null en `redirectTo`), nunca redirección a login HTML.
- **Códigos OTP**: verificación de correo y reseteo de contraseña por código de 6 dígitos, guardado **hasheado**, de un solo uso, con caducidad (15 min), límite de intentos (5) y cooldown de reenvío (60 s).
- **Alta diferida**: el registro público **no persiste** al usuario en `users`; sus datos (nombre, correo y contraseña hasheada) viven en `registros_pendientes` y sólo se materializa el `User` verificado al confirmar el código. Así una cuenta nunca existe sin haber verificado su correo.

## 2. Autorización (RBAC)

- **Middleware `role:`** (`CheckRole`, alias en `Kernel.php`): admite varios roles («alguno de»). 401 sin usuario; 403 `{message: "No tienes permiso para realizar esta acción."}` sin rol.
- **Middleware `turno.activo`** (`EnsureActiveTurno`): condiciona a los baristas a estar en turno activo; responde 403 con códigos `FUERA_HORARIO`, `TURNO_INACTIVO`, `TURNO_EXPIRADO`. Exenta a admin y cliente.
- **Policies + Gates** (defensa en profundidad, `AuthServiceProvider`): gates `view-record`, `create-record`, `manage-record` usados por el trait `HasBasicQueries`; ownership por `usuario_id/cliente_id/barista_id/abierta_por/cerrada_por`.
- **Scopes de datos**: `Pedido::scopeByUser` (cliente solo sus pedidos), `Pago_Pedido`, `Factura_Venta` (cliente solo lo suyo), `Turno::scopeByUser` (barista solo sus turnos), `CajaPolicy` (barista gestiona solo su caja).

## 3. Verificación de correo obligatoria

- Registro público (`POST /registro`) → correo con **código de 6 dígitos** (`POST /email/verify-code`); login bloqueado hasta verificar (403 `EMAIL_NOT_VERIFIED`).
- Reenvío: `POST /email/verification-notification` (respuesta uniforme, anti-enumeración).
- Usuarios creados por el admin nacen verificados; migración con backfill para cuentas preexistentes.

## 4. Throttling (límite de peticiones)

**Tabla 1.** _Límites de peticiones (throttling)_

| Ruta/grupo | Límite |
|------------|--------|
| API en general | 60/min por usuario o IP |
| `/login` | 5/min (protege bcrypt) |
| `/registro` | 10/min |
| `/forgot-password`, `/reset-password`, `/email/verification-notification` | 5/min |
| `/email/verify-code` | 10/min |
| `/equipo` | 60/min |
| Escrituras de catálogo (admin) | 30/min |
| `POST /pedidos` y escrituras operativas | 10/min |
| `/asistente/*` (Asistente IA, solo admin) | 20/min |

## 5. CORS — `config/cors.php`

- Rutas: `['api/*', 'sanctum/csrf-cookie']`.
- Métodos: `GET, POST, PUT, PATCH, DELETE, OPTIONS` (explícitos).
- Orígenes: variable de entorno `CORS_ALLOWED_ORIGINS` (por defecto `*`; `.env.example` recomienda fijar el dominio real en producción).
- `supports_credentials = false` (API de tokens puros).

## 6. Protección de datos

- `BaseResource` oculta `password` y `remember_token` en todas las respuestas de colecciones.
- `AuthController::me/updatePerfil` aplican `makeHidden` a los mismos campos.
- `GET /equipo` (público) solo expone `id, nombre, foto` — nunca correos (verificado también por `EquipoTest`).
- `Handler::$dontFlash` descarta contraseñas de las trazas de excepciones.
- `dontFlash`/`ConvertEmptyStringsToNull`, `TrimStrings` en el stack global; `ValidatePostSize` activo.
- **Asistente IA**: la `GEMINI_API_KEY` vive únicamente en el backend (`config/services.php`) y **nunca** se envía al frontend; el navegador sólo consume `/api/v1/asistente/*`. Al proveedor externo (Google Gemini) se le envían **métricas agregadas** del negocio (ventas, productos, stock, mermas, gastos), **nunca datos personales de clientes**.

## 7. Validación de entradas

- Form Requests con reglas explícitas por recurso (ver `03-api.md`).
- Regla transversal de comprobantes: medios virtuales ⇒ `comprobante_url` obligatoria (URL válida, ≤ 500).
- Reglas de negocio codificadas como `BusinessRuleException` (422): stock insuficiente, inconsistencia de pagos, caja con movimientos, compra con stock negativo al revertir, etc.
- Transacciones con reintentos ante deadlocks (`TransactionService`, códigos PostgreSQL `40P01`).

## 8. Contraseñas

- Política: mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos (registro, reset, admin, perfil).
- Hash bcrypt por defecto de Laravel (`casts` `hashed` en `User`).
- Reset: **código OTP de un solo uso** + revocación de todas las sesiones; respuestas uniformes en `forgot-password` para evitar enumeración de correos.

## 9. Tokens: alcance de *abilities* (aplicado)

Los tokens incluyen *abilities* por rol (`*` para admin; `pedidos:manage`, `catalogo:read`, … para barista/cliente) **y se hacen cumplir** mediante el middleware `ability:` (`EnsureTokenCanAbility`, alias registrado en `Kernel.php`), aplicado en `routes/api.php` a las rutas de escritura:

**Tabla 2.** _Mapeo de abilities exigidas por grupo de escritura_

| Grupo de escritura | Ability exigida (alguna de) |
|--------------------|------------------------------|
| Catálogos (categorias/insumos/productos/recetas/medios-pago) | `catalogo:manage` |
| `POST /pedidos` | `pedidos:create` (cliente) o `pedidos:manage` (barista) |
| Pedidos (update/destroy) y `pago-pedidos` | `pedidos:manage` |
| Compras / detalle-compras / compra-pagos | `compras:manage` |
| Gastos / gasto-pagos | `gastos:manage` |
| Mermas | `mermas:manage` |
| Cajas | `cajas:manage` |
| Proveedores (escritura) | `proveedores:manage` (solo admin la posee) |
| Movimientos de caja (escritura) | `movimiento-cajas:manage` (solo admin) |
| Asistente IA (`/asistente/*`) | `asistente:consultar` (solo admin) |
| Usuarios / usuario-roles, roles, turnos, factura-ventas | `usuarios:manage`, `roles:manage`, `turnos:manage`, `facturas:manage` (solo admin `*`) |

Respuesta de rechazo: **403** `{message: "Tu token no tiene el permiso requerido para esta acción.", code: "TOKEN_SIN_ABILITY", required_ability: [...]}`.

> Nota de migración: los tokens emitidos **antes** de un cambio de abilities conservan las abilities con las que fueron creados; los usuarios deben re-autenticarse o rotar el token con `POST /auth/refresh`. Cubierto por `tests/Feature/TurnoMiddlewareTest` y `TokenSessionTest`.

## 10. Hallazgos de seguridad relevantes (estado tras la remediación)

**Tabla 3.** _Hallazgos de seguridad: estado tras la remediación_

| # | Hallazgo original | Estado | Acción tomada |
|---|-------------------|--------|---------------|
| 1 | `.env` del backend presente en el directorio con `DB_PASSWORD` vacío | **CORREGIDO (no era riesgo real)** | Verificado: `.gitignore` ignora `.env` y `git ls-files` confirma que solo `.env.example` está versionado. El hallazgo original sobrestimó el riesgo. Es práctica normal de Laravel en desarrollo |
| 2 | `.env.example` declaraba `mysql`/3306 cuando el sistema opera con `pgsql`/5432 | **RESUELTO** | `.env.example` corregido: `DB_CONNECTION=pgsql`, `DB_PORT=5432`, `DB_DATABASE=kaffa`, `DB_USERNAME=postgres` |
| 3 | Tokens sin expiración por defecto | **RESUELTO** | `.env.example` fija `SANCTUM_EXPIRATION=1440` (24 h) por defecto; rotación con `POST /auth/refresh` |
| 4 | `CORS_ALLOWED_ORIGINS=*` por defecto | **RESUELTO** | `.env.example` fija `http://localhost:5173` (origen del dev server de Vite) con comentario para el dominio de producción |
| 5 | `APP_DEBUG=true` por defecto en `.env.example` | **MITIGADO** | Se mantiene `true` para desarrollo (estándar Laravel) y se añadió un **checklist de PRODUCCIÓN comentado** al inicio del archivo (`APP_ENV=production`, `APP_DEBUG=false`, CORS real, Redis, SMTP real) |
| 6 | `QUEUE_CONNECTION=sync` y `CACHE_DRIVER=file` por defecto | **DOCUMENTADO (por diseño en dev)** | Valores correctos para desarrollo; comentarios y checklist de producción indican `redis` para producción |

### 10.1 Otros hallazgos remediados en la misma pasada

**Tabla 4.** _Otros hallazgos remediados en la misma pasada_

| Hallazgo | Acción |
|----------|--------|
| Abilities de tokens Sanctum almacenadas sin validarse | **RESUELTO**: middleware `ability:` (`EnsureTokenCanAbility`) creado, registrado y aplicado a las rutas de escritura (ver §9) |
| `UserFactory` con columnas `name`/`email` inexistentes | **RESUELTO**: fábrica reescrita sobre `nombre`/`correo` (+ estados `unverified`/`inactive`) |
| Suite de pruebas mínima | **RESUELTO**: suite ampliada (58 pruebas en 2026-09; **63** en 2026-10 con el Asistente IA) — ver `08-pruebas.md` |
| Dos lockfiles en el frontend | **RESUELTO**: eliminado `package-lock.json`; queda `pnpm-lock.yaml` como fuente única |
| Directorio vacío `backend-kaffa/backend-kaffa/` | **RESUELTO**: eliminado |

**Estas son observaciones derivadas de la auditoría de documentación y su remediación; no se ejecutó un pentest.** Para un análisis exhaustivo orientado a vulnerabilidades puede usarse una auditoría de seguridad dedicada.

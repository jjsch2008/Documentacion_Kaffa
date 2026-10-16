# 08 — Pruebas y Calidad

## 1. Estrategia y frameworks

**Tabla 1.** _Frameworks y configuración de pruebas_

| Aplicación | Framework | Configuración |
|------------|-----------|---------------|
| Backend | **PHPUnit 10** (`^10.1`, dev) [9] | `phpunit.xml`: base de datos de pruebas **PostgreSQL `kaffa_test`** (no sqlite, no hereda la base real), `BCRYPT_ROUNDS=4`, caché/cola/sesión en `array` |
| Frontend | **No hay pruebas automatizadas** | solo ESLint (`npm run lint`); `[GAP]` no existe `test` script ni framework de tests |

> **Ejecución real de la suite**: 05-10-2026, `php artisan test` sobre PostgreSQL local con base `kaffa_test` ⇒ **63 pruebas pasando, 0 fallos (228 aserciones)**. Advertencias: 2 avisos de deprecación preexistentes de PHP 8.5 (constante `PDO::MYSQL_ATTR_SSL_CA` referenciada en `config/database.php`), ajenos a la lógica de la aplicación.

## 2. Inventario de pruebas del backend (`backend-kaffa/tests/`)

### 2.1 Suite original

**Tabla 2.** _Inventario de pruebas: suite original_

| Archivo | Qué verifica |
|---------|--------------|
| `tests/Unit/ExampleTest.php` | trivial (`assertTrue(true)`) |
| `tests/Feature/ExampleTest.php` | la ruta web `/` responde 200 |
| `tests/Feature/ApiTest.php` | Login válido devuelve `{access_token, token_type, usuario}`; contraseña errónea ⇒ 401 con mensaje; ruta protegida sin token ⇒ 401; `GET /api/v1/productos` autenticado devuelve envoltura paginada `{data, links, meta}` |
| `tests/Feature/EquipoTest.php` | 10 pruebas del endpoint público `/equipo`: acceso público; administradora siempre presente; filtrado mañana/tarde; cambio de fecha; baristas inactivos excluidos; **sin datos sensibles** (correo/password); tipo inválido ⇒ 422; fecha inválida ⇒ 422; valores por defecto (hoy + mañana) |
| `tests/Feature/EmailVerificationTest.php` | (7) El registro envía el **código** de verificación y no devuelve token; login sin verificar ⇒ 403 `EMAIL_NOT_VERIFIED`; código correcto verifica y es de un solo uso; código incorrecto incrementa intentos; código expirado ⇒ 422; demasiados intentos bloquea; el reenvío envía un código nuevo |
| `tests/Feature/PasswordResetTest.php` | (5) `forgot-password` envía el código y lo guarda; respuesta uniforme 200 para correo desconocido (anti-enumeración); código válido actualiza la contraseña (hash); código inválido ⇒ 422; el reseteo **revoca todos los tokens** |

### 2.2 Suite ampliada (pasada de seguridad 2026-09, 6 archivos nuevos, 35 pruebas)

**Tabla 3.** _Inventario de pruebas: suite ampliada_

| Archivo | Qué verifica |
|---------|--------------|
| `tests/Feature/PedidoTest.php` | Creación de pedido por cliente con **autoría forzada** y estado `pendiente`; nota por línea; **numeración server-side de factura** (formato `F{YYYY}{NNNNNN}`); **descuento de stock por receta**; medio virtual sin comprobante ⇒ 422; **consistencia de pagos** (Σ pagos = total ±0.01) ⇒ 422 con transacción revertida; **stock insuficiente** ⇒ 422 sin alterar inventario; **scope por rol** (cada cliente ve solo sus pedidos); cliente bloqueado en actualización (403) |
| `tests/Feature/CajaTest.php` | Apertura con campos del servidor (`abierta_por`, `estado`, montos, `turno_id` null en admin); apertura del barista con **turno_id automático**; **arqueo calculado** al cierre (apertura + ingresos − egresos); **movimiento `ingreso`** generado por el pago del pedido; **bloqueo de eliminación con movimientos** (422); eliminación de caja sin movimientos (soft delete); **barista no opera caja ajena** (422) |
| `tests/Feature/CompraMermaTest.php` | Compra **incrementa stock**; compra con medio virtual sin comprobante ⇒ 422; **eliminación de compra revierte stock**; merma **descuenta stock** y fuerza `usuario_id`; merma excedente ⇒ 422 sin alterar inventario; **eliminación de merma restaura stock** |
| `tests/Feature/TurnoMiddlewareTest.php` | Barista **con turno activo** opera (201); sin turno ⇒ 403 `TURNO_INACTIVO`; fuera de horario ⇒ 403 `FUERA_HORARIO`; **admin exento**; **cliente exento** para crear su pedido; **token sin la ability** ⇒ 403 `TOKEN_SIN_ABILITY` |
| `tests/Feature/ChatReporteTest.php` | Chat: cliente→barista (201), cliente→cliente bloqueado (422), auto-mensaje bloqueado (422), destinatario inactivo (422); **bandeja con no leídos, hilo y marcado masivo**; Reportes: barista crea con **autoría forzada**, cliente bloqueado (403), **admin gestiona** (listar/leído) |
| `tests/Feature/TokenSessionTest.php` | `/auth/refresh` **rota y revoca el anterior**; `/auth/logout-all` revoca todos; `/logout` revoca solo el actual; middleware `ability:` rechaza token sin permiso (403 `TOKEN_SIN_ABILITY`) y permite `*` |

> Nota técnica para mantener estas pruebas: la instancia de la aplicación en tests cachea el guard autenticado entre peticiones del mismo método; los tests usan `$this->app['auth']->forgetGuards()` antes de cambiar de usuario/token, y leen los recursos individuales desde `json('data.id')` (los `BaseResource` envuelven la respuesta en `data`).

### 2.3 Asistente IA de ventas (2026-10)

**Tabla 4.** _Inventario de pruebas: Asistente IA_

| Archivo | Qué verifica |
|---------|--------------|
| `tests/Feature/AsistenteTest.php` | El admin envía un mensaje, recibe la respuesta del proveedor externo **simulado con `Http::fake`** (no consume cuota) y **ambos turnos se persisten** en `asistente_mensajes`; `GET`/`DELETE` del historial; **barista y cliente reciben 403**; sin token ⇒ 401 |

## 3. Ejecución de las pruebas

```bash
cd backend-kaffa
# crear la base de pruebas (una sola vez):
#   CREATE DATABASE kaffa_test;   (PostgreSQL)
php artisan test          # o: vendor/bin/phpunit
```

Las pruebas usan `RefreshDatabase` (migraciones por ejecución).

## 4. Cobertura verificada vs. no cubierta

**Cubierto (suite ejecutada, 66 pruebas)**: login y protección por token; envoltura de paginación; endpoint público `/equipo`; verificación de correo por **código OTP**; reseteo de contraseña por **código**; pedidos (autoría forzada, comprobante virtual, consistencia de pagos, stock, scope por rol); facturación secuencial; caja y arqueo (movimientos, bloqueo de eliminación, caja ajena); compras y mermas (ajuste/restauración de stock); middleware `turno.activo` (códigos `FUERA_HORARIO`/`TURNO_INACTIVO`, exenciones); chat (reglas y no leídos); reportes (roles y autoría); rotación/revocación de tokens (`refresh`/`logout`/`logout-all`) y middleware `ability:` (`TOKEN_SIN_ABILITY`); Asistente IA (persistencia, respuesta simulada y bloqueo por rol).

**No cubierto** `[GAP]` (funcionalidad sin pruebas automatizadas detectadas): CRUD de catálogo completo (create/update/delete de productos/categorías/insumos/recetas/medios-pago), gestión de usuarios/roles/turnos del admin, **subida de imágenes a Cloudinary** (ocurre en el frontend; el backend sólo se cubre con la validación de `App\Rules\CloudinaryUrl`), gastos con caja (movimientos `egreso`), consultas con filtros avanzados (`fecha_desde`/`fecha_hasta`/`sort_by`), throttle por rutas (verificación de límites), frontend (sin framework de tests).

**Medición de cobertura**: no existe medición de cobertura de código en el repositorio (no se ejecutó `--coverage`).

## 5. Pruebas manuales sugeridas (por flujo)

`[RECOMENDACIÓN]` — derivadas de reglas de negocio verificadas en código:

1. Login de los 3 roles sembrados y redirección por rol en la SPA.
2. Registro público → bloqueo de login hasta verificar → verificación → login.
3. Cliente: crear pedido con pago virtual sin comprobante ⇒ 422; con comprobante ⇒ 201; ver solo sus pedidos.
4. Barista: fuera de turno ⇒ 403 (`FUERA_HORARIO`/`TURNO_INACTIVO`); con turno: cobrar, cambiar estados, abrir y cerrar caja, revisar arqueo.
5. Admin: crear usuario con roles, gestionar catálogo, turnos y reportes; caja sin restricción de turno.
6. Compra de insumos ⇒ sube stock; merma ⇒ baja stock; eliminar merma ⇒ restaura stock.
7. Asistente IA: con el admin, abrir «Asistente IA», preguntar por las ventas y verificar que responde con datos reales; comprobar que barista y cliente no ven la sección ni obtienen datos del endpoint (403).

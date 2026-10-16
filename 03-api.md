# 03 — Referencia de la API REST

> **Fuente de verdad de la API.** Ante cualquier discrepancia con otros documentos (`04-modulos.md`, README del backend, `prompt_android_app.md`), **rige este documento**, junto con la especificación OpenAPI generada desde el código: [`docs/openapi.json`](openapi.json) (generador: Scramble [8], ruta de desarrollo `GET /docs/api`).

Fuente principal: `backend-kaffa/routes/api.php`, controladores en `app/Http/Controllers/`, validadores en `app/Http/Requests/`. Prefijo registrado en `app/Providers/RouteServiceProvider.php`.

## 1. Convenciones generales

**Tabla 1.** _Convenciones generales de la API_

| Aspecto | Valor |
|---------|-------|
| Base URL | `http://{host}:8000/api/v1` (desarrollo) — en producción la SPA la llama relativa como `/api/v1` |
| Autenticación | Header `Authorization: Bearer {token}` (tokens personales Sanctum) |
| Formato | JSON |
| Paginación | Todas las listas: `{data: [...], links: {...}, meta: {current_page, last_page, per_page, total, …}}` |
| `per_page` | Por defecto 15; rango válido 1–100 (`HasBasicQueries::consultar`) |
| Filtros exactos | Cualquier columna permitida (fillable/clave) del modelo, p. ej. `?estado=pendiente&cliente_id=3` |
| Búsqueda parcial (LIKE) | Columnas de texto: `nombre`, `descripcion`, `correo`, `nit`, `direccion`, `motivo` |
| Filtros de fecha | `?fecha_desde=2026-01-01&fecha_hasta=2026-12-31` (sobre `created_at`) |
| Ordenamiento | `?sort_by=created_at&sort_order=desc` (por defecto: PK descendente) |
| Rol del usuario | `GET /me` y `GET /user` devuelven el usuario con `roles` cargados |

## 2. Autenticación y sesión

### 2.1 Endpoints

**Tabla 2.** _Endpoints de autenticación y sesión_

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/login` | No | Recibe `{correo, password}`. Throttle 5/min. |
| POST | `/registro` | No | Registro público (rol `cliente` fijo). **Alta diferida**: guarda el pendiente y envía el código; no crea el usuario aún. Throttle 10/min. No devuelve token. |
| POST | `/forgot-password` | No | Envía un **código OTP** de restablecimiento. Throttle 5/min. |
| POST | `/reset-password` | No | Restablece contraseña con `{correo, codigo, password, password_confirmation}`. Throttle 5/min. |
| POST | `/email/verify-code` | No | Verifica el alta con `{correo, codigo}` (OTP de 6 dígitos) y **crea el usuario** ya verificado. Throttle 10/min. |
| POST | `/email/verification-notification` | No | Reenvía el **código** de verificación. Throttle 5/min. |
| GET | `/me` | Sí | Perfil autenticado con roles (oculta `password`, `remember_token`) |
| GET | `/user` | Sí | Equivalente a `/me` |
| POST | `/logout` | Sí | Revoca el token actual |
| POST | `/auth/refresh` | Sí | Rota el token (revoca el actual y emite uno nuevo) |
| POST | `/auth/logout-all` | Sí | Revoca todos los tokens del usuario |
| PUT | `/perfil` | Sí | Actualiza `{nombre?, correo?, password?}` del propio usuario |
| GET | `/health` | Sí | Comprueba la validez del token (`{status: "ok"}`) |

### 2.2 `POST /login`

Cuerpo:

```json
{ "correo": "admin@kaffa.com", "password": "admin123" }
```

Respuesta 200 (verificada en `AuthController::login`):

```json
{
  "access_token": "1|xxxxxxxx…",
  "token_type": "Bearer",
  "usuario": { "id": 1, "nombre": "…", "correo": "…", "roles": [ … ] },
  "turno_activo": true,
  "turno_info": { "id": 4, "fecha": "2026-09-28", "tipo": "mañana", "minutos_restantes": 95 }
}
```

`turno_activo`/`turno_info` solo se calculan para usuarios con rol barista.

Errores de login:

**Tabla 3.** _Errores del endpoint de login_

| Código | Condición | Cuerpo |
|--------|-----------|--------|
| 401 | Credenciales inválidas | `{message: "Credenciales inválidas."}` |
| 403 | Usuario inactivo | `{message: "Este usuario está inactivo. …"}` |
| 403 | Correo sin verificar | `{message: "Debes verificar tu correo…", code: "EMAIL_NOT_VERIFIED"}` |
| 429 | Demasiados intentos | throttle 5/min |

### 2.3 `POST /registro` — alta diferida

Cuerpo: `{nombre, correo, password}`. La contraseña exige mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos.

Devuelve **201 sin token** y **no crea el usuario**: guarda el alta en `registros_pendientes` (nombre + contraseña hasheada) y envía un **código OTP de 6 dígitos** al correo. Reintentar el registro con el mismo correo **actualiza** el pendiente y reenvía el código (ya no responde `correo ya existe`, pues aún no hay usuario).

### 2.4 Verificación de correo por código (OTP)

- Registro → código de 6 dígitos por correo; válido **15 min**, **5 intentos**, reenvío con **cooldown de 60 s**.
- `POST /email/verify-code` `{correo, codigo}` → `200` y **crea el usuario ya verificado** (con rol `cliente`) a partir del pendiente; código incorrecto/expirado o demasiados intentos ⇒ `422`. El usuario sigue sin existir en `users` hasta este paso.
- `POST /email/verification-notification` `{correo}` → reenvía el código del alta pendiente (respuesta uniforme, anti-enumeración).
- El código se guarda **hasheado** (tabla `codigos_otp`) y es de **un solo uso**. Los pendientes con más de 24 h se descartan.

### 2.5 Recuperación de contraseña por código (OTP)

- `POST /forgot-password` `{correo}`: respuesta uniforme 200 (evita enumeración de usuarios); envía un **código de 6 dígitos**.
- `POST /reset-password` `{correo, codigo, password, password_confirmation}`: valida el código; al restablecer, **se revocan todos los tokens Sanctum** del usuario.

## 3. Endpoints públicos (landing, catálogo y eventos)

**Tabla 4.** _Endpoints públicos (sin autenticación)_

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/equipo` | Equipo visible en la landing: `{administradora: {id, nombre, foto}, baristas: [{id, nombre, foto}], fecha, tipo}`. Throttle 60/min. |
| GET | `/categorias`, `/categorias/{id}` | Catálogo de categorías (sólo `index`/`show`) para el Home del invitado. Throttle 60/min. |
| GET | `/productos`, `/productos/{id}` | Catálogo de productos (sólo `index`/`show`) para el Home del invitado. Throttle 60/min. |
| GET | `/eventos` | Eventos publicados (`publicado = true`), orden `fecha, hora` ascendente. Throttle 60/min. |
| GET | `/eventos/{id}` | Detalle público de un evento publicado (`whereNumber`; un borrador responde 404). Throttle 60/min. |

Parámetros (`/equipo`): `?fecha=YYYY-MM-DD` y `?tipo=mañana|tarde|abierto` (por defecto: hoy America/Bogota y `mañana`). La administradora es fija (primer admin activo); los baristas son los asignados al turno que cubre `fecha` y su tipo, y activos. No expone correos ni datos sensibles.

> **Catálogo público.** Categorías y productos se sirven **sin sesión** (Home del invitado de la app móvil y menú web): son de sólo lectura (`index`/`show`) y están limitados con `throttle:60,1`. Las escrituras siguen siendo exclusivas del admin (ver §4). Los recursos sensibles (insumos, recetas, medios-pago) **no** son públicos.

### 3.1 Eventos — gestión (administración)

**Tabla 5.** _Endpoints de gestión de eventos (admin)_

| Método | Endpoint | Middleware adicional | Descripción |
|--------|----------|----------------------|-------------|
| GET | `/eventos/admin` | `ability:eventos:manage` | Listado de gestión: incluye borradores y publicados. |
| POST | `/eventos` | `ability:eventos:manage` | Crea `{titulo, descripcion, lugar?, fecha, hora?, publicado?, imagenes[]?}`. |
| POST | `/eventos/imagen` | `ability:eventos:manage` | Subida **multipart** de una imagen (campo `imagen`, ≤ 5 MB) → `{url}`. |
| PUT/PATCH | `/eventos/{id}` | `ability:eventos:manage` | Actualiza; `imagenes` (si se envía) **reemplaza** la galería. |
| DELETE | `/eventos/{id}` | `ability:eventos:manage` | Soft delete. |

Reglas (verificadas en `EventoController`, `StoreEventoRequest`/`UpdateEventoRequest` y `Evento`):

- Todo el grupo exige `role:admin` + `throttle:30,1` + `ability:catalogo:manage` (grupo de escritura de catálogo) **y** `ability:eventos:manage`.
- Máximo **5 imágenes** por evento (`Evento::MAX_IMAGENES`); cada URL se valida con `App\Rules\CloudinaryUrl` (acepta URLs externas y de nuestra cuenta Cloudinary).
- `POST /eventos/imagen` permite a la app móvil subir la imagen desde la cámara/galería: el archivo se guarda en el disco `public` (carpeta `eventos`) y se devuelve una **URL absoluta** que el cliente persiste luego en `imagenes[]`. Es compatible con el flujo Cloudinary del navegador (que envía la `secure_url` directamente).

## 4. Catálogos

**Tabla 6.** _Catálogos: lectura y escritura por rol_

| Recurso | Lectura (index/show) | Escritura (store/update/destroy) |
|---------|----------------------|-----------------------------------|
| `/categorias` | **Público** (sin sesión, throttle 60/min) | Solo admin (throttle 30/min) |
| `/productos` | **Público** (sin sesión, throttle 60/min) | Solo admin (throttle 30/min) |
| `/insumos` | Todos los autenticados | Solo admin (throttle 30/min) |
| `/recetas` | Todos los autenticados | Solo admin (throttle 30/min) |
| `/medios-pago` | Todos los autenticados | Solo admin (throttle 30/min) |

Ejemplos de carga útil (validadores `Store*Request`):

- `POST /productos`: `{nombre, descripcion?, imagen? (URL max 500), precio_venta (≥0), categoria_id?, activo?}`
- `POST /categorias`: `{nombre}`
- `POST /insumos`: `{nombre (único), unidad_medida?, stock_actual?, stock_minimo?, activo?}` (el stock solo se fija al crear; luego lo mueven compras/mermas/ventas)
- `POST /recetas`: `{producto_id, insumo_id, cantidad}`
- `POST /medios-pago`: `{nombre (único), es_virtual}`

## 5. Pedidos

**Tabla 7.** _Endpoints de pedidos_

| Método | Endpoint | Roles | Middleware adicional |
|--------|----------|-------|----------------------|
| GET | `/pedidos` | admin, barista: todos; cliente: solo los propios (`scopeByUser`) | — |
| POST | `/pedidos` | admin, barista, cliente | `turno.activo` (solo baristas) + throttle 10/min + `ability:pedidos:create,pedidos:manage` |
| GET | `/pedidos/{id}` | admin, barista; cliente: solo propios | — |
| PUT | `/pedidos/{id}` | admin, barista | `turno.activo` + throttle 10/min + `ability:pedidos:manage` |
| DELETE | `/pedidos/{id}` | admin, barista | `turno.activo` + throttle 10/min + `ability:pedidos:manage` |

### 5.1 `POST /pedidos` — carga útil (`StorePedidoRequest`)

```json
{
  "cliente_id": 3,
  "barista_id": 2,
  "total": 25.50,
  "propina": 2.00,
  "estado": "pendiente",
  "caja_id": 1,
  "descripcion_movimiento": "Venta de café",
  "detalles": [
    { "producto_id": 1, "cantidad": 2, "precio_unitario": 10000, "subtotal": 20000, "nota": "sin azúcar" }
  ],
  "pagos": [
    { "medio_pago_id": 4, "monto": 25500, "comprobante_url": "https://…/recibo.jpg" }
  ],
  "factura": { "subtotal": 23000, "impuestos": 2500, "total": 25500 }
}
```

Reglas (verificadas en `StorePedidoRequest` + `PedidoService`):

- `estado` ∈ `pendiente | pagado | cancelado | entregado`.
- `detalles[].cantidad` entero ≥ 1; `nota` máx. 500.
- `pagos[].monto` ≥ 0.01; `comprobante_url` obligatoria (URL válida, máx. 500) **si el medio de pago es virtual**; si se omite en ese caso ⇒ 422.
- **Autoría forzada**: el cliente crea siempre su propio pedido (`cliente_id` = su ID) y con estado `pendiente`; el barista firma `barista_id` = su ID; el admin puede asignar libremente.
- La **caja** debe existir y estar `abierta`; un barista solo puede operar **su propia** caja (`lockForUpdate`).
- **Stock validado** antes de crear: si algún insumo insuficiente ⇒ 422 `Stock insuficiente…` (excepción `BusinessRuleException`).
- **Consistencia de pagos**: Σ pagos ≈ total (tolerancia ±0.01); estado `pagado` exige ≥ 1 pago; si no ⇒ 422.
- **Factura**: el servidor genera `numero_factura` (`F{año}{NNNNNN}`); el campo enviado por el cliente se ignara/rechaza.
- Se registran movimientos de caja `ingreso` por cada pago (si `caja_id`) y el evento `PedidoCreado` descuenta el inventario según recetas.

### 5.2 `PUT /pedidos/{id}` (`UpdatePedidoRequest`)

Solo admite `total`, `propina`, `estado` (con `sometimes`). `cliente_id`/`barista_id` **no son actualizables** (autoría inmutable). Si un barista actualiza un pedido sin barista asignado, el backend le asigna a sí mismo (`PedidoController::update`).

### 5.3 `DELETE /pedidos/{id}`

Borrado en cascada gestionado por `PedidoService::eliminar`: elimina detalles, movimientos de caja vinculados a sus pagos, pagos y factura, y hace soft delete del pedido. No restaura el stock de insumos.

## 6. Pagos y comprobantes

**Tabla 8.** _Endpoints de pagos y comprobantes_

| Método | Endpoint | Roles | Notas |
|--------|----------|-------|-------|
| GET | `/pago-pedidos` | admin, barista | index/show; el cliente consulta los pagos de sus pedidos a través de `GET /pedidos` (relación `pagos`) |
| POST | `/pago-pedidos` | admin, barista | `turno.activo` + throttle 10/min |
| PUT/DELETE | `/pago-pedidos/{id}` | admin, barista | `turno.activo` + throttle 10/min |

> **Imágenes y Cloudinary**: las imágenes (productos, eventos, fotos de perfil y comprobantes) se suben **directamente del navegador a Cloudinary** con un upload preset *unsigned* (`cloud_name = roffd6et`, `upload_preset = KAFFACCYS`, carpeta `samples/ecommerce`). El backend **no recibe archivos** en el flujo web: sólo recibe y valida la `secure_url` resultante (regla `App\Rules\CloudinaryUrl`, que exige que las URLs de `res.cloudinary.com` pertenezcan a nuestra cuenta) y la persiste en el campo correspondiente (`productos.imagen`, `users.foto`, `evento_imagenes.url`, `pagos.*.comprobante_url`). **Excepción (móvil)**: `POST /eventos/imagen` sí recibe el archivo (multipart), lo guarda en el disco `public` y devuelve una URL absoluta — pensado para la cámara/galería de la app; esa URL se persiste luego en `imagenes[]` del evento.

## 7. Facturas

**Tabla 9.** _Endpoints de facturas_

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/factura-ventas`, `/factura-ventas/{id}` | admin (`FacturaVentaPolicy`). El cliente ve la factura de sus pedidos a través de `GET /pedidos` (relación `factura_venta`) |
| POST | `/factura-ventas` | admin |
| PUT/DELETE | `/factura-ventas/{id}` | admin |

El `numero_factura` siempre lo genera el servidor a partir de `factura_contadores` (transacción + `lockForUpdate`, sin huecos ni carreras). Formato: `F` + año + 6 dígitos (p. ej. `F2026000042`).

## 8. Caja y movimientos

**Tabla 10.** _Endpoints de caja y movimientos_

| Método | Endpoint | Roles | Notas |
|--------|----------|-------|-------|
| GET | `/cajas` | admin, barista | barista ve todas; la SPA filtra `abierta_por` = su ID |
| POST | `/cajas` | admin, barista | `turno.activo` + throttle 10/min |
| GET | `/cajas/{id}` | admin, barista | incluye `movimientos` |
| PUT | `/cajas/{id}` | admin, barista | `turno.activo` + throttle 10/min |
| DELETE | `/cajas/{id}` | admin, barista | bloqueado si hay movimientos (422) |
| GET | `/movimiento-cajas`, `/movimiento-cajas/{id}` | admin, barista | `turno.activo`. Escritura (store/update/destroy): solo admin (`MovimientoCajaPolicy` + `ability:movimiento-cajas:manage`); los movimientos operativos los emiten los servicios |
| GET | `/turno-activo` | todos los autenticados | `{turno_activo, turno_info{id, fecha, fecha_fin, tipo, minutos_restantes, hora_inicio, hora_fin}}` |

Reglas de apertura (`POST /cajas`, `StoreCajaRequest`): solo se recibe `monto_apertura_fisico` (requerido) y opcionalmente el desglose `monto_apertura_efectivo`/`monto_apertura_digital`. El servidor fija `abierta_por`, `estado='abierta'`, `fecha_apertura=now` y `turno_id` (turno activo del barista; null para admin).

Reglas de cierre (`PUT /cajas/{id}`): se envían `estado='cerrada'` y los montos declarados de cierre (`monto_cierre_fisico` y desglose). El **servidor calcula** `monto_cierre_sistema` = apertura + ingresos − egresos de los movimientos; fija `cerrada_por` y `fecha_cierre`.

## 9. Compras, proveedores, gastos y mermas

Todos los recursos siguientes exigen `role:admin,barista` + `turno.activo`; sus **escrituras** (POST/PUT/DELETE) están limitadas a throttle 10/min, mientras que las **lecturas** (`GET index`/`show`) no consumen ese cupo (el throttle de Laravel es por usuario y se comparte entre rutas del grupo, por lo que limitar también las lecturas agotaba el cupo de las escrituras). Cada recurso exige además que el token posea su ability (`compras:manage`, `gastos:manage`, `mermas:manage`, `cajas:manage` — middleware `ability:`): un token sin el alcance recibe **403** `TOKEN_SIN_ABILITY`.

**Tabla 11.** _Recursos operativos (compras, gastos, mermas, proveedores)_

| Recurso | Métodos | Carga útil relevante |
|---------|---------|----------------------|
| `/compras` | CRUD completo | `{proveedor_id?, numero_factura_proveedor, fecha_compra?, total_compra, detalles:[{insumo_id, cantidad, precio_costo}], pagos:[{medio_pago_id, monto, comprobante_url?}]}` — **incrementa stock**; su eliminación lo revierte (falla si el stock quedaría negativo) |
| `/detalle-compras` | CRUD completo | `{compra_id, insumo_id, cantidad, precio_costo}` |
| `/compra-pagos` | CRUD completo | `{compra_id, medio_pago_id, monto, comprobante_url?}` (obligatoria si medio virtual) |
| `/proveedores` | CRUD completo | `{nit (único), nombre, telefono?, correo?, direccion?, activo}` (sin throttle estricto) |
| `/gastos` | CRUD completo | `{descripcion, categoria?, pagos:[{medio_pago_id, monto, comprobante_url?}]}` — `usuario_id` forzado al autenticado |
| `/gasto-pagos` | CRUD completo | `{gasto_id, medio_pago_id, monto, comprobante_url?}` |
| `/mermas` | CRUD completo | `{insumo_id, cantidad, motivo?}` — `usuario_id` forzado; valida stock suficiente; **reduce stock**; su eliminación lo restaura |

## 10. Turnos

**Tabla 12.** _Endpoints de turnos_

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| GET | `/turnos` | admin | Lista con `baristas` cargados |
| POST | `/turnos` | admin | `{fecha (Y-m-d), fecha_fin (Y-m-d, opcional, ≥ fecha), tipo ∈ mañana\|tarde\|abierto, barista_ids[] (≥1)}` — único por `fecha+tipo`. Si se omite `fecha_fin`, el turno dura un solo día (`fecha_fin = fecha`) |
| GET/PUT/DELETE | `/turnos/{id}` | admin | PUT reemplaza los baristas asignados (`fecha_fin` y `tipo` editables) |
| GET | `/mis-turnos` | barista | Turnos propios, paginado 15, orden `fecha,tipo asc` |
| GET | `/turno-activo` | todos los autenticados | Turno activo del barista: `{turno_activo, turno_info{id, fecha, fecha_fin, tipo, minutos_restantes, hora_inicio, hora_fin}}` (para no baristas: `{turno_activo:false, turno_info:null}`) |

Horarios (`TurnoService`): mañana 07:00–13:00, tarde 13:00–18:00, **abierto 05:00–22:00** (jornada extendida), zona `America/Bogota`. Un turno **cubre** una fecha si cae dentro de su rango `[fecha, fecha_fin]` (`fecha_fin` es **opcional**: si se omite o es nula, equivale a un turno de un solo día). El tipo `abierto` tiene **prioridad** sobre mañana/tarde cuando el barista lo tiene asignado. Fuera de 05:00–22:00 no hay turno esperado.

> Al eliminar un turno con **cajas asociadas** se responde 422 (`BusinessRuleException`): primero deben cerrarse sus cajas.

## 11. Chat (`/mensajes`)

**Tabla 13.** _Endpoints del chat_

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/mensajes` | Sin `?con=`: bandeja con contactos (`{contactos: [{id, nombre, ultimo_mensaje, ultima_hora, no_leidos}]}`). Con `?con={id}`: hilo completo (paginación 50, desc) + contacto |
| GET | `/mensajes/contactos` | Sugerencias de contacto según rol (cliente ↔ barista/admin; barista/admin ↔ clientes), solo usuarios activos |
| POST | `/mensajes` | `{destinatario_id, mensaje (máx. 1000)}`. Rechaza (422): destinatario inexistente/inactivo, auto-mensajes y chat cliente→cliente |
| POST | `/mensajes/leer` | `{con: id}` marca como leídos los mensajes no leídos de ese contacto |

## 12. Reportes de novedades

**Tabla 14.** _Endpoints de reportes_

| Método | Endpoint | Roles |
|--------|----------|-------|
| POST | `/reportes` | admin, barista — `{mensaje, prioridad ∈ baja\|media\|alta}`; `barista_id` forzado al autenticado |
| GET | `/reportes`, `/reportes/{id}` | admin |
| PUT/PATCH | `/reportes/{id}` | admin — `{mensaje?, prioridad?, leido?}` |
| DELETE | `/reportes/{id}` | admin |

## 13. Usuarios y roles (solo admin)

**Tabla 15.** _Endpoints de administración de usuarios y roles_

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/usuarios` | Soporta filtro `?rol=admin\|barista\|cliente` |
| POST | `/usuarios` | `{nombre, correo (único), password (fuerte), foto? (URL), activo?, rol_ids[]}` — los usuarios creados por el admin nacen **verificados**. Se acepta también la clave `roles[]` (la envía la app móvil) como alias de `rol_ids[]`. |
| PUT | `/usuarios/{id}` | Ídem (password opcional; sincroniza `rol_ids`/`roles`) |
| DELETE | `/usuarios/{id}` | Soft delete |
| GET/POST/PUT/DELETE | `/roles` | CRUD de roles |
| GET/POST/PUT/DELETE | `/usuario-roles` | Asignación de roles (pivote) |

## 14. Matriz RBAC resumida

**Tabla 16.** _Matriz RBAC resumida_

| Capacidad | admin | barista | cliente |
|-----------|:-----:|:-------:|:--------:|
| Catálogos: lectura | ✔ | ✔ | ✔ (categorías/productos, además, **sin sesión**) |
| Catálogos: escritura | ✔ | — | — |
| Eventos: lectura | ✔ | ✔ | ✔ (publicados; **sin sesión**) |
| Eventos: gestión (crear/editar/publicar/imagen) | ✔ | — | — |
| Usuarios / roles / turnos / factura-ventas: CRUD | ✔ | — | — |
| Pedidos: ver | todos | todos | solo propios |
| Pedidos: crear | ✔ | ✔ (mostrador) | ✔ (propios, `pendiente`) |
| Pedidos: actualizar/eliminar | ✔ | ✔ (con turno activo) | — |
| Pagos de pedidos: ver | ✔ | ✔ | solo de sus pedidos (vía pedidos) |
| Pagos: registrar | ✔ | ✔ (con turno activo) | — |
| Compras / gastos / mermas / cajas | ✔ | ✔ (con turno activo) | — |
| Proveedores: lectura | ✔ | ✔ (con turno activo) | — |
| Proveedores: escritura | ✔ | — (`ability:proveedores:manage`, solo admin) | — |
| Movimientos de caja: lectura | ✔ | ✔ (con turno activo) | — |
| Movimientos de caja: escritura | ✔ | — (solo admin) | — |
| Chat | ✔ (con clientes) | ✔ (con clientes) | ✔ (con barista/admin) |
| Reportes: crear | ✔ | ✔ | — |
| Reportes: gestionar | ✔ | — | — |
| Asistente KAFFA (chatbot) | ✔ (analítica) | ✔ (operativo) | ✔ (ayuda del menú) |

Middleware `role:` responde **401** si no hay usuario autenticado y **403** `{message: "No tienes permiso para realizar esta acción."}` si el rol no corresponde.

## 15. Códigos de error de negocio (403)

**Tabla 17.** _Códigos de error de negocio_

| Código | Condición |
|--------|-----------|
| `EMAIL_NOT_VERIFIED` | Login con correo no verificado |
| `FUERA_HORARIO` | Barista fuera de 05:00–22:00 (America/Bogota) |
| `TURNO_INACTIVO` | Barista sin turno asignado que cubra el tramo horario actual |
| `TURNO_EXPIRADO` | El turno del barista ya terminó («Debes cerrar la caja inmediatamente») |
| `PERMISO_DENEGADO` | Un rol no autorizado intenta crear un pedido (403) |
| `CAJA_NO_EXISTE` | Se referencia una caja inexistente (422) |
| `CAJA_CERRADA` | La caja indicada no está abierta (422) |
| `CAJA_AJENA` | Un barista opera contra una caja abierta por otro barista (422) |

Los cuatro últimos se emiten desde `PedidoService`/`CompraService`/`GastoService` vía `BusinessRuleException` con un campo `code` adicional en el cuerpo JSON (`Handler`), que el cliente móvil/SPA puede leer sin analizar el mensaje. El resto de `BusinessRuleException` conserva el formato `{message}`.

Otras respuestas de error: **401** no autenticado (JSON, nunca redirección); **403** `TOKEN_SIN_ABILITY` (token sin la ability exigida por el middleware `ability:`); **404** `{"message": "Recurso no encontrado."}` para rutas API inexistentes (`Handler`); **422** errores de validación Laravel + `BusinessRuleException` (stock insuficiente, pagos inconsistentes, caja con movimientos, etc.); **429** límites de throttle.

## 16. Throttling (límites de peticiones)

**Tabla 18.** _Límites de peticiones (throttling)_

| Grupo | Límite |
|-------|--------|
| Global API (`api` group) | 60/min por usuario o IP (`RouteServiceProvider`) |
| `/login` | 5/min |
| `/registro` | 10/min |
| `/forgot-password`, `/reset-password`, `/email/verification-notification` | 5/min |
| `/email/verify-code` | 10/min |
| `/equipo`, `/categorias`, `/productos`, `/eventos` (públicos) | 60/min |
| Escrituras de catálogo + gestión de eventos (admin) | 30/min |
| `POST /pedidos`, escrituras operativas (pedidos/pagos/compras/gastos/mermas/cajas) | 10/min |
| `/asistente/*` (Asistente KAFFA, todos los roles autenticados) | 30/min |

## 17. Asistente KAFFA (todos los roles)

**Tabla 19.** _Endpoints del Asistente KAFFA_

| Método | Endpoint | Roles | Middleware adicional | Descripción |
|--------|----------|-------|----------------------|-------------|
| GET | `/asistente/mensajes` | todos los autenticados | throttle 30/min | Historial del hilo del usuario (`?per_page` 1–100, por defecto 15; más reciente primero). |
| POST | `/asistente/chat` | todos los autenticados | throttle 30/min | Envía `{mensaje (máx. 2000)}` y devuelve la respuesta adaptada al rol. |
| DELETE | `/asistente/mensajes` | todos los autenticados | throttle 30/min | Reinicia (borra) la conversación del usuario autenticado. |

`POST /asistente/chat` — respuesta 200:

```json
{ "respuesta": "…texto del asistente…", "mensaje_id": 42, "created_at": "2026-10-16T15:47:46-05:00" }
```

Reglas y funcionamiento (verificado en `AsistenteController` y `AsistenteService`):

- **Disponible para todos los roles autenticados** (`auth:sanctum` + `throttle:30,1`); no exige una ability específica (es el ícono flotante de la app móvil, también visible para clientes).
- La respuesta se **adapta al rol** (`rolAsistente`): el **admin** recibe analítica completa (ventas hoy/7 días/mes, productos más vendidos, inventario por reponer, pedidos, gastos, **predicción** de ventas por promedio móvil a 7 días y **recomendaciones de promoción**); el **barista**, la analítica operativa (ventas, productos, inventario, pedidos — sin gastos ni predicciones); el **cliente**, ayuda del menú, medios de pago, cómo hacer un pedido, eventos próximos y sede, **sin** métricas internas del negocio.
- El servicio es **local** (`AsistenteService`): interpreta la intención por palabras clave y responde con **consultas reales a la base de datos**, sin depender de una API externa. Las claves `GEMINI_*` (`config/services.php`) se conservan por si se conecta un modelo más adelante, pero **no se usan** en el flujo actual.
- Cada turno (`user` y `assistant`) se **persiste** en `asistente_mensajes`, aislado por `usuario_id`.
- Errores: **401** sin token; **422** si `mensaje` falta o excede 2000 caracteres; **429** por throttle.

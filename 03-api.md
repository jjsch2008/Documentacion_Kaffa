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
| POST | `/registro` | No | Registro público (rol `cliente` fijo). Throttle 10/min. No devuelve token. |
| POST | `/forgot-password` | No | Envía correo de recuperación. Throttle 5/min. |
| POST | `/reset-password` | No | Restablece contraseña con `{correo, token, password, password_confirmation}`. Throttle 5/min. |
| GET | `/email/verify/{id}/{hash}` | No (URL firmada) | Verifica el correo; redirige al frontend `/login?verified=…` |
| POST | `/email/verification-notification` | Sí (o según flujo) | Reenvía el correo de verificación. Throttle 5/min. |
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

### 2.3 `POST /registro`

Cuerpo: `{nombre, correo, password}`. La contraseña exige mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos. Devuelve **201 sin token**; la cuenta queda pendiente de verificación de correo (evento `Registered` → correo con enlace firmado). El usuario no puede iniciar sesión hasta verificar.

### 2.4 Recuperación de contraseña

- `POST /forgot-password` `{correo}`: respuesta uniforme 200 (evita enumeración de usuarios).
- `POST /reset-password` `{correo, token, password, password_confirmation}`: al restablecer, **se revocan todos los tokens Sanctum** del usuario.
- El correo enlaza al frontend en `FRONTEND_URL/reset-password?token=…&correo=…`.

## 3. Endpoint público (landing)

**Tabla 4.** _Endpoint público de equipo (landing)_

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/equipo` | Equipo visible en la landing: `{administradora: {id, nombre, foto}, baristas: [{id, nombre, foto}], fecha, tipo}`. Throttle 60/min. |

Parámetros: `?fecha=YYYY-MM-DD` y `?tipo=mañana|tarde` (por defecto: hoy America/Bogota y `mañana`). La administradora es fija (primer admin activo); los baristas son los asignados al turno `fecha+tipo` y activos. No expone correos ni datos sensibles.

## 4. Catálogos

**Tabla 5.** _Catálogos: lectura y escritura por rol_

| Recurso | Lectura (index/show) | Escritura (store/update/destroy) |
|---------|----------------------|-----------------------------------|
| `/categorias` | Todos los autenticados | Solo admin (throttle 30/min) |
| `/productos` | Todos los autenticados | Solo admin (throttle 30/min) |
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

**Tabla 6.** _Endpoints de pedidos_

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

**Tabla 7.** _Endpoints de pagos y comprobantes_

| Método | Endpoint | Roles | Notas |
|--------|----------|-------|-------|
| GET | `/pago-pedidos` | admin, barista | index/show; el cliente consulta los pagos de sus pedidos a través de `GET /pedidos` (relación `pagos`) |
| POST | `/pago-pedidos` | admin, barista | `turno.activo` + throttle 10/min |
| PUT/DELETE | `/pago-pedidos/{id}` | admin, barista | `turno.activo` + throttle 10/min |
| POST | `/comprobantes` | admin, barista | `turno.activo`. Subida de imagen del comprobante |

`POST /comprobantes` (multipart): campo `imagen`, formatos `jpeg/jpg/png/webp`, máx. **5120 KB**. El backend la guarda en el disco `public` (`comprobantes/…`) y devuelve `{url}` absoluta (`…/storage/comprobantes/…`) que el cliente luego envía como `comprobante_url` del pago.

## 7. Facturas

**Tabla 8.** _Endpoints de facturas_

| Método | Endpoint | Roles |
|--------|----------|-------|
| GET | `/factura-ventas`, `/factura-ventas/{id}` | admin (`FacturaVentaPolicy`). El cliente ve la factura de sus pedidos a través de `GET /pedidos` (relación `factura_venta`) |
| POST | `/factura-ventas` | admin |
| PUT/DELETE | `/factura-ventas/{id}` | admin |

El `numero_factura` siempre lo genera el servidor a partir de `factura_contadores` (transacción + `lockForUpdate`, sin huecos ni carreras). Formato: `F` + año + 6 dígitos (p. ej. `F2026000042`).

## 8. Caja y movimientos

**Tabla 9.** _Endpoints de caja y movimientos_

| Método | Endpoint | Roles | Notas |
|--------|----------|-------|-------|
| GET | `/cajas` | admin, barista | barista ve todas; la SPA filtra `abierta_por` = su ID |
| POST | `/cajas` | admin, barista | `turno.activo` + throttle 10/min |
| GET | `/cajas/{id}` | admin, barista | incluye `movimientos` |
| PUT | `/cajas/{id}` | admin, barista | `turno.activo` + throttle 10/min |
| DELETE | `/cajas/{id}` | admin, barista | bloqueado si hay movimientos (422) |
| GET | `/movimiento-cajas`, `/movimiento-cajas/{id}` | admin, barista | `turno.activo`. Escritura (store/update/destroy): solo admin (`MovimientoCajaPolicy` + `ability:movimiento-cajas:manage`); los movimientos operativos los emiten los servicios |
| GET | `/turno-activo` | todos los autenticados | `{turno_activo, turno_info{id, fecha, tipo, minutos_restantes, hora_inicio, hora_fin}}` |

Reglas de apertura (`POST /cajas`, `StoreCajaRequest`): solo se recibe `monto_apertura_fisico` (requerido) y opcionalmente el desglose `monto_apertura_efectivo`/`monto_apertura_digital`. El servidor fija `abierta_por`, `estado='abierta'`, `fecha_apertura=now` y `turno_id` (turno activo del barista; null para admin).

Reglas de cierre (`PUT /cajas/{id}`): se envían `estado='cerrada'` y los montos declarados de cierre (`monto_cierre_fisico` y desglose). El **servidor calcula** `monto_cierre_sistema` = apertura + ingresos − egresos de los movimientos; fija `cerrada_por` y `fecha_cierre`.

## 9. Compras, proveedores, gastos y mermas

Todos los recursos siguientes exigen `role:admin,barista` + `turno.activo`; compras/gastos/mermas además throttle 10/min. Cada recurso exige además que el token posea su ability (`compras:manage`, `gastos:manage`, `mermas:manage`, `cajas:manage` — middleware `ability:`): un token sin el alcance recibe **403** `TOKEN_SIN_ABILITY`.

**Tabla 10.** _Recursos operativos (compras, gastos, mermas, proveedores)_

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

**Tabla 11.** _Endpoints de turnos_

| Método | Endpoint | Roles | Descripción |
|--------|----------|-------|-------------|
| GET | `/turnos` | admin | Lista con `baristas` cargados |
| POST | `/turnos` | admin | `{fecha (Y-m-d), tipo ∈ mañana\|tarde, barista_ids[] (≥1)}` — único por `fecha+tipo` |
| GET/PUT/DELETE | `/turnos/{id}` | admin | PUT reemplaza los baristas asignados |
| GET | `/mis-turnos` | barista | Turnos propios, paginado 15, orden `fecha,tipo asc` |
| GET | `/turno-activo` | todos los autenticados | Turno activo del barista (para no baristas: `{turno_activo:false, turno_info:null}`) |

Horarios fijos (`TurnoService`): mañana 07:00–13:00, tarde 13:00–18:00, zona `America/Bogota`. Fuera de 07:00–18:00 no hay turno esperado.

## 11. Chat (`/mensajes`)

**Tabla 12.** _Endpoints del chat_

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/mensajes` | Sin `?con=`: bandeja con contactos (`{contactos: [{id, nombre, ultimo_mensaje, ultima_hora, no_leidos}]}`). Con `?con={id}`: hilo completo (paginación 50, desc) + contacto |
| GET | `/mensajes/contactos` | Sugerencias de contacto según rol (cliente ↔ barista/admin; barista/admin ↔ clientes), solo usuarios activos |
| POST | `/mensajes` | `{destinatario_id, mensaje (máx. 1000)}`. Rechaza (422): destinatario inexistente/inactivo, auto-mensajes y chat cliente→cliente |
| POST | `/mensajes/leer` | `{con: id}` marca como leídos los mensajes no leídos de ese contacto |

## 12. Reportes de novedades

**Tabla 13.** _Endpoints de reportes_

| Método | Endpoint | Roles |
|--------|----------|-------|
| POST | `/reportes` | admin, barista — `{mensaje, prioridad ∈ baja\|media\|alta}`; `barista_id` forzado al autenticado |
| GET | `/reportes`, `/reportes/{id}` | admin |
| PUT/PATCH | `/reportes/{id}` | admin — `{mensaje?, prioridad?, leido?}` |
| DELETE | `/reportes/{id}` | admin |

## 13. Usuarios y roles (solo admin)

**Tabla 14.** _Endpoints de administración de usuarios y roles_

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/usuarios` | Soporta filtro `?rol=admin\|barista\|cliente` |
| POST | `/usuarios` | `{nombre, correo (único), password (fuerte), foto? (URL), activo?, rol_ids[]}` — los usuarios creados por el admin nacen **verificados** |
| PUT | `/usuarios/{id}` | Ídem (password opcional; sincroniza `rol_ids`) |
| DELETE | `/usuarios/{id}` | Soft delete |
| GET/POST/PUT/DELETE | `/roles` | CRUD de roles |
| GET/POST/PUT/DELETE | `/usuario-roles` | Asignación de roles (pivote) |

## 14. Matriz RBAC resumida

**Tabla 15.** _Matriz RBAC resumida_

| Capacidad | admin | barista | cliente |
|-----------|:-----:|:-------:|:--------:|
| Catálogos: lectura | ✔ | ✔ | ✔ |
| Catálogos: escritura | ✔ | — | — |
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
| Comprobantes (subida) | ✔ | ✔ (con turno activo, `comprobantes:upload`) | — |
| Chat | ✔ (con clientes) | ✔ (con clientes) | ✔ (con barista/admin) |
| Reportes: crear | ✔ | ✔ | — |
| Reportes: gestionar | ✔ | — | — |

Middleware `role:` responde **401** si no hay usuario autenticado y **403** `{message: "No tienes permiso para realizar esta acción."}` si el rol no corresponde.

## 15. Códigos de error de negocio (403)

**Tabla 16.** _Códigos de error de negocio_

| Código | Condición |
|--------|-----------|
| `EMAIL_NOT_VERIFIED` | Login con correo no verificado |
| `FUERA_HORARIO` | Barista fuera de 07:00–18:00 (America/Bogota) |
| `TURNO_INACTIVO` | Barista sin turno asignado para el tramo horario actual |
| `TURNO_EXPIRADO` | El turno del barista ya terminó («Debes cerrar la caja inmediatamente») |

Otras respuestas de error: **401** no autenticado (JSON, nunca redirección); **403** `TOKEN_SIN_ABILITY` (token sin la ability exigida por el middleware `ability:`); **404** `{"message": "Recurso no encontrado."}` para rutas API inexistentes (`Handler`); **422** errores de validación Laravel + `BusinessRuleException` (stock insuficiente, pagos inconsistentes, caja con movimientos, etc.); **429** límites de throttle.

## 16. Throttling (límites de peticiones)

**Tabla 17.** _Límites de peticiones (throttling)_

| Grupo | Límite |
|-------|--------|
| Global API (`api` group) | 60/min por usuario o IP (`RouteServiceProvider`) |
| `/login` | 5/min |
| `/registro` | 10/min |
| `/forgot-password`, `/reset-password`, `/email/verification-notification` | 5/min |
| `/equipo` | 60/min |
| Escrituras de catálogo (admin) | 30/min |
| `POST /pedidos`, escrituras operativas (pedidos/pagos/compras/gastos/mermas/cajas) | 10/min |

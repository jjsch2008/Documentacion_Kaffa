# 04 — Módulos del Sistema

> **Fuente de verdad**: este documento describe las **reglas de negocio** por módulo. La referencia completa y canónica de endpoints (métodos, roles, middleware, payloads, códigos de error) vive en [`03-api.md`](03-api.md); aquí los endpoints se citan solo como apoyo de cada regla. La especificación OpenAPI generada desde el código está en [`openapi.json`](openapi.json).

Cada módulo describe: propósito, actores, entidades, endpoints y reglas de negocio verificadas en el código.

## 1. Autenticación y sesión

- **Propósito**: registro público de clientes con verificación de correo obligatoria (por **código OTP**), login por token Sanctum, recuperación de contraseña y gestión de sesión.
- **Actores**: todos.
- **Entidades**: `users`, `registros_pendientes`, `personal_access_tokens`, `password_reset_tokens`, `usuario__rols`, `codigos_otp`.
- **Implementación**: `AuthController`, `PasswordResetController`, `EmailVerificationController`, `RegistrationService`, `OtpService` y el correo `CodigoOtpMail`.
- **Reglas**:
  - Login por `correo` + `password` (no existe login por `email`).
  - Contraseñas: mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos (`Password::min(8)->mixedCase()->numbers()->symbols()`).
  - **Alta diferida**: `POST /registro` **no** crea el usuario; guarda el alta en `registros_pendientes` y envía un **código de 6 dígitos** (válido 15 min, 5 intentos, reenvío cada 60 s). El `User` (ya verificado, con rol `cliente`) se crea sólo al confirmar el código con `POST /email/verify-code`.
  - Recuperación de contraseña también por **código**: `POST /forgot-password` lo envía y `POST /reset-password` `{correo, codigo, password, password_confirmation}` lo valida.
  - Los códigos se guardan **hasheados** en `codigos_otp` y son de un solo uso.
  - Al restablecer la contraseña se revocan todos los tokens.
  - El token admite `expires_at` si `SANCTUM_EXPIRATION` está definida (por defecto no expira).
  - Las *abilities* del token (`*`, `pedidos:manage`, `catalogo:read`, …) se emiten según el rol (`AuthController::abilitiesFor`) y se **validan** con el middleware `ability:` en las rutas de escritura (ver `05-seguridad.md`).

## 2. Catálogo (categorías, productos, insumos, recetas, medios de pago)

- **Propósito**: menú vendible con precios en COP, composición por insumos (recetas) y medios de pago disponibles.
- **Actores**: lectura **pública** para categorías y productos (Home del invitado, sin sesión); lectura autenticada para insumos/recetas/medios-pago; escritura solo admin.
- **Entidades**: `categorias`, `productos`, `insumos`, `recetas`, `medio__pagos`.
- **Reglas**:
  - Un producto pertenece (opcionalmente) a una categoría y consume N insumos vía `recetas` con `cantidad`.
  - `insumos` con `stock_actual`/`stock_minimo`/`unidad_medida`; nombre único.
  - `medio__pagos.es_virtual` ⇒ los pagos exigen `comprobante_url`.
  - El frontend muestra un catálogo demo estático (`src/data/productos.js`) cuando la API no responde, claramente no comprable.

## 3. Pedidos y POS

- **Propósito**: ciclo completo del pedido (creación, cobro, estados) para cliente (web) y barista (mostrador).
- **Actores**: cliente (crea los suyos), barista (mostrador + gestión), admin (backoffice).
- **Entidades**: `pedidos`, `detalle__pedidos`, `pago__pedidos`, `factura__ventas`, `cajas`, `movimiento__cajas`, `insumos`.
- **Implementación backend**: `PedidoController`, `PedidoService` (transaccional), evento `PedidoCreado` → `DeducirInventario`.
- **Implementación frontend**: barista: `dashboard-barista/PedidosView.jsx` (kanban Solicitudes / Pagado·Preparación / Entregados+Cancelados, cobro con comprobante, pedido de mostrador, impresión de recibo 80 mm con jsPDF); cliente: carrito y pago en `ClienteWidgets.jsx` + `MisPedidos.jsx`.
- **Reglas**:
  - Estados: `pendiente` → `pagado` → `entregado` (o `cancelado`).
  - Autoría forzada e inmutable; el cliente siempre crea con estado `pendiente`.
  - Stock prevalidado por recetas antes de crear; el inventario se descuenta al crear el pedido (atómico, `GREATEST(0, …)`).
  - Σ pagos = total (±0.01); `pagado` exige ≥ 1 pago; medios virtuales exigen comprobante.
  - Si el pedido usa caja: caja abierta y propia del barista; cada pago genera un movimiento `ingreso`.
  - La actualización solo permite `total`, `propina`, `estado`; un barista que actualiza un pedido sin asignar se autoasigna.
  - La eliminación del pedido borra en cascada detalles/pagos/factura/movimientos, y **no** restaura stock.

## 4. Pagos y comprobantes

- **Propósito**: registrar pagos por medio y validar comprobantes en medios virtuales.
- **Entidades**: `pago__pedidos`, `compra__pagos`, `gasto__pagos`, `medio__pagos`.
- **Subida de imágenes (Cloudinary)**: las imágenes se suben **desde el frontend** a Cloudinary (upload preset *unsigned*; nube `roffd6et`, preset `KAFFACCYS`, carpeta `samples/ecommerce`). Para comprobantes no hay endpoint de subida de archivos: al registrar un pago el cliente/barista ya envía la `secure_url` devuelta por Cloudinary en `pagos.*.comprobante_url`. La única subida que recibe el backend es **`POST /eventos/imagen`** (galería de eventos, pensada para la cámara/galería de la app móvil), que guarda el archivo en el disco `public` y devuelve una URL.
- **Regla transversal**: si `medio__pagos.es_virtual = true`, `comprobante_url` es obligatoria (validada en `StorePedidoRequest`, `StoreCompraRequest`, `StoreGastoRequest` con `withValidator`); si no, opcional. La URL se valida además con `App\Rules\CloudinaryUrl`.
- **Frontend**: tanto el cliente (portal) como el barista suben la imagen a Cloudinary con el componente reutilizable `ImageUpload` y luego registran el pago con la URL devuelta.

## 5. Facturación

- **Propósito**: factura 1:1 por pedido con numeración secuencial legal-like.
- **Entidades**: `factura__ventas`, `factura_contadores`.
- **Implementación**: `FacturaService::generarNumeroFactura` — UPSERT del contador (nombre, año), `SELECT … FOR UPDATE`, incremento y formato `F{YYYY}{NNNNNN}`; a prueba de carreras y sin huecos (transacción).
- **Reglas**: el número nunca lo define el cliente; una compra del pedido puede generar la factura en el mismo `POST /pedidos` o después vía `POST /factura-ventas` (admin).

## 6. Caja (arqueo)

- **Propósito**: control de efectivo por sesión de trabajo: apertura con base, movimientos automáticos y cierre con arqueo.
- **Actores**: barista (dueño de la sesión) y admin (supervisor, sin exigencia de turno).
- **Entidades**: `cajas`, `movimiento__cajas`.
- **Flujo**:
  1. Apertura: `monto_apertura_fisico` (obligatorio) + desglose efectivo/digital; el servidor fija `abierta_por`, `estado='abierta'`, `fecha_apertura` y `turno_id` (turno activo del barista).
  2. Operación: ingresos por pagos de pedidos; egresos por pagos de compras y gastos. Los movimientos solo los crean los servicios (no hay escritura directa por API).
  3. Cierre: se declaran `monto_cierre_fisico` (+ desglose); el **servidor calcula** `monto_cierre_sistema = apertura + ingresos − egresos` y fija `cerrada_por`/`fecha_cierre`.
  4. Arqueo en la SPA: diferencia = físico declarado − sistema ⇒ Perfecto / Faltante / Sobrante (`CajaView.jsx`).
- **Reglas**: no se puede eliminar una caja con movimientos (422); el barista solo opera su propia caja; el cierre exige turno activo para baristas.

## 7. Compras y proveedores

- **Propósito**: abastecimiento de insumos con pago a proveedores y ajuste automático de stock.
- **Actores**: admin, barista (con turno activo).
- **Entidades**: `compras`, `detalle__compras`, `compra__pagos`, `proveedors`, `movimiento__cajas`, `insumos`.
- **Implementación**: `CompraService` (bloqueo por lotes de insumos con `lockForUpdate`).
- **Reglas**:
  - Cada detalle **incrementa** `stock_actual` del insumo.
  - Σ pagos = `total_compra` (±0.01); medios virtuales con comprobante.
  - Cada pago genera movimiento `egreso` en la caja usada (validada igual que en pedidos).
  - La eliminación de la compra revierte el stock y falla si quedaría negativo.

## 8. Gastos

- **Propósito**: registrar egresos operativos (servicios, insumos no de inventario, etc.).
- **Entidades**: `gastos`, `gasto__pagos`, `movimiento__cajas`.
- **Implementación**: `GastoService` — `usuario_id` forzado al autenticado; pagos y movimientos `egreso`; eliminación limpia pagos y movimientos.

## 9. Mermas e inventario

- **Propósito**: registrar pérdidas de insumos con motivo y responsable.
- **Entidades**: `mermas`, `insumos`.
- **Implementación**: `MermaService` — `usuario_id` forzado; bloquea el insumo y valida que la cantidad no supere el stock; **reduce** `stock_actual`; la eliminación **restaura** el stock.
- **Frontend**: vista de inventario del barista (lectura, refresco 15 s) con estados Agotado / Bajo / Disponible y botón «Reportar» que crea un reporte de novedad.

## 10. Turnos

- **Propósito**: definir qué baristas trabajan cada turno (mañana 07:00–13:00 / tarde 13:00–18:00 / **abierto 05:00–22:00**, America/Bogota) y condicionar sus operaciones a estar en turno.
- **Actores**: admin (define), barista (consulta), cliente (inmune).
- **Entidades**: `turnos`, `barista_turno`, `cajas`.
- **Implementación**: `TurnoService`, `TurnoController`, middleware `turno.activo` (`EnsureActiveTurno`).
- **Reglas**:
  - Único turno por `fecha+tipo` (UNIQUE).
  - Cada turno define un rango `fecha`–`fecha_fin` (si `fecha_fin` = `fecha`, es de un solo día); un barista está en turno si la fecha actual cae dentro del rango y su tipo coincide con la hora. El tipo **`abierto`** cubre la jornada extendida (05:00–22:00) y tiene **prioridad** sobre mañana/tarde.
  - No se puede eliminar un turno con **cajas asociadas** (422): primero deben cerrarse.
  - El barista solo puede mutar pedidos/pagos/compras/gastos/mermas/cajas **dentro de su turno activo**; si no ⇒ 403 con `FUERA_HORARIO` / `TURNO_INACTIVO` / `TURNO_EXPIRADO`. Admin y cliente están exentos.
  - `GET /equipo` (público) usa esta información para la landing; la SPA del barista muestra el badge de turno y minutos restantes (sondeo 60 s).

## 11. Chat (mensajes)

- **Propósito**: mensajería directa cliente ↔ barista/admin (soporte, estado de pedidos).
- **Entidades**: `mensajes`.
- **Implementación**: `MensajeController` (bandeja con no leídos por contacto vía consulta agregada, hilo, contactos sugeridos por rol, marcado masivo como leído).
- **Frontend**: `ChatBarista.jsx` (cliente) y `ChatView.jsx` (barista) con sondeo de 5 s e insignia de no leídos en la navegación.
- **Reglas**: máximo 1000 caracteres; prohibidos auto-mensajes y chats cliente→cliente; destinatario inactivo rechazado (422).

## 12. Reportes de novedades

- **Propósito**: que el barista informe incidencias (ej. falta de insumos) al admin con prioridad.
- **Entidades**: `reportes`.
- **Reglas**: barista crea con `barista_id` forzado y `prioridad ∈ baja|media|alta`; el admin lista, marca como leído, edita o elimina. Vista admin `ReportesView.jsx` con insignias por prioridad.

## 13. Asistente KAFFA (todos los roles)

- **Propósito**: chatbot integrado (ícono flotante en la app y en la web) que responde con **datos reales** del negocio, adaptándose al rol del usuario.
- **Actores**: todos los usuarios autenticados. **Admin**: analítica completa, **predicciones** de ventas y recomendaciones de marketing. **Barista**: analítica operativa (ventas, productos, inventario, pedidos). **Cliente**: ayuda del menú, medios de pago, cómo pedir, eventos próximos y sede, **sin** métricas internas.
- **Entidades**: `asistente_mensajes` (historial por usuario); fuentes consultadas para las respuestas: `pedidos`, `detalle__pedidos`, `productos`, `insumos`, `gasto__pagos`, `medio__pagos`, `eventos`.
- **Implementación**: `AsistenteController` + `AsistenteService`. El servicio es **local**: detecta la intención por palabras clave y calcula la respuesta con consultas reales (no depende de una API externa). Las claves `GEMINI_*` (`config/services.php`) quedan disponibles por si se conecta un modelo, pero **no se usan** en el flujo actual.
- **Frontend**: `dashboard-admin/AsistenteView.jsx` (chat estilo Messenger con burbujas, indicador de escritura, sugerencias rápidas y botón para limpiar la conversación). El asistente también está disponible para barista y cliente mediante el ícono flotante.
- **Reglas**:
  - Cada pregunta y respuesta se **persiste** y se **aísla por `usuario_id`** (cada quien ve sólo su historial).
  - El **cliente nunca recibe métricas internas** (ventas, gastos, inventario, predicciones): el servicio acota la respuesta según el rol.
  - `mensaje` requerido, máx. 2000 caracteres; `throttle:30,1` (todos los roles).

## 14. Sitio público y equipo

- **Propósito**: landing comercial (inicio, menú, eventos, sobre nosotros, contacto) sin autenticación.
- **Frontend**: `pages/Home.jsx`, `Menu.jsx`, `Eventos.jsx`, `SobreNosotros.jsx`, `Contacto.jsx` + `useCatalogo` y `useEquipo`.
- **Endpoints**: `GET /productos`, `GET /categorias` (**públicos**, sin sesión) y `GET /equipo` (público); `GET /eventos` y `GET /eventos/{id}` (públicos, sólo publicados). En modo demo la SPA usa catálogo estático si la API falla.
- El catálogo demo (10 productos) se muestra si la API falla o está vacía; los productos demo no son comprables.

## 15. Usuarios y roles (administración)

- **Propósito**: gestión de cuentas y asignación de roles múltiples.
- **Entidades**: `users`, `rols`, `usuario__rols`.
- **Reglas**: un usuario puede tener varios roles; el admin crea usuarios ya verificados; filtro `?rol=`; la SPA redirige tras el login según el rol: admin → `/admin-dashboard`, barista → `/barista-dashboard`, cliente → `/` (permanece en el sitio público). Se acepta la clave `roles[]` (app móvil) como alias de `rol_ids[]`.

## 16. Eventos

- **Propósito**: gestionar los eventos de la cafetería que se muestran en la sección «Eventos» de la landing y en el Home de la app (ferias del café, talleres…).
- **Actores**: lectura **pública** (sólo eventos con `publicado = true`); gestión (crear, editar, publicar y subir imagen) exclusiva del **admin**.
- **Entidades**: `eventos`, `evento_imagenes`.
- **Implementación**: `EventoController` + `StoreEventoRequest`/`UpdateEventoRequest`; `EventoPolicy` (lectura pública, gestión admin).
- **Reglas**:
  - El listado público devuelve sólo `publicado = true`, ordenado por fecha/hora ascendente; el detalle público responde 404 para borradores.
  - Galería de hasta **5 imágenes** por evento, con orden; cada URL se valida con `App\Rules\CloudinaryUrl`.
  - `POST /eventos/imagen` (multipart) recibe una imagen de la cámara/galería del móvil, la guarda en el disco `public` y devuelve la URL para persistirla en `imagenes[]`.
  - El grupo de gestión exige `role:admin` + `ability:catalogo:manage` + `ability:eventos:manage` y `throttle:30,1`.

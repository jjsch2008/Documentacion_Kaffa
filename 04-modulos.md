# 04 — Módulos del Sistema

> **Fuente de verdad**: este documento describe las **reglas de negocio** por módulo. La referencia completa y canónica de endpoints (métodos, roles, middleware, payloads, códigos de error) vive en [`03-api.md`](03-api.md); aquí los endpoints se citan solo como apoyo de cada regla. La especificación OpenAPI generada desde el código está en [`openapi.json`](openapi.json).

Cada módulo describe: propósito, actores, entidades, endpoints y reglas de negocio verificadas en el código.

## 1. Autenticación y sesión

- **Propósito**: registro público de clientes con verificación de correo obligatoria, login por token Sanctum, recuperación de contraseña y gestión de sesión.
- **Actores**: todos.
- **Entidades**: `users`, `personal_access_tokens`, `password_reset_tokens`, `usuario__rols`.
- **Implementación**: `AuthController`, `PasswordResetController`, `EmailVerificationController`, notificaciones `ResetPasswordNotification` y verificación en español (`AppServiceProvider`).
- **Reglas**:
  - Login por `correo` + `password` (no existe login por `email`).
  - Contraseñas: mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos (`Password::min(8)->mixedCase()->numbers()->symbols()`).
  - Sin correo verificado no hay sesión (`403 EMAIL_NOT_VERIFIED`). Los usuarios creados por el admin nacen verificados; el backfill de la migración verificó a los usuarios preexistentes.
  - Al restablecer la contraseña se revocan todos los tokens.
  - El token admite `expires_at` si `SANCTUM_EXPIRATION` está definida (por defecto no expira).
  - Las *abilities* del token (`*`, `pedidos:manage`, `catalogo:read`, …) se almacenan pero **no se validan** con middleware (ver `05-seguridad.md`).

## 2. Catálogo (categorías, productos, insumos, recetas, medios de pago)

- **Propósito**: menú vendible con precios en COP, composición por insumos (recetas) y medios de pago disponibles.
- **Actores**: lectura para todos los autenticados; escritura solo admin.
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
- **Endpoint de subida**: `POST /comprobantes` (imagen jpeg/jpg/png/webp ≤ 5120 KB) → URL pública (`storage/comprobantes/…`) que se persiste como `comprobante_url`.
- **Regla transversal**: si `medio__pagos.es_virtual = true`, `comprobante_url` es obligatoria (validada en `StorePedidoRequest`, `StoreCompraRequest`, `StoreGastoRequest` con `withValidator`); si no, opcional.
- **Frontend**: el barista sube la imagen en el flujo de cobro (`POST /comprobantes`) y luego registra el pago con la URL devuelta.

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

- **Propósito**: definir qué baristas trabajan cada turno (mañana 07:00–13:00 / tarde 13:00–18:00, America/Bogota) y condicionar sus operaciones a estar en turno.
- **Actores**: admin (define), barista (consulta), cliente (inmune).
- **Entidades**: `turnos`, `barista_turno`, `cajas`.
- **Implementación**: `TurnoService`, `TurnoController`, middleware `turno.activo` (`EnsureActiveTurno`).
- **Reglas**:
  - Único turno por `fecha+tipo` (UNIQUE).
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

## 13. Sitio público y equipo

- **Propósito**: landing comercial (inicio, menú, eventos, sobre nosotros, contacto) sin autenticación.
- **Frontend**: `pages/Home.jsx`, `Menu.jsx`, `Eventos.jsx`, `SobreNosotros.jsx`, `Contacto.jsx` + `useCatalogo` y `useEquipo`.
- **Endpoints**: `GET /productos`, `GET /categorias` (autenticados; en demo la SPA usa catálogo estático) y `GET /equipo` (público).
- El catálogo demo (10 productos) se muestra si la API falla o está vacía; los productos demo no son comprables.

## 14. Usuarios y roles (administración)

- **Propósito**: gestión de cuentas y asignación de roles múltiples.
- **Entidades**: `users`, `rols`, `usuario__rols`.
- **Reglas**: un usuario puede tener varios roles; el admin crea usuarios ya verificados; filtro `?rol=`; la SPA redirige tras el login según el rol: admin → `/admin-dashboard`, barista → `/barista-dashboard`, cliente → `/` (permanece en el sitio público).

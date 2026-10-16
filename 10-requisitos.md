# 10 — Requisitos y Trazabilidad

Requisitos derivados exclusivamente del **código implementado** (comportamiento observable verificado en rutas, controladores, servicios, validadores y SPA). No se inventan requisitos no implementados.

## 1. Requisitos funcionales

**Tabla 1.** _Requisitos funcionales (RF)_

| ID | Requisito | Evidencia (implementación) |
|----|-----------|------------------------------|
| RF-01 | El sistema permite registrarse públicamente como cliente con contraseña fuerte, persistiendo la cuenta **solo tras verificar el correo** | `AuthController::register`, `RegistrationService`, `routes/api.php` `/registro` |
| RF-02 | El sistema exige verificación de correo para iniciar sesión | `AuthController::login` (403 `EMAIL_NOT_VERIFIED`), `EmailVerificationController`, `RegistrationService::confirmar` |
| RF-03 | El usuario puede iniciar sesión y obtener un token Bearer con sus roles | `AuthController::login`, `ApiTest` |
| RF-04 | El usuario puede consultar su perfil, editarlo y cerrar sesión (token actual, todos los dispositivos o rotación) | `/me`, `/perfil`, `/logout`, `/auth/refresh`, `/auth/logout-all` |
| RF-05 | El sistema permite recuperar la contraseña por correo y revoca todas las sesiones al restablecerla | `PasswordResetController`, `PasswordResetTest` |
| RF-06 | Un usuario puede tener varios roles simultáneos (admin/barista/cliente) | `usuario__rols`, `RolSeeder` |
| RF-07 | El sitio público muestra menú, eventos, contacto y el equipo (administradora + baristas por fecha y turno) | `pages/*`, `EquipoController`, `useEquipo`, `EquipoTest` |
| RF-08 | El catálogo es consultable: categorías y productos **sin sesión** (Home del invitado); insumos, recetas y medios de pago para usuarios autenticados | rutas de lectura `index`/`show` en `routes/api.php` (públicas para categorías/productos) |
| RF-09 | El admin administra el catálogo completo | grupo `role:admin` + `ability:catalogo:manage` de `routes/api.php` |
| RF-10 | El cliente crea sus propios pedidos (autoría forzada, estado inicial `pendiente`) | `PedidoService::crear`, `StorePedidoRequest` |
| RF-11 | El barista registra pedidos de mostrador y gestiona estados de cualquier pedido | `POST /pedidos`, `PUT /pedidos/{id}`, `PedidosView.jsx` |
| RF-12 | Cada pedido puede llevar detalles con nota, pagos por medio y factura opcional | `StorePedidoRequest`, `PedidoService` |
| RF-13 | Los medios de pago virtuales exigen comprobante (imagen) en pedidos, compras y gastos | `withValidator` de `Store*Request`, `Medio_Pago::virtualIds`, `App\Rules\CloudinaryUrl` (imagen alojada en Cloudinary) |
| RF-14 | El sistema valida stock de insumos (por receta) antes de crear un pedido y lo descuenta al crearlo | `PedidoService`, listener `DeducirInventario` |
| RF-15 | El sistema valida que la suma de pagos coincida con el total del pedido/compra | `PedidoService`, `CompraService` |
| RF-16 | Las facturas se numeran de forma secuencial y atómica por año | `FacturaService`, `factura_contadores` |
| RF-17 | La caja se abre con monto físico (y desglose), registra movimientos automáticos de pagos y se cierra con arqueo calculado por el servidor | `Caja` (overrides), `CajaView.jsx` |
| RF-18 | No se puede eliminar una caja con movimientos | `Caja::eliminarRegistro` (422) |
| RF-19 | Las compras a proveedores incrementan stock y registran egresos de caja; su eliminación revierte el stock | `CompraService` |
| RF-20 | Las mermas reducen stock con responsable y motivo; su eliminación restaura el stock | `MermaService` |
| RF-21 | Los gastos registran egresos con pagos y movimientos de caja | `GastoService` |
| RF-22 | El admin define turnos (`mañana`/`tarde`/**`abierto`** y rango `fecha`–`fecha_fin`) y asigna baristas | `TurnoController`, `TurnoService`, `TurnosView.jsx` |
| RF-23 | Las operaciones del barista (pedidos/pagos/compras/gastos/mermas/cajas) exigen turno activo; con excepciones para admin y cliente | middleware `turno.activo`, `EnsureActiveTurno` |
| RF-24 | El barista consulta sus turnos y el turno activo actual | `/mis-turnos`, `/turno-activo`, `BaristaContext` |
| RF-25 | Chat directo cliente ↔ barista/admin con no leídos y marcado masivo | `MensajeController`, `ChatBarista.jsx`, `ChatView.jsx` |
| RF-26 | El barista envía reportes de novedades con prioridad; el admin los gestiona | `ReporteController`, `InventarioView.jsx` |
| RF-27 | El admin gestiona usuarios (creación verificada, filtro por rol, roles múltiples) | `UsuarioController`, `usuario-roles` |
| RF-28 | Toda lista admite paginación (1–100), filtros por campo, búsqueda parcial en textos, filtros de fecha y ordenamiento | `HasBasicQueries::consultar` |
| RF-29 | El barista imprime recibos (80 mm) y exporta historial a PDF | `PedidosView.jsx`, `helpers.js` (jsPDF) |
| RF-30 | El admin exporta pedidos a CSV y visualiza KPIs con gráficas | `PedidosView.jsx`, `InicioView.jsx` (Chart.js) |
| RF-31 | Todos los usuarios autenticados conversan con el **Asistente KAFFA**, cuya respuesta se adapta al rol (admin: analítica/predicciones/marketing; barista: operativo; cliente: menú/ayuda); el historial se persiste por usuario | `AsistenteController`, `AsistenteService`, `AsistenteView.jsx`, `asistente_mensajes` |
| RF-32 | El sistema publica eventos en la landing/Home y permite al admin gestionarlos (crear, editar, publicar y **subir imagen** desde el móvil) | `EventoController`, `EventoPolicy`, `StoreEventoRequest`, `POST /eventos/imagen` |

## 2. Requisitos no funcionales (verificados en implementación)

**Tabla 2.** _Requisitos no funcionales (RNF)_

| ID | Requisito | Evidencia |
|----|-----------|-----------|
| RNF-01 | Rendimiento: índices sobre columnas de filtrado/orden (`estado`, `created_at`, etc.) | migración `2026_07_31_000000_add_performance_indexes…` |
| RNF-02 | Rendimiento: anti-N+1 con carga diligente de relaciones en listados | `HasBasicQueries::consultar` (`eagerRelations`) |
| RNF-03 | Fiabilidad: escrituras en transacciones con reintento ante deadlocks | `TransactionService` |
| RNF-04 | Fiabilidad: bloqueos pesimistas para stock, cajas y numeración de facturas | `lockForUpdate` en `PedidoService`, `CompraService`, `FacturaService` |
| RNF-05 | Seguridad: RBAC por middleware + policies/gates con ownership | `CheckRole`, `AuthServiceProvider` |
| RNF-05b | Seguridad: tokens acuñados por alcance (abilities) y validados en las rutas de escritura (403 `TOKEN_SIN_ABILITY`) | `EnsureTokenCanAbility` (`ability:`), `AuthController::abilitiesFor` |
| RNF-05c | Seguridad: tokens de API con expiración por defecto (24 h) y rotación sin re-login | `SANCTUM_EXPIRATION=1440` en `.env.example`, `POST /auth/refresh` |
| RNF-06 | Seguridad: throttling por ruta y por API | `routes/api.php`, `RouteServiceProvider` |
| RNF-07 | Seguridad: contraseñas fuertes y anti-enumeración en recuperación | `Password::min(8)->mixedCase()…`, respuesta uniforme `forgot-password` |
| RNF-08 | Seguridad: cabeceras CORS configurables y API de tokens puros | `config/cors.php`, `supports_credentials=false` |
| RNF-09 | Disponibilidad de datos en UI: sondeo periódico (pedidos 10 s, chat 5 s, inventario 15 s, caja 30 s, turno 60 s) | hooks y vistas SPA |
| RNF-10 | Usabilidad: tema claro/oscuro en dashboards y notificaciones toast | `useDashboardTheme`, `variables.css`, `sonner` |
| RNF-10b | Seguridad: el Asistente KAFFA es **local** (no envía datos a proveedores externos) y **acota la respuesta por rol**; el cliente nunca recibe métricas internas | `AsistenteService`, `AsistenteController::rolAsistente` |
| RNF-10c | Robustez: el Asistente resuelve las respuestas con consultas locales, sin dependencia de una API externa (evita fallos 503/429 de proveedor) | `AsistenteService` |
| RNF-11 | Compatibilidad: SPA servida por Vite (dev) o Apache (prod) con la misma base relativa `/api/v1` | `vite.config.js`, `api.js` |

## 3. Matriz de trazabilidad (resumen)

**Tabla 3.** _Matriz de trazabilidad_

| Requisito | Módulo (docs/04) | API (docs/03) | Prueba automatizada |
|-----------|-------------------|----------------|----------------------|
| RF-01..RF-05 | Autenticación y sesión | §2 | `ApiTest`, `EmailVerificationTest`, `PasswordResetTest`, `TokenSessionTest` (rotación/revocación) |
| RF-06, RF-27 | Usuarios y roles | §13 | — `[GAP]` (solo abilities en `TokenSessionTest`) |
| RF-07 | Sitio público y equipo | §3 | `EquipoTest` (10 pruebas) |
| RF-08, RF-09 | Catálogo | §4 | `ApiTest` (catálogo público sin token) + `TokenSessionTest` (escritura con ability) |
| RF-10..RF-16 | Pedidos y POS / Pagos / Facturación | §5–§7 | `PedidoTest` (6 pruebas: autoría, comprobante, pagos, stock, scope, numeración de factura) |
| RF-17, RF-18 | Caja | §8 | `CajaTest` (5 pruebas: apertura, turno, arqueo, eliminación) |
| RF-19..RF-21 | Compras / Gastos / Mermas | §9 | `CompraMermaTest` (6 pruebas; gastos con caja aún `[GAP]`) |
| RF-22..RF-24 | Turnos | §10 | `TurnoMiddlewareTest` (8 pruebas: turno activo, **`abierto`**, rango `fecha_fin`, códigos 403, exenciones, abilities) |
| RF-25 | Chat | §11 | `ChatReporteTest` (5 pruebas) |
| RF-26 | Reportes | §12 | `ChatReporteTest` (3 pruebas) |
| RF-28 | Transversal | §1 | parcial (envoltura de paginación en `ApiTest`) |
| RF-29, RF-30 | Frontend (sin API propia) | — | — `[GAP]` (frontend sin tests) |
| RF-31 | Asistente KAFFA | §13 (§17 en docs/03) | `AsistenteTest` (5 pruebas: multi-rol, respuesta local, historial y reinicio, 401 anónimo) |
| RF-32 | Eventos | §16 (§3.1 en docs/03) | `EventoTest` (12 pruebas: público/publicado, gestión admin, galería, subida de imagen, 403 barista) |

**Leyenda de gaps**: la suite (85 pruebas, ejecutada 2026-10-16) cubre autenticación, catálogo público, eventos (incl. subida de imagen), pedidos, caja, compras/mermas, turnos (`abierto` y rango `fecha_fin`), chat, reportes, sesión de tokens y el Asistente KAFFA. Quedan sin pruebas automatizadas: CRUD de catálogo completo, gestión de usuarios/roles/turnos, gastos con caja, subida de comprobantes, filtros avanzados y throttle. Ver `docs/08-pruebas.md`.

## 4. Fuera de alcance (no implementado)

Detectado en el código como ausencia verificada, para evitar ambigüedades:

- Tiempo real por websockets (se usa sondeo).
- Pagos en línea reales (los «virtuales» son transferencias con comprobante).
- App Android/iOS nativa (existe la especificación `prompt_android_app.md`, pero **no** un proyecto móvil en este repositorio).
- Multisesión SPA por cookies (tokens Bearer únicamente).
- Facturación electrónica fiscal colombiana (numeración interna simple).
- Docker/CI-CD en el repositorio.

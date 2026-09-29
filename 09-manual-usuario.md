# 09 — Manual de Usuario

Manual basado en las pantallas implementadas en la SPA (`REACT_clean/REACT_kaffa/src/`). **Capturas de pantalla no disponibles desde la evidencia del proyecto** — se describen los flujos por pantalla.

## 1. Visitante (sin cuenta)

**Tabla 1.** _Pantallas públicas_

| Pantalla | Ruta | Qué puede hacer |
|----------|------|-----------------|
| Inicio | `/` | Portada con productos destacados (catálogo real si la API responde; si no, catálogo demo) y acceso al menú |
| Menú | `/menu` | Explorar productos por categoría; botón «Comprar» → redirige a login si no hay sesión |
| Eventos | `/eventos` | Ver eventos fijos (ferias del café del SENA) |
| Sobre Nosotros | `/sobre-nosotros` | Misión/visión y **Nuestro Equipo**: elegir fecha y turno (mañana/tarde) y ver la administradora y los baristas de ese turno |
| Contacto | `/contacto` | Datos de contacto y horarios |
| Registro | `/registro` | Crear cuenta de cliente (nombre, correo, contraseña fuerte) |
| Login | `/login` | Iniciar sesión (correo + contraseña) |
| Recuperar contraseña | `/forgot-password` → `/reset-password` | Recibir enlace por correo y restablecer |

Después de registrarse, el sistema **envía un correo de verificación**; hay que abrir el enlace antes de poder iniciar sesión. Desde `/verify-email` se puede reenviar el correo.

## 2. Cliente

Tras iniciar sesión, el cliente permanece en el sitio público (misma web) con widgets de cliente:

1. **Comprar** (`ProductCard` + modales): elegir producto → cantidad y nota por línea («sin azúcar») → carrito (editar cantidades, ver total) → **Pagar**:
   - *Efectivo en mostrador*: el pedido queda `pendiente` y se paga en caja.
   - *Pagar ya*: elegir medio **virtual** (transferencia/pago móvil/QR) y adjuntar la **imagen del comprobante**; el sistema la sube y registra el pago.
2. **Mis Pedidos** (`/pedidos`): lista de sus pedidos con estado (`pendiente`, `pagado`, `cancelado`, `entregado`), productos, pagos y número de factura. Se actualiza sola cada 10 s.
3. **Chat** (`/chat`): conversación con baristas/administración, con contador de mensajes no leídos.
4. **Mi Perfil** (menú de usuario): cambiar nombre, correo, contraseña y foto.
5. **Cerrar Sesión**.

El cliente **no ve** paneles de administración ni operaciones de caja; solo puede crear pedidos con estado inicial `pendiente`.

## 3. Barista (`/barista-dashboard`)

**Tabla 2.** _Secciones del panel barista_

Requiere turno activo (mañana 07:00–13:00 / tarde 13:00–18:00, asignado por el admin). El encabezado muestra el **badge de turno con minutos restantes**. Si no hay turno activo, las acciones quedan bloqueadas y el backend rechaza con 403.

| Sección | Uso |
|---------|-----|
| **Pedidos (POS)** | Tablero kanban: *Solicitudes* (pendientes) → *Pagado · Preparación* → *Entregados/Cancelados*. Acciones: **Cobrar** (elegir medio; si es virtual, subir comprobante; si cubre el total, el pedido pasa a `pagado`), cambiar **estado** (entregado/cancelado), **Registrar pedido de mostrador** (productos, cliente opcional, pagos con la misma regla de comprobante), **imprimir recibo** (80 mm) y descargar historial en PDF |
| **Inventario** | Solo lectura con estados Agotado/Bajo/Disponible y botón **Reportar** (crea un reporte de novedad con prioridad baja/media/alta para el admin) |
| **Chat** | Bandeja de clientes con no leídos, conversación y marcado automático de leído |
| **Caja** | Abrir caja (monto físico de apertura y desglose efectivo/digital), ver movimientos y **cerrar caja** declarando el físico contado; el sistema calcula el esperado y muestra **Perfecto / Faltante / Sobrante** |

También puede editar su perfil (menú de avatar) y cerrar sesión.

## 4. Administrador (`/admin-dashboard`)

**Tabla 3.** _Secciones del panel administrador_

Panel con 16 secciones (menú lateral). El admin **no depende de turnos** para operar.

| Sección | Uso |
|---------|------|
| Inicio | KPIs: ingresos del día, pedidos del día, clientes registrados, ticket promedio + gráficas (ingresos de 7 días, top 5 productos) |
| Pedidos | Tabla con detalle completo, cambio de estado, eliminación con cascada y **exportación CSV** |
| Productos | CRUD con imagen (URL/base64), precio y categoría |
| Categorías | CRUD de categorías |
| Insumos | CRUD; el stock lo mueven compras/mermas/ventas (solo se fija al crear) |
| Mermas | Registrar mermas (baja stock) y eliminarlas (restaura stock) |
| Compras | Compras a proveedores con detalles (sube stock) y pagos; eliminar revierte stock |
| Proveedores | CRUD (NIT, contacto, estado) |
| Gastos | Registrar gastos con pagos (generan egresos de caja) |
| Cajas | Ver todas las cajas, abrir/cerrar sin restricción de turno, detalle de movimientos |
| Facturas | Listado de facturas (número, pedido, subtotal, impuestos, total) |
| Clientes | Gestión de clientes (editar/desactivar/eliminar, historial de pedidos) |
| Baristas | Gestión de baristas: crear con contraseña y foto, asignar rol |
| Turnos | Crear/editar turnos (`mañana`/`tarde`) y asignar baristas por turno |
| Reportes | Novedades enviadas por baristas: marcar leídas, editar prioridad, eliminar |
| Configuración | CRUD de **medios de pago** (con flag «virtual» ⇒ exige comprobante) y tabla de roles del sistema |

El perfil del admin y el cierre de sesión están en la barra superior.

## 5. Reglas comunes a tener en cuenta

- Contraseñas: mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.
- Los medios de pago virtuales (transferencia, pago móvil, QR) **exigen comprobante** (imagen) en pagos de pedidos, compras y gastos.
- El barista debe tener **turno activo** para cobrar, mover estados, y todo lo de caja/compras/gastos/mermas; de lo contrario el sistema rechaza la operación.
- Los números de factura los asigna el sistema automáticamente.
- Los datos de listas se actualizan periódicamente (pedidos 10 s, chat 5 s, inventario 15 s, caja 30 s); no hay que refrescar la página.

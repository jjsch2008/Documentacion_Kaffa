# Glosario

Definiciones de los términos usados en el sistema KAFFA y en esta documentación.

| Término | Definición |
|---------|------------|
| **Ability** | Permiso acuñado en un token Sanctum (p. ej. `pedidos:manage`, `catalogo:read`). El middleware `ability:` valida que el token posea la ability exigida por la ruta de escritura; de lo contrario responde 403 `TOKEN_SIN_ABILITY`. |
| **Arqueo** | Conciliación de caja al cierre: `monto_cierre_sistema = apertura + ingresos − egresos`, calculado por el servidor; la diferencia contra el físico declarado determina Faltante/Sobrante/Perfecto. |
| **Barista** | Rol operativo: atiende el POS, cobra, registra pedidos de mostrador, compras, gastos y mermas. Solo puede mutar recursos **dentro de su turno activo** (`turno.activo`). |
| **Comprobante** | Imagen (jpeg/png/webp) que acredita un pago con medio virtual (transferencia, pago móvil, QR). Se sube con `POST /comprobantes` y su URL se persiste en `comprobante_url`. |
| **Medio de pago virtual** | Medio marcado `es_virtual=true`; exige `comprobante_url` en el pago (regla validada en el backend). |
| **Merma** | Pérdida de insumo (rotura, derrame, caducidad) con motivo y responsable; **reduce** el `stock_actual`; su eliminación lo restaura. |
| **Pivote** | Tabla intermedia de una relación muchos-a-muchos (`usuario__rols`, `recetas`, `barista_turno`) con clave primaria compuesta. |
| **POS** | Punto de venta (Point of Sale): flujo de pedido/cobro del barista (kanban Solicitudes → Pagado → Entregados/Cancelados). |
| **Receta** | Relación producto↔insumo con `cantidad`: cuánto insumo consume cada producto. Base del descuento de inventario por venta. |
| **RBAC** | Control de acceso por roles (`admin`, `barista`, `cliente`) aplicado por el middleware `role:` y reforzado por policies/gates y abilities. |
| **Sanctum** | Paquete de Laravel para autenticación por tokens personales (Bearer); ver [`personal_access_tokens`](02-base-datos.md). |
| **Scope por rol** | Filtrado de datos según el rol (p. ej. el cliente solo ve sus pedidos) implementado con `scopeByUser` en los modelos. |
| **Soft delete** | Borrado lógico: columna `deleted_at`; el registro deja de aparecer en consultas normales pero se conserva en la base. |
| **SPA** | Single Page Application: la aplicación React servida por Vite/Apache que consume la API. |
| **Throttle** | Límite de peticiones por minuto por ruta (p. ej. login 5/min, escrituras operativas 10/min); excederlo responde 429. |
| **Token (PAT)** | Personal Access Token de Sanctum: cadena `{id}|{secreto}` con abilities, `expires_at` opcional y revocación individual o global. |
| **Turno** | Bloque de trabajo `mañana` (07:00–13:00) o `tarde` (13:00–18:00), zona `America/Bogota`, por fecha; define qué baristas pueden operar. |
| **`turno.activo`** | Middleware que exige turno activo a los baristas (admin y cliente exentos); rechaza con `FUERA_HORARIO`, `TURNO_INACTIVO` o `TURNO_EXPIRADO`. |

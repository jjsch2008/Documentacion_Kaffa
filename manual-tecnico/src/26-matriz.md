# 26. Matriz completa de endpoints

Esta matriz se genera automáticamente a partir de `php artisan route:list` y se contrasta con `openapi.json`. Una misma ruta puede aparecer una vez por operación; `PUT/PATCH` se muestra junto porque Laravel acepta ambos métodos. La columna **Throttle** indica el límite específico de la ruta; todas las rutas heredan además el límite global de 60 peticiones por minuto por usuario o IP.

> **Nota.** `route:list` reporta 142 entradas porque separa lecturas y escrituras de los `apiResource` y añade el prefijo `HEAD` a los `GET`. Al normalizar métodos y rutas quedan las operaciones funcionales de esta matriz; OpenAPI documenta 69 paths porque agrupa operaciones por recurso.

## 26.1 Resumen por módulo

**Tabla.** _Resumen de operaciones por módulo_

| Módulo | Operaciones | Rutas con auth | Rutas con rol | Rutas con ability |
|---|---:|---:|---:|---:|
| Autenticación y sesión | 13 | 7 | 0 | 0 |
| Sitio público y eventos | 8 | 5 | 5 | 5 |
| Catálogo | 25 | 21 | 15 | 15 |
| Pedidos, pagos y facturas | 15 | 15 | 13 | 11 |
| Caja y movimientos | 11 | 11 | 10 | 8 |
| Compras y proveedores | 20 | 20 | 20 | 18 |
| Gastos y mermas | 15 | 15 | 15 | 15 |
| Turnos | 6 | 6 | 6 | 5 |
| Chat y reportes | 9 | 9 | 5 | 0 |
| Usuarios y roles | 15 | 15 | 15 | 15 |
| Asistente KAFFA | 3 | 3 | 0 | 0 |
| **Total** | **140** | **127** | **104** | **92** |

## 26.2 Detalle por módulo

### Autenticación y sesión

**Tabla.** _Matriz de endpoints: autenticación y sesión_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `POST` | `/api/v1/auth/logout-all` | Sí | Todos los autenticados | `—` | — | 60/min global | Revocar TODOS los tokens del usuario autenticado (cierre de sesión en todos los dispositivos). |
| `POST` | `/api/v1/auth/refresh` | Sí | Todos los autenticados | `—` | — | 60/min global | Rotar el token actual: revoca el actual y emite uno nuevo con un nuevo expires_at. Útil para extender sesión activa sin re-login. |
| `POST` | `/api/v1/email/verification-notification` | No | Público | `—` | — | 5/min | Reenvía el código de verificación de un alta pendiente. |
| `POST` | `/api/v1/email/verify-code` | No | Público | `—` | — | 10/min | Verifica la cuenta con el código recibido por correo. Al confirmar, materializa el usuario verificado. |
| `POST` | `/api/v1/forgot-password` | No | Público | `—` | — | 5/min | Envía un código de restablecimiento al correo indicado. |
| `GET` | `/api/v1/health` | Sí | Todos los autenticados | `—` | — | 60/min global | Comprueba que el token es válido. |
| `POST` | `/api/v1/login` | No | Público | `—` | — | 5/min | Autenticar un usuario y retornar el token de acceso. |
| `POST` | `/api/v1/logout` | Sí | Todos los autenticados | `—` | — | 60/min global | Cerrar sesión (revocar el token actual). |
| `GET` | `/api/v1/me` | Sí | Todos los autenticados | `—` | — | 60/min global | Retornar el perfil del usuario autenticado. |
| `PUT` | `/api/v1/perfil` | Sí | Todos los autenticados | `—` | — | 60/min global | Editar el perfil del usuario autenticado (nombre/correo/contraseña). |
| `POST` | `/api/v1/registro` | No | Público | `—` | — | 10/min | Registro público de clientes (rol 'cliente'). |
| `POST` | `/api/v1/reset-password` | No | Público | `—` | — | 5/min | Restablece la contraseña usando el código recibido por correo. |
| `GET` | `/api/v1/user` | Sí | Todos los autenticados | `—` | — | 60/min global | Alias de /me: perfil del usuario autenticado. |

### Sitio público y eventos

**Tabla.** _Matriz de endpoints: sitio público y eventos_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `GET` | `/api/v1/equipo` | No | Público | `—` | — | 60/min | Endpoint público para la landing ("Sobre Nosotros → Nuestro Equipo"). |
| `GET` | `/api/v1/eventos` | No | Público | `—` | — | 60/min | Listado público de eventos publicados (landing /eventos). Ordena por fecha ascendente: primero los eventos más próximos. |
| `POST` | `/api/v1/eventos` | Sí | admin | `eventos:manage` | — | 30/min | Crea un evento. |
| `GET` | `/api/v1/eventos/admin` | Sí | admin | `eventos:manage` | — | 30/min | Listado de gestión (admin): incluye borradores y publicados. |
| `POST` | `/api/v1/eventos/imagen` | Sí | admin | `eventos:manage` | — | 30/min | Subida de una imagen de la galería desde el cliente móvil (cámara/galería). |
| `DELETE` | `/api/v1/eventos/{id}` | Sí | admin | `eventos:manage` | — | 30/min | Elimina un evento. |
| `GET` | `/api/v1/eventos/{id}` | No | Público | `—` | — | 60/min | Detalle público de un evento publicado. |
| `PUT/PATCH` | `/api/v1/eventos/{id}` | Sí | admin | `eventos:manage` | — | 30/min | Actualiza un evento. |

### Catálogo

**Tabla.** _Matriz de endpoints: catálogo_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `GET` | `/api/v1/categorias` | No | Público | `—` | — | 60/min | Lista categorías. |
| `POST` | `/api/v1/categorias` | Sí | admin | `catalogo:manage` | — | 30/min | Crea un categoría. |
| `DELETE` | `/api/v1/categorias/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Elimina un categoría. |
| `GET` | `/api/v1/categorias/{id}` | No | Público | `—` | — | 60/min | Consulta un categoría por ID. |
| `PUT/PATCH` | `/api/v1/categorias/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Actualiza un categoría. |
| `GET` | `/api/v1/insumos` | Sí | Todos los autenticados | `—` | — | 60/min global | Lista insumos. |
| `POST` | `/api/v1/insumos` | Sí | admin | `catalogo:manage` | — | 30/min | Crea un insumo. |
| `DELETE` | `/api/v1/insumos/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Elimina un insumo. |
| `GET` | `/api/v1/insumos/{id}` | Sí | Todos los autenticados | `—` | — | 60/min global | Consulta un insumo por ID. |
| `PUT/PATCH` | `/api/v1/insumos/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Actualiza un insumo. |
| `GET` | `/api/v1/medios-pago` | Sí | Todos los autenticados | `—` | — | 60/min global | Lista medio de pagos. |
| `POST` | `/api/v1/medios-pago` | Sí | admin | `catalogo:manage` | — | 30/min | Crea un medio de pago. |
| `DELETE` | `/api/v1/medios-pago/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Elimina un medio de pago. |
| `GET` | `/api/v1/medios-pago/{id}` | Sí | Todos los autenticados | `—` | — | 60/min global | Consulta un medio de pago por ID. |
| `PUT/PATCH` | `/api/v1/medios-pago/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Actualiza un medio de pago. |
| `GET` | `/api/v1/productos` | No | Público | `—` | — | 60/min | Lista productos. |
| `POST` | `/api/v1/productos` | Sí | admin | `catalogo:manage` | — | 30/min | Crea un producto. |
| `DELETE` | `/api/v1/productos/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Elimina un producto. |
| `GET` | `/api/v1/productos/{id}` | No | Público | `—` | — | 60/min | Consulta un producto por ID. |
| `PUT/PATCH` | `/api/v1/productos/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Actualiza un producto. |
| `GET` | `/api/v1/recetas` | Sí | Todos los autenticados | `—` | — | 60/min global | Lista recetas. |
| `POST` | `/api/v1/recetas` | Sí | admin | `catalogo:manage` | — | 30/min | Crea un receta. |
| `DELETE` | `/api/v1/recetas/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Elimina un receta. |
| `GET` | `/api/v1/recetas/{id}` | Sí | Todos los autenticados | `—` | — | 60/min global | Consulta un receta por ID. |
| `PUT/PATCH` | `/api/v1/recetas/{id}` | Sí | admin | `catalogo:manage` | — | 30/min | Actualiza un receta. |

### Pedidos, pagos y facturas

**Tabla.** _Matriz de endpoints: pedidos, pagos y facturas_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `GET` | `/api/v1/factura-ventas` | Sí | admin | `facturas:manage` | — | 30/min | Lista factura de ventas. |
| `POST` | `/api/v1/factura-ventas` | Sí | admin | `facturas:manage` | — | 30/min | Crea un factura de venta. |
| `DELETE` | `/api/v1/factura-ventas/{id}` | Sí | admin | `facturas:manage` | — | 30/min | Elimina un factura de venta. |
| `GET` | `/api/v1/factura-ventas/{id}` | Sí | admin | `facturas:manage` | — | 30/min | Consulta un factura de venta por ID. |
| `PUT/PATCH` | `/api/v1/factura-ventas/{id}` | Sí | admin | `facturas:manage` | — | 30/min | Actualiza un factura de venta. |
| `GET` | `/api/v1/pago-pedidos` | Sí | admin, barista | `—` | — | 60/min global | Lista pago de pedidos. |
| `POST` | `/api/v1/pago-pedidos` | Sí | admin, barista | `pedidos:manage` | Sí | 10/min | Crea un pago de pedido. |
| `DELETE` | `/api/v1/pago-pedidos/{id}` | Sí | admin, barista | `pedidos:manage` | Sí | 10/min | Elimina un pago de pedido. |
| `GET` | `/api/v1/pago-pedidos/{id}` | Sí | admin, barista | `—` | — | 60/min global | Consulta un pago de pedido por ID. |
| `PUT/PATCH` | `/api/v1/pago-pedidos/{id}` | Sí | admin, barista | `pedidos:manage` | Sí | 10/min | Actualiza un pago de pedido. |
| `GET` | `/api/v1/pedidos` | Sí | Todos los autenticados | `—` | — | 60/min global | Lista pedidos. |
| `POST` | `/api/v1/pedidos` | Sí | admin, barista, cliente | `pedidos:create,pedidos:manage` | Sí | 10/min | Crea un pedido. |
| `DELETE` | `/api/v1/pedidos/{id}` | Sí | admin, barista | `pedidos:manage` | Sí | 10/min | Elimina un pedido. |
| `GET` | `/api/v1/pedidos/{id}` | Sí | Todos los autenticados | `—` | — | 60/min global | Consulta un pedido por ID. |
| `PUT/PATCH` | `/api/v1/pedidos/{id}` | Sí | admin, barista | `pedidos:manage` | Sí | 10/min | Actualiza un pedido. |

### Caja y movimientos

**Tabla.** _Matriz de endpoints: caja y movimientos_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `GET` | `/api/v1/cajas` | Sí | admin, barista | `cajas:manage` | Sí | 60/min global | Lista cajas. |
| `POST` | `/api/v1/cajas` | Sí | admin, barista | `cajas:manage` | Sí | 10/min | Crea un caja. |
| `DELETE` | `/api/v1/cajas/{id}` | Sí | admin, barista | `cajas:manage` | Sí | 10/min | Elimina un caja. |
| `GET` | `/api/v1/cajas/{id}` | Sí | admin, barista | `cajas:manage` | Sí | 60/min global | Consulta un caja por ID. |
| `PUT/PATCH` | `/api/v1/cajas/{id}` | Sí | admin, barista | `cajas:manage` | Sí | 10/min | Actualiza un caja. |
| `GET` | `/api/v1/movimiento-cajas` | Sí | admin, barista | `—` | Sí | 60/min global | Lista movimiento de cajas. |
| `POST` | `/api/v1/movimiento-cajas` | Sí | admin, barista | `movimiento-cajas:manage` | Sí | 60/min global | Crea un movimiento de caja. |
| `DELETE` | `/api/v1/movimiento-cajas/{id}` | Sí | admin, barista | `movimiento-cajas:manage` | Sí | 60/min global | Elimina un movimiento de caja. |
| `GET` | `/api/v1/movimiento-cajas/{id}` | Sí | admin, barista | `—` | Sí | 60/min global | Consulta un movimiento de caja por ID. |
| `PUT/PATCH` | `/api/v1/movimiento-cajas/{id}` | Sí | admin, barista | `movimiento-cajas:manage` | Sí | 60/min global | Actualiza un movimiento de caja. |
| `GET` | `/api/v1/turno-activo` | Sí | Todos los autenticados | `—` | — | 60/min global | Lista turno activos. |

### Compras y proveedores

**Tabla.** _Matriz de endpoints: compras y proveedores_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `GET` | `/api/v1/compra-pagos` | Sí | admin, barista | `compras:manage` | Sí | 60/min global | Lista pago de compras. |
| `POST` | `/api/v1/compra-pagos` | Sí | admin, barista | `compras:manage` | Sí | 10/min | Crea un pago de compra. |
| `DELETE` | `/api/v1/compra-pagos/{id}` | Sí | admin, barista | `compras:manage` | Sí | 10/min | Elimina un pago de compra. |
| `GET` | `/api/v1/compra-pagos/{id}` | Sí | admin, barista | `compras:manage` | Sí | 60/min global | Consulta un pago de compra por ID. |
| `PUT/PATCH` | `/api/v1/compra-pagos/{id}` | Sí | admin, barista | `compras:manage` | Sí | 10/min | Actualiza un pago de compra. |
| `GET` | `/api/v1/compras` | Sí | admin, barista | `compras:manage` | Sí | 60/min global | Lista compras. |
| `POST` | `/api/v1/compras` | Sí | admin, barista | `compras:manage` | Sí | 10/min | Crea un compra. |
| `DELETE` | `/api/v1/compras/{id}` | Sí | admin, barista | `compras:manage` | Sí | 10/min | Elimina un compra. |
| `GET` | `/api/v1/compras/{id}` | Sí | admin, barista | `compras:manage` | Sí | 60/min global | Consulta un compra por ID. |
| `PUT/PATCH` | `/api/v1/compras/{id}` | Sí | admin, barista | `compras:manage` | Sí | 10/min | Actualiza un compra. |
| `GET` | `/api/v1/detalle-compras` | Sí | admin, barista | `compras:manage` | Sí | 60/min global | Lista detalle de compras. |
| `POST` | `/api/v1/detalle-compras` | Sí | admin, barista | `compras:manage` | Sí | 10/min | Crea un detalle de compra. |
| `DELETE` | `/api/v1/detalle-compras/{id}` | Sí | admin, barista | `compras:manage` | Sí | 10/min | Elimina un detalle de compra. |
| `GET` | `/api/v1/detalle-compras/{id}` | Sí | admin, barista | `compras:manage` | Sí | 60/min global | Consulta un detalle de compra por ID. |
| `PUT/PATCH` | `/api/v1/detalle-compras/{id}` | Sí | admin, barista | `compras:manage` | Sí | 10/min | Actualiza un detalle de compra. |
| `GET` | `/api/v1/proveedores` | Sí | admin, barista | `—` | Sí | 60/min global | Lista proveedors. |
| `POST` | `/api/v1/proveedores` | Sí | admin, barista | `proveedores:manage` | Sí | 60/min global | Crea un proveedor. |
| `DELETE` | `/api/v1/proveedores/{id}` | Sí | admin, barista | `proveedores:manage` | Sí | 60/min global | Elimina un proveedor. |
| `GET` | `/api/v1/proveedores/{id}` | Sí | admin, barista | `—` | Sí | 60/min global | Consulta un proveedor por ID. |
| `PUT/PATCH` | `/api/v1/proveedores/{id}` | Sí | admin, barista | `proveedores:manage` | Sí | 60/min global | Actualiza un proveedor. |

### Gastos y mermas

**Tabla.** _Matriz de endpoints: gastos y mermas_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `GET` | `/api/v1/gasto-pagos` | Sí | admin, barista | `gastos:manage` | Sí | 60/min global | Lista pago de gastos. |
| `POST` | `/api/v1/gasto-pagos` | Sí | admin, barista | `gastos:manage` | Sí | 10/min | Crea un pago de gasto. |
| `DELETE` | `/api/v1/gasto-pagos/{id}` | Sí | admin, barista | `gastos:manage` | Sí | 10/min | Elimina un pago de gasto. |
| `GET` | `/api/v1/gasto-pagos/{id}` | Sí | admin, barista | `gastos:manage` | Sí | 60/min global | Consulta un pago de gasto por ID. |
| `PUT/PATCH` | `/api/v1/gasto-pagos/{id}` | Sí | admin, barista | `gastos:manage` | Sí | 10/min | Actualiza un pago de gasto. |
| `GET` | `/api/v1/gastos` | Sí | admin, barista | `gastos:manage` | Sí | 60/min global | Lista gastos. |
| `POST` | `/api/v1/gastos` | Sí | admin, barista | `gastos:manage` | Sí | 10/min | Crea un gasto. |
| `DELETE` | `/api/v1/gastos/{id}` | Sí | admin, barista | `gastos:manage` | Sí | 10/min | Elimina un gasto. |
| `GET` | `/api/v1/gastos/{id}` | Sí | admin, barista | `gastos:manage` | Sí | 60/min global | Consulta un gasto por ID. |
| `PUT/PATCH` | `/api/v1/gastos/{id}` | Sí | admin, barista | `gastos:manage` | Sí | 10/min | Actualiza un gasto. |
| `GET` | `/api/v1/mermas` | Sí | admin, barista | `mermas:manage` | Sí | 60/min global | Lista mermas. |
| `POST` | `/api/v1/mermas` | Sí | admin, barista | `mermas:manage` | Sí | 10/min | Crea un merma. |
| `DELETE` | `/api/v1/mermas/{id}` | Sí | admin, barista | `mermas:manage` | Sí | 10/min | Elimina un merma. |
| `GET` | `/api/v1/mermas/{id}` | Sí | admin, barista | `mermas:manage` | Sí | 60/min global | Consulta un merma por ID. |
| `PUT/PATCH` | `/api/v1/mermas/{id}` | Sí | admin, barista | `mermas:manage` | Sí | 10/min | Actualiza un merma. |

### Turnos

**Tabla.** _Matriz de endpoints: turnos_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `GET` | `/api/v1/mis-turnos` | Sí | barista | `—` | — | 60/min global | Lista mis turnoss. |
| `GET` | `/api/v1/turnos` | Sí | admin | `turnos:manage` | — | 30/min | Lista turnos. |
| `POST` | `/api/v1/turnos` | Sí | admin | `turnos:manage` | — | 30/min | Crea un turno. |
| `DELETE` | `/api/v1/turnos/{id}` | Sí | admin | `turnos:manage` | — | 30/min | Elimina un turno. |
| `GET` | `/api/v1/turnos/{id}` | Sí | admin | `turnos:manage` | — | 30/min | Consulta un turno por ID. |
| `PUT/PATCH` | `/api/v1/turnos/{id}` | Sí | admin | `turnos:manage` | — | 30/min | Actualiza un turno. |

### Chat y reportes

**Tabla.** _Matriz de endpoints: chat y reportes_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `GET` | `/api/v1/mensajes` | Sí | Todos los autenticados | `—` | — | 60/min global | Bandeja o conversación: - Sin parámetro `con`: resumen de contactos (último mensaje + no leídos). - Con parámetro `con`: hilo completo con ese usuario. |
| `POST` | `/api/v1/mensajes` | Sí | Todos los autenticados | `—` | — | 60/min global | Enviar un mensaje. Cliente → barista/admin. Barista/admin → cualquier usuario activo. |
| `GET` | `/api/v1/mensajes/contactos` | Sí | Todos los autenticados | `—` | — | 60/min global | Contactos sugeridos según el rol del usuario autenticado. |
| `POST` | `/api/v1/mensajes/leer` | Sí | Todos los autenticados | `—` | — | 60/min global | Marcar como leídos todos los mensajes recibidos de un contacto. |
| `GET` | `/api/v1/reportes` | Sí | admin | `—` | — | 60/min global | Lista reportes. |
| `POST` | `/api/v1/reportes` | Sí | admin, barista | `—` | — | 60/min global | Crea un reporte. |
| `DELETE` | `/api/v1/reportes/{id}` | Sí | admin | `—` | — | 60/min global | Elimina un reporte. |
| `GET` | `/api/v1/reportes/{id}` | Sí | admin | `—` | — | 60/min global | Consulta un reporte por ID. |
| `PUT/PATCH` | `/api/v1/reportes/{id}` | Sí | admin | `—` | — | 60/min global | Actualiza un reporte. |

### Usuarios y roles

**Tabla.** _Matriz de endpoints: usuarios y roles_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `GET` | `/api/v1/roles` | Sí | admin | `roles:manage` | — | 30/min | Lista rols. |
| `POST` | `/api/v1/roles` | Sí | admin | `roles:manage` | — | 30/min | Crea un rol. |
| `DELETE` | `/api/v1/roles/{id}` | Sí | admin | `roles:manage` | — | 30/min | Elimina un rol. |
| `GET` | `/api/v1/roles/{id}` | Sí | admin | `roles:manage` | — | 30/min | Consulta un rol por ID. |
| `PUT/PATCH` | `/api/v1/roles/{id}` | Sí | admin | `roles:manage` | — | 30/min | Actualiza un rol. |
| `GET` | `/api/v1/usuario-roles` | Sí | admin | `usuarios:manage` | — | 30/min | Lista asignación usuario-rols. |
| `POST` | `/api/v1/usuario-roles` | Sí | admin | `usuarios:manage` | — | 30/min | Crea un asignación usuario-rol. |
| `DELETE` | `/api/v1/usuario-roles/{id}` | Sí | admin | `usuarios:manage` | — | 30/min | Elimina un asignación usuario-rol. |
| `GET` | `/api/v1/usuario-roles/{id}` | Sí | admin | `usuarios:manage` | — | 30/min | Consulta un asignación usuario-rol por ID. |
| `PUT/PATCH` | `/api/v1/usuario-roles/{id}` | Sí | admin | `usuarios:manage` | — | 30/min | Actualiza un asignación usuario-rol. |
| `GET` | `/api/v1/usuarios` | Sí | admin | `usuarios:manage` | — | 30/min | Lista usuarios. |
| `POST` | `/api/v1/usuarios` | Sí | admin | `usuarios:manage` | — | 30/min | Crea un usuario. |
| `DELETE` | `/api/v1/usuarios/{id}` | Sí | admin | `usuarios:manage` | — | 30/min | Elimina un usuario. |
| `GET` | `/api/v1/usuarios/{id}` | Sí | admin | `usuarios:manage` | — | 30/min | Consulta un usuario por ID. |
| `PUT/PATCH` | `/api/v1/usuarios/{id}` | Sí | admin | `usuarios:manage` | — | 30/min | Actualiza un usuario. |

### Asistente KAFFA

**Tabla.** _Matriz de endpoints: asistente KAFFA_

| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |
|---|---|---:|---|---|---:|---|---|
| `POST` | `/api/v1/asistente/chat` | Sí | Todos los autenticados | `—` | — | 30/min | Envía una pregunta al asistente y devuelve su respuesta. El servicio persiste tanto la pregunta como la respuesta en el historial. |
| `DELETE` | `/api/v1/asistente/mensajes` | Sí | Todos los autenticados | `—` | — | 30/min | Borra todo el historial del usuario autenticado. |
| `GET` | `/api/v1/asistente/mensajes` | Sí | Todos los autenticados | `—` | — | 30/min | Historial de conversación del usuario autenticado. Se devuelve del turno más reciente al más antiguo; el frontend lo invierte para mostrarlo en orden cronológico. |

## 26.3 Cómo leer la matriz

- **Auth**: exige `Authorization: Bearer {token}`. Sin token, la API responde 401 en JSON.
- **Roles**: el middleware `role:` exige al menos uno de los roles indicados. Admin, barista y cliente son acumulables.
- **Ability**: el token debe poseer el alcance indicado; de lo contrario responde 403 `TOKEN_SIN_ABILITY`. El token de admin usa `*`.
- **Turno**: el middleware `turno.activo` solo afecta a baristas; admin y cliente están exentos.
- **Throttle**: límite específico por usuario/IP. Las lecturas operativas se separaron de las escrituras para no agotar el cupo de 10/min al listar.

> **Recomendación.** Para clientes nuevos, obtenga el token con `POST /api/v1/login` y consulte `GET /api/v1/me` antes de asumir roles. No deduzca permisos solo por el nombre de la ruta: la fuente de verdad es la combinación rol + ability + policy.

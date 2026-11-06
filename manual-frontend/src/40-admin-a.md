# Parte IV. Panel del administrador

## 28. Entrar y recorrer el panel

### Para qué sirve

El panel del administrador controla todo el negocio: catálogo, inventario, compras, gastos, personal, turnos, reportes y estadísticas. Es la vista con más permisos del sistema.

### Cómo llegar

Inicia sesión con una cuenta de administrador. El sistema te lleva a `/admin-dashboard`.

![Figura 28.1. Panel de administración con el menú de 19 secciones.](assets/capturas/a01-inicio.png)

### Qué ves

- **Menú lateral verde** con 19 secciones.
- **Barra superior** con el título de la sección, el botón de tema y tu perfil.
- **Área de contenido** que cambia según la sección elegida.
- **Cerrar Sesión** al final del menú.

### Las 19 secciones

| Grupo | Secciones |
|---|---|
| **Operación** | Inicio, Pedidos, Cajas, Facturas |
| **Catálogo** | Menú / Productos, Categorías, Insumos, Mermas |
| **Compras y dinero** | Compras, Proveedores, Gastos |
| **Personas** | Clientes, Baristas, Turnos |
| **Comunicación** | Eventos, Promociones, Reportes, Asistente IA |
| **Sistema** | Configuración |

### Paso a paso para orientarte

1. Empieza en **Inicio**: te da la foto del día.
2. Revisa **Pedidos** si hay operación en curso.
3. Usa el menú lateral para cambiar de sección; no cambia la dirección web, pero sí el contenido.
4. El título de la barra superior te confirma dónde estás.
5. Al terminar, cierra sesión desde el menú.

### El panel en pantallas pequeñas

En un teléfono o tablet, el menú lateral se oculta y aparece un botón de tres líneas (☰) en la esquina superior izquierda. Púlsalo para abrir la navegación.

![Figura 28.2. Panel de administración en un teléfono.](assets/capturas/a37-menu-movil-admin.png)

::: cuida
El administrador **no depende de turnos** para operar: puede abrir y cerrar cajas, cambiar estados y registrar movimientos en cualquier momento.
:::

::: consejo
El panel recuerda el tema claro u oscuro que elijas. Si vas a tomar capturas o proyectar en clase, usa el tema claro para mayor legibilidad.
:::

## 29. Inicio y los indicadores

### Para qué sirve

Es el tablero gerencial. Resume el día en cuatro cifras y muestra dos gráficas: ingresos de los últimos siete días y productos más vendidos.

### Cómo llegar

Inicia sesión como administrador o pulsa **Inicio** en el menú lateral.

![Figura 29.1. Indicadores del día y gráficas de ventas.](assets/capturas/a01-inicio.png)

### Qué ves

Cuatro tarjetas:

| Indicador | Qué mide |
|---|---|
| **Ingresos hoy** | Suma de las facturas del día. |
| **Pedidos hoy** | Pedidos creados hoy. |
| **Clientes registrados** | Total de cuentas con rol cliente. |
| **Ticket promedio** | Ingresos del día divididos entre los pedidos del día. |

Dos gráficas:

- **Ingresos Últimos 7 Días**: línea con el total facturado por día.
- **Productos Más Vendidos**: dona con los cinco productos más pedidos en la semana.

### Cómo interpretarlos

1. Compara **Ingresos hoy** con el ticket promedio: si el ticket baja pero los pedidos suben, estás vendiendo más unidades de menor valor.
2. Mira la línea de siete días: un valle puede coincidir con un día sin facturación o con un cierre anticipado.
3. En la dona, identifica los productos que sostienen la venta y los que casi no aparecen.
4. Usa esta información para decidir promociones y compras.

::: cuida
Los indicadores se calculan con las **facturas** y los **pedidos** registrados. Si un pedido se cobró pero no generó factura, puede no reflejarse igual en todas las cifras.
:::

::: consejo
Revisa **Inicio** al abrir y al cerrar el día. Es la forma más rápida de detectar un pedido que quedó pendiente o una caja sin cerrar.
:::

### Si algo sale mal

::: error
**Todo aparece en cero.** Puede que no haya facturas del día o que la fecha del servidor no coincida. Verifica **Pedidos** y **Facturas**.
**Las gráficas no aparecen.** El navegador debe poder cargar la librería de gráficas; revisa la conexión y recarga.
:::

## 30. Pedidos desde el administrador

### Para qué sirve

Permite ver todos los pedidos, cambiar su estado, revisar el detalle, eliminar registros y exportar la lista a CSV.

### Cómo llegar

Pulsa **Pedidos** en el menú lateral.

![Figura 30.1. Tabla de pedidos con estado editable y acciones.](assets/capturas/a02-pedidos.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **ID** | Número del pedido. |
| **Cliente** | Nombre del cliente o un guion si es de mostrador. |
| **Barista** | Quién lo atendió. |
| **Productos** | Resumen de ítems y notas. |
| **Total** | Valor del pedido. |
| **Estado** | Lista desplegable: Pendiente, Pagado, Cancelado, Entregado. |
| **Acciones** | Ver detalle y eliminar. |

Arriba a la derecha está **Exportar CSV**.

### Ver el detalle

1. Pulsa el icono del ojo en la fila.
2. Se abre **Detalle del Pedido** con cliente, barista, fecha, productos, pagos y factura.
3. Pulsa **Cerrar** para volver.

![Figura 30.2. Detalle completo de un pedido, con pagos y factura.](assets/capturas/a20-detalle-pedido.png)

### Cambiar el estado

1. Abre la lista de **Estado** en la fila.
2. Elige el nuevo estado.
3. El cambio se guarda de inmediato.

Usa esta opción para corregir un pedido que quedó en el estado equivocado. El barista también puede mover estados durante su turno.

### Exportar a CSV

1. Pulsa **Exportar CSV**.
2. El navegador descarga un archivo con los pedidos visibles.
3. Ábrelo con Excel, Google Sheets o Numbers.

### Eliminar un pedido

1. Pulsa el icono de basura.
2. Confirma la eliminación.

::: cuida
Eliminar un pedido es una acción destructiva: se borra el registro, su detalle, sus pagos y su factura. **No repone el inventario** ni reintegra el dinero a la caja. Si solo necesitas anularlo, cambia el estado a **Cancelado** en lugar de eliminarlo.
:::

::: consejo
Exporta el CSV al cierre de cada semana. Es una copia sencilla que puedes analizar sin entrar al sistema.
:::

## 31. Productos

### Para qué sirve

Administra el menú: crea, edita, activa o elimina productos, define precio, categoría e imagen.

### Cómo llegar

Pulsa **Menú / Productos** en el menú lateral.

![Figura 31.1. Lista de productos con imagen, categoría, precio y estado.](assets/capturas/a03-productos.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **Producto** | Imagen, nombre y descripción. |
| **Categoría** | Categoría a la que pertenece. |
| **Precio** | Precio de venta. |
| **Activo** | Interruptor para mostrarlo u ocultarlo. |
| **Acciones** | Editar y eliminar. |

Botón **Nuevo Producto** arriba a la derecha.

### Crear un producto

1. Pulsa **Nuevo Producto**.
2. Escribe el **nombre**.
3. Escribe una **descripción** breve y apetitosa.
4. Sube una **imagen** desde tu dispositivo (JPG, PNG, WebP o AVIF, máximo 5 MB).
5. Escribe el **precio**.
6. Elige la **categoría**.
7. Deja marcado **Visible en el menú**.
8. Pulsa **Guardar**.

![Figura 31.2. Formulario de creación de producto.](assets/capturas/a21-nuevo-producto.png)

### Editar o desactivar

- Pulsa el lápiz para editar cualquier campo.
- Apaga **Activo** para ocultarlo del menú sin borrarlo. Es útil para productos de temporada.
- El icono de basura elimina el producto.

::: cuida
Si un producto ya tiene pedidos, eliminarlo puede afectar el historial. En ese caso es mejor **desactivarlo**.
:::

::: consejo
Una buena foto vende más que una descripción larga. Usa fondo limpio, buena luz y el producto completo.
:::

## 32. Categorías

### Para qué sirve

Agrupa los productos para que el cliente pueda filtrar el menú: Cafés, Postres, Snacks, Bebidas frías, etc.

### Cómo llegar

Pulsa **Categorías** en el menú lateral.

![Figura 32.1. Categorías disponibles y sus acciones.](assets/capturas/a04-categorias.png)

### Qué ves

- Tabla con **ID**, **NOMBRE** y **ACCIONES**.
- Botón **Nueva Categoría**.

### Crear una categoría

1. Pulsa **Nueva Categoría**.
2. Escribe el nombre, por ejemplo *Bebidas frías*.
3. Pulsa **Guardar**.

![Figura 32.2. Ventana para crear una categoría.](assets/capturas/a22-nueva-categoria.png)

### Editar o eliminar

Usa el lápiz o la basura de la fila. Si la categoría tiene productos, el sistema puede impedir la eliminación; en ese caso reasigna primero los productos.

::: consejo
Usa nombres cortos y claros. Aparecen como filtros en el menú y deben caber en un botón.
:::

::: cuida
El orden de las categorías en el menú depende de su creación. Si necesitas un orden específico, créalas en el orden deseado.
:::

## 33. Insumos

### Para qué sirve

Controla la materia prima: café, leche, azúcar, vasos. El stock se mueve automáticamente con ventas, compras y mermas.

### Cómo llegar

Pulsa **Insumos** en el menú lateral.

![Figura 33.1. Inventario de insumos con stock, mínimo y estado.](assets/capturas/a05-insumos.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **ID** | Número interno. |
| **Nombre** | Nombre del insumo. |
| **Und.** | Unidad: kg, lt, unidades. |
| **Stock** | Cantidad actual. |
| **Mínimo** | Umbral de reposición. |
| **Estado** | Agotado, Bajo o Disponible. |
| **Activo** | Interruptor. |
| **Acciones** | Editar y eliminar. |

### Crear un insumo

1. Pulsa **Nuevo Insumo**.
2. Escribe el **nombre**.
3. Escribe la **unidad de medida** (`kg`, `lt`, `unidades`).
4. Escribe el **stock actual** y el **stock mínimo**.
5. Deja marcado **Insumo activo**.
6. Pulsa **Guardar**.

![Figura 33.2. Formulario de nuevo insumo.](assets/capturas/a23-nuevo-insumo.png)

### Cómo se mueve el stock

| Acción | Efecto |
|---|---|
| Crear un pedido | Descuenta según la receta del producto. |
| Registrar una compra | Suma la cantidad comprada. |
| Registrar una merma | Resta la cantidad perdida. |
| Eliminar una compra o merma | Revierte el movimiento. |

::: cuida
El stock solo se fija al crear el insumo. Después no se edita a mano: se corrige con compras o mermas para que quede trazabilidad.
:::

::: consejo
Define mínimos realistas. Un mínimo demasiado bajo te hace quedar sin insumo; uno demasiado alto llena la bodega y genera mermas.
:::

## 34. Mermas

### Para qué sirve

Registra producto perdido, vencido, derramado o dañado. Cada merma descuenta stock y explica el motivo.

### Cómo llegar

Pulsa **Mermas** en el menú lateral.

![Figura 34.1. Historial de mermas con insumo, cantidad, motivo y responsable.](assets/capturas/a06-mermas.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **Insumo** | Insumo afectado. |
| **Cantidad** | Cantidad perdida. |
| **Motivo** | Explicación. |
| **Registrada por** | Usuario que la registró. |
| **Fecha** | Cuándo ocurrió. |
| **Acciones** | Eliminar (devuelve el stock). |

### Registrar una merma

1. Pulsa **Registrar Merma**.
2. Elige el **insumo**.
3. Escribe la **cantidad**.
4. Escribe el **motivo**: *producto vencido*, *derrame*, *empaque roto*.
5. Pulsa **Guardar**.

![Figura 34.2. Formulario para registrar una merma.](assets/capturas/a24-registrar-merma.png)

### Eliminar una merma

Si registraste una merma por error, elimínala con la basura. El sistema devuelve la cantidad al inventario.

::: cuida
No uses las mermas para “cuadrar” el inventario. Si el stock no coincide, revisa compras, ventas y conteos antes de registrar una pérdida.
:::

::: consejo
Registra la merma en el momento. Al final del día es fácil olvidar qué producto se dañó y por qué.
:::

## 35. Compras

### Para qué sirve

Registra la mercancía que compras a los proveedores. Suma stock, controla el costo y deja el pago asociado.

### Cómo llegar

Pulsa **Compras** en el menú lateral.

![Figura 35.1. Compras registradas con proveedor, factura, total y fecha.](assets/capturas/a07-compras.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **ID** | Número de compra. |
| **Proveedor** | A quién se compró. |
| **Factura Prov.** | Número de factura del proveedor. |
| **Total** | Valor de la compra. |
| **Detalles** | Insumos y cantidades. |
| **Fecha** | Fecha de la compra. |
| **Acciones** | Eliminar (revierte stock). |

### Registrar una compra

1. Pulsa **Nueva Compra**.
2. Elige el **proveedor**.
3. Escribe el **N° Factura Proveedor**.
4. Selecciona la **Fecha Compra**.
5. En **Detalles**, elige el insumo, la cantidad y el costo unitario. Pulsa **Agregar detalle** para más líneas.
6. En **Pagos**, elige el medio y el monto; si es virtual, sube el comprobante.
7. Pulsa **Guardar**.

![Figura 35.2. Formulario de compra con detalles y pagos.](assets/capturas/a25-nueva-compra.png)

### Qué pasa después

- El stock de cada insumo sube según la cantidad comprada.
- El pago queda registrado y, si hay caja abierta, genera un egreso.
- Si eliminas la compra, el stock se revierte.

::: cuida
Verifica que la cantidad y el costo unitario sean correctos antes de guardar. Corregir después implica eliminar y volver a crear.
:::

::: consejo
Adjunta el número de factura del proveedor: es la mejor forma de conciliar una compra con su soporte físico.
:::

## 36. Proveedores

### Para qué sirve

Mantiene el directorio de proveedores: a quién le compras, cómo contactarlo y si está activo.

### Cómo llegar

Pulsa **Proveedores** en el menú lateral.

![Figura 36.1. Lista de proveedores con NIT, contacto y estado.](assets/capturas/a08-proveedores.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **NIT** | Identificación tributaria. |
| **Nombre** | Razón social o nombre. |
| **Teléfono** | Contacto. |
| **Correo** | Correo de pedidos. |
| **Activo** | Estado. |
| **Acciones** | Editar y eliminar. |

### Crear un proveedor

1. Pulsa **Nuevo Proveedor**.
2. Escribe **NIT**, **nombre**, **teléfono**, **correo** y **dirección**.
3. Deja **Proveedor activo** marcado.
4. Pulsa **Guardar**.

![Figura 36.2. Formulario de proveedor.](assets/capturas/a26-nuevo-proveedor.png)

::: consejo
Guarda el correo de pedidos, no el personal. Así cualquier persona del equipo puede hacer un pedido sin depender de un contacto único.
:::

## 37. Gastos

### Para qué sirve

Registra los egresos que no son compras de inventario: servicios, transporte, publicidad, mantenimiento. Cada gasto puede tener uno o varios pagos.

### Cómo llegar

Pulsa **Gastos** en el menú lateral.

![Figura 37.1. Gastos registrados con categoría, total y responsable.](assets/capturas/a09-gastos.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **Descripción** | Qué se pagó. |
| **Categoría** | Servicios públicos, transporte, marketing, etc. |
| **Total** | Suma de los pagos. |
| **Registrado por** | Usuario que lo creó. |
| **Fecha** | Cuándo se registró. |
| **Acciones** | Eliminar. |

### Registrar un gasto

1. Pulsa **Nuevo Gasto**.
2. Escribe la **descripción**.
3. Escribe la **categoría**.
4. En **Pagos**, elige el medio, el monto y, si es virtual, sube el comprobante.
5. Pulsa **Agregar pago** si necesitas dividir el gasto.
6. Pulsa **Guardar**.

![Figura 37.2. Formulario de gasto con pagos y comprobante.](assets/capturas/a27-nuevo-gasto.png)

### Qué pasa después

El gasto queda en el historial y, si hay caja abierta, genera un egreso. Los gastos afectan el análisis de rentabilidad del asistente.

::: cuida
Un gasto no descuenta inventario. Si compraste insumos, usa **Compras**, no **Gastos**.
:::

::: consejo
Usa categorías consistentes. Si escribes “servicios”, “servicio” y “Servicios públicos”, los reportes se fragmentan.
:::

## 38. Cajas

### Para qué sirve

Supervisa todas las cajas: cuáles están abiertas, quién las abrió, a qué turno pertenecen y cómo cerraron. El administrador puede abrir y cerrar sin depender de un turno.

### Cómo llegar

Pulsa **Cajas** en el menú lateral.

![Figura 38.1. Historial de cajas con apertura, cierre y estado.](assets/capturas/a10-cajas.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **ID** | Número de caja. |
| **Estado** | Abierta o cerrada. |
| **Abrió** | Usuario que la abrió. |
| **Turno** | Turno asociado. |
| **Apertura** | Monto inicial. |
| **Cerró** | Usuario que la cerró. |
| **Cierre sistema** | Monto esperado por el sistema. |
| **Acciones** | Ver detalle y operar. |

### Abrir una caja

1. Pulsa **Abrir Caja**.
2. Escribe el **monto de apertura**.
3. Confirma.

![Figura 38.2. Ventana para abrir una caja.](assets/capturas/a28-abrir-caja.png)

### Revisar una caja

1. Pulsa el icono del ojo en la fila.
2. Revisa movimientos, ingresos, egresos y diferencias.
3. Si está abierta, puedes cerrarla con los montos contados.

::: cuida
Una caja abierta por error afecta los ingresos del turno. Ciérrala con el monto real antes de abrir otra.
:::

::: consejo
Al cerrar el día, verifica que no quede ninguna caja abierta. Es una de las causas más comunes de descuadres al día siguiente.
:::

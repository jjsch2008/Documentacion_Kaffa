## 39. Facturas

### Para qué sirve

Consulta las facturas internas generadas por los pedidos cobrados. Cada factura tiene número, pedido asociado, subtotal, impuestos y total.

### Cómo llegar

Pulsa **Facturas** en el menú lateral.

![Figura 39.1. Listado de facturas de venta.](assets/capturas/a11-facturas.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **N° Factura** | Número consecutivo, por ejemplo `F2026000007`. |
| **Pedido** | Pedido que la originó. |
| **Subtotal** | Valor antes de impuestos. |
| **Impuestos** | Impuestos registrados. |
| **Total** | Valor final. |
| **Emisión** | Fecha de emisión. |

### Qué puedes hacer

Esta sección es de **consulta**. No se crean facturas a mano: se generan cuando un pedido se cobra con factura. Para corregir una factura, corrige el pedido asociado.

### Cómo leer el número

El formato `F` + año + consecutivo permite ordenar y buscar. El consecutivo lo asigna el sistema y no se reutiliza.

::: cuida
La factura de KAFFA es un comprobante interno de la operación. No reemplaza una factura electrónica certificada ante la DIAN.
:::

::: consejo
Si necesitas conciliar la caja con la facturación, cruza el **Total** de las facturas del día con los ingresos de la caja.
:::

## 40. Clientes

### Para qué sirve

Gestiona las cuentas de cliente: datos de contacto, estado y historial de pedidos.

### Cómo llegar

Pulsa **Clientes** en el menú lateral.

![Figura 40.1. Lista de clientes registrados.](assets/capturas/a12-clientes.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **Nombre** | Nombre del cliente. |
| **Correo** | Correo de la cuenta. |
| **Registro** | Fecha de creación. |
| **Activo** | Si puede iniciar sesión. |
| **Acciones** | Ver detalle, editar y eliminar. |

### Ver el historial

1. Pulsa el icono del ojo.
2. Se abre **Detalle del Cliente** con sus datos y sus pedidos.
3. Usa esta vista para responder preguntas como *“¿cuánto he comprado?”* o *“¿mi último pedido está entregado?”*.

### Editar un cliente

1. Pulsa el lápiz.
2. Cambia **nombre** o **correo**.
3. Apaga **Usuario activo** si necesitas bloquear el acceso.
4. Pulsa **Guardar**.

![Figura 40.2. Edición de los datos de un cliente.](assets/capturas/a29-editar-cliente.png)

### Eliminar un cliente

La basura elimina la cuenta. Si solo quieres impedir el acceso, **desactívala** en lugar de borrarla, para conservar el historial.

::: cuida
Cambiar el correo de un cliente afecta su próximo inicio de sesión. Avísale antes de hacerlo.
:::

::: consejo
Antes de crear una cuenta manualmente, verifica que el cliente no se haya registrado ya. Dos cuentas con el mismo correo generan confusión.
:::

## 41. Baristas

### Para qué sirve

Crea y administra las cuentas del personal de barra. Cada barista debe tener su propia cuenta para que los pedidos queden trazados.

### Cómo llegar

Pulsa **Baristas** en el menú lateral.

![Figura 41.1. Lista de baristas con contacto y estado.](assets/capturas/a13-baristas.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **Nombre** | Nombre del barista. |
| **Correo** | Correo de acceso. |
| **Registro** | Fecha de creación. |
| **Activo** | Si puede iniciar sesión. |
| **Acciones** | Editar y eliminar. |

### Crear un barista

1. Pulsa **Agregar Barista**.
2. Escribe **nombre** y **correo**.
3. Sube una **foto** (opcional pero recomendada).
4. Escribe una **contraseña** que cumpla los requisitos.
5. Deja **Usuario activo** marcado.
6. Pulsa **Guardar**.

![Figura 41.2. Formulario para agregar un barista.](assets/capturas/a30-agregar-barista.png)

### Asignar el turno

Crear la cuenta no basta: el barista debe tener un **turno asignado** para hoy (capítulo 42). Sin turno puede ver el panel, pero no cobrar ni operar caja.

::: cuida
No compartas una cuenta entre varios baristas. Se pierde la trazabilidad de quién cobró, quién reportó y quién cerró la caja.
:::

::: consejo
Crea la cuenta y asigna el turno en la misma sesión de trabajo. Así la persona puede empezar sin bloqueos.
:::

## 42. Turnos

### Para qué sirve

Organiza el horario del personal. Un turno define la fecha, el tipo (mañana, tarde o abierto) y los baristas asignados.

### Cómo llegar

Pulsa **Turnos** en el menú lateral.

![Figura 42.1. Turnos con fecha, tipo y baristas asignados.](assets/capturas/a14-turnos.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **Fecha** | Día del turno. |
| **Tipo** | Mañana (07:00–13:00), Tarde (13:00–18:00) o Abierto (05:00–22:00). |
| **Baristas asignados** | Personas que trabajan ese turno. |
| **Acciones** | Editar y eliminar. |

### Crear un turno

1. Pulsa **Nuevo Turno**.
2. Elige la **fecha** de inicio.
3. Si el turno dura varios días, elige **Fecha fin**; si es de un solo día, déjala vacía.
4. Elige el **tipo**.
5. Marca los **baristas asignados**.
6. Pulsa **Guardar**.

![Figura 42.2. Formulario de turno con selección de baristas.](assets/capturas/a31-nuevo-turno.png)

### Reglas

- Solo puede existir **un turno del mismo tipo por fecha**.
- No se puede eliminar un turno que ya tiene cajas asociadas.
- El turno **Abierto** tiene prioridad sobre mañana y tarde cuando el barista está asignado.

::: cuida
Si un barista no ve su turno activo, revisa tres cosas: la fecha, el tipo según la hora actual y que esté marcado en **Baristas asignados**.
:::

::: consejo
Planifica los turnos con una semana de anticipación. Los cambios de última hora son la causa más frecuente de bloqueos al abrir la caja.
:::

## 43. Eventos

### Para qué sirve

Publica las actividades de la cafetería en la página pública **Eventos**: ferias, talleres, música en vivo.

### Cómo llegar

Pulsa **Eventos** en el menú lateral.

![Figura 43.1. Eventos creados con imagen, lugar, fecha y estado.](assets/capturas/a15-eventos.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **Imagen** | Portada del evento. |
| **Título** | Nombre del evento. |
| **Lugar** | Dónde se realiza. |
| **Fecha** | Día y hora. |
| **Estado** | Publicado o Borrador. |
| **Acciones** | Editar y eliminar. |

### Crear un evento

1. Pulsa **Nuevo Evento**.
2. Escribe el **título**.
3. Escribe el **lugar**.
4. Elige **fecha** y, si aplica, **hora**.
5. Escribe una **descripción** clara.
6. Sube hasta **5 imágenes**; la primera es la portada.
7. Marca **Publicar en la sección de eventos**.
8. Pulsa **Guardar**.

![Figura 43.2. Formulario de evento con imágenes y opción de publicación.](assets/capturas/a32-nuevo-evento.png)

### Qué pasa después

Si está publicado y la fecha es futura, aparece en `/eventos`. Si lo dejas como borrador, no se muestra al público.

::: cuida
Un evento con fecha pasada deja de mostrarse. Si necesitas conservarlo visible, actualiza la fecha.
:::

::: consejo
La primera imagen es la que más se ve. Usa una foto horizontal, bien iluminada y sin texto pequeño.
:::

## 44. Promociones

### Para qué sirve

Crea los avisos emergentes que ven los clientes al entrar a la portada: descuentos, 2x1 y combos.

### Cómo llegar

Pulsa **Promociones** en el menú lateral.

![Figura 44.1. Promociones registradas con tipo, vencimiento y estado.](assets/capturas/a16-promociones.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **Promoción** | Imagen, nombre y mensaje. |
| **Tipo** | Descuento, 2x1 o Combo. |
| **Vencimiento** | Fecha y hora límite, o *Sin vencimiento*. |
| **Estado** | Activa, Inactiva o Vencida. |
| **Acciones** | Editar, activar/desactivar y eliminar. |

### Crear una promoción

1. Pulsa **Nueva Promoción**.
2. Escribe el **nombre** y el **mensaje**.
3. Elige el **tipo**.
4. Elige un **color de fondo**.
5. Define **fecha y hora de vencimiento** si aplica.
6. Escribe un **enlace** de destino (`/menu` o una URL completa).
7. Sube una **imagen**.
8. Deja **Promoción activa** marcada.
9. Revisa la vista previa y pulsa **Guardar**.

![Figura 44.2. Formulario de promoción con vista previa en vivo.](assets/capturas/a33-nueva-promocion.png)

### Qué pasa después

La promoción aparece como ventana emergente en la portada, según el navegador donde se configure. Los clientes pueden cerrarla; no vuelve a mostrarse en esa sesión.

::: cuida
Las promociones se guardan en el almacenamiento local del navegador donde se crean, no en la base de datos central. Para que las vean todos los clientes en todos los dispositivos, coordina con el equipo técnico la publicación centralizada.
:::

::: consejo
Una promoción con imagen y mensaje corto funciona mejor que un texto largo. Prueba una a la vez y mide el resultado.
:::

## 45. Reportes

### Para qué sirve

Recibe las novedades que envían los baristas desde el inventario: insumos agotados, equipos dañados, situaciones del turno.

### Cómo llegar

Pulsa **Reportes** en el menú lateral.

![Figura 45.1. Reportes de baristas con prioridad y estado de lectura.](assets/capturas/a17-reportes.png)

### Qué ves

| Columna | Contenido |
|---|---|
| **Barista** | Quién envió el reporte. |
| **Mensaje** | Descripción de la novedad. |
| **Prioridad** | Baja, Media o Alta. |
| **Fecha** | Cuándo se envió. |
| **Estado** | Leído o No leído. |
| **Acciones** | Marcar leído, cambiar prioridad, eliminar. |

### Paso a paso

1. Revisa primero los reportes **No leídos** y de prioridad **Alta**.
2. Abre el mensaje completo si está truncado.
3. Marca como leído cuando lo hayas atendido.
4. Cambia la prioridad si la situación empeoró o se resolvió.
5. Elimina el reporte cuando ya no sea útil.

::: cuida
Marcar como leído no resuelve la novedad. Asegúrate de tomar la acción: comprar el insumo, llamar al técnico o ajustar el turno.
:::

::: consejo
Revisa los reportes al inicio y al final del día. Son la forma más directa de enterarte de lo que pasa en la barra.
:::

## 46. Asistente IA

### Para qué sirve

Responde preguntas sobre el negocio usando los datos registrados: ventas, productos, inventario, gastos y pedidos. En esta versión se abre desde el panel del administrador.

### Cómo llegar

Pulsa **Asistente IA** en el menú lateral.

![Figura 46.1. Asistente KAFFA con sugerencias rápidas.](assets/capturas/a18-asistente.png)

### Qué ves

- Encabezado **Asistente IA de Ventas** y estado **En línea**.
- Historial de la conversación.
- Botón **Limpiar** para borrar el historial.
- **Sugerencias rápidas**:
  - ¿Cómo van las ventas de esta semana?
  - Predice las ventas de los próximos 7 días.
  - ¿Qué promoción me recomiendas lanzar?
  - ¿Qué insumos debo reponer?
- Campo de texto y botón de enviar.

### Paso a paso

1. Pulsa una sugerencia o escribe tu pregunta.
2. Espera el indicador de escritura.
3. Lee la respuesta; puede incluir cifras, listas y recomendaciones.
4. Pulsa **Limpiar** si quieres empezar de cero.

![Figura 46.2. Respuesta del asistente con datos del negocio.](assets/capturas/a35-asistente-conversacion.png)

### Qué tipo de preguntas responde bien

- Ventas de la semana, del día o por producto.
- Productos más vendidos y menos vendidos.
- Insumos que están por agotarse.
- Gastos y su efecto en la rentabilidad.
- Ideas de promoción según el comportamiento de venta.
- Predicciones simples basadas en el histórico.

### Qué no hace

- No modifica datos: solo consulta e informa.
- No reemplaza una decisión contable ni fiscal.
- No envía correos ni promociones por sí solo.

::: cuida
Las predicciones son estimaciones basadas en el histórico. Úsalas como orientación, no como una certeza.
:::

::: consejo
Haz preguntas concretas: *“¿cuánto vendí de capuchino esta semana?”* funciona mejor que *“¿cómo va todo?”*.
:::

## 47. Configuración

### Para qué sirve

Define los medios de pago disponibles y consulta los roles del sistema. Es una sección sensible: un cambio aquí afecta a todos los pedidos.

### Cómo llegar

Pulsa **Configuración** en el menú lateral.

![Figura 47.1. Medios de pago y roles del sistema.](assets/capturas/a19-configuracion.png)

### Medios de pago

| Columna | Contenido |
|---|---|
| **Nombre** | Efectivo, Tarjeta, Transferencia, etc. |
| **Virtual** | Sí o No. |
| **Acciones** | Editar y eliminar. |

**Virtual = Sí** significa que ese medio exige comprobante en pedidos, compras y gastos.

#### Crear un medio de pago

1. Pulsa **Nuevo Medio**.
2. Escribe el **nombre**.
3. Marca **Requiere comprobante de pago** si es virtual.
4. Pulsa **Guardar**.

![Figura 47.2. Formulario de nuevo medio de pago.](assets/capturas/a34-nuevo-medio.png)

### Roles del sistema

La tabla **Roles del Sistema** muestra los roles disponibles y su identificador: administrador, barista y cliente. Es de consulta; no se editan desde aquí.

::: cuida
Si marcas un medio como virtual, todos los pagos con ese medio empezarán a exigir comprobante. Avisa al equipo antes de cambiarlo.
:::

::: consejo
Mantén los nombres tal como los usa el personal: *Efectivo*, *Transferencia Bancaria*, *Pago Móvil*. Los nombres raros generan errores al cobrar.
:::

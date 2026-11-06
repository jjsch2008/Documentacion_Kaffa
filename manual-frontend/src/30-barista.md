# Parte III. Panel del barista

## 18. Entrar al panel y entender tu turno

### Para qué sirve

El panel del barista concentra la operación del día: pedidos, inventario, chat y caja. Todo gira alrededor de una regla: **sin turno activo no se puede operar**.

### Cómo llegar

Inicia sesión con una cuenta de barista. El sistema te lleva a `/barista-dashboard/pedidos`.

![Figura 18.1. Encabezado del panel con el turno activo y los minutos restantes.](assets/capturas/b01-tablero.png)

### Qué ves

- **Menú lateral verde**: **Tablero Pedidos**, **Inventario**, **Chat Cliente** (con contador de no leídos), **Caja** y **Cerrar Sesión**.
- **Barra superior**: título de la sección, insignia de turno, botón de tema claro/oscuro y tu perfil.
- **Insignia de turno**:
  - Verde: `TURNO MAÑANA · 150 min` (activo).
  - Gris: `SIN TURNO ACTIVO`.
- En el tablero, un aviso si no tienes turno: *Sin turno activo no puedes cobrar ni cambiar estados*.

### Los tres turnos

| Turno | Horario | Uso típico |
|---|---|---|
| **Mañana** | 07:00 – 13:00 | Apertura y servicio de la mañana |
| **Tarde** | 13:00 – 18:00 | Servicio de la tarde y cierre |
| **Abierto** | 05:00 – 22:00 | Jornada extendida; tiene prioridad si estás asignado |

El administrador crea el turno y te asigna. Tú no puedes crearlo desde el panel del barista.

### Paso a paso para empezar el día

1. Inicia sesión y confirma que la insignia diga **TURNO … · … min**.
2. Revisa el **Tablero Pedidos**: cuántos hay pendientes y en preparación.
3. Abre **Caja** y verifica si ya hay una caja abierta para tu turno.
4. Si no hay caja, ábrela con la base en efectivo y digital (capítulo 26).
5. Revisa **Inventario** para conocer los insumos agotados o bajos.

### Si no tienes turno

- Puedes ver el panel, pero los botones de cobrar, entregar, cancelar y abrir/cerrar caja quedan deshabilitados.
- El servidor también rechaza la operación con el mensaje *No tienes un turno activo para este horario* o *Fuera del horario laboral*.
- Pide al administrador que te asigne el turno correcto para hoy.

::: cuida
La hora se toma de la zona horaria de Colombia (America/Bogota). Si tu computador tiene otra hora, el sistema seguirá usando la hora del servidor.
:::

::: consejo
Mira los minutos restantes de la insignia. Cuando el turno está por terminar, cierra la caja y entrega los pedidos pendientes antes de que el sistema bloquee las acciones.
:::

## 19. El tablero de pedidos

### Para qué sirve

Es la vista principal del barista: un tablero tipo kanban que muestra cada pedido en la etapa en la que está y las acciones disponibles.

### Cómo llegar

Pulsa **Tablero Pedidos** o entra a `/barista-dashboard/pedidos`.

![Figura 19.1. Tablero con las columnas Solicitudes, Pagado/Preparación y Entregados/Cancelados.](assets/capturas/b01-tablero.png)

### Qué ves

Tres columnas:

| Columna | Qué contiene | Acciones |
|---|---|---|
| **Solicitudes (Pendiente)** | Pedidos nuevos sin cobrar o con pago por confirmar. | **COBRAR** o **CONFIRMAR PAGO**; **×** para cancelar. |
| **Pagado / Preparación** | Pedidos cobrados que se están preparando. | **ENTREGAR**; **×** para cancelar. |
| **Entregados / Cancelados** | Historial del turno. | **FACTURA PDF**. |

Cada tarjeta muestra:

- Número de pedido y fecha/hora.
- Cliente o **Mostrador** si no hay cliente.
- Productos con cantidad y nota.
- Total.
- Medio de pago (o *Pago en mostrador*).
- Botones de acción.

En la parte superior están **Registrar Pedido** y, al final de la página, **Descargar Historial**.

### Paso a paso en un turno normal

1. Llega un pedido a **Solicitudes**. Léelo completo, incluidas las notas.
2. Si es efectivo o tarjeta, pulsa **COBRAR**.
3. Si ya tiene un pago virtual, pulsa **CONFIRMAR PAGO** y revisa el comprobante.
4. Al confirmar, el pedido pasa a **Pagado / Preparación**.
5. Prepara el pedido.
6. Cuando lo entregues, pulsa **ENTREGAR**. Pasa a **Entregados / Cancelados**.
7. Si el cliente pide factura, pulsa **FACTURA PDF** en la tarjeta entregada.

### Descargar el historial

El botón **Descargar Historial** genera un PDF con los pedidos **entregados** del turno. Úsalo al final del turno o cuando el administrador lo solicite.

::: consejo
Si hay muchos pedidos, empieza por los más antiguos (los de arriba). La columna muestra el número y la hora para que no se te crucen.
:::

### Si algo sale mal

::: error
**“Sin turno activo no puedes cobrar ni cambiar estados”.** Pide al administrador que te asigne un turno para hoy.
**Un pedido no aparece.** El tablero consulta cada 10 segundos; espera o recarga. Si el cliente acaba de pagar, puede tardar unos segundos.
**El pedido desapareció de Solicitudes.** Alguien lo cobró o lo canceló. Búscalo en **Entregados / Cancelados**.
:::

## 20. Cobrar un pedido

### Para qué sirve

Registra el pago de un pedido y lo pasa a preparación. Puedes cobrar en efectivo, con tarjeta o con un medio virtual que exige comprobante.

### Cómo llegar

En **Solicitudes**, pulsa **COBRAR** (o **CONFIRMAR PAGO** si el cliente ya adjuntó un pago).

![Figura 20.1. Ventana Registrar Pago con medio, monto y comprobante.](assets/capturas/b02-cobrar.png)

### Qué ves

- Encabezado **Registrar Pago** o **Confirmar Pago**.
- **Pedido #N · Total: $…**.
- **Medio de Pago**: lista de medios; los virtuales dicen *(virtual)*.
- **Monto**: viene precargado con el total; puedes ajustarlo si hay pago parcial.
- **Comprobante (imagen del dispositivo)**: aparece cuando el medio es virtual.
- Botones **Cancelar** y **Pasar a preparación**.

### Paso a paso: efectivo o tarjeta

1. Abre el cobro del pedido.
2. Elige **Efectivo**, **Tarjeta de Crédito** o **Tarjeta de Débito**.
3. Verifica que el **Monto** coincida con el total.
4. Pulsa **Pasar a preparación**.
5. El pedido se mueve a la columna central. El inventario ya se descontó al crear el pedido, según la receta de cada producto.

### Paso a paso: pago virtual con comprobante

1. Elige **Transferencia Bancaria**, **Pago Móvil** o **QR (Pago Digital)**.
2. Pulsa el campo de **Comprobante** y selecciona la imagen.
3. Espera la vista previa y revisa que se lea el monto y la operación.
4. Verifica el **Monto**.
5. Pulsa **Pasar a preparación**.

![Figura 20.2. Cobro con un medio virtual: el comprobante es obligatorio.](assets/capturas/b03-cobrar-virtual.png)

### Reglas importantes

- Si el cliente ya pagó desde su cuenta, el pedido llega con un pago registrado. Usa **CONFIRMAR PAGO**, no vuelvas a cobrar.
- La suma de pagos debe cubrir el total. Si falta dinero, el sistema muestra *La suma de pagos no coincide con el total*.
- Un medio virtual **no** se puede cobrar sin comprobante.
- Al confirmar el pago, el pedido pasa a **Pagado · En preparación**.

::: cuida
No confirmes un comprobante borroso o repetido. Si tienes dudas, pide al cliente que lo reenvíe por el chat o que pague en efectivo.
:::

### Si algo sale mal

::: error
**“El comprobante es obligatorio para medios virtuales”.** Sube la imagen o cambia el medio a efectivo.
**El monto no coincide.** Revisa el total del pedido; si el cliente entrega una suma mayor, registra el monto exacto y entrega el cambio por fuera del sistema.
**El botón está deshabilitado.** No tienes turno activo o el pedido ya fue cobrado.
:::

## 21. Entregar, cancelar y facturar

### Para qué sirve

Cierra el ciclo del pedido: marcar que ya se entregó, cancelarlo si no se puede cumplir y generar la factura en PDF.

### Entregar un pedido

1. En **Pagado / Preparación**, revisa que el pedido esté completo.
2. Pulsa **ENTREGAR**.
3. El pedido pasa a **Entregados / Cancelados** y deja de ocupar la columna de trabajo.

### Cancelar un pedido

1. Pulsa el botón **×** en la tarjeta.
2. El sistema pregunta *¿Cancelar el pedido #N?*.
3. Confirma.
4. El pedido pasa a **Cancelado**. Si tenía pago, el administrador gestiona la devolución.

::: cuida
Cancelar no devuelve el dinero automáticamente ni repone el inventario descontado. Si el cliente ya pagó, avisa al administrador para acordar la devolución y el ajuste de stock.
:::

### Generar la factura en PDF

1. En **Entregados / Cancelados**, ubica el pedido.
2. Pulsa **FACTURA PDF**.
3. El navegador descarga un archivo con el número de factura y el detalle.
4. Ábrelo o envíalo al cliente.

La factura incluye el número asignado por el sistema, los productos, el total y los datos del pedido. Es un comprobante interno, no una factura electrónica certificada.

### Si algo sale mal

::: error
**No aparece FACTURA PDF.** Solo está disponible para pedidos entregados. Si el pedido está cancelado o pendiente, primero completa el flujo.
**La descarga no inicia.** Revisa que el navegador no esté bloqueando descargas y vuelve a intentar.
:::

::: consejo
Al final del turno, descarga el **Historial** y guarda las facturas que el administrador te pida. Así el cierre de caja queda respaldado.
:::

## 22. Registrar un pedido de mostrador

### Para qué sirve

Permite crear un pedido cuando el cliente compra directamente en la caja, sin usar su cuenta. Puedes asignarlo a un cliente registrado o dejarlo como **Mostrador**.

### Cómo llegar

En el **Tablero Pedidos**, pulsa **Registrar Pedido**.

![Figura 22.1. Formulario para registrar un pedido de mostrador.](assets/capturas/b04-registrar-pedido.png)

### Qué ves

- **Cliente (opcional)**: lista de clientes o **Sin cliente (mostrador)**.
- **Productos**: selector, cantidad y botón **Agregar producto**.
- **Pagos**: medio de pago, monto y comprobante si es virtual; botón **Agregar pago**.
- **Total del pedido**, calculado automáticamente.
- **Estado inicial**: **Pendiente** o **Pagado**.
- Botones **Cancelar** y **Guardar Pedido**.

### Paso a paso

1. Elige un cliente o deja **Sin cliente (mostrador)**.
2. Selecciona el primer producto y la cantidad.
3. Pulsa **Agregar producto** y repite para cada producto.
4. En **Pagos**, elige el medio y escribe el monto. Si es virtual, sube el comprobante.
5. Revisa el **Total del pedido**.
6. Elige el **Estado inicial**:
   - **Pendiente** si vas a cobrar después.
   - **Pagado** si ya recibiste el dinero.
7. Pulsa **Guardar Pedido**.

### Qué pasa después

El pedido aparece en el tablero, en la columna que corresponde al estado inicial. Si lo creaste como **Pagado**, pasa directo a preparación.

::: cuida
Si eliges **Pagado**, el sistema exige que la suma de pagos coincida con el total. No lo uses como atajo para saltar el cobro.
:::

::: consejo
Para un pedido rápido de mostrador, deja el cliente vacío y escribe el nombre en la nota del producto si necesitas identificarlo.
:::

### Si algo sale mal

::: error
**“La suma de pagos no coincide con el total”.** Ajusta el monto o agrega otro pago hasta cubrir el total.
**No puedo guardar.** Revisa que haya al menos un producto y que el estado **Pagado** tenga su pago.
:::

## 23. Inventario

### Para qué sirve

Muestra el stock de insumos y su estado. El barista **no edita** el inventario: solo consulta y reporta novedades al administrador.

### Cómo llegar

Pulsa **Inventario** o entra a `/barista-dashboard/inventario`.

![Figura 23.1. Inventario con estados Agotado, Bajo y Disponible.](assets/capturas/b05-inventario.png)

### Qué ves

| Columna | Significado |
|---|---|
| **Insumo** | Nombre del insumo. |
| **Unidad** | kg, lt, unidades. |
| **Stock** | Cantidad actual. |
| **Mínimo** | Cantidad a partir de la cual se considera bajo. |
| **Estado** | **Agotado** (rojo), **Bajo** (amarillo) o **Disponible** (verde). |
| **Acción** | Botón **Reportar**. |

La pantalla consulta el inventario cada **15 segundos**.

### Cómo leer los estados

- **Disponible**: hay suficiente para operar.
- **Bajo**: queda poco; conviene reponer pronto.
- **Agotado**: no hay existencia; puede afectar productos.

### Paso a paso

1. Revisa primero los insumos en **Agotado** y **Bajo**.
2. Si un insumo se está acabando, pulsa **Reportar** (capítulo 24).
3. No intentes cambiar el stock desde aquí: las compras y mermas lo actualizan.

::: cuida
El inventario se descuenta cuando se **crea** un pedido, según la receta del producto. Si un producto no tiene receta, el sistema no descuenta insumos.
:::

::: consejo
Revisa el inventario al abrir y al cerrar el turno. Así evitas quedarte sin leche o café en plena hora pico.
:::

### Si algo sale mal

::: error
**El stock no cambia después de una venta.** Puede que el producto no tenga receta configurada. Avisa al administrador.
**Todos los insumos están en cero.** Puede ser un problema de carga; recarga la página y avisa si continúa.
:::

## 24. Reportar una novedad

### Para qué sirve

Envía un aviso al administrador sobre un insumo agotado, un equipo dañado o cualquier situación que afecte el servicio.

### Cómo llegar

En **Inventario**, pulsa **Reportar** en la fila del insumo.

![Figura 24.1. Ventana Reportar Novedad con prioridad baja, media o alta.](assets/capturas/b06-reportar.png)

### Qué ves

- **Barista**: tu nombre (solo lectura).
- **Producto**: insumo seleccionado (puedes cambiarlo).
- **Mensaje**: descripción de la novedad.
- **Prioridad**: **Baja**, **Media** o **Alta**.
- Botones **Cancelar** y **Enviar reporte**.

### Paso a paso

1. Confirma el insumo.
2. Describe qué pasa con datos concretos: *“Quedan 2 botellas de caramelo”*, *“El grifo gotea”*.
3. Elige la prioridad:
   - **Alta**: impide vender o es urgente.
   - **Media**: afecta el servicio pero hay alternativa.
   - **Baja**: informativo.
4. Pulsa **Enviar reporte**.

### Qué pasa después

El reporte aparece en el panel del administrador, en la sección **Reportes**. Allí puede marcarlo como leído, cambiar la prioridad o eliminarlo.

::: consejo
Un buen reporte responde tres preguntas: **qué** pasa, **dónde** y **desde cuándo**. Evita mensajes como “hay un problema”.
:::

### Si algo sale mal

::: error
**No puedo enviar.** Revisa que el mensaje no esté vacío y que tu turno siga activo.
**El reporte no aparece en el panel del administrador.** Puede tardar unos segundos; si no aparece, avísale directamente.
:::

## 25. Chat de clientes

### Para qué sirve

Centraliza las conversaciones con los clientes. Puedes responder dudas, confirmar pagos y avisar cuando un pedido está listo.

### Cómo llegar

Pulsa **Chat Cliente** o entra a `/barista-dashboard/chat`.

![Figura 25.1. Bandeja de conversaciones con contador de no leídos.](assets/capturas/b07-chat.png)

### Qué ves

- **Bandeja izquierda** con los contactos, el último mensaje y un número rojo si hay mensajes sin leer.
- **Conversación** a la derecha con burbujas enviadas y recibidas.
- **Campo de texto** y botón de enviar.
- El contador del menú lateral y de la barra superior.

### Paso a paso

1. Elige una conversación en la bandeja.
2. Lee los mensajes pendientes.
3. Escribe tu respuesta y pulsa enviar.
4. Al abrir la conversación, los mensajes se marcan como leídos.

### Consulta automática

La pantalla busca mensajes nuevos cada **5 segundos**. No necesitas recargar.

::: cuida
No confirmes pagos solo por lo que dice el chat. Verifica siempre el comprobante en la ventana de cobro.
:::

::: consejo
Si un cliente pregunta por su pedido, ten a mano el número y el estado antes de responder. Así das una respuesta útil en un solo mensaje.
:::

### Si algo sale mal

::: error
**No veo la conversación nueva.** Espera 5 segundos o recarga; el contador se actualiza con la misma frecuencia.
**El mensaje no se envía.** Verifica tu sesión y que el texto no esté vacío.
:::

## 26. Caja y arqueo

### Para qué sirve

Controla el dinero del turno: con cuánto se abre, qué ingresos y egresos hay, y con cuánto se cierra. El **arqueo** compara lo esperado con lo contado.

### Cómo llegar

Pulsa **Caja** o entra a `/barista-dashboard/caja`.

![Figura 26.1. Caja abierta del turno con bases, ventas y movimientos.](assets/capturas/b08-caja.png)

### Qué ves cuando la caja está abierta

- **Base Efectivo (apertura)** y **Base Digital (apertura)**.
- **Ventas Sistema (ingresos)**.
- **Esperado en caja (efectivo + digital)**.
- **Efectivo Real contado** y **Digital Real** (aquí escribes).
- Botón **Cerrar Caja**.
- Resumen de movimientos: ingresos por pedidos y egresos por gastos.

### Abrir la caja

1. Si no hay caja abierta, verás **Base en Efectivo** y **Base Digital**.
2. Escribe el dinero con el que empiezas. Si no hay base digital, escribe `0`.
3. Pulsa **Abrir Caja**.

### Cerrar la caja y hacer el arqueo

1. Cuenta el dinero físico y el saldo digital real.
2. Escríbelos en **Efectivo Real contado** y **Digital Real**.
3. Compara con **Esperado en caja**.
4. Pulsa **Cerrar Caja**.
5. El sistema muestra un resumen con el resultado:
   - **Perfecto**: lo contado coincide con lo esperado.
   - **Faltante**: contaste menos.
   - **Sobrante**: contaste más.

![Figura 26.2. Arqueo con los montos contados antes de cerrar.](assets/capturas/b09-arqueo.png)

### Reglas de la caja

- El barista necesita turno activo para abrir y cerrar.
- El administrador puede abrir y cerrar sin turno.
- Los ingresos se generan al cobrar pedidos; los egresos, al registrar compras o gastos.
- No se puede abrir una segunda caja para el mismo turno.

::: cuida
Un faltante o sobrante no se corrige editando la caja. Se documenta y se informa al administrador para revisar los movimientos.
:::

::: consejo
Haz el arqueo con calma y por separado: primero efectivo, luego digital. Si el resultado no es *Perfecto*, revisa los movimientos antes de cerrar.
:::

### Si algo sale mal

::: error
**“No tienes un turno activo”.** Pide al administrador que te asigne el turno o que abra la caja.
**“Ingresa los montos reales contados”.** Escribe ambos valores, aunque uno sea cero.
**La caja ya estaba cerrada.** Consulta el historial en el panel del administrador.
:::

## 27. Tu perfil de barista

### Para qué sirve

Actualiza tu nombre, correo, foto y contraseña. Los cambios se ven en el panel y en los pedidos que atiendes.

### Cómo llegar

Pulsa tu nombre o avatar en la barra superior y elige **Editar Perfil**.

![Figura 27.1. Ventana de perfil del barista.](assets/capturas/b10-perfil.png)

### Paso a paso

1. Pulsa el avatar.
2. Elige **Editar Perfil**.
3. Cambia lo necesario.
4. Si subes una foto, espera la vista previa.
5. Pulsa **Guardar**.

### Cerrar sesión

En el mismo menú, pulsa **Cerrar Sesión** y confirma. Vuelves a la portada pública.

::: cuida
Si cambias tu contraseña, úsala en el próximo inicio de sesión. No la compartas con otros baristas: cada persona debe tener su propia cuenta para que los pedidos queden trazados.
:::

::: consejo
Usa una foto reciente: ayuda a los clientes a identificarte cuando los atiendes.
:::

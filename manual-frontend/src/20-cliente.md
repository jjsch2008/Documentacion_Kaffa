# Parte II. Visitante y cliente

## 7. La portada

### Para qué sirve

La portada presenta la cafetería y lleva al menú. Si ya iniciaste sesión como cliente, además activa el carrito y el acceso a tus pedidos.

### Cómo llegar

Entra a `/` o pulsa **Inicio** en la barra superior.

![Figura 7.1. Portada de KAFFA para un visitante sin sesión.](assets/capturas/p01-portada.png)

### Qué ves

- **Mensaje principal**: *El Arte del Buen Café* y una frase que describe la cafetería.
- **Dos botones**: **Ver Menú** lleva al catálogo; **Conocer más** lleva a *Sobre Nosotros*.
- **Nuestros Favoritos**: una selección de productos con precio y botón **Comprar**.
- **Pasión por el Café Artesanal**: historia breve y enlace a la sección completa.
- **Pie de página**: horarios, contacto y enlaces rápidos.

![Figura 7.2. Sección de productos destacados de la portada.](assets/capturas/p02-portada-favoritos.png)

### Paso a paso

1. Lee la portada o pulsa **Ver Menú** si ya sabes qué quieres.
2. Baja hasta **Nuestros Favoritos** para ver los productos destacados.
3. Pulsa **Comprar** en un producto:
   - Si no tienes sesión, el sistema te lleva a **Iniciar Sesión**.
   - Si ya iniciaste sesión, se abre la ficha del producto.

![Figura 7.3. Portada con la sesión de un cliente iniciada: aparece el saludo y el carrito.](assets/capturas/c01-home-cliente.png)

### Qué cambia cuando inicias sesión

- El botón **Registrarse** desaparece.
- Aparece **Hola, tu nombre** y el icono del carrito con un número cuando tiene productos.
- El menú de tu cuenta incluye **Mi Perfil**, **Mis Pedidos**, **Chat Barista** y **Cerrar Sesión**.

### Si algo sale mal

::: error
**El botón Comprar me manda a Iniciar Sesión.** Es el comportamiento normal para visitantes. Inicia sesión o crea una cuenta.
**Los productos aparecen sin imagen.** Puede ser un problema temporal de la imagen externa. El precio y el botón siguen funcionando.
:::

::: consejo
Los productos marcados como favoritos cambian según el catálogo activo. Si acabas de crear un producto en el panel, aparece en el menú; la portada muestra los primeros productos disponibles.
:::

## 8. El menú y los filtros

### Para qué sirve

El menú es el catálogo completo. Desde aquí eliges productos, filtras por categoría y empiezas una compra.

### Cómo llegar

Pulsa **Menú** o entra a `/menu`.

![Figura 8.1. Menú completo con los filtros por categoría.](assets/capturas/p03-menu.png)

### Qué ves

- **Filtros**: **Todos**, **Snacks**, **Postres** y **Cafés**. La categoría activa se resalta en verde.
- **Tarjetas de producto**: imagen, nombre, descripción corta, precio y botón **Comprar**.
- **Barra superior**: carrito y menú de cuenta si tienes sesión.

### Paso a paso

1. Pulsa una categoría para reducir la lista. Vuelve a **Todos** para ver todo.
2. Revisa el precio debajo de cada producto.
3. Pulsa **Comprar** en el producto que quieras.

![Figura 8.2. Menú filtrado por la categoría Cafés.](assets/capturas/p04-menu-filtro.png)

### Qué pasa después

Se abre la **ficha del producto** (capítulo 9), donde eliges cantidad y notas antes de agregarlo al carrito.

### En el celular

La barra de filtros se desplaza en horizontal y las tarjetas se apilan una debajo de otra. El botón del carrito sigue visible arriba.

![Figura 8.3. Menú en un teléfono: una tarjeta por fila.](assets/capturas/c10-menu-movil.png)

### Si algo sale mal

::: error
**“Sin productos en esta categoría”.** Esa categoría no tiene productos activos. Prueba con **Todos** o avisa al administrador.
**No veo un producto que acabo de crear.** Revisa que esté marcado como **Visible en el menú** en el panel de administración y que tenga una categoría asignada.
:::

::: consejo
Si el menú muestra productos de ejemplo y no los de la cafetería, significa que la aplicación no pudo leer el catálogo del servidor. Recarga la página; si continúa, avisa al administrador.
:::

## 9. La ficha del producto

### Para qué sirve

Aquí defines **cuántas unidades** quieres y dejas una **nota para el barista** antes de agregar el producto al carrito.

### Cómo llegar

En el **Menú**, pulsa **Comprar** en cualquier producto con la sesión de cliente iniciada.

![Figura 9.1. Ficha de producto con cantidad, nota y total calculado.](assets/capturas/c03-detalle-producto.png)

### Qué ves

- **Imagen** del producto.
- **Nombre** y **descripción**.
- **Precio unitario**.
- **Cantidad** con los botones **−** y **+**.
- **Notas para el barista (opcional)**: por ejemplo *sin azúcar*, *poco hielo*, *leche deslactosada*.
- **Total** de la línea, que se actualiza al cambiar la cantidad.
- Botón **Agregar al Carrito**.

### Paso a paso

1. Ajusta la cantidad con **+** o **−**. El mínimo es 1.
2. Si necesitas algo especial, escríbelo en **Notas para el barista**. Sé breve y claro.
3. Revisa el total de la línea.
4. Pulsa **Agregar al Carrito**.
5. El producto desaparece de la ficha y se suma al carrito.

### Qué pasa después

El icono del carrito muestra un número. Puedes seguir comprando o abrir el carrito para revisar y pagar.

::: cuida
La nota es una instrucción para el barista, no un cambio de precio. Si pides un ingrediente extra que tiene costo, el barista debe ajustarlo en mostrador.
:::

### Si algo sale mal

::: error
**El botón Agregar no responde.** Verifica que la cantidad sea mayor que cero. Si sigue igual, cierra la ventana con la **×** y vuelve a abrir el producto.
**El total no coincide con el precio.** Multiplica el precio por la cantidad: si el precio es $8.000 y pides 2, el total debe ser $16.000.
:::

## 10. El carrito

### Para qué sirve

El carrito reúne todo lo que quieres pedir antes de pagar. Puedes cambiar cantidades, eliminar líneas y ver el total.

### Cómo llegar

Pulsa el icono del **carrito** en la barra superior, junto a tu nombre.

![Figura 10.1. Carrito con un producto, control de cantidad y total.](assets/capturas/c04-carrito.png)

### Qué ves

- Lista de productos con **nombre**, **precio**, **cantidad** y **nota**.
- Botones **−** y **+** para cambiar la cantidad.
- Icono de basura para eliminar una línea.
- **Total** del pedido.
- Botón **Confirmar Pedido**.

### Paso a paso

1. Revisa que cada producto y cada nota sean correctos.
2. Cambia la cantidad con **+** o **−** si hace falta.
3. Elimina una línea con el icono de basura si no la quieres.
4. Comprueba el **total**.
5. Pulsa **Confirmar Pedido** para pasar al pago.

### Reglas del carrito

- El carrito se guarda en el navegador: si recargas la página, no se pierde.
- Al cerrar sesión, el carrito se vacía.
- Los productos de ejemplo (cuando el servidor no responde) no se pueden comprar; el sistema muestra un aviso.

::: consejo
Si vas a pedir varios productos iguales con notas distintas, agrégalos por separado. Así el barista ve cada nota en su propia línea.
:::

### Si algo sale mal

::: error
**“Carrito vacío”.** Agrega al menos un producto antes de confirmar.
**El total cambió solo.** Es normal si modificaste una cantidad o eliminaste una línea. Vuelve a revisar antes de pagar.
:::

## 11. Pagar el pedido

### Para qué sirve

Eliges cómo pagar. KAFFA permite **pagar en efectivo en mostrador** o **pagar de inmediato** con un medio virtual y adjuntar el comprobante.

### Cómo llegar

En el carrito, pulsa **Confirmar Pedido**.

![Figura 11.1. Ventana Método de Pago con la opción de efectivo seleccionada.](assets/capturas/c05-pago.png)

### Qué ves

- **¿Cómo pagas?** con dos opciones: **Efectivo en mostrador** y **Pagar ya (transferencia)**.
- **Medio de Pago**: lista de medios configurados.
- **Comprobante** (solo aparece si el medio es virtual).
- Botón **Finalizar Pedido**.

### Opción A: pagar en efectivo en mostrador

1. Deja seleccionado **Efectivo en mostrador**.
2. Pulsa **Finalizar Pedido**.
3. El pedido se crea en estado **Pendiente**.
4. El barista lo cobra cuando llegues a la caja.

### Opción B: pagar ya con un medio virtual

1. Pulsa **Pagar ya (transferencia)**.
2. En **Medio de Pago**, elige **Transferencia Bancaria**, **Pago Móvil** o **QR (Pago Digital)**.
3. Pulsa **Subir comprobante** y elige la captura del pago desde tu dispositivo.
4. Espera a que termine la barra de progreso y verifica la vista previa.
5. Pulsa **Finalizar Pedido**.

![Figura 11.2. Pago virtual: medio seleccionado y campo de comprobante obligatorio.](assets/capturas/c06-pago-virtual.png)

### Qué pasa después

- El sistema crea el pedido y te lleva a **Mis Pedidos**.
- Verás un aviso: *Pedido enviado al barista*.
- El pedido aparece como **Pendiente** hasta que el barista confirme el pago. En pagos virtuales, el barista revisa el comprobante antes de pasarlo a **Pagado · En preparación**.

::: cuida
El comprobante debe verse completo: monto, fecha y número de operación. Si la imagen está borrosa, el barista puede rechazarla y pedirte otra.
:::

### Si algo sale mal

::: error
**“Sube el comprobante (URL) para pagos virtuales”.** Elegiste un medio virtual pero no adjuntaste imagen. Sube el archivo o cambia a efectivo.
**“La suma de pagos no coincide con el total”.** Ocurre cuando el monto del pago no cubre el total. Vuelve a intentarlo desde el carrito.
**“Stock insuficiente para el insumo…”.** Alguno de los productos no tiene materia prima suficiente. Elige otro producto o avisa al barista.
**La imagen no sube.** Revisa que sea JPG, PNG, WebP o AVIF y que pese menos de 5 MB.
:::

::: consejo
Si pagaste por transferencia y el barista aún no confirma, puedes escribirle por **Chat Barista** y adjuntar el número de operación como texto.
:::

## 12. Mis pedidos

### Para qué sirve

Es tu historial. Muestra el estado de cada pedido, los productos, el medio de pago, el total y el número de factura cuando existe.

### Cómo llegar

Abre el menú de tu cuenta y pulsa **Mis Pedidos**, o entra a `/pedidos`.

![Figura 12.1. Historial de pedidos de un cliente con los cuatro estados posibles.](assets/capturas/c07-mis-pedidos.png)

### Qué ves

Cada pedido es una tarjeta con:

- **Número** del pedido, por ejemplo `#2`.
- **Estado** con color: Pendiente (naranja), Pagado · En preparación (azul), Entregado (verde) o Cancelado (rojo).
- **Productos** con cantidad y nota.
- **Medio de pago** o *Pago en mostrador*.
- **Total**.
- **Número de factura** cuando el pedido ya fue facturado.

### Qué significa cada estado

| Estado | Significado | Qué debes hacer |
|---|---|---|
| **Pendiente** | El pedido llegó, pero aún no se ha cobrado. | Acércate a caja o espera al barista. |
| **Pagado · En preparación** | El pago se confirmó y el pedido se está preparando. | Espera tu turno. |
| **Entregado** | Ya recibiste el pedido. | Nada; queda en el historial. |
| **Cancelado** | El pedido no se realizó. | Consulta con el barista si tienes dudas. |

### Actualización automática

La pantalla consulta el estado cada **10 segundos**. No necesitas recargar: si el barista cambia el estado, la tarjeta se actualiza sola.

::: consejo
El número de factura sirve para reclamar o consultar. Anótalo si necesitas soporte.
:::

### Si algo sale mal

::: error
**No aparece un pedido reciente.** Espera 10 segundos o recarga. Si pagaste en efectivo y nunca llegó, revisa que hayas pulsado **Finalizar Pedido**.
**El pedido sigue en Pendiente después de pagar.** El barista debe confirmar el comprobante. Escríbele por el chat.
:::

## 13. Chat con el barista

### Para qué sirve

Es un canal directo para preguntar por tu pedido, el menú o una novedad. Los mensajes quedan guardados en tu cuenta.

### Cómo llegar

Abre el menú de tu cuenta y pulsa **Chat Barista**, o entra a `/chat`.

![Figura 13.1. Conversación del cliente con el equipo de KAFFA.](assets/capturas/c08-chat-cliente.png)

### Qué ves

- **Encabezado** con el nombre de la persona que atiende y el estado **En línea**.
- **Burbujas verdes** a la derecha: tus mensajes.
- **Burbujas blancas** a la izquierda: respuestas del equipo.
- **Hora** de cada mensaje.
- **Campo de texto** y botón de enviar.

### Paso a paso

1. Escribe tu mensaje en el campo inferior.
2. Pulsa el botón con el icono de enviar.
3. Espera la respuesta; la pantalla consulta mensajes nuevos cada **5 segundos**.
4. Si el equipo no responde, revisa el horario de atención.

### Qué pasa después

El mensaje queda en el historial. Cuando el equipo responde, verás la burbuja nueva sin recargar. En la barra superior, el icono de chat muestra un número con los mensajes no leídos.

::: cuida
No compartas contraseñas, datos de tarjetas ni información sensible por el chat. Para pagos, usa siempre la ventana de pago y sube el comprobante.
:::

### Si algo sale mal

::: error
**No puedo enviar.** Verifica que el mensaje no esté vacío y que tu sesión siga activa. Si aparece un error de sesión, vuelve a iniciar sesión.
**No veo mensajes nuevos.** Espera 5 segundos; si sigue igual, recarga la página.
:::

## 14. Eventos

### Para qué sirve

Muestra las actividades programadas de la cafetería: ferias, talleres, música en vivo. La información la publica el administrador.

### Cómo llegar

Pulsa **Eventos** o entra a `/eventos`.

![Figura 14.1. Próximos eventos publicados por el administrador.](assets/capturas/p05-eventos.png)

### Qué ves

- **Próximos Eventos** como título.
- Una **tarjeta por evento** con imagen, fecha, hora, lugar y descripción.
- Los eventos se ordenan por fecha.

### Paso a paso

1. Revisa la fecha y la hora de cada tarjeta.
2. Lee la descripción para saber si necesitas inscripción.
3. Si quieres asistir, usa los datos de **Contacto** o pregunta por el chat.

::: consejo
Los eventos se publican desde el panel de administración. Si un evento cambia de fecha, la página se actualiza cuando el administrador guarda el cambio.
:::

### Si algo sale mal

::: error
**No aparece ningún evento.** Puede que no haya eventos publicados o que todos hayan pasado. Revisa más tarde.
**Un evento tiene la fecha equivocada.** Avisa al administrador; solo él puede editarlo.
:::

## 15. Sobre nosotros y el equipo del turno

### Para qué sirve

Cuenta la historia de KAFFA y muestra **quién está trabajando** según la fecha y el turno. Es útil para saber con quién hablas o quién te atiende.

### Cómo llegar

Pulsa **Sobre Nosotros** o entra a `/sobre-nosotros`.

![Figura 15.1. Sección Nuestro Equipo con el selector de fecha y turno.](assets/capturas/p06-sobre-nosotros.png)

### Qué ves

- **Nuestra Historia**, **Misión, Visión y Valores** y **La Experiencia KAFFA**.
- **Nuestro Equipo** con tres botones: **Mañana**, **Tarde** y **Abierto**.
- Tarjetas con la foto, el nombre y el rol de cada persona asignada.

### Paso a paso

1. Baja hasta **Nuestro Equipo**.
2. Elige el turno que te interesa: **Mañana** (07:00–13:00), **Tarde** (13:00–18:00) o **Abierto** (05:00–22:00).
3. Observa las tarjetas: la administradora y los baristas asignados a ese turno.
4. Si no hay nadie asignado, la sección lo indica.

### Qué pasa después

La lista cambia según los turnos creados por el administrador. No necesitas recargar si cambias de turno: la información se consulta al seleccionar.

::: consejo
Si vas a visitar la cafetería y quieres hablar con una persona específica, revisa primero el turno en esta sección.
:::

### Si algo sale mal

::: error
**El turno aparece vacío.** No hay baristas asignados a ese turno para la fecha seleccionada. Prueba otro turno.
**El equipo no cambia al elegir otro turno.** Revisa que el administrador haya asignado baristas a ese turno para hoy.
:::

## 16. Contacto

### Para qué sirve

Reúne la dirección, el teléfono, el correo, el horario y las redes sociales de la cafetería.

### Cómo llegar

Pulsa **Contacto** o entra a `/contacto`.

![Figura 16.1. Página de contacto con dirección, teléfono, correo y horario.](assets/capturas/p07-contacto.png)

### Qué ves

- **Dirección** completa.
- **Teléfono** y **Email**.
- **Horario** de lunes a viernes y sábados.
- **Síguenos en redes** con los botones de Facebook, Instagram y TikTok.
- Un espacio reservado para el **mapa de ubicación**.

### Paso a paso

1. Revisa el horario antes de desplazarte.
2. Usa el teléfono o el correo para una consulta directa.
3. Pulsa un icono de red social para abrir el perfil de KAFFA.

::: cuida
Los horarios y el teléfono los actualiza el administrador en el código del sitio. Si encuentras un dato desactualizado, avísale.
:::

### Si algo sale mal

::: error
**El mapa no muestra la ubicación.** Es un espacio reservado; usa la dirección escrita y el teléfono.
**El correo rebota.** Verifica que hayas copiado la dirección completa o usa el chat de la aplicación.
:::

## 17. Promociones y avisos

### Para qué sirve

Las promociones son avisos emergentes con descuentos, 2x1 o combos. El administrador las crea y programa su vencimiento.

### Cómo llegar

Se muestran automáticamente al entrar a la **portada**, si hay promociones activas y vigentes.

![Figura 17.1. Aviso emergente con una promoción activa.](assets/capturas/p08-promocion-popup.png)

### Qué ves

- Una **ventana emergente** sobre la portada, con imagen, nombre, mensaje y botón de acción.
- Puntos o flechas para pasar a la siguiente promoción.
- Botón **×** para cerrar.
- Si hay varias, se alternan automáticamente cada pocos segundos.

### Paso a paso

1. Lee la promoción.
2. Pulsa el botón de la promoción si quieres ir al menú o al enlace indicado.
3. Ciérrala con **×** si no te interesa.
4. Una vez cerrada, no vuelve a aparecer en esa sesión del navegador.

::: consejo
Las promociones vencidas dejan de mostrarse automáticamente. Si ves una que ya expiró, avisa al administrador para que la desactive.
:::

### Si algo sale mal

::: error
**La ventana no se cierra.** Pulsa la **×** de la esquina o recarga la página.
**La promoción tapa el menú.** Ciérrala; no bloquea la navegación.
:::

# Parte V. Comportamientos comunes y ayuda

## 48. Tema, notificaciones y mensajes del sistema

### Para qué sirve

Esta parte explica los comportamientos que aparecen en todas las pantallas, sin importar tu rol: el tema, los avisos, los estados vacíos y la forma en que el sistema te informa.

### El tema claro y oscuro

- En los paneles de barista y administrador, el botón de sol/luna de la barra superior cambia el tema.
- La preferencia se guarda en el navegador y se mantiene al recargar.
- En el sitio público, el tema sigue el diseño claro de la marca.

![Figura 48.1. Panel de administración con el tema oscuro.](assets/capturas/a36-tema-oscuro.png)

### Las notificaciones (toasts)

Son los mensajes pequeños que aparecen en la esquina superior derecha. Desaparecen solos y se pueden cerrar.

| Tipo | Color | Ejemplo |
|---|---|---|
| Éxito | Verde | *Bienvenido Juan* |
| Error | Rojo | *Credenciales inválidas* |
| Información | Claro | *Pedido enviado al barista* |

### Los diálogos de confirmación

Cuando el sistema pregunta *¿Eliminar…?* o *¿Salir del sistema?*, espera una confirmación. Si pulsas **Cancelar**, no pasa nada. Si aceptas, la acción se ejecuta y **no se puede deshacer**.

### Los estados vacíos

Cuando no hay datos, verás un mensaje en lugar de una tabla:

- *Sin pedidos todavía. ¡Armá tu carrito y ordená!*
- *Sin conversaciones aún.*
- *Aún no hay promociones…*

No son errores: significan que todavía no hay información registrada.

### La actualización automática

Varias pantallas consultan datos cada cierto tiempo:

| Pantalla | Frecuencia |
|---|---|
| Pedidos del cliente y del barista | 10 segundos |
| Chat y mensajes no leídos | 5 segundos |
| Inventario del barista | 15 segundos |
| Caja del barista | 30 segundos |
| Turno activo | 60 segundos |

No necesitas recargar. Si un dato no cambia después de ese tiempo, revisa tu conexión.

::: consejo
Si vas a mostrar la aplicación en una pantalla grande, usa el tema claro y oculta las notificaciones ya leídas. La información se lee mejor.
:::

::: cuida
No cierres la pestaña mientras se está guardando un formulario (el botón dice *Guardando…*). Puedes perder el cambio.
:::

## 49. Tablas, filtros y formularios

### Para qué sirve

Casi todas las secciones del panel usan el mismo patrón: una tabla, un botón para crear, acciones por fila y un formulario en ventana emergente. Si aprendes uno, aprendes todos.

### Anatomía de una tabla

1. **Encabezados**: nombre de cada columna.
2. **Filas**: un registro por fila.
3. **Acciones**: iconos a la derecha.
   - 👁 Ojo: ver detalle.
   - ✏️ Lápiz: editar.
   - 🗑 Basura: eliminar.
4. **Estado vacío**: mensaje cuando no hay registros.

### Los formularios

- Los campos obligatorios suelen marcarse con un asterisco o se validan al guardar.
- Los botones **Cancelar** y **Guardar** están siempre al final.
- Si hay un error, el formulario no se cierra y muestra el mensaje.
- Los campos de imagen muestran una vista previa y una barra de progreso.

### Reglas de validación frecuentes

| Campo | Regla |
|---|---|
| Correo | Debe tener formato `texto@dominio.com`. |
| Contraseña | Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo. |
| Precio, monto, cantidad | Números mayores que cero. |
| Fecha | Formato día/mes/año; la fecha fin no puede ser anterior a la inicial. |
| Imagen | JPG, PNG, WebP o AVIF; máximo 5 MB. |
| Comprobante | Obligatorio si el medio de pago es virtual. |

### Cómo buscar en una tabla

La mayoría de tablas no tienen buscador propio. Usa `Ctrl + F` en el navegador para encontrar un texto visible, o el **buscador del manual** si estás consultando esta guía.

::: consejo
Antes de crear un registro, revisa si ya existe. Duplicar un producto o un proveedor complica los reportes.
:::

::: error
**El botón Guardar no hace nada.** Revisa los campos resaltados en rojo y el mensaje de validación. Si no ves ninguno, desplázate dentro de la ventana: puede haber un campo obligatorio más abajo.
:::

## 50. Imágenes y comprobantes

### Para qué sirve

KAFFA usa imágenes en productos, eventos, promociones, perfiles y comprobantes de pago. Todas se suben desde tu dispositivo y se almacenan en un servicio externo (Cloudinary).

### Dónde se suben imágenes

| Pantalla | Imagen |
|---|---|
| Productos | Foto del producto |
| Eventos | Hasta 5 imágenes; la primera es portada |
| Promociones | Imagen del aviso |
| Baristas y perfil | Foto de la persona |
| Pago virtual | Comprobante |
| Compras y gastos | Comprobante del pago |

### Cómo subir una imagen

1. Pulsa el botón **Subir** o el área de carga.
2. Elige un archivo de tu dispositivo.
3. Espera la barra de progreso.
4. Verifica la vista previa.
5. Guarda el formulario.

### Requisitos

- Formatos: **JPG, PNG, WebP o AVIF**.
- Tamaño máximo: **5 MB**.
- Para comprobantes, la imagen debe ser legible: monto, fecha y número de operación.

![Figura 50.1. Ejemplo de comprobante adjunto en un pago virtual.](assets/capturas/c06-pago-virtual.png)

::: cuida
No subas capturas con datos sensibles innecesarios (número completo de tarjeta, claves). Para un comprobante basta el monto, la fecha y la referencia.
:::

::: consejo
Si la imagen pesa demasiado, recórtala o redúcela antes de subirla. Una foto de 12 MP no aporta nada a un comprobante.
:::

### Si la imagen no sube

::: error
**“Formato no permitido”.** Convierte la imagen a JPG o PNG.
**“El archivo supera 5 MB”.** Redúcela o toma una captura de pantalla.
**La barra se queda en 0 %.** Revisa la conexión y vuelve a intentar; si persiste, usa otra red.
:::

## 51. Errores frecuentes y cómo resolverlos

### Para qué sirve

Reúne los mensajes que más aparecen y su solución. Si tu problema no está aquí, consulta el capítulo del rol correspondiente.

### Errores de acceso

| Mensaje | Causa | Solución |
|---|---|---|
| *Credenciales inválidas* | Correo o contraseña incorrectos. | Revisa mayúsculas y espacios; usa recuperar contraseña. |
| *Debes verificar tu correo* | La cuenta no completó el código. | Entra a `/verify-email` y verifica. |
| *Demasiados intentos* | Bloqueo temporal por seguridad. | Espera 60 segundos. |
| *No tienes permiso para acceder* | El rol no corresponde a la ruta. | Cierra sesión y entra con la cuenta correcta. |
| *Tu sesión expiró* | El token dejó de ser válido. | Vuelve a iniciar sesión. |

![Figura 51.1. Aviso de credenciales inválidas en el inicio de sesión.](assets/capturas/p10-login-error.png)

### Errores de turno y caja

| Mensaje | Causa | Solución |
|---|---|---|
| *No tienes un turno activo para este horario* | No hay turno asignado o la hora no coincide. | Pide al administrador que asigne el turno. |
| *Fuera del horario laboral* | Estás fuera de 07:00–18:00 (o 05:00–22:00 en abierto). | Opera en el horario o pide un turno abierto. |
| *Tu turno ha expirado* | Se acabó el tiempo del turno. | Cierra la caja y avisa al administrador. |
| *Ingresa los montos reales contados* | Faltan los valores del arqueo. | Escribe efectivo y digital, aunque sea cero. |

### Errores de pagos

| Mensaje | Causa | Solución |
|---|---|---|
| *La suma de pagos no coincide con el total* | El monto no cubre el pedido. | Ajusta el monto o agrega otro pago. |
| *Un pedido pagado debe tener al menos un pago* | Se marcó Pagado sin registrar pago. | Agrega el pago o deja Pendiente. |
| *El comprobante es obligatorio para medios virtuales* | Medio virtual sin imagen. | Sube el comprobante o usa efectivo. |

### Errores de datos

| Mensaje | Causa | Solución |
|---|---|---|
| *No se puede eliminar… tiene registros asociados* | El registro está en uso. | Desactívalo en lugar de eliminarlo. |
| *El correo ya está registrado* | Ya existe una cuenta. | Inicia sesión o recupera la contraseña. |
| *Sin productos en esta categoría* | Categoría vacía. | Asigna productos o elige otra. |

::: consejo
Antes de escribir al soporte, anota **qué estabas haciendo**, **el mensaje exacto** y **la hora**. Eso acelera cualquier solución.
:::

::: cuida
No recargues repetidamente ni envíes el mismo formulario varias veces. Puedes duplicar pedidos, compras o gastos.
:::

## 52. Preguntas frecuentes

### ¿Necesito instalar algo?

No. KAFFA funciona en el navegador. Se recomienda Chrome, Edge o Firefox actualizados.

### ¿Puedo usar la aplicación en el celular?

Sí. El sitio público y el panel del administrador se adaptan a pantallas pequeñas. El panel del barista está pensado para escritorio o tablet; en un teléfono el menú lateral puede ocupar buena parte de la pantalla.

### ¿Por qué el cliente no ve su pedido?

Porque el pedido no se creó o porque se creó con otra cuenta. Verifica en **Pedidos** del administrador, por número o por cliente.

### ¿Por qué un pedido sigue Pendiente si ya pagué?

El barista debe confirmar el pago. En medios virtuales, primero revisa el comprobante. Escríbele por el chat.

### ¿Dónde descargo mi factura?

El barista genera el PDF desde el tablero (**FACTURA PDF**). El cliente ve el número de factura en **Mis Pedidos**; si necesita el archivo, puede pedirlo por el chat.

### ¿Puedo cambiar mi correo?

Sí, desde **Mi Perfil**. Si lo cambias, usa el nuevo correo en el próximo inicio de sesión.

### ¿Qué pasa si dos baristas usan la misma cuenta?

Los pedidos, cajas y reportes quedan a nombre de la misma persona. No es recomendable: se pierde la trazabilidad.

### ¿Los datos son reales?

En este manual, no: las capturas usan datos de demostración. En tu instalación, los datos son los que registre tu equipo.

### ¿Puedo recuperar un registro eliminado?

No desde la interfaz. Las eliminaciones son definitivas. Si fue un error, contacta al soporte técnico para revisar la base de datos.

### ¿Cada cuánto debo cambiar la contraseña?

Cada 90 días es una buena práctica, y siempre que alguien deje el equipo o sospeches un acceso indebido.

## 53. Checklist diario y autoevaluación

### Checklist de apertura

- [ ] Iniciar sesión con la cuenta correcta.
- [ ] Confirmar el turno activo y los minutos restantes.
- [ ] Revisar pedidos pendientes del día anterior.
- [ ] Abrir la caja con la base en efectivo y digital.
- [ ] Revisar inventario: agotados y bajos.
- [ ] Reportar novedades al administrador.
- [ ] Verificar que el menú y los precios estén correctos.

### Checklist durante el servicio

- [ ] Leer las notas de cada pedido antes de prepararlo.
- [ ] Confirmar el pago antes de pasar a preparación.
- [ ] Verificar el comprobante en pagos virtuales.
- [ ] Entregar y marcar el pedido como **Entregado**.
- [ ] Responder el chat dentro del turno.
- [ ] Registrar mermas en el momento.

### Checklist de cierre

- [ ] Entregar o cancelar todos los pedidos abiertos.
- [ ] Contar efectivo y digital.
- [ ] Cerrar la caja y revisar el resultado del arqueo.
- [ ] Descargar el historial del turno.
- [ ] Generar las facturas pendientes.
- [ ] Cerrar sesión.

### Autoevaluación

Responde sin mirar. Al final verás tu puntuación.

::: quiz
¿Qué necesita un barista para cobrar un pedido?|Un turno activo|Solo iniciar sesión|Ser administrador|0|El sistema bloquea cobros y caja sin turno activo.
¿Qué medio de pago exige comprobante?|Transferencia bancaria|Efectivo|Tarjeta de débito|0|Los medios virtuales exigen comprobante.
¿Cuál es el estado correcto después de confirmar el pago?|Pagado · En preparación|Pendiente|Cancelado|0|Al confirmar el pago, el pedido pasa a preparación.
¿Dónde se registra una pérdida de leche vencida?|Mermas|Compras|Gastos|0|Las mermas descuentan stock y explican el motivo.
¿Qué hace el botón Exportar CSV?|Descarga la lista de pedidos|Envía un correo|Cierra la caja|0|Genera un archivo para abrir en una hoja de cálculo.
¿Qué rol ve el panel de 19 secciones?|Administrador|Barista|Cliente|0|El administrador tiene el panel completo.
¿Qué pasa si eliminas una compra?|Se revierte el stock|Se duplica el stock|No pasa nada|0|Eliminar una compra revierte el movimiento de inventario.
¿Dónde se cambia el tema claro/oscuro?|En la barra superior del panel|En el menú del navegador|En Mis Pedidos|0|El botón de sol/luna está en la barra superior.
:::

### Cómo calcular tu resultado

- **7–8 correctas**: dominas lo esencial. Puedes usar el manual como referencia.
- **5–6 correctas**: repasa las partes de tu rol y vuelve a intentarlo.
- **Menos de 5**: lee de nuevo las partes I y II antes de operar el sistema.

---

# Anexos

## Anexo A. Mapa de rutas

| Ruta | Rol | Pantalla |
|---|---|---|
| `/` | Público | Portada |
| `/menu` | Público | Menú |
| `/eventos` | Público | Eventos |
| `/sobre-nosotros` | Público | Historia y equipo |
| `/contacto` | Público | Contacto |
| `/login` | Público | Iniciar sesión |
| `/registro` | Público | Crear cuenta |
| `/forgot-password` | Público | Recuperar contraseña |
| `/reset-password` | Público | Nueva contraseña |
| `/verify-email` | Público | Verificar correo |
| `/pedidos` | Cliente | Mis pedidos |
| `/chat` | Cliente | Chat con el barista |
| `/barista-dashboard/pedidos` | Barista | Tablero de pedidos |
| `/barista-dashboard/inventario` | Barista | Inventario |
| `/barista-dashboard/chat` | Barista | Chat de clientes |
| `/barista-dashboard/caja` | Barista | Caja |
| `/admin-dashboard` | Administrador | Panel de 19 secciones |

## Anexo B. Matriz de permisos

| Acción | Visitante | Cliente | Barista | Administrador |
|---|---|---|---|---|
| Ver menú y eventos | Sí | Sí | Sí | Sí |
| Crear pedido | No | Sí | Sí (mostrador) | No |
| Ver sus propios pedidos | No | Sí | No | Todos |
| Ver todos los pedidos | No | No | Turno actual | Sí |
| Cobrar | No | No | Con turno | Sí |
| Cambiar estado | No | No | Con turno | Sí |
| Inventario (consultar) | No | No | Sí | Sí |
| Inventario (editar) | No | No | No | Sí |
| Caja | No | No | Con turno | Sí |
| Productos y categorías | No | No | No | Sí |
| Compras, proveedores, gastos | No | No | No | Sí |
| Clientes, baristas, turnos | No | No | No | Sí |
| Eventos y promociones | No | No | No | Sí |
| Reportes | No | No | Enviar | Gestionar |
| Asistente IA | No | No | No | Sí |

## Anexo C. Campos de cada formulario

| Formulario | Campos |
|---|---|
| Registro | Nombre, correo, contraseña, confirmar contraseña, términos |
| Producto | Nombre, descripción, imagen, precio, categoría, visible |
| Categoría | Nombre |
| Insumo | Nombre, unidad, stock actual, stock mínimo, activo |
| Merma | Insumo, cantidad, motivo |
| Compra | Proveedor, N° factura, fecha, total, detalles, pagos |
| Proveedor | NIT, nombre, teléfono, correo, dirección, activo |
| Gasto | Descripción, categoría, pagos |
| Caja (abrir) | Monto de apertura |
| Cliente | Nombre, correo, activo |
| Barista | Nombre, correo, foto, contraseña, activo |
| Turno | Fecha, fecha fin, tipo, baristas |
| Evento | Título, lugar, fecha, hora, descripción, imágenes (máx. 5), publicar |
| Promoción | Nombre, mensaje, tipo, color, vencimiento, enlace, imagen, activa |
| Medio de pago | Nombre, requiere comprobante |
| Pedido de mostrador | Cliente, productos, pagos, estado inicial |

## Anexo D. Índice de figuras

| Figura | Pantalla |
|---|---|
| 1.1 – 1.3 | Portada y favoritos |
| 2.1 | Registro |
| 3.1 | Verificación de correo |
| 4.1 – 4.2 | Inicio de sesión y error |
| 5.1 | Recuperación de contraseña |
| 6.1 – 6.2 | Perfil y tema oscuro |
| 7.x | Portada y sesión de cliente |
| 8.x | Menú, filtros y móvil |
| 9.1 | Ficha de producto |
| 10.1 | Carrito |
| 11.1 – 11.2 | Pago en efectivo y virtual |
| 12.1 | Mis pedidos |
| 13.1 | Chat del cliente |
| 14.1 | Eventos |
| 15.1 | Equipo del turno |
| 16.1 | Contacto |
| 17.1 | Promoción emergente |
| 18.1 – 19.1 | Panel y tablero del barista |
| 20.1 – 20.2 | Cobro y comprobante |
| 22.1 | Pedido de mostrador |
| 23.1 | Inventario |
| 24.1 | Reportar novedad |
| 25.1 | Chat de clientes |
| 26.1 – 26.2 | Caja y arqueo |
| 27.1 | Perfil del barista |
| 28.x | Panel de administración |
| 29.1 | Indicadores |
| 30.1 – 30.2 | Pedidos y detalle |
| 31.x | Productos |
| 32.x | Categorías |
| 33.x | Insumos |
| 34.x | Mermas |
| 35.x | Compras |
| 36.x | Proveedores |
| 37.x | Gastos |
| 38.x | Cajas |
| 39.1 | Facturas |
| 40.x | Clientes |
| 41.x | Baristas |
| 42.x | Turnos |
| 43.x | Eventos |
| 44.x | Promociones |
| 45.1 | Reportes |
| 46.x | Asistente IA |
| 47.x | Configuración |
| 48.1 | Tema oscuro |
| 50.1 | Comprobante |
| 51.1 | Error de acceso |

---

*Fin del manual. Versión 1.0 · Octubre de 2026 · Equipo KAFFA.*

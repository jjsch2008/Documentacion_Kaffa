# Manual del Frontend — Sistema POS KAFFA

## Control documental

| Dato | Valor |
|---|---|
| Título | Manual de Usuario del Frontend — Sistema POS KAFFA |
| Versión | 1.0 |
| Fecha de emisión | Octubre de 2026 |
| Código documental | KAFFA-MU-FE-001 |
| Audiencia | Visitantes, clientes, baristas y administradores; personal nuevo sin experiencia técnica |
| Alcance | Interfaz web (SPA React): sitio público, cuenta de cliente, panel de barista y panel de administración |
| Fuera de alcance | Backend, base de datos, API, aplicación móvil e infraestructura |
| Fuente de verdad | Aplicación en ejecución y código de `REACT_clean/REACT_kaffa` |
| Estado | Verificado pantalla por pantalla con datos de demostración |

## Cómo usar este manual

Este manual está escrito para que puedas trabajar con KAFFA **sin saber programar**. Cada pantalla tiene su propia ficha: para qué sirve, cómo llegar, qué ves, qué hacer paso a paso y qué hacer si algo falla.

Puedes leerlo de tres formas:

1. **De principio a fin**, si es tu primera vez. Dedica 20 minutos a las partes I y II.
2. **Por rol**, si ya conoces el sistema. En el sitio interactivo usa los filtros *Visitante*, *Cliente*, *Barista* o *Administrador*.
3. **Como consulta**, cuando tengas una duda puntual. Busca el nombre del botón o de la pantalla en el buscador.

::: consejo
Si estás usando la versión interactiva (HTML), pulsa `/` para buscar, `T` para cambiar entre tema claro y oscuro y `Esc` para cerrar ventanas. Las capturas con números tienen un botón **Recorrer esta pantalla** que te guía paso a paso.
:::

### Cómo están escritas las instrucciones

| Icono o estilo | Significado |
|---|---|
| **Negrita** | Nombre exacto de un botón, campo, columna o menú |
| `Ruta` | Dirección web de la pantalla, por ejemplo `/menu` |
| 1, 2, 3 | Pasos que se hacen en orden |
| 💡 **Consejo** | Recomendación para trabajar más rápido o mejor |
| ⚠️ **Cuidado** | Algo que debes revisar antes de continuar |
| ⛔ **Error** | Qué hacer cuando aparece un mensaje de error |

::: nota
Los datos que verás en las capturas son ficticios y se crearon solo para el manual: nombres, pedidos, montos y comprobantes no corresponden a personas reales.
:::

## KAFFA en dos minutos

KAFFA es un sistema de punto de venta (POS) para una cafetería. La interfaz web tiene **cuatro experiencias** que comparten el mismo diseño y la misma información:

| Rol | Qué hace | Dónde entra |
|---|---|---|
| **Visitante** | Conoce el sitio, el menú, los eventos y se registra | Sitio público, sin cuenta |
| **Cliente** | Compra, paga, sigue sus pedidos y conversa con el barista | El mismo sitio público, con sesión iniciada |
| **Barista** | Prepara pedidos, cobra, controla inventario, chat y caja | `/barista-dashboard` |
| **Administrador** | Controla productos, compras, gastos, personal, reportes y estadísticas | `/admin-dashboard` |

### Mapa de la aplicación

```text
Sitio público
├── Inicio            /                    Portada y productos destacados
├── Menú              /menu                Catálogo y compra
├── Eventos           /eventos             Próximas actividades
├── Sobre nosotros    /sobre-nosotros      Historia y equipo del turno
├── Contacto          /contacto            Dirección, horario y redes
├── Registro          /registro
├── Iniciar sesión    /login
├── Recuperar         /forgot-password
├── Verificar correo  /verify-email
├── Mis pedidos       /pedidos             Solo cliente
└── Chat              /chat                Solo cliente

Panel del barista     /barista-dashboard
├── Tablero pedidos   …/pedidos
├── Inventario        …/inventario
├── Chat cliente      …/chat
└── Caja              …/caja

Panel del administrador  /admin-dashboard
└── 19 secciones en el menú lateral
```

### Las tres reglas que explican casi todo

1. **Cada persona ve solo lo suyo.** El sistema revisa tu rol al entrar: un cliente no puede abrir el panel de barista y un barista no puede abrir el de administración.
2. **El barista necesita un turno activo.** Si no tiene turno, puede mirar el panel pero el sistema le bloquea cobros, cambios de estado y operaciones de caja.
3. **Los pagos virtuales necesitan comprobante.** Transferencia, pago móvil y QR exigen una imagen; el efectivo y las tarjetas no.

## Glosario

| Término | Qué significa en KAFFA |
|---|---|
| **Arqueo** | Comparación entre el dinero que el sistema espera y el que realmente se contó al cerrar la caja. |
| **Barista** | Persona que prepara y cobra los pedidos. Tiene su propio panel. |
| **Caja** | Registro del dinero de un turno: con cuánto se abrió, qué entró, qué salió y con cuánto se cerró. |
| **Comprobante** | Imagen o captura que demuestra que un pago virtual se realizó. |
| **Estado del pedido** | Momento en que está un pedido: *Pendiente*, *Pagado*, *Entregado* o *Cancelado*. |
| **Insumo** | Materia prima que se usa para preparar productos: café, leche, azúcar, vasos. |
| **Merma** | Producto o insumo que se pierde, vence o se daña. Descuenta inventario. |
| **Medio de pago** | Forma de pagar: efectivo, tarjeta, transferencia, pago móvil o QR. |
| **Pedido de mostrador** | Pedido que el barista registra directamente, sin que el cliente lo haga desde su cuenta. |
| **Producto** | Artículo que se vende: capuchino, bagel, brownie. |
| **Promoción** | Aviso emergente con descuento, 2x1 o combo que se muestra a los clientes. |
| **Reporte** | Novedad que el barista envía al administrador (por ejemplo, un insumo agotado). |
| **Rol** | Permiso general de una cuenta: visitante, cliente, barista o administrador. |
| **Ticket promedio** | Promedio de dinero por pedido. |
| **Turno** | Franja de trabajo: mañana (07:00–13:00), tarde (13:00–18:00) o abierto (05:00–22:00). |
| **Virtual (medio de pago)** | Pago que no se hace en efectivo ni con datáfono; exige comprobante. |

## Credenciales de demostración

::: cuida
Estas cuentas son solo para practicar en un entorno de demostración. En producción, cambia las contraseñas el primer día.
:::

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@kaffa.com` | `admin123` |
| Barista | `barista@kaffa.com` | `barista123` |
| Cliente | `cliente@kaffa.com` | `cliente123` |

---

# Parte I. Primeros pasos

## 1. Abrir KAFFA y orientarte

### Para qué sirve

Esta es la puerta de entrada. Aquí aprendes a reconocer las zonas comunes de la aplicación para que no te pierdas, sin importar si eres cliente, barista o administrador.

### Cómo llegar

Abre tu navegador y entra a la dirección que te entregue el administrador. En un ambiente local suele ser `http://localhost:5173`. La primera pantalla es la **portada**.

![Figura 1.1. Portada pública de KAFFA con la barra de navegación y el acceso a la cuenta.](assets/capturas/p01-portada.png)

### Qué ves

- **Barra superior verde**: el logo KAFFA, los enlaces **Inicio**, **Menú**, **Eventos**, **Sobre Nosotros** y **Contacto**, y a la derecha **Registrarse** e **Iniciar Sesión**.
- **Portada**: el mensaje *El Arte del Buen Café*, dos botones (**Ver Menú** y **Conocer más**) y una fotografía de la cafetería.
- **Pie de página**: horarios, contacto y enlaces rápidos.

Arriba de todo, la barra siempre está presente en las páginas públicas. Si ya iniciaste sesión, en lugar de *Registrarse / Iniciar Sesión* verás **Hola, tu nombre**, el icono del carrito y un menú desplegable.

### Paso a paso

1. Mira la barra superior: ahí se navega por todo el sitio.
2. Pasa el cursor sobre un enlace para confirmar que responde.
3. Usa la rueda del ratón o el dedo para desplazarte hacia abajo.
4. Si eres nuevo, pulsa **Registrarse**.
5. Si ya tienes cuenta, pulsa **Iniciar Sesión**.

### Qué pasa después

- Si entras como visitante, puedes ver el menú y los eventos, pero para comprar el sistema te pedirá iniciar sesión.
- Si inicias sesión, el sistema te lleva a la pantalla que corresponde a tu rol: el cliente se queda en el sitio público, el barista va a su tablero y el administrador a su panel.

::: consejo
Puedes volver al inicio desde cualquier página pulsando el logo **KAFFA** o el enlace **Inicio**. No uses el botón *Atrás* del navegador para cerrar sesión: usa siempre el menú de tu cuenta.
:::

### Si algo sale mal

::: error
**La página no carga.** Verifica que estés escribiendo la dirección correcta y que tengas conexión. Si el problema continúa, avisa al administrador: puede que el servidor esté apagado.
:::

## 2. Crear tu cuenta

### Para qué sirve

El registro crea una cuenta de **cliente**. Con ella puedes comprar, pagar, ver tus pedidos y chatear con el barista.

### Cómo llegar

Pulsa **Registrarse** en la barra superior o entra a `/registro`.

![Figura 2.1. Formulario de registro con los datos de ejemplo completados.](assets/capturas/p11-registro.png)

### Qué ves

El formulario tiene cuatro campos:

| Campo | Qué escribir | Ejemplo |
|---|---|---|
| **Nombre completo** | Tu nombre y apellido | Laura Gómez |
| **Correo electrónico** | Un correo al que puedas entrar; allí llegará el código de verificación | laura@correo.com |
| **Contraseña** | Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo | Cafe2026! |
| **Confirmar contraseña** | La misma contraseña, sin errores | Cafe2026! |

### Paso a paso

1. Escribe tu **nombre completo**.
2. Escribe un **correo electrónico** que uses a diario.
3. Crea una **contraseña** que cumpla las cuatro condiciones. El formulario te avisa si falta alguna.
4. Repite la contraseña en **Confirmar contraseña**.
5. Pulsa **Registrarme**.

### Qué pasa después

Verás un mensaje que te invita a revisar tu correo. **Todavía no puedes entrar**: primero debes verificar la cuenta con el código de seis dígitos que llega al correo (capítulo 3).

::: cuida
Si el correo no llega en dos minutos, revisa la carpeta de spam. Si tu correo institucional bloquea mensajes externos, pide al administrador que revise el envío.
:::

### Si algo sale mal

::: error
**“El correo ya está registrado”.** Ese correo ya tiene cuenta. Usa **Iniciar Sesión** o **Recuperar contraseña**.
**La contraseña no cumple los requisitos.** Debe tener al menos 8 caracteres e incluir mayúscula, minúscula, número y símbolo. Ejemplo válido: `Kaffa2026!`.
:::

## 3. Verificar tu correo

### Para qué sirve

La verificación confirma que el correo es tuyo. Es un paso de seguridad obligatorio antes del primer inicio de sesión.

### Cómo llegar

Después de registrarte, el sistema te lleva a `/verify-email`. También puedes escribir esa dirección directamente.

![Figura 3.1. Pantalla para ingresar el código de verificación de seis dígitos.](assets/capturas/p13-verificar.png)

### Qué ves

- Un mensaje de bienvenida con el correo al que se envió el código.
- Una casilla para el **código de 6 dígitos**.
- El botón **Verificar cuenta**.
- El enlace **Reenviar código**, por si no llegó.

### Paso a paso

1. Abre tu correo y busca el mensaje de KAFFA.
2. Copia el código de seis dígitos.
3. Escríbelo en la casilla, sin espacios.
4. Pulsa **Verificar cuenta**.
5. Si el código no llega, pulsa **Reenviar código** y espera un minuto.

### Qué pasa después

La cuenta queda activa y el sistema te lleva a **Iniciar Sesión** para que entres con tu correo y contraseña.

::: consejo
El código vence. Si tardas demasiado, pide uno nuevo con **Reenviar código**; el anterior deja de funcionar.
:::

### Si algo sale mal

::: error
**“Código inválido o vencido”.** Revisa que hayas copiado los seis dígitos completos y pide un código nuevo.
**No llega ningún correo.** Confirma que escribiste bien tu dirección. Si el error persiste, el administrador puede verificar la cuenta manualmente desde el panel.
:::

## 4. Iniciar sesión y llegar al panel correcto

### Para qué sirve

El inicio de sesión te identifica y decide a qué parte de KAFFA entras. Es la misma pantalla para los tres roles.

### Cómo llegar

Pulsa **Iniciar Sesión** en la barra superior o entra a `/login`.

![Figura 4.1. Pantalla de inicio de sesión.](assets/capturas/p09-login.png)

### Qué ves

- Campo **Correo electrónico**.
- Campo **Contraseña**.
- Botón **Ingresar**.
- Enlaces **¿Olvidaste tu contraseña?** y **Crear cuenta**.

### Paso a paso

1. Escribe el correo con el que te registraste.
2. Escribe tu contraseña. Puedes usar el ojo del campo para mostrarla.
3. Pulsa **Ingresar**.
4. Espera un segundo: el sistema valida tus datos y tu rol.

### Qué pasa después según tu rol

| Rol | A dónde te lleva |
|---|---|
| Cliente | Al sitio público, con **Hola, tu nombre** y el carrito activo |
| Barista | A `/barista-dashboard`, en el **Tablero de Pedidos** |
| Administrador | A `/admin-dashboard`, en la sección **Inicio** |

::: cuida
Si entras con un rol y necesitas otro, cierra sesión y vuelve a entrar con la cuenta correcta. El sistema no permite cambiar de rol desde la interfaz.
:::

### Si algo sale mal

![Figura 4.2. Mensaje de error cuando el correo o la contraseña no coinciden.](assets/capturas/p10-login-error.png)

::: error
**“Credenciales inválidas”.** Revisa mayúsculas, espacios y la letra ñ. Si no recuerdas la contraseña, usa **¿Olvidaste tu contraseña?**.

**“Debes verificar tu correo”.** Entra a `/verify-email` y completa el código.

**“Demasiados intentos. Espera un minuto”.** El sistema bloquea temporalmente por seguridad. Espera 60 segundos y vuelve a intentar.
:::

## 5. Recuperar tu contraseña

### Para qué sirve

Te permite crear una contraseña nueva sin perder tu cuenta ni tus pedidos.

### Cómo llegar

En **Iniciar Sesión**, pulsa **¿Olvidaste tu contraseña?** o entra a `/forgot-password`.

![Figura 5.1. Pantalla para solicitar el código de recuperación.](assets/capturas/p12-recuperar.png)

### Paso a paso

1. Escribe el correo de tu cuenta.
2. Pulsa **Enviar código**.
3. Revisa tu correo: llegará un código de seis dígitos.
4. El sistema te lleva a la pantalla de restablecimiento.
5. Escribe el código y tu **nueva contraseña** dos veces.
6. Confirma el cambio y vuelve a iniciar sesión.

### Qué pasa después

La contraseña anterior deja de funcionar. Si tenías la sesión abierta en otro dispositivo, ese dispositivo perderá el acceso en la siguiente operación.

::: consejo
Aprovecha para elegir una contraseña distinta a la de tu correo personal. No la compartas por chat ni por correo.
:::

### Si algo sale mal

::: error
**El correo no existe.** Verifica que sea el mismo con el que te registraste. Si estás seguro, pide ayuda al administrador.
**El código no sirve.** Solicita uno nuevo; los códigos son de un solo uso y vencen.
:::

## 6. Tu perfil, el tema y el cierre de sesión

### Para qué sirve

Desde el menú de tu cuenta puedes cambiar tu nombre, correo, foto y contraseña, alternar el tema claro u oscuro y cerrar sesión de forma segura.

### Cómo llegar

Con la sesión iniciada, pulsa **Hola, tu nombre** (cliente) o el avatar (barista y administrador).

![Figura 6.1. Ventana Mi Perfil de un cliente.](assets/capturas/c09-perfil.png)

### Qué ves y qué puedes cambiar

| Elemento | Para qué sirve |
|---|---|
| **Foto** | Pulsa el círculo para subir una imagen desde tu dispositivo. |
| **Nombre Completo** | Nombre que aparece en el saludo y en los pedidos. |
| **Correo Electrónico** | Correo de la cuenta. Si lo cambias, úsalo en el próximo inicio de sesión. |
| **Nueva Contraseña (opcional)** | Déjala vacía si no quieres cambiarla. |
| **Guardar** | Aplica los cambios. |

### Paso a paso para editar el perfil

1. Abre el menú de tu cuenta.
2. Pulsa **Mi Perfil**.
3. Cambia solo lo que necesites.
4. Si subes una foto, espera a que termine la barra de progreso.
5. Pulsa **Guardar**.

### Tema claro y oscuro

En los paneles de barista y administrador hay un botón con forma de sol o luna en la barra superior. Cambia la apariencia de todo el panel y recuerda tu elección para la próxima vez.

![Figura 6.2. Panel de administración con el tema oscuro activado.](assets/capturas/a36-tema-oscuro.png)

### Cerrar sesión

1. Abre el menú de tu cuenta.
2. Pulsa **Cerrar Sesión**.
3. Si el sistema pregunta *¿Salir del sistema?*, confirma.

Al cerrar sesión, el carrito se vacía y vuelves a la portada como visitante.

::: cuida
Si trabajas en un computador compartido, cierra sesión siempre. Cerrar la pestaña no es suficiente: la sesión puede seguir activa.
:::

::: consejo
El tema oscuro reduce el brillo en ambientes con poca luz. No cambia la información ni los permisos; es solo apariencia.
:::

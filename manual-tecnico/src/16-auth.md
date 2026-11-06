# 16. API de autenticación y sesión

Este capítulo documenta los endpoints de identidad. Todos devuelven JSON y ninguno usa cookies.

## 16.1 Endpoints

**Tabla.** _Endpoints de autenticación y sesión_

| Método | Endpoint | Auth | Throttle | Descripción |
|---|---|---:|---|---|
| POST | `/login` | No | 5/min | Login y emisión de token |
| POST | `/registro` | No | 10/min | Alta diferida de cliente |
| POST | `/forgot-password` | No | 5/min | Envía OTP de reseteo |
| POST | `/reset-password` | No | 5/min | Cambia contraseña con OTP |
| POST | `/email/verify-code` | No | 10/min | Verifica alta con OTP |
| POST | `/email/verification-notification` | No | 5/min | Reenvía OTP de alta |
| GET | `/me` | Sí | 60/min | Perfil con roles |
| GET | `/user` | Sí | 60/min | Alias de `/me` |
| PUT | `/perfil` | Sí | 60/min | Actualiza perfil propio |
| POST | `/logout` | Sí | 60/min | Revoca token actual |
| POST | `/auth/refresh` | Sí | 60/min | Rota token |
| POST | `/auth/logout-all` | Sí | 60/min | Revoca todos los tokens |
| GET | `/health` | Sí | 60/min | Valida token |

## 16.2 `POST /login`

Request:

```json
{ "correo": "admin@kaffa.com", "password": "admin123" }
```

Response 200:

```json
{
  "access_token": "1|xxxxxxxx",
  "token_type": "Bearer",
  "usuario": {
    "id": 1,
    "nombre": "Administrador",
    "correo": "admin@kaffa.com",
    "activo": true,
    "email_verified_at": "2026-10-01T10:00:00-05:00",
    "roles": [{ "id": 1, "nombre": "admin" }]
  },
  "turno_activo": false,
  "turno_info": null
}
```

Para un barista, `turno_activo` y `turno_info` se calculan con `TurnoService`:

```json
{
  "turno_activo": true,
  "turno_info": {
    "id": 4,
    "fecha": "2026-10-20",
    "tipo": "mañana",
    "minutos_restantes": 95
  }
}
```

Errores:

**Tabla.** _Respuestas de POST /login_

| HTTP | Cuerpo | Cuándo |
|---|---|---|
| 401 | `{"message":"Credenciales inválidas."}` | Correo o contraseña incorrectos |
| 403 | `{"message":"Este usuario está inactivo..."}` | `activo=false` |
| 403 | `{"message":"Debes verificar...","code":"EMAIL_NOT_VERIFIED"}` | Sin `email_verified_at` |
| 422 | `errors` | Falta correo/password o formato inválido |
| 429 | — | Más de 5 intentos/min |

> **Advertencia.** El login compara con `Hash::check`; no distingue “usuario no existe” de “contraseña incorrecta” en el mensaje público. Eso reduce la enumeración de cuentas.

## 16.3 `POST /registro`

Request:

```json
{
  "nombre": "María Pérez",
  "correo": "maria@example.com",
  "password": "ClaveSegura#2026"
}
```

Reglas:

- `nombre`: requerido, máx. 100.
- `correo`: email, máx. 120, único en `users`.
- `password`: mínimo 8, mayúscula, minúscula, número y símbolo.

Response 201:

```json
{
  "message": "Revisa tu correo electrónico e ingresa el código para activar tu cuenta.",
  "correo": "maria@example.com"
}
```

**No devuelve token** y **no crea el usuario**. Guarda un `registro_pendiente` y envía un OTP. Si se repite el registro con el mismo correo, actualiza el pendiente y reenvía.

## 16.4 `POST /email/verify-code`

Request:

```json
{ "correo": "maria@example.com", "codigo": "123456" }
```

Efecto:

- Valida el OTP de tipo `verificacion`.
- Crea el `User` con `email_verified_at=now()`.
- Asigna rol `cliente`.
- Elimina el pendiente y el código.
- Devuelve 200.

Errores 422: código incorrecto, expirado, demasiados intentos o pendiente inexistente.

## 16.5 `POST /email/verification-notification`

Request:

```json
{ "correo": "maria@example.com" }
```

Reenvía el código si pasó el cooldown de 60 s. La respuesta es uniforme para no revelar si el correo existe.

## 16.6 `POST /forgot-password`

Request:

```json
{ "correo": "maria@example.com" }
```

Response 200 uniforme:

```json
{ "message": "Si el correo existe, recibirás un código para restablecer tu contraseña." }
```

El mensaje exacto puede variar; lo importante es que **no** revela si la cuenta existe.

## 16.7 `POST /reset-password`

Request:

```json
{
  "correo": "maria@example.com",
  "codigo": "123456",
  "password": "NuevaClave#2026",
  "password_confirmation": "NuevaClave#2026"
}
```

Efecto:

- Valida el OTP de tipo `reset`.
- Actualiza el hash de la contraseña.
- Revoca **todos** los tokens del usuario.
- Devuelve 200.

## 16.8 `GET /me` y `GET /user`

Response:

```json
{
  "id": 3,
  "nombre": "Cliente Demo",
  "correo": "cliente@kaffa.com",
  "activo": true,
  "roles": [{ "id": 3, "nombre": "cliente" }]
}
```

Nunca incluye `password` ni `remember_token`. `GET /user` es un alias funcional.

## 16.9 `PUT /perfil`

Request (todos los campos son opcionales):

```json
{
  "nombre": "María P.",
  "correo": "maria.nueva@example.com",
  "password": "OtraClave#2026",
  "foto": "https://res.cloudinary.com/roffd6et/image/upload/v.../foto.jpg"
}
```

Reglas:

- `correo` único, ignorando el propio usuario.
- `password` con la misma política fuerte.
- `foto` URL válida, máx. 500, `CloudinaryUrl`.
- `foto: null` elimina la foto.

## 16.10 `POST /logout`

Revoca el token actual. Response:

```json
{ "message": "Sesión cerrada exitosamente." }
```

El token deja de servir inmediatamente.

## 16.11 `POST /auth/refresh`

Rota el token:

1. Revoca el actual.
2. Emite uno nuevo con nuevas abilities y expiración.

Response:

```json
{
  "access_token": "2|yyyyyyyy",
  "token_type": "Bearer",
  "message": "Token renovado exitosamente."
}
```

El cliente debe reemplazar el token guardado. Si la respuesta se pierde, el token anterior ya no sirve y el usuario debe volver a loguearse.

## 16.12 `POST /auth/logout-all`

Revoca todos los tokens del usuario. Útil tras un cambio de contraseña o sospecha de robo.

```json
{ "message": "Sesiones cerradas en todos los dispositivos." }
```

## 16.13 `GET /health`

Response:

```json
{ "status": "ok" }
```

No comprueba base de datos ni servicios externos; solo valida el token. Para un health check real, añada un endpoint que ejecute `SELECT 1` y verifique almacenamiento.

## 16.14 Flujo recomendado para clientes

1. `POST /registro`.
2. Mostrar formulario de código.
3. `POST /email/verify-code`.
4. `POST /login`.
5. Guardar token de forma segura.
6. `GET /me` al arrancar.
7. Renovar con `POST /auth/refresh` antes de expirar.
8. `POST /logout` al salir.

> **Recomendación.** No guarde el token en `localStorage` si el cliente maneja datos muy sensibles y hay riesgo de XSS. Para SPA, considere cookies `HttpOnly` con un backend stateful o un patrón BFF. La API actual está diseñada para Bearer puro.

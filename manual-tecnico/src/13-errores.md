# 13. Errores y códigos de negocio

La API devuelve JSON uniforme. Este capítulo reúne los códigos HTTP, los códigos de negocio y la forma de diagnosticarlos. Un cliente puede leer `message` para mostrar un texto y `code` para decidir una acción sin analizar el texto.

## 13.1 Formato general

```json
{
  "message": "La caja indicada no está abierta.",
  "code": "CAJA_CERRADA"
}
```

Errores de validación (422):

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "pagos.0.comprobante_url": [
      "El comprobante es obligatorio para medios de pago virtuales."
    ]
  }
}
```

## 13.2 Códigos HTTP

**Tabla.** _Uso de los códigos HTTP_

| HTTP | Uso | Ejemplo |
|---|---|---|
| 200 | Lectura/actualización correcta | `GET /me` |
| 201 | Creación correcta | `POST /pedidos` |
| 401 | Sin token o token inválido | `GET /insumos` sin Bearer |
| 403 | Rol/ability/turno insuficiente | `TOKEN_SIN_ABILITY` |
| 404 | Recurso o ruta inexistente | `GET /pedidos/999999` |
| 422 | Validación o regla de negocio | Stock insuficiente |
| 429 | Throttle excedido | 11 escrituras/min |
| 500 | Error no controlado | Fallo de base o bug |

## 13.3 Códigos de negocio

**Tabla.** _Catálogo de códigos de negocio_

| Código | HTTP | Significado | Acción del cliente |
|---|---|---|---|
| `EMAIL_NOT_VERIFIED` | 403 | Correo sin verificar | Pedir código y verificar |
| `FUERA_HORARIO` | 403 | Barista fuera de 05:00–22:00 | Esperar o pedir turno |
| `TURNO_INACTIVO` | 403 | Sin turno asignado | Contactar admin |
| `TURNO_EXPIRADO` | 403 | Turno terminado | Cerrar caja |
| `PERMISO_DENEGADO` | 403 | Rol no autorizado a crear pedido | Revisar rol |
| `CAJA_NO_EXISTE` | 422 | `caja_id` inexistente | Corregir caja |
| `CAJA_CERRADA` | 422 | Caja no abierta | Abrir caja |
| `CAJA_AJENA` | 422 | Caja de otro barista | Usar la propia |
| `TOKEN_SIN_ABILITY` | 403 | Token sin alcance | Reautenticar/rotar |

`TOKEN_SIN_ABILITY` incluye `required_ability` con la lista de abilities aceptadas.

## 13.4 Dónde se lanza cada error

**Tabla.** _Origen de cada error_

| Origen | Tipo | Ejemplo |
|---|---|---|
| `CheckRole` | 401/403 | Rol incorrecto |
| `EnsureActiveTurno` | 403 | `FUERA_HORARIO` |
| `EnsureTokenCanAbility` | 403 | `TOKEN_SIN_ABILITY` |
| Form Requests | 422 | Campo requerido |
| `PedidoService` | 422 | Stock, pagos, caja |
| `CompraService` | 422 | Stock negativo al revertir |
| `Caja` | 422 | Caja con movimientos |
| `FacturaService` | 500 | Contador no inicializado |
| `Handler` | 404 | Modelo/ruta no encontrada |
| Laravel | 429 | Throttle |

## 13.5 Errores de autenticación

**Tabla.** _Errores de autenticación y su respuesta_

| Caso | Respuesta |
|---|---|
| Credenciales inválidas | `401 {"message":"Credenciales inválidas."}` |
| Usuario inactivo | `403 {"message":"Este usuario está inactivo..."}` |
| Correo sin verificar | `403 {"code":"EMAIL_NOT_VERIFIED"}` |
| Token expirado | `401 {"message":"No autenticado."}` |
| Token revocado | `401` |

La API **nunca** redirige a una página de login HTML; `Authenticate::redirectTo` devuelve `null`.

## 13.6 Errores de validación frecuentes

**Tabla.** _Errores de validación frecuentes_

| Campo | Regla | Mensaje típico |
|---|---|---|
| `correo` | email, único | “The correo has already been taken.” |
| `password` | 8+, mayúscula, minúscula, número, símbolo | “The password must contain...” |
| `pagos.*.comprobante_url` | obligatorio si medio virtual | “El comprobante es obligatorio...” |
| `detalles.*.cantidad` | entero ≥1 | “The cantidad must be at least 1.” |
| `monto_apertura_fisico` | requerido, ≥0 | “The monto apertura fisico field is required.” |
| `mensaje` (chat) | máx. 1000 | “The mensaje may not be greater than 1000 characters.” |
| `mensaje` (asistente) | máx. 2000 | “The mensaje may not be greater than 2000 characters.” |

## 13.7 Diagnóstico por síntoma

**Tabla.** _Diagnóstico de errores por síntoma_

| Síntoma | Causa probable | Dónde mirar |
|---|---|---|
| 401 en todo | Token ausente/expirado | `Authorization`, `SANCTUM_EXPIRATION` |
| 403 con rol correcto | Falta ability o turno | `EnsureTokenCanAbility`, `EnsureActiveTurno` |
| 422 en pago virtual | Falta comprobante | `withValidator` |
| 422 en pedido | Stock o suma de pagos | `PedidoService` |
| 404 en ruta existente | Prefijo `/api/v1` mal | `RouteServiceProvider` |
| 429 tras listar | Throttle compartido | `routes/api.php` |
| 500 con traza | Bug o base caída | `storage/logs/laravel.log` |
| JSON truncado | Error fatal de PHP | Log de PHP-FPM |

## 13.8 Logging

Laravel registra excepciones en `storage/logs/laravel.log` (o diario). Para diagnóstico:

```bash
tail -f storage/logs/laravel.log
```

No registre tokens, contraseñas, códigos OTP ni cuerpos completos con datos personales. Si necesita depurar, use un identificador de correlación y redacte campos sensibles.

## 13.9 Recomendaciones para clientes

- Lea `code` antes que `message`.
- Para 422, recorra `errors` y marque los campos.
- Para 401, limpie el token y redirija a login.
- Para 403 `TOKEN_SIN_ABILITY`, renueve el token.
- Para 429, respete `Retry-After` si está presente y aplique backoff.
- No reintente automáticamente un `POST /pedidos` sin idempotencia: puede duplicar la venta.

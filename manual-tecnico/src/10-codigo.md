# 10. Organización del código

El backend sigue la estructura estándar de Laravel 10 con una decisión deliberada: **controladores delgados y servicios transaccionales**. Este capítulo explica dónde vive cada responsabilidad para que un ingeniero nuevo sepa qué archivo tocar.

## 10.1 Mapa de responsabilidades

**Tabla.** _Mapa de responsabilidades por necesidad_

| Necesidad | Archivo / carpeta |
|---|---|
| Añadir un endpoint | `routes/api.php` |
| Validar un payload | `app/Http/Requests` |
| Regla de negocio compleja | `app/Services` |
| CRUD simple con filtros | `app/Models/Concerns/HasBasicQueries.php` |
| Relaciones y casts | `app/Models` |
| Autorización por registro | `app/Policies` + `AuthServiceProvider` |
| Autenticación por rol/turno/ability | `app/Http/Middleware` |
| Formato de salida | `app/Http/Resources/BaseResource.php` |
| Efecto secundario | `app/Events` + `app/Listeners` |
| Error de negocio | `app/Exceptions/BusinessRuleException.php` |
| Configuración | `config/*.php` + `.env` |

## 10.2 Rutas

`routes/api.php` es la **fuente de verdad de endpoints**. Se carga con prefijo `api/v1` desde `RouteServiceProvider`:

```php
Route::middleware('api')
    ->prefix('api/v1')
    ->group(base_path('routes/api.php'));
```

Convenciones:

- Rutas públicas primero (login, registro, catálogo, eventos).
- Grupo `auth:sanctum` para todo lo demás.
- Subgrupos por rol (`role:admin`, `role:admin,barista`) y por escritura (`ability:`).
- Nombres de ruta estables (`pedidos.store`, `cajas.update`) para `route()` y pruebas.
- `whereNumber('id')` en rutas públicas que colisionan con rutas administrativas (`/eventos/admin` vs `/eventos/{id}`).

> **Nota.** `route:list` muestra 142 entradas porque cada `apiResource` se declara dos veces (lectura y escritura) y los `GET` incluyen `HEAD`. La matriz del capítulo 26 normaliza esas entradas.

## 10.3 Controladores

Hay 29 controladores de dominio + `Controller` base en `app/Http/Controllers`. Su patrón:

```php
public function store(StorePedidoRequest $request)
{
    return new BaseResource(PedidoService::crear($request->validated()));
}

public function update(UpdatePedidoRequest $request, int $id)
{
    $payload = $request->validated();
    // reglas específicas de autoría
    return new BaseResource(Pedido::actualizarRegistro($id, $payload));
}
```

Buenas prácticas:

- No escribir reglas de stock/caja/factura en el controlador.
- Usar `validated()` y no `$request->all()`.
- Devolver `BaseResource` para ocultar campos sensibles.
- No exponer modelos con `password` o `remember_token`.
- Mantener el método corto; si supera ~30 líneas, mover lógica a un servicio.

## 10.4 Form Requests

`app/Http/Requests` contiene `Store*Request` y `Update*Request`. Características:

- Reglas explícitas por campo.
- `withValidator` para reglas condicionales (comprobante en medios virtuales).
- `authorize()` devuelve `true` porque la autorización se hace por middleware/policy.
- Mensajes en español por defecto de Laravel; el cliente recibe `errors` por campo.

Ejemplo de regla transversal:

```php
$validator->after(function ($validator) {
    $pagos = $this->input('pagos', []);
    $virtualIds = Medio_Pago::virtualIds();
    foreach ($pagos as $i => $pago) {
        if (in_array($pago['medio_pago_id'] ?? null, $virtualIds)
            && empty($pago['comprobante_url'])) {
            $validator->errors()->add(
                "pagos.$i.comprobante_url",
                'El comprobante es obligatorio para medios de pago virtuales.'
            );
        }
    }
});
```

## 10.5 Servicios

**Tabla.** _Servicios de negocio y su responsabilidad_

| Servicio | Responsabilidad |
|---|---|
| `PedidoService` | Crear/eliminar pedidos, stock, pagos, factura, caja |
| `CompraService` | Compras, aumento de stock, egresos |
| `GastoService` | Gastos, pagos y egresos |
| `MermaService` | Mermas y ajuste de stock |
| `FacturaService` | Numeración transaccional |
| `TurnoService` | Horarios, turno activo, minutos restantes |
| `TransactionService` | Transacción con reintentos por deadlock |
| `RegistrationService` | Alta diferida, confirmación y purga |
| `OtpService` | Generación/validación de códigos |
| `AsistenteService` | Respuestas locales por rol |

Los servicios son clases con métodos estáticos. No reciben `Request`; reciben arrays validados. Esto facilita pruebas y reutilización desde comandos o jobs.

## 10.6 Modelos y trait HasBasicQueries

Los 29 modelos usan Eloquent. El trait `App\Models\Concerns\HasBasicQueries` centraliza:

- `consultar(array $filtros)`: filtros exactos, búsqueda `LIKE`, rangos de fecha, orden y paginación (1–100, por defecto 15).
- `buscarPorId(int $id)`: `findOrFail` + `Gate::authorize('view-record')`.
- `crearRegistro`, `actualizarRegistro`, `eliminarRegistro`: transacción + gate.
- `scopeByUser`: hook para restringir por rol.
- `eagerRelations`: relaciones a precargar para evitar N+1.

Modelos con lógica especial:

- `Caja`: fuerza `abierta_por`, `turno_id`, calcula arqueo y bloquea eliminación con movimientos.
- `Pedido`: `scopeByUser` limita al cliente a sus pedidos.
- `Medio_Pago`: `virtualIds()` cachea 5 minutos.
- `Turno`: casts de fecha y relación con baristas.
- `User`: roles, `isAdmin()`, `isBarista()`, `isCliente()`, `hasRole()`.

## 10.7 Policies y gates

`AuthServiceProvider` registra 17 policies de dominio + BasePolicy y tres gates:

**Tabla.** _Gates de autorización y su uso_

| Gate | Uso |
|---|---|
| `view-record` | Ver un registro |
| `create-record` | Crear un recurso |
| `manage-record` | Actualizar/eliminar |

`BasePolicy` implementa reglas comunes; cada policy ajusta ownership:

- `PedidoPolicy`: cliente solo sus pedidos; barista/admin todos.
- `CajaPolicy`: barista solo su caja.
- `FacturaVentaPolicy`: admin; cliente solo la factura de sus pedidos.
- `MovimientoCajaPolicy`: lectura admin/barista; escritura solo admin.
- `EventoPolicy`: lectura pública de publicados; gestión admin.

## 10.8 Middleware

**Tabla.** _Middleware registrado y su efecto_

| Alias | Clase | Efecto |
|---|---|---|
| `role:` | `CheckRole` | Exige uno de los roles |
| `turno.activo` | `EnsureActiveTurno` | Barista en turno; admin/cliente exentos |
| `ability:` | `EnsureTokenCanAbility` | Token con al menos una ability |
| `auth` | `Authenticate` | 401 JSON, sin redirección |
| `throttle` | Laravel | Límite por ruta |

Orden recomendado en escrituras: `role` → `turno.activo` → `throttle` → `ability`. El orden actual funciona, pero `role` antes de `ability` da mensajes más claros.

## 10.9 Recursos y serialización

`BaseResource` elimina `password` y `remember_token` de las respuestas. Laravel envuelve colecciones paginadas en:

```json
{
  "data": [ ... ],
  "links": { "first": "...", "last": "...", "prev": null, "next": null },
  "meta": { "current_page": 1, "last_page": 3, "per_page": 15, "total": 42 }
}
```

`AuthController::me` y `updatePerfil` usan `makeHidden` para el mismo fin.

## 10.10 Eventos y listeners

`PedidoCreado` se dispara al final de `PedidoService::crear`. `DeducirInventario`:

1. Carga `detalles.producto.insumos`.
2. Agrega consumo por insumo.
3. Ejecuta un `UPDATE` por insumo con `GREATEST(0, stock_actual - ?)`.

El listener es síncrono (`QUEUE_CONNECTION=sync`). Si falla, la transacción del pedido se revierte. Si se cambia a cola asíncrona, el descuento podría ocurrir después del commit y dejar una ventana de inconsistencia; habría que rediseñar la idempotencia.

## 10.11 Excepciones

`BusinessRuleException` lleva mensaje, código HTTP y un código de negocio opcional:

```php
throw new BusinessRuleException(
    'La caja indicada no está abierta.',
    422,
    'CAJA_CERRADA'
);
```

`Handler` responde:

```json
{ "message": "La caja indicada no está abierta.", "code": "CAJA_CERRADA" }
```

Los 404 de API se normalizan a `{"message": "Recurso no encontrado."}`. Las validaciones usan el formato estándar de Laravel.

## 10.12 Convenciones de código

- PHP 8.1+: tipos de retorno, propiedades tipadas cuando sea posible.
- PSR-12 y Laravel Pint (`vendor/bin/pint`).
- Nombres de dominio en español (`Pedido`, `Caja`, `Merma`), términos técnicos en inglés (`Service`, `Request`).
- No usar `env()` fuera de `config/`; usar `config('clave')`.
- No usar `DB::raw` con entrada de usuario; usar bindings.
- Fechas con `now()` y zona `America/Bogota`.
- Dinero con `decimal:2`; no usar `float` para cálculos contables críticos.
- Evitar consultas en bucles; usar `with()` y agregaciones.

> **Recomendación.** Antes de añadir un módulo, copie el patrón de un recurso existente (ruta → request → controlador → servicio → policy → prueba) y actualice la matriz de endpoints y OpenAPI.

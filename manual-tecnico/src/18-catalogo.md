# 18. API de catálogo

El catálogo agrupa categorías, productos, insumos, recetas y medios de pago. La lectura es pública para categorías/productos y autenticada para insumos/recetas/medios; la escritura es exclusiva del admin.

## 18.1 Matriz de acceso

**Tabla.** _Matriz de acceso al catálogo_

| Recurso | Lectura | Escritura | Ability |
|---|---|---|---|
| `/categorias` | Pública | Admin | `catalogo:manage` |
| `/productos` | Pública | Admin | `catalogo:manage` |
| `/insumos` | Autenticados | Admin | `catalogo:manage` |
| `/recetas` | Autenticados | Admin | `catalogo:manage` |
| `/medios-pago` | Autenticados | Admin | `catalogo:manage` |

Las escrituras usan `role:admin`, `throttle:30,1` y `ability:catalogo:manage`.

## 18.2 Categorías

### Crear

```http
POST /api/v1/categorias
Authorization: Bearer {admin}
Content-Type: application/json

{ "nombre": "Tés" }
```

Reglas:

- `nombre` requerido, máx. 100.
- No hay unicidad estricta en la migración; evite duplicados por convención.

### Actualizar / eliminar

```http
PUT /api/v1/categorias/{id}
DELETE /api/v1/categorias/{id}
```

Eliminar es soft delete. Un producto puede quedar con `categoria_id` apuntando a una categoría eliminada; revise la integridad antes.

## 18.3 Productos

### Crear

```json
{
  "nombre": "Matcha Latte",
  "descripcion": "Té matcha con leche",
  "imagen": "https://res.cloudinary.com/roffd6et/image/upload/...",
  "precio_venta": 9500,
  "categoria_id": 1,
  "activo": true
}
```

Reglas:

- `nombre` requerido, máx. 150.
- `precio_venta` numérico ≥ 0.
- `imagen` URL máx. 500 (Cloudinary).
- `categoria_id` existente o nulo.
- `activo` booleano.

### Recetas

Un producto consume insumos a través de `recetas`:

```json
POST /api/v1/recetas
{
  "producto_id": 1,
  "insumo_id": 3,
  "cantidad": 0.25
}
```

`cantidad` es el consumo por unidad vendida. Si un producto no tiene receta, no descuenta inventario.

## 18.4 Insumos

### Crear

```json
{
  "nombre": "Leche entera",
  "unidad_medida": "lt",
  "stock_actual": 20,
  "stock_minimo": 5,
  "activo": true
}
```

Reglas:

- `nombre` único (validado en `StoreInsumoRequest`).
- `stock_actual` y `stock_minimo` ≥ 0.
- El stock solo se fija al crear; luego lo mueven compras, mermas y ventas.
- No edite `stock_actual` por API para “cuadrar”; use compra/merma.

### Lectura

```http
GET /api/v1/insumos?stock_actual=0
GET /api/v1/insumos?nombre=leche
```

## 18.5 Medios de pago

### Crear

```json
{ "nombre": "Nequi", "es_virtual": true }
```

Reglas:

- `nombre` único, máx. 50.
- `es_virtual=true` ⇒ los pagos que lo usen exigen comprobante.
- Los IDs virtuales se cachean 5 min.

Medios sembrados:

**Tabla.** _Medios de pago y su carácter virtual_

| Medio | Virtual |
|---|---|
| Efectivo | No |
| Tarjeta de Crédito | No |
| Tarjeta de Débito | No |
| Transferencia Bancaria | Sí |
| Pago Móvil | Sí |
| QR (Pago Digital) | Sí |

## 18.6 Imágenes de producto

El backend no recibe el archivo. El flujo es:

1. El navegador sube a Cloudinary con el preset unsigned.
2. Cloudinary devuelve `secure_url`.
3. El cliente envía esa URL en `imagen`.
4. El backend valida `CloudinaryUrl`.

Si la URL pertenece a otra cuenta, responde 422.

## 18.7 Errores frecuentes

**Tabla.** _Errores frecuentes del catálogo_

| HTTP | Causa | Solución |
|---|---|---|
| 401 | Sin token en insumos/recetas/medios | Enviar Bearer |
| 403 | Barista intenta escribir catálogo | Usar admin |
| 422 | `nombre` duplicado en insumo/medio | Cambiar nombre |
| 422 | `precio_venta` negativo | Corregir |
| 422 | URL de imagen de otra cuenta | Subir a la cuenta correcta |

## 18.8 Ejemplo completo `curl`

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@kaffa.com","password":"admin123"}' | jq -r .access_token)

curl -s -X POST http://127.0.0.1:8000/api/v1/productos \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "nombre":"Matcha Latte",
    "descripcion":"Té matcha con leche",
    "precio_venta":9500,
    "categoria_id":1,
    "activo":true
  }' | jq
```

> **Recomendación.** Mantenga un catálogo de imágenes con nombres estables y transformaciones de Cloudinary (`f_auto,q_auto,w_...`). No guarde URLs con parámetros de sesión.

# 24. API de usuarios y roles

La gestión de usuarios es exclusiva del admin. Un usuario puede tener varios roles.

## 24.1 Endpoints

**Tabla.** _Endpoints de usuarios y roles_

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/usuarios` | Lista; filtro `?rol=` |
| POST | `/usuarios` | Crea usuario verificado |
| GET | `/usuarios/{id}` | Detalle |
| PUT | `/usuarios/{id}` | Actualiza |
| DELETE | `/usuarios/{id}` | Soft delete |
| GET/POST/PUT/DELETE | `/roles` | CRUD de roles |
| GET/POST/PUT/DELETE | `/usuario-roles` | Pivote |

Todas exigen `role:admin` + `ability:usuarios:manage`/`roles:manage`.

## 24.2 Crear usuario

```json
{
  "nombre": "Nuevo Barista",
  "correo": "barista2@kaffa.com",
  "password": "ClaveSegura#2026",
  "foto": "https://res.cloudinary.com/...",
  "activo": true,
  "rol_ids": [2]
}
```

Reglas:

- `nombre` máx. 100.
- `correo` único, máx. 120.
- `password` fuerte.
- `foto` URL Cloudinary opcional.
- `rol_ids` ≥ 1.
- Se acepta `roles[]` como alias de `rol_ids[]` (app móvil).
- El usuario nace **verificado** (`email_verified_at=now`).

## 24.3 Actualizar

```json
{
  "nombre": "Barista Actualizado",
  "correo": "barista2@kaffa.com",
  "password": "OtraClave#2026",
  "activo": true,
  "rol_ids": [2, 3]
}
```

`password` es opcional; si se envía, se rehashea. `rol_ids` sincroniza la pivote.

## 24.4 Filtrar por rol

```http
GET /api/v1/usuarios?rol=barista
```

El filtro se aplica sobre la relación `roles`. Útil para selectores de turnos.

## 24.5 Roles

```json
{ "nombre": "supervisor" }
```

Los roles sembrados son `admin`, `barista`, `cliente`. Crear roles nuevos no otorga abilities automáticamente: `AuthController::abilitiesFor` solo reconoce los tres roles. Un rol personalizado sin abilities no podrá escribir.

> **Advertencia.** Si añade un rol, actualice `abilitiesFor`, la matriz RBAC, las policies y las pruebas. De lo contrario, el rol existirá pero no servirá para operar.

## 24.6 Pivote usuario-rol

```json
{ "usuario_id": 5, "rol_id": 2 }
```

Permite asignar roles manualmente. La forma recomendada es `rol_ids` en `POST/PUT /usuarios`, que sincroniza en una transacción.

## 24.7 Eliminar

Soft delete. El usuario deja de aparecer en listados y no puede autenticarse. Los pedidos y movimientos históricos conservan su `usuario_id`.

## 24.8 Seguridad

- Solo admin.
- No se puede eliminar el propio usuario si se queda sin admin (no hay validación explícita; opere con cuidado).
- Cambiar el correo de un usuario no reenvía verificación; el admin asume la responsabilidad.
- No exponga `password` ni `remember_token`.

## 24.9 Errores

**Tabla.** _Errores frecuentes de usuarios_

| HTTP | Causa |
|---|---|
| 403 | No admin |
| 422 | Correo duplicado |
| 422 | Contraseña débil |
| 422 | `rol_ids` vacío o inexistente |
| 404 | Usuario/rol inexistente |

## 24.10 Ejemplo `curl`

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"admin@kaffa.com","password":"admin123"}' | jq -r .access_token)

curl -s -X POST http://127.0.0.1:8000/api/v1/usuarios \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "nombre":"Nuevo Barista",
    "correo":"barista2@kaffa.com",
    "password":"ClaveSegura#2026",
    "rol_ids":[2]
  }' | jq
```

> **Recomendación.** Use roles múltiples en lugar de crear cuentas duplicadas. Un barista que también compra como cliente puede tener ambos roles y alternar según el contexto.

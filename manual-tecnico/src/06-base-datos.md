# 6. Operación de la base de datos

Este capítulo cubre la base de datos como **servicio operativo**: creación, migraciones, seeders, respaldos, restauración, mantenimiento y consultas útiles. El modelo lógico y el diccionario completo están en el capítulo 8.

## 6.1 Motor y conexión

**Tabla.** _Parámetros de conexión a PostgreSQL_

| Parámetro | Valor |
|---|---|
| Motor | PostgreSQL |
| Base principal | `kaffa` |
| Base de pruebas | `kaffa_test` |
| Puerto por defecto | `5432` |
| Codificación | UTF-8 |
| Zona de aplicación | `America/Bogota` |
| Driver PHP | `pdo_pgsql` |

El proyecto **no** soporta MySQL ni SQLite. El esquema usa tipos y funciones de PostgreSQL, y los tests configuran `pgsql` en `phpunit.xml`.

## 6.2 Crear la base desde cero

```sql
-- Como superusuario de PostgreSQL
CREATE ROLE kaffa_app WITH LOGIN PASSWORD '<secreto>';
CREATE DATABASE kaffa
  WITH OWNER kaffa_app
       ENCODING 'UTF8'
       LC_COLLATE 'C.UTF-8'
       LC_CTYPE 'C.UTF-8'
       TEMPLATE template0;
CREATE DATABASE kaffa_test
  WITH OWNER kaffa_app
       ENCODING 'UTF8'
       TEMPLATE template0;
```

Verificación:

```bash
psql -h 127.0.0.1 -U kaffa_app -d kaffa -c "\conninfo"
psql -h 127.0.0.1 -U kaffa_app -d kaffa -c "select current_database(), current_user;"
```

## 6.3 Migraciones

### 6.3.1 Ejecutar

```bash
php artisan migrate
```

### 6.3.2 Estado

```bash
php artisan migrate:status
```

### 6.3.3 Reconstruir en desarrollo

```bash
php artisan migrate:fresh --seed
```

### 6.3.4 Revertir la última tanda

```bash
php artisan migrate:rollback
```

### 6.3.5 Revertir todo

```bash
php artisan migrate:reset
```

> **Advertencia.** `migrate:fresh`, `migrate:reset` y `db:wipe` destruyen datos. Úselos solo en desarrollo o en una base desechable. En producción, cada migración debe revisarse y probarse contra una copia.

### 6.3.6 Buenas prácticas para nuevas migraciones

1. Una migración = un cambio coherente.
2. Use `nullable()` explícito y valores por defecto seguros.
3. Añada índices para columnas de filtro/orden.
4. Para columnas nuevas en tablas con datos, haga backfill antes de `NOT NULL`.
5. Evite lógica de negocio en migraciones; use seeders o comandos.
6. Pruebe `up` y `down` en una base limpia.
7. No renombre tablas sin actualizar modelos, relaciones, policies y pruebas.

## 6.4 Seeders

Orden de `DatabaseSeeder`:

```text
RolSeeder → MedioPagoSeeder → UserSeeder → TurnoSeeder → CatalogSeeder
```

**Tabla.** _Seeders de la base de datos_

| Seeder | Datos | Idempotencia |
|---|---|---|
| `RolSeeder` | admin, barista, cliente | `firstOrCreate` |
| `MedioPagoSeeder` | 6 medios (3 virtuales) | `firstOrCreate` por nombre |
| `UserSeeder` | 3 usuarios verificados con foto | `firstOrCreate` por correo |
| `TurnoSeeder` | Turnos de hoy y asignación de baristas | Verifica existencia por fecha/tipo |
| `CatalogSeeder` | 3 categorías, 20 insumos, 10 productos, recetas | `firstOrCreate` |

```bash
php artisan db:seed
php artisan db:seed --class=CatalogSeeder
```

> **Advertencia.** `TurnoSeeder` crea turnos para el día actual. Si la zona horaria del servidor no es `America/Bogota`, los turnos pueden quedar en el día equivocado.

## 6.5 Respaldos

### 6.5.1 Respaldo lógico completo

```bash
PGPASSWORD='<secreto>' pg_dump \
  -h 127.0.0.1 -U kaffa_app -d kaffa \
  -Fc -f /backups/kaffa_$(date +%F_%H%M).dump
```

`-Fc` genera un formato comprimido y flexible. Para un SQL plano:

```bash
pg_dump -h 127.0.0.1 -U kaffa_app -d kaffa -Fp -f kaffa.sql
```

### 6.5.2 Restauración

```bash
pg_restore -h 127.0.0.1 -U kaffa_app -d kaffa_restore --clean --if-exists kaffa_2026-10-20_0300.dump
```

Nunca restaure directamente sobre producción sin una ventana de mantenimiento y un respaldo previo.

### 6.5.3 Qué respaldar además de la base

**Tabla.** _Elementos a incluir en el respaldo_

| Elemento | Motivo |
|---|---|
| `storage/app/public/eventos` | Imágenes subidas desde el móvil |
| `.env` (cifrado) | Configuración y secretos |
| `storage/logs` | Diagnóstico histórico |
| `docs/openapi.json` | Contrato de API versionado |
| Configuración del servidor web/PHP-FPM | Reproducibilidad |

Cloudinary conserva las imágenes web; no necesita respaldo local, pero sí inventario de URLs.

### 6.5.4 Política recomendada

- Respaldo completo diario, retención 14–30 días.
- Respaldo incremental/WAL si el volumen lo justifica.
- Prueba de restauración mensual en un entorno aislado.
- Copia fuera del servidor (almacenamiento de objetos o servidor secundario).
- Cifrado en reposo y control de acceso.

## 6.6 Mantenimiento

### 6.6.1 Estadísticas y espacio

```sql
-- Actualizar estadísticas del planificador
ANALYZE;

-- Reclamar espacio de filas muertas (no bloquea lecturas)
VACUUM (VERBOSE, ANALYZE);

-- Revisar tamaño por tabla
SELECT relname AS tabla,
       pg_size_pretty(pg_total_relation_size(relid)) AS tamano
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 6.6.2 Conexiones

```sql
SELECT count(*) AS conexiones,
       state
FROM pg_stat_activity
WHERE datname = 'kaffa'
GROUP BY state;
```

Si se agotan las conexiones, revise el pool de PHP-FPM y el número de workers antes de aumentar `max_connections`.

### 6.6.3 Índices sin uso

```sql
SELECT schemaname, relname AS tabla, indexrelname AS indice, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

No elimine un índice solo porque `idx_scan=0`; puede ser estacional o proteger una restricción única.

### 6.6.4 Bloqueos

```sql
SELECT pid, usename, state, wait_event_type, wait_event, query
FROM pg_stat_activity
WHERE datname = 'kaffa' AND state <> 'idle'
ORDER BY query_start;
```

Los servicios usan `lockForUpdate` sobre stock, cajas y contadores. Un bloqueo largo suele indicar una transacción que no cierra o un deadlock reintentado.

## 6.7 Consultas útiles de operación

### 6.7.1 Ventas del día

```sql
SELECT count(*) AS pedidos,
       coalesce(sum(total), 0) AS total
FROM pedidos
WHERE deleted_at IS NULL
  AND estado IN ('pagado', 'entregado')
  AND created_at >= CURRENT_DATE;
```

### 6.7.2 Productos más vendidos

```sql
SELECT p.nombre,
       sum(d.cantidad) AS unidades,
       sum(d.subtotal) AS ingresos
FROM detalle__pedidos d
JOIN pedidos pe ON pe.id = d.pedido_id AND pe.deleted_at IS NULL
JOIN productos p ON p.id = d.producto_id
WHERE pe.estado IN ('pagado', 'entregado')
  AND pe.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.nombre
ORDER BY unidades DESC
LIMIT 10;
```

### 6.7.3 Stock bajo

```sql
SELECT nombre, stock_actual, stock_minimo, unidad_medida
FROM insumos
WHERE deleted_at IS NULL
  AND stock_actual <= stock_minimo
ORDER BY (stock_actual - stock_minimo) ASC;
```

### 6.7.4 Cajas abiertas

```sql
SELECT c.id, u.nombre AS abierta_por, c.fecha_apertura, c.monto_apertura_fisico
FROM cajas c
JOIN users u ON u.id = c.abierta_por
WHERE c.estado = 'abierta' AND c.deleted_at IS NULL;
```

### 6.7.5 Arqueo de una caja

```sql
SELECT c.id,
       c.monto_apertura_sistema,
       coalesce(sum(CASE WHEN m.tipo = 'ingreso' THEN m.monto ELSE 0 END), 0) AS ingresos,
       coalesce(sum(CASE WHEN m.tipo = 'egreso' THEN m.monto ELSE 0 END), 0) AS egresos,
       c.monto_apertura_sistema
         + coalesce(sum(CASE WHEN m.tipo = 'ingreso' THEN m.monto ELSE 0 END), 0)
         - coalesce(sum(CASE WHEN m.tipo = 'egreso' THEN m.monto ELSE 0 END), 0) AS sistema
FROM cajas c
LEFT JOIN movimiento__cajas m ON m.caja_id = c.id
WHERE c.id = :caja_id
GROUP BY c.id;
```

### 6.7.6 Tokens activos

```sql
SELECT id, tokenable_id, name, last_used_at, expires_at
FROM personal_access_tokens
WHERE (expires_at IS NULL OR expires_at > now())
ORDER BY last_used_at DESC NULLS LAST;
```

### 6.7.7 Pendientes de registro

```sql
SELECT correo, nombre, created_at
FROM registros_pendientes
WHERE created_at < now() - INTERVAL '24 hours';
```

## 6.8 Integridad y mantenimiento de datos

- No borre filas de `movimiento__cajas` para “cuadrar” una caja: rompe la trazabilidad. Use movimientos de ajuste autorizados.
- No modifique `factura_contadores` manualmente; puede generar números duplicados.
- No elimine `personal_access_tokens` de un usuario activo sin avisar: cerrará su sesión.
- Los soft delete no liberan espacio; `VACUUM` no elimina filas vivas.
- Las tablas de detalle sin `deleted_at` se borran físicamente; revise las FKs antes de un `DELETE` manual.

## 6.9 Checklist de operación

- [ ] Respaldo diario verificado.
- [ ] Restauración probada en un entorno aislado.
- [ ] `ANALYZE` programado.
- [ ] Alertas de espacio en disco y conexiones.
- [ ] Índices revisados tras cambios de consulta.
- [ ] Zona horaria y NTP correctos.
- [ ] `storage/app/public/eventos` incluido en el respaldo.
- [ ] Credenciales de base rotadas según política.

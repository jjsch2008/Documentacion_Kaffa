# 28. Observabilidad y operación

Operar KAFFA requiere saber si la API responde, si la base está sana, si los correos salen y si el disco de imágenes crece. Este capítulo propone un conjunto mínimo de señales y runbooks.

## 28.1 Health checks

**Tabla.** _Health checks por nivel_

| Nivel | Qué comprobar | Cómo |
|---|---|---|
| Proceso | PHP-FPM/Nginx activos | `systemctl status` |
| HTTP | `GET /api/v1/health` con token | 200 `{"status":"ok"}` |
| Base | `SELECT 1` | `psql` o endpoint propio |
| Disco | espacio y permisos | `df -h`, `ls storage` |
| Correo | envío de prueba | `Mail::raw` |
| Cloudinary | subida de prueba | consola/API |

El endpoint `/health` actual **solo valida el token**. Para monitoreo real, añada un endpoint interno que compruebe base y almacenamiento, protegido por red o token.

## 28.2 Logs

```bash
tail -f storage/logs/laravel.log
tail -f /var/log/nginx/kaffa-error.log
tail -f /var/log/php8.2-fpm.log
```

Qué buscar:

- `ERROR` con stack trace.
- `No se pudo enviar el código de verificación`.
- `SQLSTATE` (conexión, deadlock, unique).
- `Token mismatch`/401 repetidos.
- `429` por throttle.

En producción use `LOG_CHANNEL=daily` y retención de 14–30 días. No registre tokens ni contraseñas.

## 28.3 Métricas recomendadas

**Tabla.** _Métricas recomendadas y alertas_

| Métrica | Fuente | Alerta |
|---|---|---|
| Latencia p95 API | Nginx/APM | > 1 s |
| Tasa 5xx | Nginx/APM | > 1% |
| Tasa 401/403 | Logs | Pico anómalo |
| Tasa 429 | Logs | Pico |
| Conexiones PostgreSQL | `pg_stat_activity` | > 80% |
| Espacio disco | `df` | > 80% |
| Tamaño `storage/app/public` | `du` | Crecimiento anómalo |
| Correos fallidos | Logs | > 0 |
| Deadlocks | PostgreSQL | > 0 recurrente |

## 28.4 Alertas mínimas

1. API no responde 2 minutos.
2. Base de datos inaccesible.
3. Disco > 85%.
4. Errores 5xx > 1% durante 5 min.
5. Fallos de correo > 3 en 10 min.
6. Backup diario no generado.

## 28.5 Backups y recuperación

**Tabla.** _Política de respaldos por activo_

| Activo | Frecuencia | Retención | Prueba |
|---|---|---|---|
| PostgreSQL | Diaria | 14–30 días | Restauración mensual |
| `storage/app/public/eventos` | Diaria | 30 días | Acceso a una imagen |
| `.env` | Por cambio | Cifrado | Recuperación en staging |
| Código | Por release | Git | Checkout de tag |
| OpenAPI | Por release | Git | Comparación |

Objetivos sugeridos:

- **RPO** (pérdida máxima de datos): 24 h o menos.
- **RTO** (tiempo de recuperación): 2–4 h.

Si el negocio no tolera perder un día de ventas, use WAL archiving/PITR.

## 28.6 Runbook: API caída

```text
1. Comprobar DNS/TLS.
2. systemctl status nginx php8.2-fpm postgresql.
3. Revisar logs de Nginx/PHP/Laravel.
4. Verificar conexión a PostgreSQL.
5. Verificar espacio en disco.
6. Si hay migración reciente, evaluar rollback.
7. Restaurar servicio y smoke test.
8. Registrar incidente y causa raíz.
```

## 28.7 Runbook: correos no llegan

```text
1. Revisar MAIL_* y que no esté MAIL_MAILER=log.
2. Probar SMTP con tinker.
3. Revisar logs de Brevo (rebotes, límites).
4. Verificar remitente y DNS/DKIM.
5. Revisar `codigos_otp` (existen, no expiraron).
6. Reenviar código y confirmar recepción.
```

## 28.8 Runbook: caja descuadrada

```text
1. Consultar caja y movimientos.
2. Recalcular sistema = apertura + ingresos - egresos.
3. Comparar con monto_cierre_fisico.
4. Revisar pagos no registrados o movimientos duplicados.
5. No editar movimientos a mano sin autorización.
6. Registrar ajuste y documentar.
```

## 28.9 Runbook: stock negativo o inconsistente

```text
1. Revisar insumo y recetas.
2. Consultar compras/mermas/ventas recientes.
3. Verificar que el listener DeducirInventario se ejecutó.
4. Si hay negativo, corregir con compra/merma de ajuste.
5. Revisar transacciones concurrentes/deadlocks.
```

## 28.10 Capacidad y crecimiento

- Revise mensualmente el tamaño de `pedidos`, `detalle__pedidos`, `movimiento__cajas` y `personal_access_tokens`.
- Archive datos históricos si las consultas se vuelven lentas.
- Depure tokens expirados:

```sql
DELETE FROM personal_access_tokens
WHERE expires_at IS NOT NULL AND expires_at < now() - interval '30 days';
```

- Depure pendientes antiguos (el servicio lo hace, pero puede forzarse).
- Monitoree la cuota de Cloudinary.

## 28.11 Documentación operativa

Mantenga un runbook vivo con:

- Contactos de responsables.
- Proveedores (Brevo, Cloudinary, hosting).
- Procedimiento de backup/restore.
- Credenciales en gestor de secretos.
- Historial de incidentes.
- Ventanas de mantenimiento.

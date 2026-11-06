# 29. Seguridad operativa

Este capítulo complementa el 11 con medidas de infraestructura y hábitos de operación. No sustituye un pentest.

## 29.1 Superficie de exposición

**Tabla.** _Superficie de exposición y riesgo_

| Elemento | Exposición | Riesgo |
|---|---|---|
| `/api/v1/*` | Público | Fuerza bruta, abuso, enumeración |
| `/docs/api` | Público si Scramble activo | Revela contrato |
| PostgreSQL 5432 | Debe ser interno | Acceso directo |
| `storage/app/public` | Público | Imágenes, no secretos |
| `.env` | Nunca público | Claves |
| Logs | Interno | Datos personales |
| Backups | Interno/cifrado | Fuga masiva |

## 29.2 Hardening del servidor

- Actualice SO, PHP, Nginx/Apache y PostgreSQL.
- Deshabilite servicios innecesarios.
- Use firewall (UFW/nftables/security group).
- SSH solo con clave, sin root directo.
- Fail2ban o equivalente para SSH/HTTP.
- `APP_DEBUG=false`.
- `expose_php=Off`.
- Cabeceras de seguridad: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy` (SPA).
- TLS moderno; deshabilite TLS 1.0/1.1.
- Rotación de logs.

## 29.3 Gestión de secretos

**Tabla.** _Gestión y rotación de secretos_

| Secreto | Dónde vive | Rotación |
|---|---|---|
| `APP_KEY` | `.env`/gestor | Rara; respaldar |
| `DB_PASSWORD` | `.env`/gestor | 90–180 días |
| `MAIL_PASSWORD` | `.env`/gestor | 90 días |
| `CLOUDINARY_API_SECRET` | Backend | 90–180 días |
| Tokens de usuario | BD | Expiración/revocación |
| Claves de backup | Gestor | 180 días |

Nunca incluya secretos en imágenes, repositorios, tickets o capturas. Si se filtran, rote de inmediato y revise accesos.

## 29.4 Seguridad de la base de datos

- Usuario dedicado, sin superusuario.
- `pg_hba.conf` restringido por red.
- TLS si hay red externa.
- Copias cifradas.
- Auditoría de accesos.
- No exponer 5432 a Internet.
- Revisar extensiones y permisos.

## 29.5 Seguridad de la API

- Tokens Bearer con expiración.
- Throttle por ruta.
- Validación de entrada con Form Requests.
- Policies y abilities.
- Respuestas JSON sin trazas.
- CORS restringido.
- No confiar en `role:` solo.
- No aceptar URLs de imágenes de dominios no permitidos.
- No permitir mass assignment: usar `validated()`.

## 29.6 Seguridad del frontend

- No guardar el API secret de Cloudinary.
- Sanitizar HTML del Asistente antes de renderizar.
- Evitar `dangerouslySetInnerHTML` con datos del usuario.
- CSP para mitigar XSS.
- HTTPS.
- No cachear tokens en logs del navegador.
- Cerrar sesión en equipos compartidos.

## 29.7 Respuesta a incidentes

```text
1. Contener: revocar tokens, bloquear IP, desactivar usuario.
2. Evaluar: logs, accesos, datos afectados.
3. Erradicar: parche, rotación de secretos.
4. Recuperar: restaurar servicio, verificar integridad.
5. Notificar: responsables/usuarios según normativa.
6. Documentar: causa raíz y acciones.
```

## 29.8 Checklist de auditoría trimestral

- [ ] `composer audit` y `pnpm audit` sin críticos.
- [ ] Usuarios inactivos revisados.
- [ ] Tokens expirados depurados.
- [ ] Permisos de base revisados.
- [ ] Backups restaurados en staging.
- [ ] Logs sin secretos.
- [ ] CORS y TLS verificados.
- [ ] Scramble desactivado.
- [ ] Dependencias de Cloudinary/Brevo rotadas.
- [ ] Pruebas de permisos por rol.

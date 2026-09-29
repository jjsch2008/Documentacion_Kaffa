# Guía de Contribución a la Documentación

Reglas para mantener esta documentación sincronizada con el código (principio de la skill: *la documentación es un artefacto vivo*).

## 1. Fuente de verdad por dominio

| Dominio | Documento canónico |
|---------|--------------------|
| Endpoints / API | `docs/03-api.md` + `docs/openapi.json` (generado) |
| Base de datos | `docs/02-base-datos.md` |
| Seguridad | `docs/05-seguridad.md` |
| Frontend | `docs/11-frontend.md` |
| Reglas de negocio por módulo | `docs/04-modulos.md` |
| Requisitos y trazabilidad | `docs/10-requisitos.md` |
| Especificación Android | `backend-kaffa/prompt_android_app.md` (**derivada**: si discrepa de `03-api.md`, rige `03-api.md`) |

Los READMEs de las aplicaciones son **resúmenes** que enlazan a `docs/`, no fuentes primarias. Nunca dupliques tablas completas de endpoints o esquemas: enlaza.

## 2. Cuándo actualizar (detección de deriva)

| Cambio en el código | Documentación a revisar |
|---------------------|-------------------------|
| Nueva ruta / endpoint o cambio de middleware | `03-api.md` + regenerar `openapi.json` + matriz RBAC + `prompt_android_app.md` |
| Nueva migración / columna / tabla | `02-base-datos.md` (+ diccionario y diagrama ER) |
| Nueva regla de negocio | `04-modulos.md`, `10-requisitos.md` |
| Cambio de roles/permisos/abilities | `05-seguridad.md`, `03-api.md`, `prompt_android_app.md` |
| Nueva pantalla/flujo en la SPA | `11-frontend.md`, `09-manual-usuario.md` |
| Cambio de dependencias/versiones | `01-arquitectura.md` |
| Instalación/configuración | `06-instalacion.md`, `07-despliegue.md` |
| Tests añadidos/eliminados | `08-pruebas.md`, matriz de `10-requisitos.md` |

## 3. Cómo regenerar OpenAPI

```bash
cd backend-kaffa
php artisan serve            # en un terminal
curl -s http://localhost:8000/docs/api.json -o ../docs/openapi.json
```

La UI navegable vive en `GET /docs/api` (desarrollo). En producción, desactivar con `SCRAMBLE_ENABLED=false`. Si cambias `config/scramble.php` (título, versión), regenera el archivo.

## 4. Normas de redacción

- **Solo afirmaciones verificadas** contra el código; lo no comprobado se marca `[NO VERIFICADO]`, lo pendiente `[GAP]`, lo propuesto `Recomendación`, y lo resuelto se documenta como tal en `05-seguridad.md`.
- **No citar números de línea** (se rompen con cada commit): citar archivos y símbolos (`PedidoService::crear`, alias `ability:`).
- **Numeración ICONTEC**: las tablas llevan rótulo «**Tabla N.** …» **encima** y las figuras «**Figura N.** …» **debajo** del diagrama, con numeración secuencial **por documento**. Al insertar/eliminar una tabla o figura, renumerar el resto del documento y actualizar los índices en `docs/README.md`.
- **Idioma**: español formal; terminología consistente (ver `glosario.md`).
- **Secretos**: nunca documentar credenciales reales; usar `<tu-contraseña>` y similares.

## 5. Historial

Cada cambio relevante se registra en `CHANGELOG.md` (fecha — resumen — documentos afectados). El estado de sincronización (fecha/commit) se actualiza en la tabla de `docs/README.md`.

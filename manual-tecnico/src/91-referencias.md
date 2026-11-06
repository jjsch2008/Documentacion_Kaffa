# 91. Referencias y control de versiones

## 91.1 Referencias técnicas

- LARAVEL. *Laravel 10.x Documentation*. https://laravel.com/docs/10.x
- LARAVEL. *Laravel Sanctum*. https://laravel.com/docs/10.x/sanctum
- THE POSTGRESQL GLOBAL DEVELOPMENT GROUP. *PostgreSQL Documentation*. https://www.postgresql.org/docs/
- PHP GROUP. *PHP Manual*. https://www.php.net/manual/
- DEDOC. *Scramble — OpenAPI generator for Laravel*. https://scramble.dedoc.co
- PHPUNIT PROJECT. *PHPUnit 10 Documentation*. https://phpunit.de
- CLOUDINARY. *Upload API*. https://cloudinary.com/documentation/upload_images
- BREVO. *SMTP Relay*. https://developers.brevo.com/docs/smtp-relay
- REACT. *React Documentation*. https://react.dev
- VITE. *Vite Documentation*. https://vite.dev
- ISO. *ISO 9001:2015 — Sistemas de gestión de la calidad. Requisitos*. https://www.iso.org
- ISO/IEC. *ISO/IEC 25010:2023 — Modelo de calidad de producto (SQuaRE)*. https://www.iso.org
- ISO/IEC. *ISO/IEC 27001:2022 — Sistemas de gestión de la seguridad de la información*. https://www.iso.org
- ISO/IEC. *ISO/IEC 27002:2022 — Controles de seguridad de la información*. https://www.iso.org
- ISO/IEC. *ISO/IEC 29119-1:2022 — Conceptos generales de pruebas de software*. https://www.iso.org
- ISO/IEC/IEEE. *ISO/IEC/IEEE 12207:2017 — Procesos del ciclo de vida del software*. https://www.iso.org
- ISO/IEC/IEEE. *ISO/IEC/IEEE 42010:2011 — Descripción de arquitectura*. https://www.iso.org
- ISO. *ISO 8601-1:2019 — Representación de fechas y horas*. https://www.iso.org
- ISO. *ISO 14289-1:2014 — PDF/UA: accesibilidad de documentos PDF*. https://www.iso.org
- ISO. *ISO 31000:2018 — Gestión del riesgo. Directrices*. https://www.iso.org

## 91.2 Documentos internos

**Tabla.** _Documentos internos del proyecto_

| Documento | Ruta |
|---|---|
| Arquitectura | `docs/01-arquitectura.md` |
| Base de datos | `docs/02-base-datos.md` |
| API | `docs/03-api.md` |
| Módulos | `docs/04-modulos.md` |
| Seguridad | `docs/05-seguridad.md` |
| Instalación | `docs/06-instalacion.md` |
| Despliegue | `docs/07-despliegue.md` |
| Pruebas | `docs/08-pruebas.md` |
| Requisitos | `docs/10-requisitos.md` |
| Frontend | `docs/11-frontend.md` |
| OpenAPI | `docs/openapi.json` |
| Glosario | `docs/glosario.md` |
| Cambios | `docs/CHANGELOG.md` |
| Contribución | `docs/CONTRIBUCION.md` |

## 91.3 Control de versiones del manual

**Tabla.** _Control de versiones del manual_

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | Octubre 2026 | Creación del manual consolidado del backend |
| 1.0 (rev. 2) | Noviembre 2026 | Corrección de diagramas y paginación, índice de tablas y capítulo 32 de calidad frente a normas ISO |

**Commit backend auditado:** `01fb00d` (`fix(turnos): fecha_fin opcional`).
**Documentación base:** `docs/` sincronizada al 16 de octubre de 2026.
**Entorno de auditoría:** PHP 8.5.11, PostgreSQL 18.6, Composer 2.10.3, Node 24.19.

## 91.4 Cómo mantenerlo

1. Actualice el capítulo afectado.
2. Regenere `openapi.json` si cambian rutas.
3. Ejecute `python3 build/gen_endpoints.py` si cambia la matriz.
4. Ejecute `node build/build-all.mjs`.
5. Revise el PDF y el índice.
6. Registre el cambio en este control de versiones.

> **Nota.** Este manual se generó a partir del código y de la documentación existente. Las afirmaciones no verificadas se marcaron como **Recomendación**, `[NO VERIFICADO]` o `[GAP]`. Si encuentra una discrepancia, prevalezca el código y actualice el manual.

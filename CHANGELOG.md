# Historial de Cambios de la Documentación

Registro cronológico de los cambios de esta documentación (no del código). Formato: fecha — resumen — documentos afectados.

| Fecha | Cambio | Documentos afectados |

**Tabla 1.** _Historial de cambios de la documentación_
|-------|--------|----------------------|
| 2026-09-28 | **Creación inicial**: auditoría completa del proyecto y generación de la documentación desde cero (arquitectura, BD, API, módulos, seguridad, instalación, despliegue, pruebas, manual, requisitos); auditoría y actualización de `prompt_android_app.md`; READMEs reales en backend y frontend | `docs/01`–`docs/10`, `docs/README.md`, `README.md`, `backend-kaffa/README.md`, `REACT_clean/REACT_kaffa/README.md`, `backend-kaffa/prompt_android_app.md` |
| 2026-09-28 | **Remediación de hallazgos + suite ampliada**: middleware `ability:` (validación de alcance de tokens), `.env.example` seguro por defecto (pgsql, `SANCTUM_EXPIRATION=1440`, CORS restringido, checklist de producción), `UserFactory` corregido, lockfile único (pnpm), limpieza de directorio vacío; **6 archivos de pruebas nuevos** (35 pruebas; suite total 58, 213 aserciones, ejecutada) | código (`routes/api.php`, `Kernel`, `AuthController`, `EnsureTokenCanAbility`, `UserFactory`, `.env.example`, `tests/Feature/*`) y `docs/05`, `docs/08`, `docs/10`, `docs/02`, `docs/06`, `docs/07`, `docs/01`, `docs/README.md`, READMEs, `prompt_android_app.md` |
| 2026-09-28 | **Nivel profesional + ICONTEC ligero**: especificación **OpenAPI generada con Scramble** (`docs/openapi.json`, 64 rutas, título/versión configurados); **fuente única** por dominio (API ⇒ `03-api.md`); nuevo `11-frontend.md`; referencias robustas (sin citas de línea); glosario, historial y guía de contribución; **portada, numeración «Tabla N»/«Figura N», índices de tablas/figuras y referencias estilo NTC** | `docs/openapi.json`, `docs/03`, `docs/04`, `docs/11`, `docs/glosario.md`, `docs/CHANGELOG.md`, `docs/CONTRIBUCION.md`, `docs/referencias.md`, `docs/README.md`, rótulos ICONTEC en `docs/01`–`docs/11`, `backend-kaffa/config/scramble.php` |

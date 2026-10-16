# Documentación Técnica — Proyecto KAFFA

<div align="center">

**SISTEMA POS PARA CAFETERÍA «KAFFA»**

*API REST Laravel 10 + PostgreSQL + Sanctum · SPA React 19 + Vite*

Documentación técnica, arquitectónica y funcional

**Autores:** Ana Maria Joaqui Conejo, Santiago Salamanca Muñoz, Juan José Sandoval Chávez

**Institución:** Servicio Nacional De Aprendizaje (SENA) · **Programa:** ADSO (3142101)

Popayán, Cauca — Colombia · 28 de septiembre de 2026

---

*Presentación del documento según la NTC 1486 [1], con referencias según NTC 5613 [2] (ver `referencias.md`). Limitación: al ser un documento Markdown, la tipografía, márgenes y espaciado de la norma no aplican; sí se aplican la portada, la numeración y títulos de tablas/figuras, los índices y el formato de referencias.*

</div>

## Estado de sincronización

**Tabla 1.** Estado de sincronización de la documentación.

| Aspecto | Valor |
|---------|-------|
| Fecha de sincronización con el código | 16 de octubre de 2026 |
| Commit backend auditado | `ecd1c66` (integración del backend móvil de `ana` sobre `main`/`parche_6`) |
| Commit frontend auditado | `bbcd709` (parche_seguridad_2) |
| Última ampliación (2026-10-16) | **Integración del backend móvil de `ana` (unificación web + móvil)**: catálogo público (categorías/productos) para el Home del invitado, módulo de **eventos** con `POST /eventos/imagen`, **Asistente KAFFA multi-rol y local** (`AsistenteService`), turnos con tipo `abierto` y rango `fecha_fin` (opcional), alias `roles[]` y códigos de negocio; se eliminan migraciones duplicadas; suite a **88 pruebas** |
| Método | Auditoría archivo por archivo (rutas, migraciones, modelos, controladores, servicios, middleware, seeders, tests, SPA) + pasadas de remediación y de nivel profesional/ICONTEC (2026-09-28) |
| Cambios aplicados en la remediación | Middleware `ability:`, `.env.example` seguro por defecto, `UserFactory` corregido, lockfile único (pnpm), suite ampliada de 23 a **58 pruebas**, especificación **OpenAPI (Scramble)**, fuente única por dominio y presentación ICONTEC ligera |
| Idioma | Español (convenciones técnicas profesionales + ICONTEC ligero) |

## Fuente de verdad por dominio

**Tabla 2.** Documento canónico de cada dominio (los READMEs de las aplicaciones y `prompt_android_app.md` son resúmenes o derivados que enlazan aquí).

| Dominio | Documento canónico |
|---------|--------------------|
| Endpoints / API | [`03-api.md`](03-api.md) + [`openapi.json`](openapi.json) (generado con Scramble [8]) |
| Base de datos | [`02-base-datos.md`](02-base-datos.md) |
| Seguridad | [`05-seguridad.md`](05-seguridad.md) |
| Frontend | [`11-frontend.md`](11-frontend.md) |
| Reglas de negocio por módulo | [`04-modulos.md`](04-modulos.md) |
| Requisitos y trazabilidad | [`10-requisitos.md`](10-requisitos.md) |
| Especificación Android (derivada) | `backend-kaffa/prompt_android_app.md` |

## Índice de documentos

**Tabla 3.** Índice de documentos de la suite.

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | [01-arquitectura.md](01-arquitectura.md) | Arquitectura desacoplada, stack con versiones verificadas, diagramas, flujos de autenticación y pedido. |
| 2 | [02-base-datos.md](02-base-datos.md) | Esquema PostgreSQL: 34 tablas, diccionario de datos, relaciones, índices y seeders. |
| 3 | [03-api.md](03-api.md) | Referencia canónica de la API `/api/v1` (fuente de verdad de endpoints), incluidos catálogo público, eventos y el Asistente KAFFA (§17). |
| 4 | [04-modulos.md](04-modulos.md) | Reglas de negocio por módulo (POS, caja, compras, turnos, eventos, chat, reportes, Asistente KAFFA…). |
| 5 | [05-seguridad.md](05-seguridad.md) | Autenticación, RBAC, abilities, verificación de correo, CORS, throttling y hallazgos. |
| 6 | [06-instalacion.md](06-instalacion.md) | Instalación de backend y frontend, requisitos y usuarios de prueba. |
| 7 | [07-despliegue.md](07-despliegue.md) | Entornos de desarrollo/producción y variables de entorno. |
| 8 | [08-pruebas.md](08-pruebas.md) | Inventario y resultados reales de la suite (88 pruebas). |
| 9 | [09-manual-usuario.md](09-manual-usuario.md) | Manual de uso por rol: visitante, cliente, barista y administrador. |
| 10 | [10-requisitos.md](10-requisitos.md) | Requisitos funcionales/no funcionales con matriz de trazabilidad. |
| 11 | [11-frontend.md](11-frontend.md) | SPA React: componentes, flujo de datos, estilos, sondeo y flujos. |
| — | [openapi.json](openapi.json) | Especificación OpenAPI 3.1 generada desde el código (Scramble). |
| — | [glosario.md](glosario.md) | Definiciones de términos del sistema y de la documentación. |
| — | [CHANGELOG.md](CHANGELOG.md) | Historial de cambios de esta documentación. |
| — | [CONTRIBUCION.md](CONTRIBUCION.md) | Guía para mantener la documentación sincronizada. |
| — | [referencias.md](referencias.md) | Referencias según NTC 5613 / ISO 690. |

## Lista de tablas

Numeración secuencial por documento (NTC 1486 [1]). Total: 83 tablas.

| Tablas | Documento | Títulos (resumen) |
|--------|-----------|-------------------|
| 1–3 | `01-arquitectura.md` | Stack del backend; dependencias del frontend; estructura de carpetas |
| 1–39 | `02-base-datos.md` | Inventarios de tablas (1–3); diccionarios de las 34 tablas (4–35); diccionarios de eventos y su galería (36–37); índices de rendimiento (38); seeders (39) |
| 1–19 | `03-api.md` | Convenciones; autenticación; errores de login; públicos (equipo/catálogo/eventos); eventos (gestión); catálogos; pedidos; pagos; facturas; caja; operativas; turnos; chat; reportes; usuarios/roles; matriz RBAC; códigos de error; throttling; Asistente KAFFA |
| 1–4 | `05-seguridad.md` | Throttling; mapeo de abilities; hallazgos (estado); otros hallazgos remediados |
| 1–3 | `06-instalacion.md` | Requisitos previos; usuarios de prueba; problemas comunes |
| 1 | `07-despliegue.md` | Variables de entorno del backend |
| 1–5 | `08-pruebas.md` | Frameworks; suite original; suite ampliada; Asistente KAFFA; eventos e integración móvil |
| 1–3 | `09-manual-usuario.md` | Pantallas públicas; panel barista; panel administrador |
| 1–3 | `10-requisitos.md` | Requisitos funcionales; no funcionales; matriz de trazabilidad |
| 1–3 | `11-frontend.md` | Dependencias; rutas de la SPA; intervalos de sondeo |

## Lista de figuras

Numeración secuencial por documento. Total: 8 figuras (diagramas Mermaid).

| Figuras | Documento | Título |
|---------|-----------|--------|
| 1–4 | `01-arquitectura.md` | Contexto del sistema; capas del backend; flujo de autenticación; flujo de pedido POS |
| 1 | `02-base-datos.md` | Diagrama entidad–relación del esquema KAFFA |
| 1 | `07-despliegue.md` | Topología de producción prevista |
| 1–2 | `11-frontend.md` | Componentes y flujo de datos; flujo de compra del cliente |

## Documentos por aplicación

**Tabla 4.** Documentos asociados a cada aplicación del repositorio.

| Aplicación | Documento | Nota |
|------------|-----------|------|
| `backend-kaffa/` | `README.md` | Guía de la API (resumen; la fuente de verdad es `docs/03-api.md`) |
| `REACT_clean/REACT_kaffa/` | `README.md` | Guía de la SPA (resumen; fuente de verdad: `docs/11-frontend.md`) |
| `backend-kaffa/` | `prompt_android_app.md` | Especificación derivada para una app Android |

## Convenciones de esta documentación

- **Fuente de verdad**: el código del proyecto. Cada afirmación se verifica contra archivos concretos (rutas, migraciones, controladores, etc.).
- Los pendientes se marcan `[NO VERIFICADO]` o `[GAP]`; las propuestas, como **Recomendación**; los hallazgos resueltos se documentan como tales (`05-seguridad.md`).
- No se citan números de línea (frágiles): se citan archivos y símbolos.
- Mantenimiento: ver `CONTRIBUCION.md`; historial en `CHANGELOG.md`; términos en `glosario.md`.

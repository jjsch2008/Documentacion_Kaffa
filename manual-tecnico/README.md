# Manual Técnico del Backend — fuentes

Este directorio contiene las fuentes y el pipeline reproducible del **Manual Técnico del Backend** del Sistema POS KAFFA.

## Resultado

El PDF final se publica en:

```text
docs/KAFFA_Manual_Tecnico_Backend_v1.0.pdf
```

## Estructura

```text
manual-tecnico/
├── src/                 Capítulos en Markdown y manifiesto
├── assets/              Logo e imágenes
├── styles/print.css     Hoja de estilos A4
├── data/                Rutas, OpenAPI y páginas calculadas del índice
├── build/               Scripts de generación y exportación
└── dist/                HTML/PDF intermedios (no versionar)
```

## Requisitos

- Node.js 20+ (probado con 24.19).
- Chromium/Chrome headless (el pipeline usa el binario de Playwright si está disponible).
- Ghostscript (`gs`) para unir y añadir metadatos.
- `pdfinfo`, `pdftotext` y `pdftoppm` (poppler-utils) para calcular el índice y validar.

## Instalación de dependencias

```bash
cd docs/manual-tecnico/build
npm install
```

Dependencias: `marked`, `mermaid`, `highlight.js`, `pagedjs` (legacy, no usado en la versión final).

## Generar el PDF

```bash
cd docs/manual-tecnico
node build/build-all.mjs
```

El script:

1. Genera `dist/cover.html`, `dist/body.html` y `dist/back.html`.
2. Exporta portada, cuerpo y contraportada con Chrome.
3. Calcula la página real de cada título leyendo `dist/body.pdf`.
4. Reimprime el cuerpo si el índice cambió.
5. Une los tres PDF con Ghostscript y añade metadatos.
6. Copia el resultado a `docs/KAFFA_Manual_Tecnico_Backend_v1.0.pdf`.

## Regenerar la matriz de endpoints

Si cambian las rutas:

```bash
cd backend-kaffa
php artisan route:list --path=api --json > ../docs/manual-tecnico/data/routes.json
curl -s http://localhost:8000/docs/api.json -o ../docs/manual-tecnico/data/openapi.json
cd ../docs/manual-tecnico
python3 build/gen_endpoints.py
node build/build-all.mjs
```

## Añadir o editar un capítulo

1. Cree o edite el `.md` en `src/`.
2. Añádalo a `src/manifest.json` si es nuevo.
3. Use encabezados `#` para capítulos y `##` para secciones.
4. Use bloques ```mermaid para diagramas.
5. Anteponga `**Tabla.** _Título de la tabla_` a cada tabla; el script asigna el número en orden de lectura y genera el índice de tablas.
6. Regenere el PDF.
7. Revise el índice general, el índice de tablas y las páginas.

## Convenciones

- Español formal.
- Sin secretos reales.
- Marcar `[NO VERIFICADO]`, `[GAP]` y **Recomendación**.
- Tablas con encabezado y columnas claras.
- Diagramas Mermaid con título debajo (`**Figura N.**`).

## Notas técnicas

- La portada y la contraportada se imprimen sin encabezado/pie y se unen al cuerpo.
- El cuerpo usa numeración `Página X de Y`; la portada no se numera.
- El índice general y el índice de tablas se calculan con `pdftotext` y se reimprimen hasta estabilizarse.
- Las tablas se numeran en orden de lectura; el número del fuente no se escribe a mano.
- Las ligaduras tipográficas están desactivadas a propósito: Ghostscript las reescribe al unir los PDF y rompe el texto extraíble.
- Ghostscript añade título, autor, asunto y palabras clave al PDF final.

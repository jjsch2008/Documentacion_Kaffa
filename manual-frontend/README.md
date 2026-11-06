# Manual del Frontend — Sistema POS KAFFA

Fuentes, capturas y pipeline reproducible del **Manual de Usuario del Frontend** de KAFFA (SPA React).

## Resultados

| Entrega | Ruta |
|---|---|
| PDF profesional A4 | [`../KAFFA_Manual_Frontend_v1.0.pdf`](../KAFFA_Manual_Frontend_v1.0.pdf) |
| Sitio interactivo offline (ZIP) | [`../KAFFA_Manual_Frontend_Interactivo_v1.0.zip`](../KAFFA_Manual_Frontend_Interactivo_v1.0.zip) |
| Sitio abierto desde el repositorio | [`dist/index.html`](dist/index.html) |

El sitio interactivo se abre con doble clic, sin servidor ni internet. Incluye búsqueda, filtros por rol, capturas con puntos anotados, recorridos guiados, listas de verificación con progreso, autoevaluación, glosario y tema claro/oscuro.

## Estructura

```text
manual-frontend/
├── src/                     Capítulos en Markdown (fuente única)
├── assets/
│   ├── capturas/            Capturas originales en PNG (generadas por capture.mjs)
│   └── fuentes/             Poppins en WOFF2 (para que el PDF sea reproducible)
├── data/
│   ├── hotspots.json        Puntos numerados de cada captura (x%, y%, título, texto)
│   ├── tokens.json          Tokens de demostración (solo entorno local)
│   ├── toc-pages.json       Página calculada de cada capítulo
│   └── capturas.json        Resultado de la última captura
├── styles/
│   ├── manual.css           Estilos del sitio interactivo
│   └── print.css            Estilos A4 del PDF
├── build/
│   ├── build-all.mjs        Orquesta todo
│   ├── prepare-images.mjs   PNG → JPG optimizado
│   ├── render.mjs           Markdown → sitio + cuerpo imprimible
│   ├── client.js            Comportamiento del sitio interactivo
│   ├── print.mjs            HTML → PDF con Chrome (CDP)
│   ├── compute-toc.mjs      Calcula las páginas reales del índice
│   ├── capture.mjs          Captura la SPA real (Chrome headless)
│   ├── cdp.mjs              Cliente mínimo de Chrome DevTools Protocol
│   ├── seed-demo.php        Datos ficticios para las capturas
│   └── faketime.php         Reloj fijo para las capturas (no es backend)
└── dist/                    Salida generada (se puede borrar y regenerar)
```

## Requisitos

- Node.js 20+ (probado con 24.19).
- Chromium de Playwright en `~/.cache/ms-playwright/chromium-1234/` (o `CHROME_BIN`).
- Ghostscript (`gs`), `pdfinfo`, `pdftotext` y `pdftoppm` (poppler-utils).
- ImageMagick (`magick`).
- Para regenerar capturas: PHP 8+, PostgreSQL y las dependencias del backend (`vendor/`).

## Generar el PDF y el sitio

```bash
cd docs/manual-frontend/build
npm install

cd ..
node build/build-all.mjs
```

El comando:

1. Optimiza las capturas a JPG (1440 px, calidad 87).
2. Renderiza `dist/index.html`, `dist/body.html`, `dist/cover.html` y `dist/back.html`.
3. Exporta portada, cuerpo y contraportada con Chrome.
4. Calcula la página real de cada capítulo leyendo `dist/body.pdf` y repite si el índice cambió.
5. Une los tres PDF y añade metadatos con `pdf-lib`, sin recomprimir las capturas (~7,2 MB, 126 páginas).
6. Copia el PDF al sitio y crea el ZIP interactivo.

## Editar el contenido

- Los capítulos están en `src/*.md`. Cada `#` abre una parte y cada `##` un capítulo.
- Capturas: `![Figura 8.1. Texto de la leyenda](assets/capturas/p03-menu.png)`.
- Avisos:
  ```markdown
  ::: consejo
  Texto del consejo.
  :::
  ```
  Tipos: `consejo`, `cuida`, `error`, `nota`.
- Autoevaluación:
  ```markdown
  ::: quiz
  ¿Pregunta?|Respuesta correcta|Opción incorrecta|Opción incorrecta|0|Explicación
  :::
  ```
  El último número antes de la explicación es el índice de la respuesta correcta (0 = primera). El render rota las opciones para que no sea siempre la A.
- Puntos de una captura: `data/hotspots.json`, clave = nombre del archivo PNG. `x`/`y` en porcentaje.
- Después de editar, vuelve a ejecutar `node build/build-all.mjs`. Si cambian las capturas, ejecuta antes `node build/capture.mjs`.

## Ajustar la posición de los números

Si un número de una captura quedó desviado, no hace falta editar el JSON a mano:

1. Ejecuta `node build/render.mjs` (o `node build/build-all.mjs`).
2. Abre `dist/editor.html` en Chrome.
3. Arrastra cada número sobre el campo o botón que describe. Con las flechas se afina (0,5 %; `Shift` = 0,1 %).
4. Pulsa **Descargar posiciones**. Se descarga `hotspots.json`.
5. Reemplaza `data/hotspots.json` por ese archivo.
6. Ejecuta `node build/build-all.mjs` para regenerar el PDF y el sitio estático.

El editor solo existe en `dist/editor.html`; `build-all.mjs` lo excluye del ZIP final. Los cambios se guardan en `localStorage` mientras trabajas, así que puedes cerrar y continuar después.

## Regenerar las capturas

Las capturas se toman de la aplicación real con una base de demostración, **nunca de la base de producción**.

```bash
# 1. Clonar la base (ejemplo)
dropdb -U postgres -h 127.0.0.1 --if-exists kaffa_manual
createdb -U postgres -h 127.0.0.1 kaffa_manual
pg_dump -U postgres -h 127.0.0.1 kaffa | psql -U postgres -h 127.0.0.1 -d kaffa_manual

# 2. Migrar y sembrar datos base + datos ricos del manual
cd backend-kaffa
DB_DATABASE=kaffa_manual php artisan migrate:fresh --seed --force
DB_DATABASE=kaffa_manual php -d auto_prepend_file=../docs/manual-frontend/build/faketime.php \
  ../docs/manual-frontend/build/seed-demo.php

# 3. Levantar backend demo (reloj fijo y sin rate limit) y Vite
cd public
DB_DATABASE=kaffa_manual CACHE_DRIVER=array \
  php -d auto_prepend_file=../../docs/manual-frontend/build/faketime.php \
  -S 127.0.0.1:8000 \
  ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php

cd ../../REACT_clean/REACT_kaffa
pnpm dev --host 127.0.0.1 --port 5173

# 4. Capturar
cd ../../docs/manual-frontend
node build/tokens.mjs
node build/capture.mjs
```

`faketime.php` fija el reloj en el 22/10/2026, 10:30 a. m. (America/Bogota), dentro del turno de la mañana. `CACHE_DRIVER=array` evita el límite de 60 peticiones por minuto mientras se capturan las pantallas.

## Convenciones del documento

- Los datos de las capturas son ficticios (`@kaffa.com`, pedidos y montos de ejemplo).
- La portada y la contraportada no se numeran. Los números del índice corresponden al cuerpo; si el visor cuenta desde la portada, se suma 1.
- El PDF se une con `pdf-lib` para conservar la calidad y el color original de la portada y de las capturas. Los textos y gráficas son vectoriales; las capturas se mantienen a 1440 px.
- Las promociones del frontend se guardan en `localStorage`, no en la base de datos. El manual lo advierte en el capítulo 44.
- El manual se verificó contra el código y la aplicación en ejecución; no contra `docs/09-manual-usuario.md`, que está desactualizado en varios puntos (por ejemplo, el panel del administrador tiene 19 secciones, no 17).

## Validación rápida

```bash
pdfinfo ../KAFFA_Manual_Frontend_v1.0.pdf | grep -E "Pages|File size"
pdftotext -f 2 -l 4 -layout ../KAFFA_Manual_Frontend_v1.0.pdf - | head
unzip -l ../KAFFA_Manual_Frontend_Interactivo_v1.0.zip | tail
```

#!/usr/bin/env node
/**
 * Construye los tres documentos HTML del Manual Técnico KAFFA:
 *   dist/cover.html  -> portada a sangre
 *   dist/body.html   -> preliminares, índice y capítulos (paginado por Chrome)
 *   dist/back.html   -> contraportada a sangre
 *
 * El índice usa números de página calculados por compute-toc.mjs a partir
 * del PDF del cuerpo. Si aún no existen, muestra "—" y la primera pasada
 * sirve para calcularlos.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'dist');

const manifest = JSON.parse(await readFile(path.join(root, 'src/manifest.json'), 'utf8'));
const read = (p) => readFile(path.join(root, p), 'utf8');

let tocPages = {};
try {
  tocPages = JSON.parse(await readFile(path.join(root, 'data/toc-pages.json'), 'utf8'));
} catch { /* primera pasada */ }

marked.setOptions({ gfm: true, breaks: false });

function decodeEntities(s) {
  return s
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'seccion';
}

function addHeadingIds(html) {
  const used = new Map();
  return html.replace(/<h([1-3])>([\s\S]*?)<\/h\1>/g, (m, level, inner) => {
    const plain = inner.replace(/<[^>]+>/g, '').trim();
    let id = `sec-${slugify(plain)}`;
    const count = used.get(id) || 0;
    used.set(id, count + 1);
    if (count) id = `${id}-${count + 1}`;
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
}

function classifyCallouts(html) {
  return html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (m, inner) => {
    const text = inner.replace(/<[^>]+>/g, ' ').trim();
    let cls = 'note';
    let label = 'Nota';
    if (/^(⚠|Advertencia|ATENCIÓN|Atención)/i.test(text)) { cls = 'warning'; label = 'Advertencia'; }
    else if (/^(Recomendación|RECOMENDACIÓN)/i.test(text)) { cls = 'recommend'; label = 'Recomendación'; }
    else if (/^(Verificado|✔)/i.test(text)) { cls = 'verified'; label = 'Verificado'; }
    else if (/\[NO VERIFICADO\]|\[GAP\]/i.test(text)) { cls = 'pending'; label = 'Trazabilidad'; }
    return `<div class="callout ${cls}"><span class="callout-label">${label}</span>${inner}</div>`;
  });
}

function renderMarkdown(md) {
  let html = marked.parse(md);
  html = html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (m, code) => `<figure class="diagram"><pre class="mermaid">${decodeEntities(code)}</pre></figure>`,
  );
  html = addHeadingIds(html);
  html = classifyCallouts(html);
  html = html.replace(/<table>([\s\S]*?)<\/table>/g, (m, inner) => {
    const isMatrix = inner.includes('<th>Método</th>') && inner.includes('<th>Endpoint</th>');
    return `<div class="table-wrap"><table${isMatrix ? ' class="matrix"' : ''}>${inner}</table></div>`;
  });
  // El rótulo "**Tabla.** _Título_" se convierte en atributo del contenedor;
  // la numeración definitiva se asigna después, en orden de lectura.
  html = html.replace(
    /<p><strong>Tabla(?: \d+)?\.<\/strong>\s*<em>([\s\S]*?)<\/em><\/p>\s*<div class="table-wrap">/g,
    (m, titleHtml) => `<div class="table-wrap" data-table-title="${encodeURIComponent(titleHtml)}">`,
  );
  return html;
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function wrapFigures(html) {
  // Figura + pie de figura: nunca se separan.
  html = html.replace(
    /(<figure class="diagram">[\s\S]*?<\/figure>)\s*(<p>(?:<strong>)?[Ff]igura[\s\S]*?<\/p>)?/g,
    (m, fig, cap = '') => `<div class="keep-together">${fig}${cap}</div>`,
  );
  // Encabezado + figura: evita títulos huérfanos al final de página.
  // El contenido del encabezado no puede contener otro cierre </hN>, o el
  // regex se extiende hasta una figura posterior y encierra media sección.
  html = html.replace(
    /(<h([234])[^>]*>(?:(?!<\/h\2>)[\s\S])*?<\/h\2>)\s*(<div class="keep-together">[\s\S]*?<\/div>)/g,
    (m, heading, level, block) => `<div class="keep-together">${heading}${block}</div>`,
  );
  return html;
}

const chapters = [];
const tableToc = [];
let tableNumber = 0;
for (const item of manifest.chapters) {
  const md = await read(path.join('src', item.file));
  let html = renderMarkdown(md);

  html = html.replace(/<div class="table-wrap"([^>]*)>([\s\S]*?)<\/table><\/div>/g, (m, attrs, tableHtml) => {
    tableNumber += 1;
    const match = attrs.match(/data-table-title="([^"]*)"/);
    const titleHtml = match ? decodeURIComponent(match[1]) : '';
    const title = stripTags(titleHtml);
    tableToc.push({
      num: tableNumber,
      id: `tabla-${tableNumber}`,
      title,
      chapter: item.number || '',
      chapterTitle: item.title || '',
    });
    // Las tablas cortas no se parten al final de página; las largas sí pueden
    // continuar, con el encabezado repetido.
    const rows = (tableHtml.match(/<tr>/g) || []).length;
    const keepClass = rows <= 8 ? ' keep' : '';
    return `<div class="table-block${keepClass}"><p class="table-caption" id="tabla-${tableNumber}"><span class="table-caption-label">Tabla ${tableNumber}.</span> <em>${titleHtml}</em></p>\n<div class="table-wrap">${tableHtml}</table></div></div>`;
  });

  html = wrapFigures(html);

  chapters.push({
    number: item.number || '',
    title: item.title || '',
    html,
  });
}

const frontmatterHtml = renderMarkdown(await read('src/00-frontmatter.md'));
let bodyHtml = chapters
  .map((c) => `<section class="chapter" data-chapter="${c.number}" data-title="${c.title}">\n${c.html}\n</section>`)
  .join('\n');

// Índice: h1 y h2 de los capítulos.
const toc = [];
for (const m of bodyHtml.matchAll(/<h([12]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)) {
  const level = Number(m[1]);
  const title = m[3].replace(/<[^>]+>/g, '').trim();
  toc.push({ level, id: m[2], title });
}
await writeFile(path.join(outDir, 'toc.json'), JSON.stringify(toc, null, 2));
await writeFile(path.join(outDir, 'table-toc.json'), JSON.stringify(tableToc, null, 2));

const tocHtml = `<nav class="toc" aria-label="Índice general">
  <h2 class="toc-title">Índice general</h2>
  <p class="toc-note">Los números de página corresponden a la paginación del cuerpo del manual (la portada no se numera).</p>
  <ol class="toc-list">
    ${toc.map((t) => `<li class="toc-l${t.level}"><a href="#${t.id}"><span class="toc-text">${t.title}</span><span class="toc-page">${tocPages[t.id] ?? '—'}</span></a></li>`).join('\n')}
  </ol>
  <p class="toc-end">Fin del índice</p>
</nav>`;

let tablePages = {};
try {
  tablePages = JSON.parse(await readFile(path.join(root, 'data/table-pages.json'), 'utf8'));
} catch { /* primera pasada */ }

const tableGroups = [];
for (const entry of tableToc) {
  const last = tableGroups[tableGroups.length - 1];
  if (!last || last.chapter !== entry.chapter) {
    tableGroups.push({ chapter: entry.chapter, chapterTitle: entry.chapterTitle, items: [] });
  }
  tableGroups[tableGroups.length - 1].items.push(entry);
}

const tableTocHtml = `<nav class="toc table-toc" aria-label="Índice de tablas">
  <h2 class="toc-title">Índice de tablas</h2>
  <p class="toc-note">Las tablas se numeran en orden de lectura. La página indicada es la del cuerpo del manual.</p>
  ${tableGroups.map((group) => `<div class="table-toc-group">
    <p class="table-toc-chapter">Capítulo ${group.chapter}. ${group.chapterTitle}</p>
    <ul class="table-toc-list">
      ${group.items.map((t) => `<li><a href="#${t.id}"><span class="table-toc-num">Tabla ${t.num}.</span><span class="table-toc-text">${t.title}</span><span class="toc-page">${tablePages[t.id] ?? '—'}</span></a></li>`).join('\n')}
    </ul>
  </div>`).join('\n')}
  <p class="toc-end">Fin del índice de tablas</p>
</nav>`;

const assets = {
  logo: `data:image/jpeg;base64,${(await readFile(path.join(root, 'assets/logo_kaffa.jpg'))).toString('base64')}`,
  mermaid: await read('build/node_modules/mermaid/dist/mermaid.min.js'),
  highlight: await read('build/node_modules/@highlightjs/cdn-assets/highlight.min.js'),
};
const css = await read('styles/print.css');

const cover = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<title>Portada — Manual Técnico del Backend KAFFA</title>
<meta name="author" content="Ana Maria Joaqui Conejo; Santiago Salamanca Muñoz; Juan José Sandoval Chávez">
<style>${css}
@page { size: A4; margin: 0; }
body { margin: 0; }
</style></head>
<body>
<section class="cover">
  <div class="cover-noise"></div>
  <div class="cover-top">
    <span class="cover-kicker">SENA · ADSO 3142101</span>
    <span class="cover-edition">Edición 1.0 · 2026</span>
  </div>
  <div class="cover-main">
    <div class="cover-logo"><img src="${assets.logo}" alt="Logotipo de KAFFA Café"></div>
    <p class="cover-eyebrow">Documentación técnica oficial</p>
    <h1 class="cover-title">Manual Técnico<br><em>del Backend</em></h1>
    <p class="cover-subtitle">Sistema POS KAFFA · API REST Laravel 10 + PostgreSQL</p>
    <div class="cover-rule"></div>
    <p class="cover-description">Arquitectura, instalación, base de datos, seguridad, servicios internos,<br>referencia completa de la API y operación en producción.</p>
  </div>
  <div class="cover-bottom">
    <div class="cover-authors">
      <span class="cover-label">Autores</span>
      Ana Maria Joaqui Conejo<br>
      Santiago Salamanca Muñoz<br>
      Juan José Sandoval Chávez
    </div>
    <div class="cover-meta">
      <span class="cover-label">Institución</span>
      Servicio Nacional de Aprendizaje — SENA<br>
      Programa ADSO · Popayán, Cauca<br>
      Octubre de 2026
    </div>
  </div>
</section>
<script>window.__KAFFA_READY = true;</script>
</body></html>`;

const body = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<title>Manual Técnico del Backend — Sistema POS KAFFA</title>
<meta name="author" content="Ana Maria Joaqui Conejo; Santiago Salamanca Muñoz; Juan José Sandoval Chávez">
<meta name="description" content="Manual técnico del backend Laravel 10 + PostgreSQL del sistema POS KAFFA: arquitectura, instalación, base de datos, seguridad, API y operación.">
<meta name="keywords" content="KAFFA, Laravel, PostgreSQL, API REST, POS, manual técnico, Sanctum">
<style>${css}</style>
</head>
<body>
<section class="frontmatter" data-title="Control documental">
${frontmatterHtml}
${tocHtml}
${tableTocHtml}
</section>
${bodyHtml}
<script>${assets.mermaid}</script>
<script>${assets.highlight}</script>
<script>
(async () => {
  try {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((img) =>
      img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; })
    ));
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'Noto Sans, Liberation Sans, sans-serif',
      themeVariables: {
        primaryColor: '#f7f1e8',
        primaryTextColor: '#2b1b12',
        primaryBorderColor: '#39a900',
        lineColor: '#6b4c35',
        secondaryColor: '#e8f0e0',
        tertiaryColor: '#fffaf2',
        fontSize: '13px'
      },
      flowchart: { htmlLabels: true, curve: 'basis', useMaxWidth: true, nodeSpacing: 26, rankSpacing: 34 },
      sequence: { useMaxWidth: true, wrap: true },
      er: { useMaxWidth: true }
    });
    await mermaid.run({ querySelector: '.mermaid' });
    document.querySelectorAll('pre code').forEach((el) => {
      if (!el.classList.contains('language-mermaid')) {
        try { hljs.highlightElement(el); } catch (e) { console.warn(e); }
      }
    });
    window.__KAFFA_READY = true;
  } catch (error) {
    console.error(error);
    window.__KAFFA_ERROR = String(error && error.stack || error);
  }
})();
</script>
</body></html>`;

const back = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<title>Cierre — Manual Técnico del Backend KAFFA</title>
<style>${css}
@page { size: A4; margin: 0; }
body { margin: 0; }
</style></head>
<body>
<section class="backcover">
  <div class="backcover-inner">
    <img src="${assets.logo}" alt="KAFFA" class="backcover-logo">
    <h2>Fin del documento</h2>
    <p>Manual verificado contra el código fuente del backend.</p>
    <p>Para actualizarlo, consulte <strong>docs/manual-tecnico/README.md</strong><br>
    y regenere el PDF con el script de construcción.</p>
    <div class="backcover-rule"></div>
    <p class="backcover-small">KAFFA · Manual Técnico del Backend · Versión 1.0 · Octubre de 2026</p>
  </div>
</section>
<script>window.__KAFFA_READY = true;</script>
</body></html>`;

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'cover.html'), cover, 'utf8');
await writeFile(path.join(outDir, 'body.html'), body, 'utf8');
await writeFile(path.join(outDir, 'back.html'), back, 'utf8');
console.log(`HTML generado: ${chapters.length} capítulos · ${toc.length} entradas de índice · ${tableToc.length} tablas`);

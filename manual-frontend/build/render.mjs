#!/usr/bin/env node
/**
 * Genera el manual del frontend KAFFA en dos sabores desde la misma fuente:
 *   dist/index.html  → manual interactivo (se abre con doble clic)
 *   dist/body.html   → cuerpo imprimible para el PDF
 *   dist/cover.html  → portada A4
 *   dist/back.html   → contraportada A4
 *
 * También produce dist/toc.json con la lista de títulos para calcular páginas.
 */
import { readFile, writeFile, mkdir, cp, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const srcDir = path.join(root, 'src');

const SRC_FILES = [
  '10-inicio.md',
  '20-cliente.md',
  '30-barista.md',
  '40-admin-a.md',
  '41-admin-b.md',
  '50-ayuda.md',
];

let hotspots = {};
try { hotspots = JSON.parse(await readFile(path.join(root, 'data/hotspots.json'), 'utf8')); } catch { /* opcional */ }
let tocPages = {};
try { tocPages = JSON.parse(await readFile(path.join(root, 'data/toc-pages.json'), 'utf8')); } catch { /* primera pasada */ }

marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });

// ── Utilidades ───────────────────────────────────────────────────────────────
const decode = (s) => s
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"').replaceAll('&#39;', "'")
  .replaceAll('&amp;', '&');

const stripTags = (s) => decode(String(s).replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

function slugify(text, max = 70) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max) || 'seccion';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Bloques propios: callouts y quiz ─────────────────────────────────────────
const CALLOUT_META = {
  consejo: { title: 'Consejo', icon: '💡', cls: 'tip' },
  cuida: { title: 'Cuidado', icon: '⚠️', cls: 'warn' },
  error: { title: 'Qué hacer', icon: '⛔', cls: 'danger' },
  nota: { title: 'Nota', icon: 'ℹ️', cls: 'note' },
};

function renderInlineBlocks(md) {
  const blocks = [];
  const placeholders = [];
  // ::: tipo ... :::
  let out = md.replace(/^::: (consejo|cuida|error|nota)[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm, (m, kind, inner) => {
    const meta = CALLOUT_META[kind];
    const body = marked.parse(inner.trim());
    const token = `@@BLOCK${blocks.length}@@`;
    blocks.push(`<aside class="callout ${meta.cls}" data-kind="${kind}">
      <div class="callout-head"><span class="callout-icon" aria-hidden="true">${meta.icon}</span><span>${meta.title}</span></div>
      <div class="callout-body">${body}</div>
    </aside>`);
    return token;
  });

  // ::: quiz  (una pregunta por línea: pregunta|correcta|incorrecta|incorrecta|índice|explicación)
  out = out.replace(/^::: quiz[ \t]*\n([\s\S]*?)\n:::[ \t]*$/gm, (m, inner) => {
    const rows = inner.split('\n').map((l) => l.trim()).filter(Boolean).map((line, qi) => {
      const [q, ...rest] = line.split('|').map((s) => s.trim());
      const correctIndex = Number(rest[3]) || 0;
      const options = rest.slice(0, 3);
      const explanation = rest[4] || '';
      // Rotar las opciones para que la respuesta correcta no sea siempre la A.
      const shift = qi % options.length;
      const rotated = [...options.slice(shift), ...options.slice(0, shift)];
      const newCorrect = (correctIndex - shift + options.length) % options.length;
      return { q, options: rotated, correctIndex: newCorrect, explanation };
    });
    const html = rows.map((r, qi) => `
      <div class="quiz-q" data-correct="${r.correctIndex}" data-q="${qi}">
        <p class="quiz-title"><span class="quiz-num">${qi + 1}.</span> ${esc(r.q)}</p>
        <div class="quiz-options">
          ${r.options.map((o, oi) => `<button type="button" class="quiz-opt" data-i="${oi}"><span class="quiz-letter">${'ABC'[oi] || oi + 1}</span>${esc(o)}</button>`).join('')}
        </div>
        <p class="quiz-feedback" hidden></p>
        <p class="quiz-explanation" hidden>${esc(r.explanation)}</p>
      </div>`).join('');
    const key = rows.map((r, i) => `${i + 1}-${'ABC'[r.correctIndex] || r.correctIndex + 1}`).join(' · ');
    const token = `@@BLOCK${blocks.length}@@`;
    blocks.push(`<div class="quiz" data-quiz>
      <div class="quiz-head"><span aria-hidden="true">🎯</span> Ponte a prueba</div>
      ${html}
      <p class="quiz-key">Respuestas: ${key}</p>
      <p class="quiz-score" hidden></p>
    </div>`);
    return token;
  });

  out = marked.parse(out);
  blocks.forEach((html, i) => { out = out.replace(`@@BLOCK${i}@@`, html); });
  return out;
}

// ── Metadatos de figuras ─────────────────────────────────────────────────────
let figCounter = 0;
function figureHtml(src, alt, chapterId) {
  figCounter += 1;
  const file = src.split('/').pop();
  const jpgSrc = src.replace(/\.png$/i, '.jpg');
  const pins = hotspots[file] || [];
  const labelMatch = alt.match(/^(Figura\s+[\d.]+)\.?\s*(.*)$/i);
  const label = labelMatch ? labelMatch[1] : '';
  const caption = labelMatch ? labelMatch[2] : alt;
  const figId = `fig-${slugify(file.replace(/\.png$/, ''))}-${figCounter}`;
  const pinHtml = pins.map((p, i) => `
    <button type="button" class="pin" style="left:${p.x}%;top:${p.y}%"
      data-n="${i + 1}" data-title="${esc(p.title)}" data-text="${esc(p.text)}"
      aria-label="Punto ${i + 1}: ${esc(p.title)}">${i + 1}</button>`).join('');
  const legend = pins.length ? `
    <ol class="pin-legend">
      ${pins.map((p, i) => `<li data-n="${i + 1}"><span class="pin-num">${i + 1}</span><span><b>${esc(p.title)}.</b> ${esc(p.text)}</span></li>`).join('')}
    </ol>` : '';
  return `<figure class="shot${file.includes('-movil') ? ' phone' : ''}" id="${figId}" data-figure="${esc(file)}">
    <div class="shot-frame">
      <img src="${jpgSrc}" alt="${esc(caption)}" loading="lazy">
      ${pins.length ? `<div class="pins">${pinHtml}</div>` : ''}
      <button type="button" class="shot-zoom" aria-label="Ampliar imagen">⤢</button>
    </div>
    <figcaption>${label ? `<span class="fig-label">${esc(label)}</span>` : ''}<span>${esc(caption)}</span></figcaption>
    ${legend}
    ${pins.length ? `<button type="button" class="tour-btn"><span aria-hidden="true">▶</span> Recorrer esta pantalla</button>` : ''}
  </figure>`;
}

function postProcess(html, chapterId) {
  // Imágenes sueltas → figura con pines.
  html = html.replace(/<p><img\s+src="([^"]+)"\s+alt="([^"]*)"\s*\/?><\/p>/g,
    (m, src, alt) => figureHtml(src, alt, chapterId));

  // Tablas responsivas.
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');

  // IDs de secciones y enlaces externos.
  let sec = 0;
  html = html.replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g, (m, level, inner) => {
    sec += 1;
    const id = `${chapterId}-s${sec}-${slugify(stripTags(inner))}`;
    const anchor = level === '3' ? `<a class="sec-anchor" href="#${id}" aria-label="Enlace a esta sección">#</a>` : '';
    return `<h${level} id="${id}">${anchor}${inner}</h${level}>`;
  });

  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener noreferrer"');
  return html;
}

// ── Lectura y división en partes/capítulos ───────────────────────────────────
const raw = (await Promise.all(SRC_FILES.map((f) => readFile(path.join(srcDir, f), 'utf8')))).join('\n\n');
const html = renderInlineBlocks(raw);

const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
const parts = [];

for (let i = 0; i < h1s.length; i++) {
  const m = h1s[i];
  const title = stripTags(m[1]);
  const start = m.index + m[0].length;
  const end = i + 1 < h1s.length ? h1s[i + 1].index : html.length;
  const partHtml = html.slice(start, end);
  const h2s = [...partHtml.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)];
  const chapters = [];

  for (let j = 0; j < h2s.length; j++) {
    const h2 = h2s[j];
    const cTitle = stripTags(h2[1]);
    const cStart = h2.index + h2[0].length;
    const cEnd = j + 1 < h2s.length ? h2s[j + 1].index : partHtml.length;
    const body = partHtml.slice(cStart, cEnd);

    let num = '';
    let display = cTitle;
    const numbered = cTitle.match(/^(\d+)\.\s*(.*)$/);
    const annex = cTitle.match(/^Anexo\s+([A-Z])\.?\s*(.*)$/i);
    if (numbered) {
      num = numbered[1];
      display = numbered[2];
    } else if (annex) {
      num = `Anexo ${annex[1].toUpperCase()}`;
      display = annex[2];
    }

    const id = num.startsWith('Anexo')
      ? `anexo-${num.split(' ')[1].toLowerCase()}`
      : num ? `cap-${num}` : `prel-${slugify(display)}`;

    chapters.push({
      id,
      num,
      label: num ? (/^\d+$/.test(num) ? `Cap. ${num}` : num) : '',
      display,
      heading: cTitle,
      html: postProcess(body, id),
      partIndex: i,
      index: chapters.length,
    });
  }
  parts.push({ index: i, title: i === 0 ? 'Antes de empezar' : title, chapters });
}

// Roles por capítulo (para los filtros del sitio).
function rolesFor(ch) {
  if (/^Anexo/.test(ch.num)) return ['todos'];
  const n = Number(ch.num);
  if (!n) return ['todos'];
  if (n >= 7 && n <= 17) return ['visitante', 'cliente'];
  if (n >= 18 && n <= 27) return ['barista'];
  if (n >= 28 && n <= 47) return ['admin'];
  return ['todos'];
}

const allChapters = parts.flatMap((p) => p.chapters.map((c) => ({ ...c, partTitle: p.title, roles: rolesFor(c) })));
allChapters.forEach((c) => {
  const clean = c.html
    .replace(/<a class="sec-anchor"[^>]*>#<\/a>/g, '')
    .replace(/<\/(p|li|h[1-6]|tr|td|th|div|figcaption|aside|figure|blockquote)>/g, ' ');
  c.text = stripTags(clean);
  c.tocTitle = c.heading;
});

// ── Índice de búsqueda ───────────────────────────────────────────────────────
const searchIndex = allChapters.map((c) => ({
  id: c.id,
  title: c.heading,
  part: c.partTitle,
  text: c.text.slice(0, 12000),
}));

// ── Glosario (extraído del capítulo) ─────────────────────────────────────────
function parseGlossary() {
  const glos = allChapters.find((c) => c.id === 'prel-glosario');
  const terms = [];
  if (!glos) return terms;
  const rows = [...glos.html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  rows.forEach((r, i) => {
    if (i === 0 && /<th/.test(r[1])) return;
    const cells = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => stripTags(x[1]));
    if (cells.length >= 2) terms.push({ term: cells[0], def: cells[1] });
  });
  return terms;
}
const glossary = parseGlossary();

// ── Sidebar y contenido ──────────────────────────────────────────────────────
function sidebarHtml() {
  return parts.map((p) => {
    const chapters = p.chapters.map((c) => `
      <li class="nav-chapter" data-roles="${rolesFor(c).join(' ')}">
        <a href="#${c.id}" data-target="${c.id}">
          <span class="nav-num">${c.label || '·'}</span>
          <span class="nav-title">${esc(c.display)}</span>
          <span class="nav-check" aria-hidden="true">✓</span>
        </a>
      </li>`).join('');
    return `<section class="nav-part" data-part="${p.index}">
      <button type="button" class="nav-part-head" aria-expanded="true">
        <span>${esc(p.title)}</span><span class="nav-caret">▾</span>
      </button>
      <ul class="nav-list">${chapters}</ul>
    </section>`;
  }).join('');
}

function chapterHtml(c, partTitle) {
  const roles = c.roles || ['todos'];
  return `<article class="chapter" id="${c.id}" data-num="${esc(c.num)}" data-roles="${roles.join(' ')}" data-part="${esc(partTitle)}">
    <header class="chapter-head">
      <p class="chapter-kicker">${esc(partTitle)}</p>
      <p class="chapter-num">${c.label ? esc(c.label) : 'Introducción'}</p>
      <h1>${esc(c.display)}</h1>
      <button type="button" class="mark-read" data-read="${c.id}"><span class="mark-read-icon">○</span> Marcar como leída</button>
    </header>
    <div class="chapter-body">${c.html}</div>
    <footer class="chapter-foot">
      <div class="chapter-progress"><span>Avance del manual</span><div class="progress"><i></i></div></div>
      <nav class="chapter-pager"></nav>
    </footer>
  </article>`;
}

const sections = parts.map((p) => `<div class="part-block" data-part="${p.index}">
  <div class="part-divider"><span class="part-eyebrow">Parte ${p.index === 0 ? '0' : p.index} de ${parts.length - 1}</span><h2>${esc(p.title)}</h2><p>${p.chapters.length} capítulo${p.chapters.length === 1 ? '' : 's'}</p></div>
  ${p.chapters.map((c) => chapterHtml(c, p.title)).join('\n')}
</div>`).join('\n');

// ── Portada del sitio ────────────────────────────────────────────────────────
const siteCover = `
<section class="site-cover" id="inicio">
  <div class="cover-brand"><img src="assets/logo_kaffa.jpg" alt="KAFFA"><span>KAFFA · Manual del Frontend</span></div>
  <div class="cover-grid">
    <div class="cover-copy">
      <p class="eyebrow">Manual de usuario · Versión 1.0</p>
      <h1>Aprende KAFFA<br><em>sin miedo y paso a paso</em></h1>
      <p class="lead">Todo el frontend explicado con capturas anotadas, recorridos guiados, listas de verificación y respuestas a los errores más comunes. Para visitantes, clientes, baristas y administradores.</p>
      <div class="cover-actions">
        <a class="btn btn-primary" href="#prel-como-usar-este-manual">Empezar a leer <span>→</span></a>
        <button type="button" class="btn btn-ghost" id="cover-tour">Ver cómo funciona</button>
      </div>
      <div class="cover-stats">
        <div><b>${allChapters.length}</b><span>capítulos</span></div>
        <div><b>${figCounter}</b><span>capturas</span></div>
        <div><b>4</b><span>roles</span></div>
      </div>
    </div>
    <div class="cover-visual">
      <img src="assets/capturas/p01-portada.jpg" alt="Portada de KAFFA">
      <div class="cover-badge"><span>☕</span><div><b>Sistema POS KAFFA</b><small>React · Vite · API Laravel</small></div></div>
    </div>
  </div>
  <div class="cover-strip">
    <div><b>1</b><span>Elige tu rol y aprende lo que necesitas</span></div>
    <div><b>2</b><span>Sigue los pasos con capturas anotadas</span></div>
    <div><b>3</b><span>Practica con las listas y la autoevaluación</span></div>
  </div>
</section>`;

// ── Documento interactivo ────────────────────────────────────────────────────
const appHtml = `<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Manual del Frontend · KAFFA</title>
<link rel="icon" href="assets/logo_kaffa.jpg">
<link rel="stylesheet" href="styles/manual.css">
</head>
<body>
<div class="app" id="app">
  <aside class="sidebar" id="sidebar" aria-label="Navegación del manual">
    <div class="side-head">
      <a href="#inicio" class="side-brand"><img src="assets/logo_kaffa.jpg" alt=""><span><b>KAFFA</b><small>Manual del Frontend</small></span></a>
      <button type="button" class="side-close" id="side-close" aria-label="Cerrar menú">×</button>
    </div>
    <div class="side-search">
      <label for="search" class="sr-only">Buscar en el manual</label>
      <span class="search-icon" aria-hidden="true">⌕</span>
      <input id="search" type="search" placeholder="Buscar: caja, comprobante, turno…" autocomplete="off">
      <kbd>/</kbd>
    </div>
    <div class="role-filter" role="group" aria-label="Filtrar por rol">
      <button type="button" class="role-chip active" data-role="todos">Todos</button>
      <button type="button" class="role-chip" data-role="visitante">Visitante</button>
      <button type="button" class="role-chip" data-role="cliente">Cliente</button>
      <button type="button" class="role-chip" data-role="barista">Barista</button>
      <button type="button" class="role-chip" data-role="admin">Admin</button>
    </div>
    <nav class="side-nav" id="side-nav">${sidebarHtml()}</nav>
    <div class="side-foot">
      <div class="side-progress"><span id="progress-label">0 % leído</span><div class="progress"><i id="progress-bar"></i></div></div>
      <div class="side-links">
        <button type="button" id="open-glossary">Glosario</button>
        <a href="KAFFA_Manual_Frontend_v1.0.pdf" id="pdf-link" download>PDF</a>
        <button type="button" id="theme-toggle" aria-label="Cambiar tema">◐</button>
      </div>
    </div>
  </aside>

  <div class="layout">
    <header class="topbar">
      <button type="button" class="menu-btn" id="menu-btn" aria-label="Abrir menú">☰</button>
      <div class="crumbs" id="crumbs"><span>Manual</span></div>
      <div class="top-actions">
        <button type="button" class="icon-btn" id="search-open" aria-label="Buscar">⌕</button>
        <button type="button" class="icon-btn" id="theme-toggle-2" aria-label="Cambiar tema">◐</button>
        <a class="pdf-btn" href="KAFFA_Manual_Frontend_v1.0.pdf" download>Descargar PDF</a>
      </div>
      <div class="search-results" id="search-results" hidden></div>
    </header>

    <main id="content" class="content">
      ${siteCover}
      ${sections}
      <section class="the-end" id="fin">
        <img src="assets/logo_kaffa.jpg" alt="">
        <h2>Fin del manual</h2>
        <p>Versión 1.0 · Octubre de 2026 · Equipo KAFFA</p>
        <a class="btn btn-primary" href="#inicio">Volver al inicio</a>
      </section>
    </main>
  </div>
</div>

<div class="overlay" id="overlay" hidden></div>

<!-- Tour guiado -->
<div class="tour" id="tour" hidden role="dialog" aria-modal="true" aria-label="Recorrido de la pantalla">
  <div class="tour-panel">
    <button type="button" class="modal-x" data-close-tour aria-label="Cerrar">×</button>
    <p class="tour-step">Paso <b id="tour-i">1</b> de <b id="tour-n">4</b></p>
    <div class="tour-stage"><img id="tour-img" alt=""><div class="tour-pins" id="tour-pins"></div></div>
    <div class="tour-copy"><h3 id="tour-title"></h3><p id="tour-text"></p></div>
    <div class="tour-nav"><button type="button" class="btn btn-ghost" id="tour-prev">← Anterior</button><button type="button" class="btn btn-primary" id="tour-next">Siguiente →</button></div>
  </div>
</div>

<!-- Visor de imagen -->
<div class="lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="Imagen ampliada">
  <button type="button" class="modal-x" id="lightbox-close" aria-label="Cerrar">×</button>
  <img id="lightbox-img" alt="">
  <p id="lightbox-cap"></p>
</div>

<!-- Glosario -->
<div class="glossary" id="glossary" hidden role="dialog" aria-modal="true" aria-label="Glosario">
  <div class="glossary-panel">
    <button type="button" class="modal-x" id="glossary-close" aria-label="Cerrar">×</button>
    <h2>Glosario</h2>
    <input type="search" id="glossary-search" placeholder="Buscar un término…">
    <dl id="glossary-list"></dl>
  </div>
</div>

<script>window.__KAFFA__ = ${JSON.stringify({
  chapters: allChapters.map((c) => ({ id: c.id, title: c.heading, part: c.partTitle, roles: c.roles, text: c.text })),
  search: searchIndex,
  glossary,
  hotspots,
  figCount: figCounter,
})};</script>
<script src="scripts/manual.js"></script>
</body>
</html>`;

// ── Documento imprimible ─────────────────────────────────────────────────────
function tocHtml() {
  const rows = [];
  rows.push(`<div class="toc-part"><span>Antes de empezar</span></div>`);
  for (const p of parts) {
    if (p.index > 0) rows.push(`<div class="toc-part"><span>${esc(p.title)}</span></div>`);
    for (const c of p.chapters) {
      if (c.id === 'prel-control-documental') continue;
      const page = tocPages[c.id] || '—';
      rows.push(`<div class="toc-row${c.num.startsWith('Anexo') ? ' toc-annex' : ''}">
        <span class="toc-num">${esc(c.label)}</span>
        <span class="toc-title">${esc(c.display)}</span>
        <span class="toc-dots"></span>
        <span class="toc-page">${page}</span>
      </div>`);
    }
  }
  return rows.join('');
}

const printParts = parts.map((p) => {
  const isAnnex = /^Anexos/i.test(p.title);
  const roman = ['I','II','III','IV','V','VI','VII'];
  const eyebrow = p.index === 0 ? 'Antes de empezar' : isAnnex ? 'Anexos' : `Parte ${roman[p.index - 1] || p.index}`;
  const partName = p.index === 0 ? 'Antes de empezar' : isAnnex ? 'Anexos' : p.title.replace(/^Parte\s+[IVX]+\.\s*/, '');
  const divider = `<div class="part-divider print-divider">
    <span class="part-eyebrow">${esc(eyebrow)}</span>
    <h2>${esc(partName)}</h2>
    <p>${p.chapters.length} ${p.chapters.length === 1 ? 'capítulo' : 'capítulos'}</p>
  </div>`;
  return `<section class="print-part" data-part="${p.index}">
    ${divider}
    ${p.chapters.filter((c) => c.id !== 'prel-control-documental').map((c) => printChapter(c, p.title)).join('')}
  </section>`;
}).join('\n');

function printChapter(c, partTitle) {
  let body = c.html;
  let lead = '';
  const h3m = body.match(/^(\s*<h3[^>]*>[\s\S]*?<\/h3>\s*<p[\s\S]*?<\/p>)/);
  if (h3m) {
    lead = h3m[1];
    body = body.slice(h3m[1].length);
  } else {
    const pm = body.match(/^(\s*(?:<p[\s\S]*?<\/p>\s*){1,2})/);
    if (pm) {
      lead = pm[1];
      body = body.slice(pm[1].length);
    }
  }
  const header = `<header class="print-chapter-head">
      <p class="chapter-kicker">${esc(partTitle)}</p>
      <h1>${c.label ? `<span class="print-num">${esc(c.label)}</span>` : ''} ${esc(c.display)}</h1>
    </header>`;
  return `<article class="print-chapter" id="${c.id}">
    <div class="chapter-lead">${header}${lead ? `<div class="chapter-body">${lead}</div>` : ''}</div>
    <div class="chapter-body">${body}</div>
  </article>`;
}

const bodyHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Manual del Frontend KAFFA — Cuerpo</title>
<link rel="stylesheet" href="styles/print.css">
</head>
<body>
<div class="print-doc">

  <section class="doc-control-page">
    <div class="dc-head">
      <img src="assets/logo_kaffa.jpg" alt="KAFFA">
      <div><p class="eyebrow">Documento oficial</p><h1>Manual de Usuario del Frontend</h1><p class="dc-sub">Sistema POS KAFFA · Versión 1.0</p></div>
    </div>
    <table class="dc-table">
      <tr><th>Código documental</th><td>KAFFA-MU-FE-001</td></tr>
      <tr><th>Versión</th><td>1.0</td></tr>
      <tr><th>Fecha de emisión</th><td>Octubre de 2026</td></tr>
      <tr><th>Audiencia</th><td>Visitantes, clientes, baristas y administradores; personal nuevo sin experiencia técnica</td></tr>
      <tr><th>Alcance</th><td>Interfaz web (SPA React): sitio público, cuenta de cliente, panel de barista y panel de administración</td></tr>
      <tr><th>Fuera de alcance</th><td>Backend, base de datos, API, aplicación móvil e infraestructura</td></tr>
      <tr><th>Fuente de verdad</th><td>Aplicación en ejecución y código de <code>REACT_clean/REACT_kaffa</code></td></tr>
      <tr><th>Estado</th><td>Verificado pantalla por pantalla con datos de demostración</td></tr>
    </table>

    <div class="dc-note">
      <h2>Antes de empezar</h2>
      <p>Este manual está escrito para que puedas trabajar con KAFFA sin saber programar. Cada pantalla tiene su propia ficha: para qué sirve, cómo llegar, qué ves, qué hacer paso a paso y qué hacer si algo falla.</p>
      <p>Los datos de las capturas son ficticios y se crearon solo para el manual. Las cuentas de demostración están al final de esta sección introductoria.</p>
    </div>

    <div class="dc-legend">
      <h2>Cómo leer las instrucciones</h2>
      <div class="legend-grid">
        <div><b>Negrita</b><span>Nombre exacto de un botón, campo o menú.</span></div>
        <div><b>1 · 2 · 3</b><span>Pasos que se hacen en orden.</span></div>
        <div><b>💡 Consejo</b><span>Recomendación para trabajar mejor.</span></div>
        <div><b>⚠️ Cuidado</b><span>Algo que debes revisar antes de continuar.</span></div>
        <div><b>⛔ Error</b><span>Qué hacer cuando algo falla.</span></div>
        <div><b>①②③</b><span>Puntos señalados sobre una captura; la leyenda está debajo.</span></div>
      </div>
    </div>
  </section>

  <section class="toc-page">
    <p class="eyebrow">Contenido</p>
    <h1>Índice</h1>
    <div class="toc">${tocHtml()}</div>
    <p class="toc-note">Los números de página corresponden al cuerpo del manual. La portada y la contraportada no se numeran: si tu visor cuenta desde la portada, suma 1 a estos números.</p>
    <p class="toc-end-marker">Fin del índice</p>
  </section>

  ${printParts}

  <section class="print-end">
    <img src="assets/logo_kaffa.jpg" alt="">
    <h2>Fin del manual</h2>
    <p>Versión 1.0 · Octubre de 2026 · Equipo KAFFA</p>
  </section>
</div>
</body>
</html>`;

const coverHtml = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><link rel="stylesheet" href="styles/print.css"><style>@page{size:A4;margin:0}html,body{margin:0;padding:0}</style></head>
<body class="cover-body">
<div class="cover">
  <div class="cover-top">
    <div class="cover-logo"><img src="assets/logo_kaffa.jpg" alt="KAFFA"></div>
    <span class="cover-tag">Sistema POS · Frontend</span>
  </div>
  <div class="cover-main">
    <p class="cover-kicker">Manual de usuario</p>
    <h1>Manual del<br><em>Frontend</em></h1>
    <p class="cover-sub">Sitio público, cuenta de cliente, panel de barista y panel de administración</p>
    <div class="cover-meta">
      <div><span>Versión</span><b>1.0</b></div>
      <div><span>Fecha</span><b>Octubre 2026</b></div>
      <div><span>Código</span><b>KAFFA-MU-FE-001</b></div>
    </div>
  </div>
  <div class="cover-image"><img src="assets/capturas/p01-portada.jpg" alt=""></div>
  <div class="cover-foot">
    <div><b>KAFFA</b><span>Café artesanal de especialidad</span></div>
    <div><b>Equipo KAFFA</b><span>Documentación verificada</span></div>
  </div>
</div>
</body></html>`;

const backHtml = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><link rel="stylesheet" href="styles/print.css"><style>@page{size:A4;margin:0}html,body{margin:0;padding:0}</style></head>
<body class="cover-body">
<div class="back">
  <img src="assets/logo_kaffa.jpg" alt="KAFFA" class="back-logo">
  <p class="back-kicker">Manual del Frontend · v1.0</p>
  <h2>Todo KAFFA,<br>explicado paso a paso.</h2>
  <p class="back-text">Capturas anotadas, recorridos guiados, listas de verificación y solución de errores para visitantes, clientes, baristas y administradores.</p>
  <div class="back-roles"><span>Visitante</span><span>Cliente</span><span>Barista</span><span>Administrador</span></div>
  <div class="back-foot"><span>KAFFA-MU-FE-001</span><span>Octubre 2026</span></div>
</div>
</body></html>`;

// ── Escritura ────────────────────────────────────────────────────────────────
await mkdir(path.join(dist, 'styles'), { recursive: true });
await mkdir(path.join(dist, 'scripts'), { recursive: true });
await mkdir(path.join(dist, 'assets'), { recursive: true });
await cp(path.join(root, 'assets/logo_kaffa.jpg'), path.join(dist, 'assets/logo_kaffa.jpg'));
await cp(path.join(root, 'assets/fuentes'), path.join(dist, 'assets/fuentes'), { recursive: true });
await cp(path.join(root, 'styles/manual.css'), path.join(dist, 'styles/manual.css'));
await cp(path.join(root, 'styles/editor.css'), path.join(dist, 'styles/editor.css'));
await cp(path.join(root, 'styles/print.css'), path.join(dist, 'styles/print.css'));
await cp(path.join(root, 'build/client.js'), path.join(dist, 'scripts/manual.js'));
await cp(path.join(root, 'build/editor.js'), path.join(dist, 'scripts/editor.js'));

const editorHtml = appHtml
  .replace('<title>Manual del Frontend · KAFFA</title>', '<title>Editor de puntos · KAFFA</title>')
  .replace('<link rel="stylesheet" href="styles/manual.css">', '<link rel="stylesheet" href="styles/manual.css">\n<link rel="stylesheet" href="styles/editor.css">')
  .replace('<script src="scripts/manual.js"></script>', '<script>window.__KAFFA_EDITOR__ = true;</script>\n<script src="scripts/manual.js"></script>\n<script src="scripts/editor.js"></script>');

await writeFile(path.join(dist, 'index.html'), appHtml);
await writeFile(path.join(dist, 'editor.html'), editorHtml);
await writeFile(path.join(dist, 'body.html'), bodyHtml);
await writeFile(path.join(dist, 'cover.html'), coverHtml);
await writeFile(path.join(dist, 'back.html'), backHtml);
await writeFile(path.join(dist, 'toc.json'), JSON.stringify(
  allChapters.filter((c) => c.id !== 'prel-control-documental').map((c) => ({ id: c.id, title: `${c.label} ${c.display}`.trim() })), null, 2));

console.log(`Render: ${parts.length} partes, ${allChapters.length} capítulos, ${figCounter} figuras.`);
if (Object.keys(tocPages).length) {
  const entries = allChapters.filter((c) => c.id !== 'prel-control-documental');
  const missing = entries.filter((c) => !tocPages[c.id]).length;
  console.log(`Índice: ${entries.length - missing}/${entries.length} páginas conocidas.`);
}

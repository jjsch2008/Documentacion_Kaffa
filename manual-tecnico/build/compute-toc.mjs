#!/usr/bin/env node
/**
 * Calcula la página real de cada título y de cada tabla leyendo el PDF del cuerpo.
 * Escribe data/toc-pages.json y data/table-pages.json, y devuelve un JSON con el resultado.
 */
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pdf = path.join(root, 'dist/body.pdf');
const toc = JSON.parse(await readFile(path.join(root, 'dist/toc.json'), 'utf8'));

let tableToc = [];
try {
  tableToc = JSON.parse(await readFile(path.join(root, 'dist/table-toc.json'), 'utf8'));
} catch { /* primera pasada */ }

const pdfinfo = execFileSync('pdfinfo', [pdf], { encoding: 'utf8' });
const pages = Number((pdfinfo.match(/^Pages:\s+(\d+)/m) || [])[1] || 0);
if (!pages) throw new Error('No se pudo leer el número de páginas de body.pdf');

function normalize(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‐‑–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const pageText = [];
for (let n = 1; n <= pages; n++) {
  const txt = execFileSync('pdftotext', ['-f', String(n), '-l', String(n), '-layout', pdf, '-'], {
    encoding: 'utf8',
  });
  pageText[n] = normalize(txt);
}

// El cuerpo empieza después del último índice (general o de tablas).
let startPage = 1;
for (let n = 1; n <= pages; n++) {
  if (pageText[n].includes('fin del indice de tablas')) { startPage = n + 1; break; }
}
if (startPage === 1) {
  for (let n = 1; n <= pages; n++) {
    if (pageText[n].includes('fin del indice')) { startPage = n + 1; break; }
  }
}

const map = {};
let found = 0;
let cursor = startPage;
for (const item of toc) {
  const needle = normalize(item.title);
  let page = null;
  for (let n = cursor; n <= pages; n++) {
    if (pageText[n].includes(needle)) { page = n; break; }
  }
  if (page) { found++; cursor = page; }
  map[item.id] = page;
}

// El cuerpo empieza en el primer capítulo, no en el índice de tablas.
const bodyStart = map[toc[0]?.id] || startPage;

const tableMap = {};
let tablesFound = 0;
let tableCursor = bodyStart;
for (const item of tableToc) {
  const prefix = normalize(`tabla ${item.num}.`);
  const full = normalize(`tabla ${item.num}. ${item.title}`).slice(0, 90);
  let page = null;
  for (let n = tableCursor; n <= pages; n++) {
    if (pageText[n].includes(full)) { page = n; break; }
  }
  if (!page) {
    for (let n = tableCursor; n <= pages; n++) {
      if (pageText[n].includes(prefix)) { page = n; break; }
    }
  }
  if (page) { tablesFound++; tableCursor = page; }
  tableMap[item.id] = page;
}

let previous = {};
try { previous = JSON.parse(await readFile(path.join(root, 'data/toc-pages.json'), 'utf8')); } catch { /* primera vez */ }
let previousTables = {};
try { previousTables = JSON.parse(await readFile(path.join(root, 'data/table-pages.json'), 'utf8')); } catch { /* primera vez */ }
const changed = JSON.stringify(previous) !== JSON.stringify(map)
  || JSON.stringify(previousTables) !== JSON.stringify(tableMap);
await writeFile(path.join(root, 'data/toc-pages.json'), JSON.stringify(map, null, 2) + '\n', 'utf8');
await writeFile(path.join(root, 'data/table-pages.json'), JSON.stringify(tableMap, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({
  pages, entries: toc.length, found, tables: tableToc.length, tablesFound, changed, startPage,
}, null, 2));

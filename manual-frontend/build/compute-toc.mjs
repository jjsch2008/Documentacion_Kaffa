#!/usr/bin/env node
/**
 * Calcula la página real de cada capítulo en dist/body.pdf.
 * Escribe data/toc-pages.json y devuelve el resultado en JSON.
 */
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const pdf = path.join(root, 'dist/body.pdf');
const toc = JSON.parse(await readFile(path.join(root, 'dist/toc.json'), 'utf8'));

const info = execFileSync('pdfinfo', [pdf], { encoding: 'utf8' });
const pages = Number((info.match(/^Pages:\s+(\d+)/m) || [])[1] || 0);
if (!pages) throw new Error('No se pudo leer el número de páginas de body.pdf');

const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[‐‑–—]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();

const pageText = [];
for (let n = 1; n <= pages; n++) {
  const txt = execFileSync('pdftotext', ['-f', String(n), '-l', String(n), '-layout', pdf, '-'], { encoding: 'utf8' });
  pageText[n] = normalize(txt);
}

let startPage = 1;
for (let n = 1; n <= pages; n++) {
  if (pageText[n].includes('fin del indice')) { startPage = n + 1; break; }
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

let previous = {};
try { previous = JSON.parse(await readFile(path.join(root, 'data/toc-pages.json'), 'utf8')); } catch { /* primera vez */ }
const changed = JSON.stringify(previous) !== JSON.stringify(map);
await writeFile(path.join(root, 'data/toc-pages.json'), JSON.stringify(map, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({ pages, entries: toc.length, found, changed, startPage }, null, 2));

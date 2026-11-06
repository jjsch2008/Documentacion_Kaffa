#!/usr/bin/env node
/**
 * Orquesta la construcción completa:
 *   1. HTML (portada, cuerpo, contraportada).
 *   2. PDFs parciales con Chrome.
 *   3. Cálculo de páginas del índice y segunda pasada si cambió.
 *   4. Unión de portada + cuerpo + contraportada.
 *   5. Validación básica con pdfinfo.
 */
import { execFileSync } from 'node:child_process';
import { readFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const run = (cmd, args) => {
  process.stdout.write(`\n$ ${cmd} ${args.join(' ')}\n`);
  return execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
};
const node = process.execPath;

run(node, ['build/build.mjs']);
run(node, ['build/print.mjs', 'dist/cover.html', 'dist/cover.pdf', 'plain']);
run(node, ['build/print.mjs', 'dist/back.html', 'dist/back.pdf', 'plain']);

let changed = true;
for (let i = 0; i < 4 && changed; i++) {
  run(node, ['build/print.mjs', 'dist/body.html', 'dist/body.pdf', 'body']);
  const out = run(node, ['build/compute-toc.mjs']);
  const result = JSON.parse(out.trim());
  changed = result.changed;
  console.log(`Pasada ${i + 1}: ${result.found}/${result.entries} títulos localizados.`);
  if (changed) run(node, ['build/build.mjs']);
}

// Si la última pasada cambió el índice, reimprimir el cuerpo una vez más.
if (changed) {
  run(node, ['build/print.mjs', 'dist/body.html', 'dist/body.pdf', 'body']);
  run(node, ['build/compute-toc.mjs']);
}

const finalName = 'KAFFA_Manual_Tecnico_Backend_v1.0.pdf';
const finalPath = path.join(root, '..', finalName);
run('gs', [
  '-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=pdfwrite',
  '-dPDFSETTINGS=/prepress', '-dCompatibilityLevel=1.7',
  '-dPreserveAnnots=true',
  `-sOutputFile=${finalPath}`,
  '-f', 'dist/cover.pdf', 'dist/body.pdf', 'dist/back.pdf',
  '-c', '[ /Title (Manual Tecnico del Backend - Sistema POS KAFFA) /Author (Ana Maria Joaqui Conejo; Santiago Salamanca Munoz; Juan Jose Sandoval Chavez) /Subject (Documentacion tecnica del backend Laravel 10 + PostgreSQL) /Keywords (KAFFA, Laravel, PostgreSQL, API REST, POS) /DOCINFO pdfmark'
]);

const info = execFileSync('pdfinfo', [finalPath], { encoding: 'utf8' });
const pages = (info.match(/^Pages:\s+(\d+)/m) || [])[1];
const size = (info.match(/^File size:\s+(\d+)/m) || [])[1];
console.log(`\nPDF final: ${finalPath}`);
console.log(`Páginas: ${pages} · Tamaño: ${(Number(size) / 1024 / 1024).toFixed(2)} MB`);

await copyFile(finalPath, path.join(root, 'dist', finalName));
console.log(`Copia de trabajo: ${path.join(root, 'dist', finalName)}`);

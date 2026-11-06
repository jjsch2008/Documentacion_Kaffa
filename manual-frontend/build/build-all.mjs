#!/usr/bin/env node
/**
 * Construye el Manual del Frontend KAFFA:
 *   1. HTML interactivo + cuerpo imprimible + portada/contraportada.
 *   2. PDFs parciales con Chrome.
 *   3. Cálculo de páginas del índice y segunda pasada.
 *   4. Unión con Ghostscript y metadatos.
 *   5. Copia del PDF al sitio y empaquetado ZIP.
 */
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, copyFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docsDir = path.resolve(root, '..');
const finalName = 'KAFFA_Manual_Frontend_v1.0.pdf';
const finalPath = path.join(docsDir, finalName);

const run = (cmd, args, opts = {}) => {
  process.stdout.write(`\n$ ${cmd} ${args.join(' ')}\n`);
  return execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...opts });
};
const node = process.execPath;

run(node, ['build/prepare-images.mjs']);
run(node, ['build/render.mjs']);
run(node, ['build/print.mjs', 'dist/cover.html', 'dist/cover.pdf', 'plain']);
run(node, ['build/print.mjs', 'dist/back.html', 'dist/back.pdf', 'plain']);

let changed = true;
for (let i = 0; i < 4 && changed; i++) {
  run(node, ['build/print.mjs', 'dist/body.html', 'dist/body.pdf', 'body']);
  const out = run(node, ['build/compute-toc.mjs']);
  const result = JSON.parse(out.trim());
  changed = result.changed;
  console.log(`Pasada ${i + 1}: ${result.found}/${result.entries} títulos localizados.`);
  if (changed) { run(node, ['build/prepare-images.mjs']); run(node, ['build/render.mjs']); }
}

if (changed) {
  run(node, ['build/print.mjs', 'dist/body.html', 'dist/body.pdf', 'body']);
  run(node, ['build/compute-toc.mjs']);
}

run(node, ['build/merge.mjs', finalPath]);

const info = execFileSync('pdfinfo', [finalPath], { encoding: 'utf8' });
const pages = (info.match(/^Pages:\s+(\d+)/m) || [])[1];
const size = Number((info.match(/^File size:\s+(\d+)/m) || [])[1] || 0);
console.log(`\nPDF final: ${finalPath}`);
console.log(`Páginas: ${pages} · Tamaño: ${(size / 1024 / 1024).toFixed(2)} MB`);

// Copia para el enlace del sitio interactivo.
await copyFile(finalPath, path.join(root, 'dist', finalName));

// Instrucciones para abrir el ZIP.
await writeFile(path.join(root, 'dist/LEEME.txt'), `MANUAL DEL FRONTEND - SISTEMA POS KAFFA
Version 1.0 - Octubre 2026

1. Descomprime este archivo en una carpeta.
2. Abre "index.html" con Chrome, Edge o Firefox.
3. No necesitas internet ni instalar nada.
4. El PDF completo esta en "KAFFA_Manual_Frontend_v1.0.pdf".
5. Atajos: "/" busca, "T" cambia el tema, "Esc" cierra ventanas.

Los datos de las capturas son ficticios y se usaron solo para el manual.
`);

// ZIP del manual interactivo.
const zipPath = path.join(docsDir, 'KAFFA_Manual_Frontend_Interactivo_v1.0.zip');
await rm(zipPath, { force: true });
try {
  const py = `
import os, zipfile
root = ${JSON.stringify(path.join(root, 'dist'))}
out = ${JSON.stringify(zipPath)}
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for folder, dirs, files in os.walk(root):
        for f in files:
            p = os.path.join(folder, f)
            rel = os.path.relpath(p, root).replace(os.sep, '/')
            top = rel.split('/')[0]
            if top not in ('index.html', 'LEEME.txt', 'styles', 'scripts', 'assets') and rel != ${JSON.stringify(finalName)}:
                continue
            if rel in ('styles/editor.css', 'scripts/editor.js'):
                continue
            if rel.startswith('assets/capturas/') and not f.lower().endswith('.jpg'):
                continue
            z.write(p, rel)
`;
  execFileSync('python3', ['-c', py]);
  const zs = await stat(zipPath);
  console.log(`Sitio interactivo: ${zipPath} (${(zs.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
  console.log('Aviso: no se pudo crear el ZIP:', err.message);
}

console.log('\nListo. Abre dist/index.html o el ZIP para navegar el manual.');

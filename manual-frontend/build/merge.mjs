#!/usr/bin/env node
/**
 * Une portada + cuerpo + contraportada sin recomprimir imágenes y añade
 * metadatos al PDF final.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const [, , outArg] = process.argv;
const out = outArg || path.join(root, 'dist/KAFFA_Manual_Frontend_v1.0.pdf');

const merged = await PDFDocument.create();
for (const name of ['dist/cover.pdf', 'dist/body.pdf', 'dist/back.pdf']) {
  const src = await PDFDocument.load(await readFile(path.join(root, name)));
  const pages = await merged.copyPages(src, src.getPageIndices());
  pages.forEach((p) => merged.addPage(p));
}

merged.setTitle('Manual del Frontend — Sistema POS KAFFA');
merged.setAuthor('Equipo KAFFA');
merged.setSubject('Manual de usuario de la SPA React: sitio público, cliente, barista y administración');
merged.setKeywords(['KAFFA', 'manual', 'frontend', 'React', 'POS', 'barista', 'administrador']);
merged.setCreator('Manual KAFFA · build reproducible');
merged.setProducer('pdf-lib');

const bytes = await merged.save({ useObjectStreams: true });
await writeFile(out, bytes);
console.log(`PDF unido: ${out} (${(bytes.length / 1024 / 1024).toFixed(2)} MB)`);

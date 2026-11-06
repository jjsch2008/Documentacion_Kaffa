#!/usr/bin/env node
/**
 * Publica el manual interactivo dentro del frontend:
 *   docs/manual-frontend/dist → REACT_clean/REACT_kaffa/public/manual
 *
 * Copia solo lo necesario para el lector final. No publica el editor,
 * el ZIP ni los PDF intermedios.
 */
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'dist');
const target = path.resolve(root, '../../REACT_clean/REACT_kaffa/public/manual');
const pdfName = 'KAFFA_Manual_Frontend_v1.0.pdf';

const copy = async (from, to) => {
  try {
    await stat(from);
  } catch {
    throw new Error(`No existe: ${from}. Ejecuta primero: node build/build-all.mjs`);
  }
  await cp(from, to, { recursive: true });
};

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

await copy(path.join(src, 'index.html'), path.join(target, 'index.html'));
await copy(path.join(src, 'styles/manual.css'), path.join(target, 'styles/manual.css'));
await copy(path.join(src, 'scripts/manual.js'), path.join(target, 'scripts/manual.js'));
await cp(path.join(src, 'assets/capturas'), path.join(target, 'assets/capturas'), { recursive: true, filter: (f) => !f.toLowerCase().endsWith('.png') });
await copy(path.join(src, 'assets/fuentes'), path.join(target, 'assets/fuentes'));
await copy(path.join(src, 'assets/logo_kaffa.jpg'), path.join(target, 'assets/logo_kaffa.jpg'));
await copy(path.join(src, pdfName), path.join(target, pdfName));

// Limpieza defensiva: el editor y el material de construcción nunca se publican.
for (const forbidden of ['editor.html', 'styles/editor.css', 'scripts/editor.js', 'body.html', 'cover.html', 'back.html']) {
  await rm(path.join(target, forbidden), { force: true });
}

console.log(`Manual publicado en: ${target}`);
console.log(`Abre en desarrollo: /manual/index.html`);

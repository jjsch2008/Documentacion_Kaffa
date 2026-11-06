#!/usr/bin/env node
/**
 * Prepara las capturas para el manual: PNG → JPG optimizado.
 * Mantiene los PNG originales en assets/capturas y escribe los JPG en
 * dist/assets/capturas, que es lo que consumen el sitio y el PDF.
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'assets/capturas');
const out = path.join(root, 'dist/assets/capturas');
await mkdir(out, { recursive: true });

const files = (await readdir(src)).filter((f) => f.toLowerCase().endsWith('.png'));
// Limpiar PNG antiguos que hayan quedado en dist.
for (const stale of (await readdir(out)).filter((f) => f.toLowerCase().endsWith('.png'))) {
  const { unlink } = await import('node:fs/promises');
  await unlink(path.join(out, stale)).catch(() => {});
}
let made = 0;
let skipped = 0;
for (const f of files) {
  const input = path.join(src, f);
  const output = path.join(out, f.replace(/\.png$/i, '.jpg'));
  try {
    const [si, so] = await Promise.all([stat(input), stat(output)]);
    if (so.mtimeMs >= si.mtimeMs) { skipped += 1; continue; }
  } catch { /* falta el jpg */ }
  execFileSync('magick', [
    input, '-resize', '1440x1440>', '-strip', '-interlace', 'Plane',
    '-sampling-factor', '4:2:0', '-quality', '87', output,
  ]);
  made += 1;
}
console.log(`Capturas: ${made} convertidas, ${skipped} ya estaban al día.`);

import { writeFile } from 'node:fs/promises';
import { loginData } from './cdp.mjs';
const out = {
  admin: await loginData('admin@kaffa.com', 'admin123'),
  barista: await loginData('barista@kaffa.com', 'barista123'),
  cliente: await loginData('cliente@kaffa.com', 'cliente123'),
};
await writeFile('data/tokens.json', JSON.stringify(out, null, 2));
console.log('Tokens guardados:', Object.keys(out).join(', '));

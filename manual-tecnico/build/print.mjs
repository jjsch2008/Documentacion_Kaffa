#!/usr/bin/env node
/**
 * Exporta un HTML a PDF usando Chrome DevTools Protocol.
 *
 * Uso:
 *   node print.mjs <entrada.html> <salida.pdf> [body|plain]
 *
 * - body : páginas con encabezado y pie (numeración Página X de Y).
 * - plain: portada/contraportada a sangre, sin encabezado ni pie.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [, , inputArg, outputArg, modeArg = 'body'] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Uso: node print.mjs <entrada.html> <salida.pdf> [body|plain]');
  process.exit(1);
}

/**
 * Localiza Chrome/Chromium. Playwright cambia el número de build
 * (chromium-1234, chromium-1248…), así que se detecta el más reciente en vez
 * de fijar una ruta que se rompe al actualizar el navegador.
 */
function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const base = path.join(process.env.HOME || '', '.cache/ms-playwright');
  try {
    const builds = readdirSync(base)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]))
      .reverse();
    for (const build of builds) {
      for (const sub of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
        const candidate = path.join(base, build, sub);
        if (existsSync(candidate)) return candidate;
      }
    }
  } catch { /* sin Playwright */ }
  const fallback = '/usr/bin/google-chrome';
  if (existsSync(fallback)) return fallback;
  throw new Error('No se encontró Chrome/Chromium. Defina CHROME_BIN.');
}

const CHROME = findChrome();
const input = path.resolve(inputArg);
const output = path.resolve(outputArg);
const profile = await mkdtemp(path.join(tmpdir(), 'kaffa-chrome-'));
const port = 9333 + Math.floor(Math.random() * 200);

const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--hide-scrollbars',
  '--force-color-profile=srgb',
  '--font-render-hinting=none',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let stderr = '';
chrome.stderr.on('data', (d) => { stderr += d.toString(); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForDevtools() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) return page.webSocketDebuggerUrl;
      }
    } catch { /* aún arrancando */ }
    await sleep(250);
  }
  throw new Error('Chrome no expuso DevTools.\n' + stderr);
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method) {
        (this.events.get(msg.method) || []).forEach((f) => f(msg.params));
      }
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, fn) {
    const list = this.events.get(method) || [];
    list.push(fn);
    this.events.set(method, list);
  }
  close() { try { this.ws.close(); } catch { /* noop */ } }
}

const headerTemplate = `
<div style="width:100%; padding:0 17mm; font-family:'Noto Sans','Liberation Sans',sans-serif; font-size:7px; color:#8b7a6b; display:flex; justify-content:space-between; align-items:flex-end; border-bottom:0.4px solid #d9cdbd; padding-bottom:3mm; letter-spacing:.06em; text-transform:uppercase;">
  <span>KAFFA · Manual Técnico del Backend</span>
  <span>Sistema POS · Laravel 10 + PostgreSQL</span>
</div>`;

const footerTemplate = `
<div style="width:100%; padding:0 17mm; font-family:'Noto Sans','Liberation Sans',sans-serif; font-size:7px; color:#6f6258; display:flex; justify-content:space-between; align-items:center;">
  <span>Versión 1.0 · Octubre 2026</span>
  <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
</div>`;

let cdp;
try {
  const wsUrl = await waitForDevtools();
  cdp = new CDP(wsUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const loaded = new Promise((resolve) => cdp.on('Page.loadEventFired', resolve));
  await cdp.send('Page.navigate', { url: `file://${input}` });
  await Promise.race([loaded, sleep(15000)]);

  let ready = false;
  for (let i = 0; i < 240; i++) {
    const r = await cdp.send('Runtime.evaluate', {
      expression: 'window.__KAFFA_READY === true',
      returnByValue: true,
    });
    if (r.result && r.result.value === true) { ready = true; break; }
    await sleep(250);
  }
  if (!ready) {
    const info = await cdp.send('Runtime.evaluate', {
      expression: 'window.__KAFFA_ERROR || document.body.innerText.slice(0,500)',
      returnByValue: true,
    });
    throw new Error('La página no terminó de renderizar: ' + JSON.stringify(info.result?.value));
  }

  const pdf = await cdp.send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: modeArg === 'body',
    headerTemplate: modeArg === 'body' ? headerTemplate : '<div></div>',
    footerTemplate: modeArg === 'body' ? footerTemplate : '<div></div>',
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    generateTaggedPDF: true,
    generateDocumentOutline: true,
    transferMode: 'ReturnAsBase64',
  });

  await writeFile(output, Buffer.from(pdf.data, 'base64'));
  const bytes = (await readFile(output)).length;
  console.log(`PDF: ${path.basename(output)} (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
} finally {
  cdp?.close();
  chrome.kill('SIGTERM');
  await sleep(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

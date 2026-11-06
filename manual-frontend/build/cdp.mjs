#!/usr/bin/env node
/**
 * Cliente mínimo de Chrome DevTools Protocol para capturar la SPA KAFFA.
 * Reutiliza el enfoque de docs/manual-tecnico/build/print.mjs.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class CDP {
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

export async function launch({ width = 1440, height = 900, scale = 1, fakeNow = '2026-10-22T10:30:00-05:00' } = {}) {
  const chrome = process.env.CHROME_BIN ||
    `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
  const profile = await mkdtemp(path.join(tmpdir(), 'kaffa-shots-'));
  const port = 9333 + Math.floor(Math.random() * 300);

  const proc = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none',
    '--disable-features=Translate', '--lang=es-CO',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  let stderr = '';
  proc.stderr.on('data', (d) => { stderr += d.toString(); });

  let wsUrl = null;
  for (let i = 0; i < 160 && !wsUrl; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) wsUrl = page.webSocketDebuggerUrl;
      }
    } catch { /* arrancando */ }
    if (!wsUrl) await sleep(250);
  }
  if (!wsUrl) throw new Error('Chrome no expuso DevTools.\n' + stderr);

  const cdp = new CDP(wsUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  // Cualquier alert()/confirm() de la app se acepta automáticamente para que
  // no bloquee la captura (los diálogos nativos no salen en la imagen).
  cdp.on('Page.javascriptDialogOpening', () => {
    cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
  });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: scale, mobile: false,
  });

  if (fakeNow) {
    // Reloj fijo: la app calcula "hoy" con new Date().toISOString(), que usa
    // UTC. A las 23:xx en Colombia ya es el día siguiente en UTC, así que las
    // capturas saldrían sin datos. Fijamos el reloj al mismo instante que el
    // backend de demostración (10:30 a. m. del 22/10/2026).
    const fixed = new Date(fakeNow).getTime();
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        const FIXED = ${fixed};
        const RealDate = Date;
        class FakeDate extends RealDate {
          constructor(...args) {
            if (args.length === 0) super(FIXED);
            else super(...args);
          }
          static now() { return FIXED; }
          static parse(s) { return RealDate.parse(s); }
          static UTC(...a) { return RealDate.UTC(...a); }
        }
        window.Date = FakeDate;
      })();`,
    });
  }

  // Capturas deterministas: sin animaciones CSS y con Chart.js sin animación.
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      let _chart;
      Object.defineProperty(window, 'Chart', {
        configurable: true,
        get() { return _chart; },
        set(v) {
          _chart = v;
          try {
            v.defaults.animation = false;
            v.defaults.animations = false;
            v.defaults.responsiveAnimationDuration = 0;
          } catch (e) { /* versión sin defaults */ }
        },
      });
      const css = document.createElement('style');
      css.textContent = '*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important}';
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(css));
    })();`,
  });

  const page = {
    cdp,
    async evaluate(expression, awaitPromise = true) {
      const r = await cdp.send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise,
      });
      if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.text + ' :: ' + JSON.stringify(r.exceptionDetails.exception?.description || ''));
      }
      return r.result?.value;
    },
    async goto(url, { settle = 700 } = {}) {
      const loaded = new Promise((resolve) => cdp.on('Page.loadEventFired', resolve));
      await cdp.send('Page.navigate', { url });
      await Promise.race([loaded, sleep(12000)]);
      for (let i = 0; i < 80; i++) {
        const n = await page.evaluate('document.querySelectorAll("#root *").length').catch(() => 0);
        if (n > 10) break;
        await sleep(150);
      }
      await sleep(settle);
    },
    async viewport(w, h, mobile = false) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: w, height: h, deviceScaleFactor: 1, mobile,
      });
      await sleep(250);
    },
    async click(selector, { index = 0, settle = 500 } = {}) {
      const ok = await page.evaluate(`(() => {
        const els = [...document.querySelectorAll(${JSON.stringify(selector)})];
        if (!els[${index}]) return false;
        els[${index}].scrollIntoView({block:'center'});
        els[${index}].click();
        return true;
      })()`);
      if (!ok) throw new Error('No se encontró el selector: ' + selector);
      await sleep(settle);
    },
    async clickText(selector, text, { settle = 600 } = {}) {
      const ok = await page.evaluate(`(() => {
        const els = [...document.querySelectorAll(${JSON.stringify(selector)})];
        const el = els.find(e => e.textContent.trim().toLowerCase().includes(${JSON.stringify(text.toLowerCase())}));
        if (!el) return false;
        el.scrollIntoView({block:'center'});
        el.click();
        return true;
      })()`);
      if (!ok) throw new Error(`No se encontró "${text}" en ${selector}`);
      await sleep(settle);
    },
    async type(selector, value, { index = 0 } = {}) {
      const ok = await page.evaluate(`(() => {
        const el = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
        if (!el) return false;
        if (el instanceof HTMLSelectElement) {
          el.value = ${JSON.stringify(value)};
        } else {
          const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, ${JSON.stringify(value)});
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`);
      if (!ok) throw new Error('No se encontró el campo: ' + selector);
      await sleep(250);
    },
    async storage(data) {
      await page.evaluate(`(() => {
        const data = ${JSON.stringify(data)};
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
      })()`);
    },
    async scrollTo(selector, { offset = -90, settle = 450 } = {}) {
      const ok = await page.evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        const y = el.getBoundingClientRect().top + window.scrollY + (${offset});
        window.scrollTo({ top: y, behavior: 'instant' });
        return true;
      })()`);
      if (!ok) throw new Error('No se encontró para scroll: ' + selector);
      await sleep(settle);
    },
    async shot(file, { fullPage = false, clip = null } = {}) {      await mkdir(path.dirname(file), { recursive: true });
      const params = { format: 'png', fromSurface: true, captureBeyondViewport: fullPage };
      if (fullPage) {
        const metrics = await cdp.send('Page.getLayoutMetrics');
        const cs = metrics.cssContentSize || metrics.contentSize;
        params.clip = { x: 0, y: 0, width: Math.ceil(cs.width), height: Math.ceil(cs.height), scale: 1 };
      } else if (clip) {
        params.clip = { ...clip, scale: 1 };
      }
      const { data } = await cdp.send('Page.captureScreenshot', params);
      const { writeFile } = await import('node:fs/promises');
      await writeFile(file, Buffer.from(data, 'base64'));
      return file;
    },
    async outline() {
      return page.evaluate(`(() => {
        const txt = (el) => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
        return {
          title: document.title,
          h: [...document.querySelectorAll('h1,h2,h3')].map(txt).filter(Boolean).slice(0, 20),
          buttons: [...document.querySelectorAll('button')].map(txt).filter(Boolean).slice(0, 60),
          tableHeads: [...document.querySelectorAll('th')].map(txt).filter(Boolean).slice(0, 40),
          inputs: [...document.querySelectorAll('input,select,textarea')].map(e => ({
            tag: e.tagName.toLowerCase(), type: e.type || '', name: e.name || '', placeholder: e.placeholder || '',
            label: e.closest('label') ? txt(e.closest('label')).slice(0,80) : ''
          })).slice(0, 40),
          text: document.body.innerText.replace(/\\n{3,}/g, '\\n\\n').slice(0, 2500),
        };
      })()`);
    },
    async close() {
      cdp.close();
      proc.kill('SIGTERM');
      await sleep(300);
      await rm(profile, { recursive: true, force: true }).catch(() => {});
    },
  };
  return page;
}

/** Inicia sesión contra la API real y devuelve los datos de localStorage. */
export async function loginData(correo, password, api = 'http://127.0.0.1:8000/api/v1') {
  const res = await fetch(`${api}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ correo, password }),
  });
  if (!res.ok) throw new Error(`Login ${correo}: HTTP ${res.status}`);
  const d = await res.json();
  return {
    kaffaToken: d.access_token,
    kaffaUser: JSON.stringify(d.usuario),
  };
}

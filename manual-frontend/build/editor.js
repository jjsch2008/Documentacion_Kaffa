/* Editor de puntos del Manual del Frontend KAFFA
   Permite arrastrar los números de cada captura y exportar hotspots.json. */
(() => {
  if (!window.__KAFFA_EDITOR__) return;

  const DATA = window.__KAFFA__ || { hotspots: {} };
  const ORIGINAL = JSON.parse(JSON.stringify(DATA.hotspots || {}));
  const DRAFT_KEY = 'kaffaManualHotspotsDraft';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let draft = {};
  try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') || {}; } catch { draft = {}; }
  if (Array.isArray(draft)) draft = {};

  let editing = true;
  let selected = null;
  let activeShotId = null;

  const clamp = (v) => Math.max(0.5, Math.min(99.5, v));
  const round = (v) => Math.round(v * 100) / 100;

  const shots = () => $$('.shot[data-figure]').filter((s) => s.querySelector('.pin'));
  const allShots = () => $$('.shot[data-figure]');

  function setPin(pin, x, y) {
    pin.style.left = `${clamp(round(Number(x)))}%`;
    pin.style.top = `${clamp(round(Number(y)))}%`;
    pin.dataset.x = clamp(round(Number(x)));
    pin.dataset.y = clamp(round(Number(y)));
  }

  function applyDraft() {
    allShots().forEach((fig) => {
      const key = fig.dataset.figure;
      const positions = Array.isArray(draft[key]) ? draft[key] : [];
      $$('.pin', fig).forEach((pin, i) => {
        const p = positions[i] || (ORIGINAL[key] || [])[i];
        if (p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))) {
          setPin(pin, p.x, p.y);
        }
      });
    });
  }

  function currentPin(pin) {
    return {
      x: Number(pin.dataset.x ?? parseFloat(pin.style.left) ?? 0),
      y: Number(pin.dataset.y ?? parseFloat(pin.style.top) ?? 0),
    };
  }

  function setPinGroup(key, index, x, y, save = true) {
    $$('.shot[data-figure]').filter((f) => f.dataset.figure === key).forEach((fig) => {
      const pin = $$('.pin', fig)[index];
      if (pin) setPin(pin, x, y);
    });
    if (save) saveDraft();
    updateHud();
  }

  function buildExport() {
    const out = JSON.parse(JSON.stringify(ORIGINAL));
    allShots().forEach((fig) => {
      const key = fig.dataset.figure;
      const pins = $$('.pin', fig);
      if (!pins.length) return;
      out[key] = out[key] || [];
      pins.forEach((pin, i) => {
        const pos = currentPin(pin);
        out[key][i] = { ...(out[key][i] || {}), x: round(pos.x), y: round(pos.y) };
      });
    });
    return out;
  }

  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(buildExport())); } catch { /* sin storage */ }
  }

  function changedCount() {
    let n = 0;
    allShots().forEach((fig) => {
      const key = fig.dataset.figure;
      $$('.pin', fig).forEach((pin, i) => {
        const o = (ORIGINAL[key] || [])[i];
        if (!o) return;
        const p = currentPin(pin);
        if (Math.abs(Number(o.x) - p.x) > 0.01 || Math.abs(Number(o.y) - p.y) > 0.01) n += 1;
      });
    });
    return n;
  }

  // ── Panel ────────────────────────────────────────────────────────────────
  const panel = document.createElement('section');
  panel.id = 'pin-editor';
  panel.setAttribute('aria-label', 'Editor de puntos de las capturas');
  panel.innerHTML = `
    <div class="pe-row pe-main">
      <button type="button" class="pe-toggle" id="pe-collapse" title="Contraer panel" aria-label="Contraer panel">▾</button>
      <span class="pe-badge">MODO EDITOR</span>
      <strong class="pe-title">Mueve los números</strong>
      <label class="pe-switch"><input type="checkbox" id="pe-editing" checked> Arrastrar números</label>
      <label class="pe-field"><span>Captura</span><select id="pe-select"></select></label>
      <div class="pe-arrows">
        <button type="button" id="pe-prev" title="Captura anterior">←</button>
        <button type="button" id="pe-next" title="Captura siguiente">→</button>
      </div>
      <a class="pe-link" href="index.html">Ver manual</a>
    </div>
    <div class="pe-row pe-actions">
      <span class="pe-status" id="pe-status">Toca un número para seleccionarlo.</span>
      <button type="button" id="pe-reset">Restablecer punto</button>
      <button type="button" id="pe-reset-all">Restablecer todo</button>
      <button type="button" class="pe-primary" id="pe-export">Descargar posiciones</button>
      <button type="button" id="pe-copy">Copiar JSON</button>
    </div>
    <p class="pe-hint">Arrastra cada número sobre el campo o botón que describe. Flechas: 0,5 % · con Shift: 0,1 %. Los cambios se guardan en este navegador; al terminar pulsa <b>Descargar posiciones</b> y avísame.</p>
    <p class="pe-toast" id="pe-toast" hidden></p>
  `;
  document.body.appendChild(panel);
  document.body.classList.add('editor-editing');

  const statusEl = $('#pe-status');
  const toastEl = $('#pe-toast');
  const select = $('#pe-select');

  function toast(msg, ok = true) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.classList.toggle('bad', !ok);
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toastEl.hidden = true; }, 3500);
  }

  function shotMeta(fig) {
    const chapter = fig.closest('.chapter');
    const part = $('.chapter-kicker', chapter)?.textContent?.trim() || '';
    const chTitle = $('.chapter-head h1', chapter)?.textContent?.trim() || '';
    const label = $('.fig-label', fig)?.textContent?.trim() || fig.dataset.figure || '';
    return { part, chTitle, label };
  }

  function fillSelect() {
    const groups = new Map();
    shots().forEach((fig) => {
      const meta = shotMeta(fig);
      if (!groups.has(meta.part)) groups.set(meta.part, []);
      groups.get(meta.part).push({ fig, meta });
    });
    select.innerHTML = '';
    for (const [part, items] of groups) {
      const og = document.createElement('optgroup');
      og.label = part;
      items.forEach(({ fig, meta }) => {
        const opt = document.createElement('option');
        opt.value = fig.id;
        opt.textContent = `${meta.chTitle} · ${meta.label}`;
        og.appendChild(opt);
      });
      select.appendChild(og);
    }
  }

  function updateHud() {
    const key = selected?.fig?.dataset.figure;
    const pins = selected?.fig ? $$('.pin', selected.fig) : [];
    const idx = selected ? pins.indexOf(selected.pin) : -1;
    if (!selected || idx < 0) {
      statusEl.textContent = `Puntos movidos: ${changedCount()} · Selecciona un número.`;
      return;
    }
    const p = currentPin(selected.pin);
    const total = pins.length;
    statusEl.innerHTML = `<b>Punto ${idx + 1} de ${total}</b> · x ${p.x.toFixed(2)} % · y ${p.y.toFixed(2)} % · movidos: ${changedCount()}`;
  }

  function selectPin(pin) {
    $$('.pin.selected').forEach((p) => p.classList.remove('selected'));
    pin.classList.add('selected');
    selected = { fig: pin.closest('.shot'), pin };
    activeShotId = selected.fig.id;
    select.value = activeShotId;
    updateHud();
  }

  function setEditing(on) {
    editing = on;
    document.body.classList.toggle('editor-editing', on);
    $('#pe-editing').checked = on;
    if (!on) {
      $$('.pin.selected').forEach((p) => p.classList.remove('selected'));
      selected = null;
      updateHud();
    }
  }

  function goToShot(id) {
    const fig = document.getElementById(id);
    if (!fig) return;
    const chapter = fig.closest('.chapter');
    if (chapter && location.hash !== '#' + chapter.id) {
      location.hash = '#' + chapter.id;
    }
    activeShotId = id;
    select.value = id;
    setTimeout(() => fig.scrollIntoView({ block: 'center', behavior: 'smooth' }), 280);
    setTimeout(() => {
      const first = $('.pin', fig);
      if (first) selectPin(first);
    }, 700);
  }

  // ── Arrastre ──────────────────────────────────────────────────────────────
  document.addEventListener('pointerdown', (e) => {
    if (!editing) return;
    const pin = e.target.closest('.pin');
    if (!pin) return;
    e.preventDefault();
    e.stopPropagation();

    const fig = pin.closest('.shot');
    const frame = pin.closest('.shot-frame');
    if (!fig || !frame) return;
    selectPin(pin);
    const key = fig.dataset.figure;
    const index = $$('.pin', fig).indexOf(pin);
    const move = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      // Recalcular el rectángulo en cada movimiento: la página puede
      // desplazarse mientras se arrastra cerca del borde.
      const rect = frame.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      setPinGroup(key, index, x, y, false);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      saveDraft();
      updateHud();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    try { pin.setPointerCapture(e.pointerId); } catch { /* noop */ }
  }, true);

  // En modo edición, los clics no abren fichas, tours ni el visor.
  document.addEventListener('click', (e) => {
    if (!editing) return;
    const pin = e.target.closest('.pin');
    if (pin) selectPin(pin);
    if (e.target.closest('.pin, .pin-legend li, .shot-frame img, .shot-zoom, .tour-btn')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Flechas para afinar el punto seleccionado.
  $$('.pin').forEach((pin) => {
    pin.addEventListener('focus', () => { if (editing) selectPin(pin); });
    pin.addEventListener('keydown', (e) => {
      if (!editing || !selected || selected.pin !== pin) return;
      const step = e.shiftKey ? 0.1 : 0.5;
      const p = currentPin(pin);
      const fig = pin.closest('.shot');
      const key = fig.dataset.figure;
      const index = $$('.pin', fig).indexOf(pin);
      let { x, y } = p;
      if (e.key === 'ArrowLeft') x -= step;
      else if (e.key === 'ArrowRight') x += step;
      else if (e.key === 'ArrowUp') y -= step;
      else if (e.key === 'ArrowDown') y += step;
      else return;
      e.preventDefault();
      setPinGroup(key, index, x, y, true);
    });
  });

  // ── Botones ───────────────────────────────────────────────────────────────
  $('#pe-editing').addEventListener('change', (e) => {
    setEditing(e.target.checked);
    toast(e.target.checked ? 'Edición activada: arrastra los números.' : 'Edición desactivada: vista normal del manual.');
  });

  $('#pe-collapse').addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    $('#pe-collapse').textContent = panel.classList.contains('collapsed') ? '▴' : '▾';
    $('#pe-collapse').title = panel.classList.contains('collapsed') ? 'Expandir panel' : 'Contraer panel';
  });

  select.addEventListener('change', (e) => goToShot(e.target.value));

  const ordered = () => shots().map((s) => s.id);
  function step(dir) {
    const ids = ordered();
    const current = activeShotId || ids[0];
    let i = ids.indexOf(current);
    if (i < 0) i = 0;
    i = (i + dir + ids.length) % ids.length;
    goToShot(ids[i]);
  }
  $('#pe-prev').addEventListener('click', () => step(-1));
  $('#pe-next').addEventListener('click', () => step(1));

  $('#pe-reset').addEventListener('click', () => {
    if (!selected) return toast('Primero selecciona un número.', false);
    const key = selected.fig.dataset.figure;
    const index = $$('.pin', selected.fig).indexOf(selected.pin);
    const o = (ORIGINAL[key] || [])[index];
    if (!o) return toast('No hay posición original para este punto.', false);
    setPinGroup(key, index, o.x, o.y, true);
    toast('Punto restablecido.');
  });

  $('#pe-reset-all').addEventListener('click', () => {
    if (!confirm('¿Restablecer TODAS las posiciones a las del manual actual? Se perderán los cambios guardados en este navegador.')) return;
    localStorage.removeItem(DRAFT_KEY);
    location.reload();
  });

  function download() {
    saveDraft();
    const data = buildExport();
    const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hotspots.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('hotspots.json descargado. Avísame cuando termines para reconstruir el PDF.');
  }
  $('#pe-export').addEventListener('click', download);

  async function copyJson() {
    const text = JSON.stringify(buildExport(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      toast('JSON copiado al portapapeles.');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('JSON copiado al portapapeles.'); }
      catch { toast('No se pudo copiar. Usa Descargar posiciones.', false); }
      ta.remove();
    }
  }
  $('#pe-copy').addEventListener('click', copyJson);

  // ── API para pruebas y soporte ────────────────────────────────────────────
  window.__pinEditor = {
    setPin(key, i, x, y) { setPinGroup(key, i, x, y, true); },
    exportData: buildExport,
    changed: changedCount,
    goToShot,
    state: () => ({ editing, selected: selected?.fig?.id || null, changed: changedCount() }),
  };

  // ── Arranque ──────────────────────────────────────────────────────────────
  applyDraft();
  fillSelect();
  setEditing(true);
  if (location.hash) {
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    const fig = target?.classList?.contains('shot')
      ? target
      : target?.querySelector?.('.shot[data-figure]');
    if (fig && fig.querySelector('.pin')) {
      activeShotId = fig.id;
      select.value = fig.id;
    }
  }
  updateHud();
})();

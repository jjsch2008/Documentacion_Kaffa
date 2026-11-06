/* Manual del Frontend KAFFA — comportamiento del sitio interactivo */
(() => {
  'use strict';

  const DATA = window.__KAFFA__ || { chapters: [], search: [], glossary: [] };
  const chapters = DATA.chapters || [];
  const byId = new Map(chapters.map((c, i) => [c.id, { ...c, order: i }]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const LS = {
    theme: 'kaffaManualTheme',
    read: 'kaffaManualRead',
    checks: 'kaffaManualChecks',
  };

  const state = {
    current: null,
    role: 'todos',
    read: new Set(JSON.parse(localStorage.getItem(LS.read) || '[]')),
    checks: JSON.parse(localStorage.getItem(LS.checks) || '{}'),
  };

  // ── Utilidades ──────────────────────────────────────────────────────────────
  const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function saveRead() {
    localStorage.setItem(LS.read, JSON.stringify([...state.read]));
    updateProgress();
  }

  function updateProgress() {
    const pct = chapters.length ? Math.round((state.read.size / chapters.length) * 100) : 0;
    const bar = $('#progress-bar');
    const label = $('#progress-label');
    if (bar) bar.style.width = pct + '%';
    if (label) label.textContent = pct + ' % leído';
    $$('.nav-chapter').forEach((li) => {
      const a = $('a', li);
      if (!a) return;
      const id = a.dataset.target;
      li.classList.toggle('is-read', state.read.has(id));
    });
  }

  // ── Tema ────────────────────────────────────────────────────────────────────
  const savedTheme = localStorage.getItem(LS.theme);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(LS.theme, next);
  }
  ['#theme-toggle', '#theme-toggle-2'].forEach((s) => $(s)?.addEventListener('click', toggleTheme));

  // ── Navegación ──────────────────────────────────────────────────────────────
  const content = $('#content');

  function flatIds() {
    return chapters.map((c) => c.id);
  }

  function show(id, { push = true } = {}) {
    if (id === 'inicio' || id === 'fin' || !byId.has(id)) {
      $$('.chapter').forEach((c) => c.hidden = true);
      const target = id === 'fin' ? $('#fin') : $('.site-cover');
      $$('.part-block').forEach((p) => { p.hidden = true; });
      if (target) target.hidden = false;
      if (id === 'fin') { $('.site-cover').hidden = true; }
      if (id === 'inicio') { $('#fin').hidden = true; }
      state.current = id === 'fin' ? 'fin' : 'inicio';
      updateCrumbs(id);
      updatePager(id);
      closeSidebar();
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (push && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
      return;
    }

    // Mostrar solo el capítulo elegido.
    $('.site-cover').hidden = true;
    $('#fin').hidden = true;
    $$('.part-block').forEach((p) => { p.hidden = true; });
    const chapter = document.getElementById(id);
    if (!chapter) return;
    chapter.hidden = false;
    chapter.closest('.part-block').hidden = false;
    // Ocultar los demás capítulos del mismo bloque.
    $$('.chapter', chapter.closest('.part-block')).forEach((c) => { if (c !== chapter) c.hidden = true; });

    state.current = id;
    updateCrumbs(id);
    updatePager(id);
    updateActiveNav(id);
    closeSidebar();
    if (push && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    document.title = `${byId.get(id).title} · Manual KAFFA`;
    // Desplazar dejando espacio para la barra superior fija.
    requestAnimationFrame(() => chapter.scrollIntoView({ block: 'start', behavior: 'instant' }));
    setTimeout(() => chapter.scrollIntoView({ block: 'start', behavior: 'instant' }), 60);
    const btn = $('.mark-read', chapter);
    if (btn) {
      const isRead = state.read.has(id);
      btn.classList.toggle('is-read', isRead);
      btn.innerHTML = `<span class="mark-read-icon">${isRead ? '✓' : '○'}</span> ${isRead ? 'Leída' : 'Marcar como leída'}`;
    }
  }

  function updateCrumbs(id) {
    const crumbs = $('#crumbs');
    if (!crumbs) return;
    if (id === 'inicio' || id === 'fin' || !byId.has(id)) {
      crumbs.innerHTML = `<span>Manual</span> <i>›</i> <b>${id === 'fin' ? 'Fin' : 'Inicio'}</b>`;
      return;
    }
    const c = byId.get(id);
    crumbs.innerHTML = `<span>${escapeHtml(c.part)}</span> <i>›</i> <b>${escapeHtml(c.title)}</b>`;
  }

  function updatePager(id) {
    const ids = flatIds();
    const idx = ids.indexOf(id);
    const pager = $('.chapter-pager', document.getElementById(id) || document);
    if (!pager || idx < 0) return;
    const prev = idx > 0 ? byId.get(ids[idx - 1]) : null;
    const next = idx < ids.length - 1 ? byId.get(ids[idx + 1]) : null;
    pager.innerHTML = `
      ${prev ? `<a class="pager-link prev" href="#${prev.id}"><span>← Anterior</span><b>${escapeHtml(prev.title)}</b></a>` : '<span></span>'}
      ${next ? `<a class="pager-link next" href="#${next.id}"><span>Siguiente →</span><b>${escapeHtml(next.title)}</b></a>` : `<a class="pager-link next" href="#fin"><span>Fin →</span><b>Volver al inicio</b></a>`}
    `;
  }

  function updateActiveNav(id) {
    $$('.nav-chapter').forEach((li) => {
      li.classList.toggle('active', $('a', li)?.dataset.target === id);
    });
    const active = $('.nav-chapter.active');
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
      const part = active.closest('.nav-part');
      if (part && !part.classList.contains('collapsed')) return;
    }
  }

  window.addEventListener('hashchange', () => {
    const id = location.hash.replace(/^#/, '') || 'inicio';
    show(id, { push: false });
  });

  // Enlaces internos y del sidebar.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    e.preventDefault();
    show(id);
    history.pushState(null, '', '#' + id);
  });

  // Marcar como leída.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.mark-read');
    if (!btn) return;
    const id = btn.dataset.read;
    if (state.read.has(id)) state.read.delete(id);
    else state.read.add(id);
    saveRead();
    const isRead = state.read.has(id);
    btn.classList.toggle('is-read', isRead);
    btn.innerHTML = `<span class="mark-read-icon">${isRead ? '✓' : '○'}</span> ${isRead ? 'Leída' : 'Marcar como leída'}`;
  });

  // ── Filtro por rol ──────────────────────────────────────────────────────────
  $$('.role-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $$('.role-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.role = chip.dataset.role;
      $$('.nav-chapter').forEach((li) => {
        const roles = (li.dataset.roles || 'todos').split(' ');
        const visible = state.role === 'todos' || roles.includes('todos') || roles.includes(state.role);
        li.hidden = !visible;
      });
      $$('.nav-part').forEach((part) => {
        const any = $$('.nav-chapter', part).some((li) => !li.hidden);
        part.hidden = !any;
      });
    });
  });

  // Colapsar partes.
  $$('.nav-part-head').forEach((head) => {
    head.addEventListener('click', () => {
      const part = head.closest('.nav-part');
      part.classList.toggle('collapsed');
      head.setAttribute('aria-expanded', String(!part.classList.contains('collapsed')));
    });
  });

  // ── Buscador ────────────────────────────────────────────────────────────────
  const searchInput = $('#search');
  const results = $('#search-results');

  function snippet(text, needle) {
    const n = norm(text).indexOf(needle);
    if (n < 0) return text.slice(0, 150) + '…';
    let start = Math.max(0, n - 70);
    let raw = text.slice(start, start + 190);
    if (start > 0) {
      const dot = raw.lastIndexOf('. ');
      if (dot > 0 && dot < 80) raw = raw.slice(dot + 2);
      else raw = raw.replace(/^\S+\s/, '');
    }
    return (start > 0 ? '…' : '') + raw.trim() + (start + 190 < text.length ? '…' : '');
  }

  function runSearch(q) {
    if (!results) return;
    const needle = norm(q).trim();
    if (needle.length < 2) { results.hidden = true; results.innerHTML = ''; return; }
    const hits = [];
    for (const c of DATA.search) {
      const inTitle = norm(c.title).includes(needle);
      const n = norm(c.text).indexOf(needle);
      if (!inTitle && n < 0) continue;
      hits.push({ ...c, score: inTitle ? 1000 - c.title.length : 500 - Math.min(n / 100, 400) });
      if (hits.length > 60) break;
    }
    hits.sort((a, b) => b.score - a.score);
    results.innerHTML = hits.length
      ? hits.slice(0, 12).map((h) => `
        <a class="result" href="#${h.id}">
          <span class="result-part">${escapeHtml(h.part)}</span>
          <b>${highlight(h.title, q)}</b>
          <small>${highlight(snippet(h.text, needle), q)}</small>
        </a>`).join('')
      : `<p class="no-results">No encontré “${escapeHtml(q)}”. Prueba con otra palabra: <b>caja</b>, <b>pedido</b>, <b>comprobante</b>.</p>`;
    results.hidden = false;
  }

  function highlight(text, q) {
    const needle = q.trim();
    if (!needle) return escapeHtml(text);
    try {
      const re = new RegExp('(' + needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return escapeHtml(text).replace(re, '<mark>$1</mark>');
    } catch { return escapeHtml(text); }
  }

  searchInput?.addEventListener('input', (e) => runSearch(e.target.value));
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { searchInput.value = ''; results.hidden = true; searchInput.blur(); }
  });
  $('#search-open')?.addEventListener('click', () => {
    if (window.innerWidth < 900) openSidebar();
    searchInput?.focus();
    searchInput?.select();
  });
  document.addEventListener('click', (e) => {
    if (results && !results.hidden && !e.target.closest('.search-results') && e.target !== searchInput && e.target.id !== 'search-open') {
      results.hidden = true;
    }
  });
  results?.addEventListener('click', () => { results.hidden = true; if (searchInput) searchInput.value = ''; });

  // ── Pines de las capturas ───────────────────────────────────────────────────
  function closePinCards() {
    $$('.pin-card').forEach((c) => c.remove());
    $$('.pin.active').forEach((p) => p.classList.remove('active'));
  }

  function openPinCard(pin) {
    const frame = pin.closest('.shot-frame');
    const wasActive = pin.classList.contains('active');
    closePinCards();
    if (wasActive) return;
    pin.classList.add('active');
    const card = document.createElement('div');
    card.className = 'pin-card';
    card.innerHTML = `<b>${escapeHtml(pin.dataset.title)}</b><p>${escapeHtml(pin.dataset.text)}</p><button type="button" class="pin-card-x" aria-label="Cerrar">×</button>`;
    const left = Math.min(72, Math.max(2, parseFloat(pin.style.left)));
    const top = Math.min(74, Math.max(2, parseFloat(pin.style.top)));
    card.style.left = `clamp(12px, ${left}%, calc(100% - 280px))`;
    card.style.top = `calc(${top}% + 26px)`;
    frame.appendChild(card);
    card.querySelector('.pin-card-x').addEventListener('click', (e) => { e.stopPropagation(); closePinCards(); });
  }

  document.addEventListener('click', (e) => {
    const pin = e.target.closest('.pin');
    if (pin) { e.stopPropagation(); openPinCard(pin); return; }
    const legend = e.target.closest('.pin-legend li');
    if (legend) {
      const fig = legend.closest('.shot');
      const p = $(`.pin[data-n="${legend.dataset.n}"]`, fig);
      if (p) openPinCard(p);
      return;
    }
    if (!e.target.closest('.pin-card')) closePinCards();
  });

  $$('.pin-legend li').forEach((li) => {
    li.addEventListener('mouseenter', () => {
      const fig = li.closest('.shot');
      $(`.pin[data-n="${li.dataset.n}"]`, fig)?.classList.add('hover');
    });
    li.addEventListener('mouseleave', () => {
      const fig = li.closest('.shot');
      $(`.pin[data-n="${li.dataset.n}"]`, fig)?.classList.remove('hover');
    });
  });

  // ── Recorrido guiado ────────────────────────────────────────────────────────
  const tour = $('#tour');
  let tourState = null;

  function startTour(fig) {
    const pins = $$('.pin', fig);
    if (!pins.length) return;
    const img = $('img', fig);
    tourState = {
      fig,
      imgSrc: img.getAttribute('src'),
      imgAlt: img.getAttribute('alt'),
      steps: pins.map((p) => ({
        x: parseFloat(p.style.left),
        y: parseFloat(p.style.top),
        title: p.dataset.title,
        text: p.dataset.text,
      })),
      i: 0,
    };
    $('#tour-img').src = tourState.imgSrc;
    $('#tour-img').alt = tourState.imgAlt;
    tour.hidden = false;
    $('#overlay').hidden = false;
    renderTour();
  }

  function renderTour() {
    if (!tourState) return;
    const s = tourState.steps[tourState.i];
    $('#tour-i').textContent = tourState.i + 1;
    $('#tour-n').textContent = tourState.steps.length;
    $('#tour-title').textContent = s.title;
    $('#tour-text').textContent = s.text;
    $('#tour-pins').innerHTML = `<span class="tour-pin" style="left:${s.x}%;top:${s.y}%">${tourState.i + 1}</span>`;
    $('#tour-prev').disabled = tourState.i === 0;
    $('#tour-next').textContent = tourState.i === tourState.steps.length - 1 ? 'Terminar' : 'Siguiente →';
  }

  function endTour() {
    tour.hidden = true;
    $('#overlay').hidden = true;
    tourState = null;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.tour-btn');
    if (!btn) return;
    startTour(btn.closest('.shot'));
  });
  $('#tour-next')?.addEventListener('click', () => {
    if (!tourState) return;
    if (tourState.i === tourState.steps.length - 1) endTour();
    else { tourState.i += 1; renderTour(); }
  });
  $('#tour-prev')?.addEventListener('click', () => {
    if (!tourState) return;
    tourState.i = Math.max(0, tourState.i - 1);
    renderTour();
  });
  $$('[data-close-tour]').forEach((b) => b.addEventListener('click', endTour));

  // ── Visor de imagen ─────────────────────────────────────────────────────────
  const lightbox = $('#lightbox');
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.shot-frame img');
    if (img) {
      $('#lightbox-img').src = img.src;
      $('#lightbox-img').alt = img.alt;
      $('#lightbox-cap').textContent = img.alt;
      lightbox.hidden = false;
      $('#overlay').hidden = false;
      return;
    }
    const zoom = e.target.closest('.shot-zoom');
    if (zoom) {
      const img2 = $('img', zoom.closest('.shot-frame'));
      $('#lightbox-img').src = img2.src;
      $('#lightbox-img').alt = img2.alt;
      $('#lightbox-cap').textContent = img2.alt;
      lightbox.hidden = false;
      $('#overlay').hidden = false;
    }
  });
  function closeLightbox() { lightbox.hidden = true; $('#overlay').hidden = true; }
  $('#lightbox-close')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  // ── Glosario ────────────────────────────────────────────────────────────────
  const glossary = $('#glossary');
  function renderGlossary(q = '') {
    const needle = norm(q);
    const list = (DATA.glossary || []).filter((g) => !needle || norm(g.term).includes(needle) || norm(g.def).includes(needle));
    $('#glossary-list').innerHTML = list.length
      ? list.map((g) => `<div class="gloss-item"><dt>${escapeHtml(g.term)}</dt><dd>${escapeHtml(g.def)}</dd></div>`).join('')
      : '<p class="no-results">Sin resultados.</p>';
  }
  $('#open-glossary')?.addEventListener('click', () => {
    glossary.hidden = false;
    $('#overlay').hidden = false;
    $('#glossary-search').value = '';
    renderGlossary();
    $('#glossary-search').focus();
  });
  $('#glossary-close')?.addEventListener('click', () => { glossary.hidden = true; $('#overlay').hidden = true; });
  glossary?.addEventListener('click', (e) => { if (e.target === glossary) { glossary.hidden = true; $('#overlay').hidden = true; } });
  $('#glossary-search')?.addEventListener('input', (e) => renderGlossary(e.target.value));

  // ── Listas de verificación ──────────────────────────────────────────────────
  $$('.chapter-body input[type="checkbox"]').forEach((box, i) => {
    const chapter = box.closest('.chapter');
    const key = `${chapter.id}:${i}`;
    box.disabled = false;
    box.checked = !!state.checks[key];
    box.closest('li')?.classList.toggle('done', box.checked);
    box.addEventListener('change', () => {
      state.checks[key] = box.checked;
      localStorage.setItem(LS.checks, JSON.stringify(state.checks));
      box.closest('li')?.classList.toggle('done', box.checked);
    });
  });

  // ── Autoevaluación ──────────────────────────────────────────────────────────
  $$('.quiz').forEach((quiz) => {
    const questions = $$('.quiz-q', quiz);
    const scoreEl = $('.quiz-score', quiz);
    let answered = 0;
    let correct = 0;

    questions.forEach((q) => {
      const correctIndex = Number(q.dataset.correct);
      const opts = $$('.quiz-opt', q);
      const feedback = $('.quiz-feedback', q);
      const explanation = $('.quiz-explanation', q);
      opts.forEach((opt, i) => {
        opt.addEventListener('click', () => {
          if (q.dataset.answered) return;
          q.dataset.answered = '1';
          answered += 1;
          const isRight = i === correctIndex;
          if (isRight) correct += 1;
          opts.forEach((o, oi) => {
            o.disabled = true;
            if (oi === correctIndex) o.classList.add('correct');
            if (oi === i && !isRight) o.classList.add('wrong');
          });
          feedback.hidden = false;
          feedback.className = `quiz-feedback ${isRight ? 'ok' : 'bad'}`;
          feedback.textContent = isRight ? '✓ Correcto' : '✗ No es la respuesta correcta';
          explanation.hidden = false;

          if (answered === questions.length) {
            scoreEl.hidden = false;
            scoreEl.innerHTML = `Resultado: <b>${correct} de ${questions.length}</b> · ${correct >= questions.length - 1 ? '¡Excelente!' : correct >= Math.ceil(questions.length / 2) ? 'Buen trabajo, repasa lo fallado.' : 'Vuelve a leer los capítulos de tu rol.'}`;
          }
        });
      });
    });
  });

  // ── Sidebar móvil ───────────────────────────────────────────────────────────
  const sidebar = $('#sidebar');
  function openSidebar() { sidebar.classList.add('open'); }
  function closeSidebar() { sidebar.classList.remove('open'); }
  $('#menu-btn')?.addEventListener('click', openSidebar);
  $('#side-close')?.addEventListener('click', closeSidebar);

  // ── Atajos ──────────────────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === '/') { e.preventDefault(); searchInput?.focus(); }
    if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) toggleTheme();
    if (e.key === 'Escape') {
      closePinCards();
      if (!lightbox.hidden) closeLightbox();
      if (!glossary.hidden) { glossary.hidden = true; $('#overlay').hidden = true; }
      if (!tour.hidden) endTour();
      results.hidden = true;
      closeSidebar();
    }
  });

  // Flechas en el recorrido.
  document.addEventListener('keydown', (e) => {
    if (tour.hidden) return;
    if (e.key === 'ArrowRight') $('#tour-next')?.click();
    if (e.key === 'ArrowLeft') $('#tour-prev')?.click();
  });

  // ── Portada: botón "Ver cómo funciona" ──────────────────────────────────────
  $('#cover-tour')?.addEventListener('click', () => {
    show('cap-8');
    setTimeout(() => {
      const fig = $('.chapter:not([hidden]) .shot');
      if (fig) startTour(fig);
    }, 450);
  });

  // ── Arranque ────────────────────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  updateProgress();
  const initial = location.hash.replace(/^#/, '') || 'inicio';
  show(initial, { push: false });
  if (initial === 'inicio') history.replaceState(null, '', '#inicio');

  // Precarga diferida de las imágenes de las capturas al abrir un capítulo.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-target]');
    if (!a) return;
    const ch = document.getElementById(a.dataset.target);
    $$('img[loading="lazy"]', ch || document).forEach((img) => { img.loading = 'eager'; });
  });
})();

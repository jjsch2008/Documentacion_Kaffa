#!/usr/bin/env node
/**
 * Captura las pantallas del frontend KAFFA para el manual.
 * Requisitos: backend demo en :8000 (kaffa_manual + faketime) y Vite en :5173.
 *
 *   node build/capture.mjs            # todas las capturas
 *   node build/capture.mjs --only=admin
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { launch, loginData, sleep } from './cdp.mjs';

const BASE = 'http://127.0.0.1:5173';
const OUT = 'assets/capturas';
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';

await mkdir(OUT, { recursive: true });
await mkdir('data/interacciones', { recursive: true });

let tokens;
try {
  tokens = JSON.parse(await readFile('data/tokens.json', 'utf8'));
} catch {
  tokens = {
    admin: await loginData('admin@kaffa.com', 'admin123'),
    barista: await loginData('barista@kaffa.com', 'barista123'),
    cliente: await loginData('cliente@kaffa.com', 'cliente123'),
  };
  await writeFile('data/tokens.json', JSON.stringify(tokens, null, 2));
}

const PROMOS = [
  {
    id: 'promo-semana-cafe', nombre: 'Semana del Café',
    mensaje: '20% de descuento en todas las bebidas calientes', tipo: 'descuento',
    color: '#e8f0e0', fecha_vencimiento: '2026-10-30T23:59', enlace: '/menu',
    imagen: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=80',
    activa: true, creada_en: '2026-10-20T09:00:00.000Z',
  },
  {
    id: 'promo-2x1', nombre: '2x1 en Capuchinos',
    mensaje: 'Todos los martes de 3:00 a 6:00 p. m.', tipo: '2x1',
    color: '#f0e7d8', fecha_vencimiento: null, enlace: '/menu',
    imagen: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=900&q=80',
    activa: true, creada_en: '2026-10-19T09:00:00.000Z',
  },
  {
    id: 'promo-combo', nombre: 'Combo Desayuno KAFFA',
    mensaje: 'Café de 8 oz + croissant por $12.900', tipo: 'combo',
    color: '#e7ece6', fecha_vencimiento: '2026-11-15T23:59', enlace: '/menu',
    imagen: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80',
    activa: true, creada_en: '2026-10-18T09:00:00.000Z',
  },
];

const page = await launch();
const state = { role: null };
const results = [];

async function setRole(role, extra = {}) {
  if (state.role === role) {
    if (Object.keys(extra).length) {
      await page.evaluate(`localStorage.clear(); sessionStorage.clear();`);
      await page.storage({ ...(role === 'public' ? {} : tokens[role]), kaffaTheme: 'light', kaffaPromociones: JSON.stringify(PROMOS), ...extra });
    }
    return;
  }
  await page.goto(BASE + '/', { settle: 400 });
  await page.evaluate('localStorage.clear(); sessionStorage.clear();');
  await page.storage({
    ...(role === 'public' ? {} : tokens[role]),
    kaffaTheme: 'light',
    kaffaPromociones: JSON.stringify(PROMOS),
    ...extra,
  });
  await page.evaluate('sessionStorage.setItem("kaffaPromoPopupCerrado","1"); true');
  state.role = role;
}

async function go(role, path, settle = 900) {
  await setRole(role);
  await page.goto(BASE + path, { settle });
}

async function capture(id, file, fn, { raw = false } = {}) {
  if (only && !id.startsWith(only)) return;
  const t0 = Date.now();
  try {
    await fn();
    if (!raw) await page.shot(`${OUT}/${file}`);
    results.push({ id, file, ok: true, ms: Date.now() - t0 });
    console.log(`✓ ${id}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } catch (err) {
    results.push({ id, file, ok: false, error: String(err.message || err) });
    console.log(`✗ ${id}: ${err.message || err}`);
  }
}

async function dump(name) {
  const outline = await page.outline();
  await writeFile(`data/interacciones/${name}.json`, JSON.stringify(outline, null, 2));
}

// ─────────────────────────────────────────────────────────────
// 1. PÚBLICO
// ─────────────────────────────────────────────────────────────
await capture('01', 'p01-portada.png', async () => {
  await go('public', '/', 1400);
  await page.evaluate('sessionStorage.setItem("kaffaPromoPopupCerrado","1"); true');
  await page.goto(BASE + '/', { settle: 1200 });
});

await capture('02', 'p02-portada-favoritos.png', async () => {
  await go('public', '/', 1200);
  await page.evaluate('sessionStorage.setItem("kaffaPromoPopupCerrado","1"); true');
  await page.goto(BASE + '/', { settle: 1000 });
  await page.scrollTo('.featured');
});

await capture('03', 'p03-menu.png', async () => {
  await go('public', '/menu', 1400);
});

await capture('04', 'p04-menu-filtro.png', async () => {
  await go('public', '/menu', 1200);
  await page.clickText('.menu-filtros button', 'Cafés');
  await page.scrollTo('.featured');
});

await capture('05', 'p05-eventos.png', async () => {
  await go('public', '/eventos', 1500);
});

await capture('06', 'p06-sobre-nosotros.png', async () => {
  await go('public', '/sobre-nosotros', 1400);
  await page.scrollTo('.about-team', { offset: -100 });
});

await capture('07', 'p07-contacto.png', async () => {
  await go('public', '/contacto', 1300);
});

await capture('08', 'p08-promocion-popup.png', async () => {
  await setRole('public');
  await page.evaluate('sessionStorage.clear(); true');
  await page.goto(BASE + '/', { settle: 1800 });
  await page.evaluate('sessionStorage.removeItem("kaffaPromoPopupCerrado"); true');
  await page.goto(BASE + '/', { settle: 2200 });
});

await capture('09', 'p09-login.png', async () => {
  await go('public', '/login', 1100);
});

await capture('10', 'p10-login-error.png', async () => {
  await go('public', '/login', 900);
  await page.type('input[type="email"], input[name="correo"]', 'cliente@kaffa.com');
  await page.type('input[type="password"]', 'incorrecta');
  await page.clickText('button', 'Ingresar');
  await sleep(900);
});

await capture('11', 'p11-registro.png', async () => {
  await go('public', '/registro', 1100);
  await page.type('input[name="nombre"], input[type="text"]', 'Laura Gómez');
  await page.type('input[type="email"]', 'laura@correo.com');
  const pass = await page.evaluate(`document.querySelectorAll('input[type="password"]').length`);
  if (pass >= 1) await page.type('input[type="password"]', 'Cafe2026!');
  if (pass >= 2) await page.type('input[type="password"]', 'Cafe2026!', { index: 1 });
});

await capture('12', 'p12-recuperar.png', async () => {
  await go('public', '/forgot-password', 1100);
});

await capture('13', 'p13-verificar.png', async () => {
  await go('public', '/verify-email', 1100);
});

// ─────────────────────────────────────────────────────────────
// 2. CLIENTE
// ─────────────────────────────────────────────────────────────
await capture('14', 'c01-home-cliente.png', async () => {
  await go('cliente', '/', 1500);
  await page.evaluate('sessionStorage.setItem("kaffaPromoPopupCerrado","1"); true');
  await page.goto(BASE + '/', { settle: 1200 });
});

await capture('15', 'c02-menu-cliente.png', async () => {
  await go('cliente', '/menu', 1500);
});

await capture('16', 'c03-detalle-producto.png', async () => {
  await go('cliente', '/menu', 1300);
  await page.clickText('button', 'Comprar');
  await page.type('.modal-content textarea', 'Sin azúcar y con leche deslactosada');
  await page.evaluate(`(() => {
    const b = [...document.querySelectorAll('.qty-stepper button')];
    if (b.length) b[b.length - 1].click();
    return b.length;
  })()`);
  await sleep(400);
});

await capture('17', 'c04-carrito.png', async () => {
  await go('cliente', '/menu', 1300);
  await page.clickText('button', 'Comprar');
  await page.type('.modal-content textarea', 'Sin azúcar');
  await page.clickText('button', 'Agregar');
  await sleep(500);
  await page.click('.nav-cart');
  await sleep(600);
});

await capture('18', 'c05-pago.png', async () => {
  await go('cliente', '/menu', 1300);
  await page.clickText('button', 'Comprar');
  await page.clickText('button', 'Agregar');
  await sleep(500);
  await page.click('.nav-cart');
  await sleep(500);
  await page.clickText('button', 'Confirmar Pedido');
  await sleep(700);
});

await capture('19', 'c06-pago-virtual.png', async () => {
  await go('cliente', '/menu', 1300);
  await page.clickText('button', 'Comprar');
  await page.clickText('button', 'Agregar');
  await sleep(500);
  await page.click('.nav-cart');
  await sleep(500);
  await page.clickText('button', 'Confirmar Pedido');
  await sleep(600);
  await page.clickText('.payment-opt', 'Pagar ya');
  await sleep(500);
  const opts = await page.evaluate(`[...document.querySelectorAll('.modal-content select option')].map(o=>({v:o.value,t:o.textContent}))`);
  const virt = opts.find((o) => /transferencia/i.test(o.t)) || opts.find((o) => /virtual/i.test(o.t));
  if (virt) await page.type('.modal-content select', virt.v);
  await sleep(500);
});

await capture('20', 'c07-mis-pedidos.png', async () => {
  await go('cliente', '/pedidos', 1600);
});

await capture('21', 'c08-chat-cliente.png', async () => {
  await go('cliente', '/chat', 1600);
});

await capture('22', 'c09-perfil.png', async () => {
  await go('cliente', '/menu', 1300);
  await page.click('.nav-user-wrap .nav-btn');
  await sleep(350);
  await page.clickText('.nav-dropdown button', 'Mi Perfil');
  await sleep(600);
});

await capture('23', 'c10-menu-movil.png', async () => {
  await go('cliente', '/menu', 1300);
  await page.viewport(390, 844, true);
  await sleep(700);
  await page.shot(`${OUT}/c10-menu-movil.png`);
  await page.viewport(1440, 900);
}, { raw: true });

// ─────────────────────────────────────────────────────────────
// 3. BARISTA
// ─────────────────────────────────────────────────────────────
await capture('24', 'b01-tablero.png', async () => {
  await go('barista', '/barista-dashboard/pedidos', 1800);
});

await capture('25', 'b02-cobrar.png', async () => {
  await go('barista', '/barista-dashboard/pedidos', 1600);
  await page.clickText('button', 'COBRAR');
  await sleep(700);
  await dump('barista-cobrar');
});

await capture('26', 'b03-cobrar-virtual.png', async () => {
  await go('barista', '/barista-dashboard/pedidos', 1600);
  await page.clickText('button', 'COBRAR');
  await sleep(600);
  const opts = await page.evaluate(`[...document.querySelectorAll('.modal-content select option')].map(o=>({v:o.value,t:o.textContent}))`);
  const virt = opts.find((o) => /transferencia/i.test(o.t));
  if (virt) await page.type('.modal-content select', virt.v);
  await sleep(600);
});

await capture('27', 'b04-registrar-pedido.png', async () => {
  await go('barista', '/barista-dashboard/pedidos', 1600);
  await page.clickText('button', 'Registrar Pedido');
  await sleep(800);
  await dump('barista-registrar');
});

await capture('28', 'b05-inventario.png', async () => {
  await go('barista', '/barista-dashboard/inventario', 1600);
});

await capture('29', 'b06-reportar.png', async () => {
  await go('barista', '/barista-dashboard/inventario', 1600);
  await page.clickText('button', 'Reportar');
  await sleep(700);
});

await capture('30', 'b07-chat.png', async () => {
  await go('barista', '/barista-dashboard/chat', 1600);
  await page.evaluate(`(() => {
    const items = [...document.querySelectorAll('.chat-inbox-item')];
    (items[1] || items[0])?.click();
    return items.length;
  })()`);
  await sleep(900);
});

await capture('31', 'b08-caja.png', async () => {
  await go('barista', '/barista-dashboard/caja', 1800);
});

await capture('32', 'b09-arqueo.png', async () => {
  await go('barista', '/barista-dashboard/caja', 1600);
  const inputs = await page.evaluate(`[...document.querySelectorAll('#caja input[type="number"]')].map((e,i)=>({i,ph:e.placeholder,ro:e.readOnly}))`);
  const editables = inputs.filter((e) => !e.ro);
  if (editables[0]) await page.type('#caja input[type="number"]', '119500', { index: editables[0].i });
  if (editables[1]) await page.type('#caja input[type="number"]', '41500', { index: editables[1].i });
  await sleep(500);
  await dump('barista-arqueo');
});

await capture('33', 'b10-perfil.png', async () => {
  await go('barista', '/barista-dashboard/pedidos', 1500);
  await page.click('.profile-trigger');
  await sleep(300);
  await page.clickText('.profile-dropdown .dropdown-item', 'Editar Perfil');
  await sleep(600);
});

await capture('34', 'b11-tablero-movil.png', async () => {
  await go('barista', '/barista-dashboard/pedidos', 1500);
  await page.viewport(390, 844, true);
  await sleep(500);
  await page.evaluate(`document.querySelector('.menu-toggle')?.click(); true`);
  await sleep(800);
  await page.shot(`${OUT}/b11-tablero-movil.png`);
  await page.viewport(1440, 900);
}, { raw: true });

// ─────────────────────────────────────────────────────────────
// 4. ADMIN — las 19 secciones
// ─────────────────────────────────────────────────────────────
const ADMIN = [
  ['35', 'a01-inicio', 'Inicio'],
  ['36', 'a02-pedidos', 'Pedidos'],
  ['37', 'a03-productos', 'Menú / Productos'],
  ['38', 'a04-categorias', 'Categorías'],
  ['39', 'a05-insumos', 'Insumos'],
  ['40', 'a06-mermas', 'Mermas'],
  ['41', 'a07-compras', 'Compras'],
  ['42', 'a08-proveedores', 'Proveedores'],
  ['43', 'a09-gastos', 'Gastos'],
  ['44', 'a10-cajas', 'Cajas'],
  ['45', 'a11-facturas', 'Facturas'],
  ['46', 'a12-clientes', 'Clientes'],
  ['47', 'a13-baristas', 'Baristas'],
  ['48', 'a14-turnos', 'Turnos'],
  ['49', 'a15-eventos', 'Eventos'],
  ['50', 'a16-promociones', 'Promociones'],
  ['51', 'a17-reportes', 'Reportes'],
  ['52', 'a18-asistente', 'Asistente IA'],
  ['53', 'a19-configuracion', 'Configuración'],
];

for (const [id, file, label] of ADMIN) {
  await capture(id, `${file}.png`, async () => {
    await go('admin', '/admin-dashboard', 1500);
    await page.clickText('.sidebar-links button', label, { settle: 1200 });
    if (label === 'Asistente IA') await sleep(1200);
  });
}

// ─────────────────────────────────────────────────────────────
// 5. ADMIN — modales y estados
// ─────────────────────────────────────────────────────────────
async function adminModal(section, action, name) {
  await go('admin', '/admin-dashboard', 1300);
  await page.clickText('.sidebar-links button', section, { settle: 900 });
  await action();
  await sleep(750);
  await dump(name);
}

await capture('54', 'a20-detalle-pedido.png', async () => {
  await adminModal('Pedidos', async () => page.click('.btn-icon.view'), 'admin-detalle-pedido');
});

await capture('55', 'a21-nuevo-producto.png', async () => {
  await adminModal('Menú / Productos', async () => {
    await page.clickText('button', 'Nuevo Producto');
    await page.type('.modal-content input[type="text"]', 'Flat White', { index: 0 });
    await page.type('.modal-content input[type="number"]', '9500');
  }, 'admin-nuevo-producto');
});

await capture('56', 'a22-nueva-categoria.png', async () => {
  await adminModal('Categorías', async () => {
    await page.clickText('button', 'Nueva Categoría');
    await page.type('.modal-content input[type="text"]', 'Bebidas frías');
  }, 'admin-nueva-categoria');
});

await capture('57', 'a23-nuevo-insumo.png', async () => {
  await adminModal('Insumos', async () => {
    await page.clickText('button', 'Nuevo Insumo');
    await page.type('.modal-content input[type="text"]', 'Leche de almendras');
  }, 'admin-nuevo-insumo');
});

await capture('58', 'a24-registrar-merma.png', async () => {
  await adminModal('Mermas', async () => page.clickText('button', 'Registrar Merma'), 'admin-registrar-merma');
});

await capture('59', 'a25-nueva-compra.png', async () => {
  await adminModal('Compras', async () => page.clickText('button', 'Nueva Compra'), 'admin-nueva-compra');
});

await capture('60', 'a26-nuevo-proveedor.png', async () => {
  await adminModal('Proveedores', async () => {
    await page.clickText('button', 'Nuevo Proveedor');
    await page.type('.modal-content input[type="text"]', 'Distribuidora El Grano');
  }, 'admin-nuevo-proveedor');
});

await capture('61', 'a27-nuevo-gasto.png', async () => {
  await adminModal('Gastos', async () => page.clickText('button', 'Nuevo Gasto'), 'admin-nuevo-gasto');
});

await capture('62', 'a28-abrir-caja.png', async () => {
  await adminModal('Cajas', async () => page.clickText('button', 'Abrir Caja'), 'admin-abrir-caja');
});

await capture('63', 'a29-editar-cliente.png', async () => {
  await adminModal('Clientes', async () => page.click('.btn-icon.edit'), 'admin-editar-cliente');
});

await capture('64', 'a30-agregar-barista.png', async () => {
  await adminModal('Baristas', async () => page.clickText('button', 'Agregar Barista'), 'admin-agregar-barista');
});

await capture('65', 'a31-nuevo-turno.png', async () => {
  await adminModal('Turnos', async () => page.clickText('button', 'Nuevo Turno'), 'admin-nuevo-turno');
});

await capture('66', 'a32-nuevo-evento.png', async () => {
  await adminModal('Eventos', async () => page.clickText('button', 'Nuevo Evento'), 'admin-nuevo-evento');
});

await capture('67', 'a33-nueva-promocion.png', async () => {
  await adminModal('Promociones', async () => page.clickText('button', 'Nueva Promoción'), 'admin-nueva-promocion');
});

await capture('68', 'a34-nuevo-medio.png', async () => {
  await adminModal('Configuración', async () => page.clickText('button', 'Nuevo Medio'), 'admin-nuevo-medio');
});

await capture('69', 'a35-asistente-conversacion.png', async () => {
  await go('admin', '/admin-dashboard', 1400);
  await page.clickText('.sidebar-links button', 'Asistente IA', { settle: 1200 });
  await page.click('.ia-chip');
  await sleep(2600);
});

await capture('70', 'a36-tema-oscuro.png', async () => {
  await go('admin', '/admin-dashboard', 1400);
  await page.click('.theme-toggle');
  await sleep(900);
});

await capture('71', 'a37-menu-movil-admin.png', async () => {
  await go('admin', '/admin-dashboard', 1400);
  await page.evaluate(`localStorage.setItem('kaffaTheme','light'); true`);
  await page.goto(BASE + '/admin-dashboard', { settle: 1200 });
  await page.viewport(390, 844, true);
  await sleep(700);
  await page.shot(`${OUT}/a37-menu-movil-admin.png`);
  await page.viewport(1440, 900);
}, { raw: true });

await writeFile('data/capturas.json', JSON.stringify(results, null, 2));
const ok = results.filter((r) => r.ok).length;
console.log(`\nCapturas: ${ok}/${results.length}`);
const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.log('Fallidas:');
  failed.forEach((f) => console.log(' -', f.id, f.error));
}
await page.close();

#!/usr/bin/env node
/**
 * Levanta la SPA y vuelca la estructura visible de cada pantalla:
 * títulos, botones, cabeceras de tabla, campos y texto.
 * Sirve para redactar el manual con las etiquetas reales.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { launch, loginData, sleep } from './cdp.mjs';

const BASE = 'http://127.0.0.1:5173';
const out = {};

const sesiones = {
  admin: await loginData('admin@kaffa.com', 'admin123'),
  barista: await loginData('barista@kaffa.com', 'barista123'),
  cliente: await loginData('cliente@kaffa.com', 'cliente123'),
};

const page = await launch();
try {
  await page.goto(BASE + '/');
  await page.storage(sesiones.admin);

  const adminSecciones = ['Inicio', 'Pedidos', 'Menú / Productos', 'Categorías', 'Insumos', 'Mermas',
    'Compras', 'Proveedores', 'Gastos', 'Cajas', 'Facturas', 'Clientes', 'Baristas', 'Turnos',
    'Eventos', 'Promociones', 'Reportes', 'Asistente IA', 'Configuración'];

  await page.goto(BASE + '/admin-dashboard');
  for (const s of adminSecciones) {
    await page.clickText('.sidebar-links button', s, { settle: 900 });
    out['admin:' + s] = await page.outline();
    console.log('admin:', s);
  }

  // Barista
  await page.goto(BASE + '/');
  await page.storage(sesiones.barista);
  for (const [slug, name] of [['pedidos', 'Pedidos'], ['inventario', 'Inventario'], ['chat', 'Chat'], ['caja', 'Caja']]) {
    await page.goto(BASE + '/barista-dashboard/' + slug, { settle: 1000 });
    out['barista:' + name] = await page.outline();
    console.log('barista:', name);
  }

  // Cliente
  await page.goto(BASE + '/');
  await page.storage(sesiones.cliente);
  for (const [slug, name] of [['/pedidos', 'Mis pedidos'], ['/chat', 'Chat cliente']]) {
    await page.goto(BASE + slug, { settle: 1000 });
    out['cliente:' + name] = await page.outline();
    console.log('cliente:', name);
  }

  // Públicas
  await page.evaluate('localStorage.clear()');
  for (const [slug, name] of [['/', 'Inicio'], ['/menu', 'Menú'], ['/eventos', 'Eventos'],
    ['/sobre-nosotros', 'Sobre nosotros'], ['/contacto', 'Contacto'], ['/login', 'Login'],
    ['/registro', 'Registro'], ['/forgot-password', 'Recuperar contraseña'], ['/verify-email', 'Verificar correo']]) {
    await page.goto(BASE + slug, { settle: 1200 });
    out['publico:' + name] = await page.outline();
    console.log('publico:', name);
  }

  await mkdir('data', { recursive: true });
  await writeFile('data/outline.json', JSON.stringify(out, null, 2));
  console.log('Guardado data/outline.json');
} finally {
  await page.close();
}

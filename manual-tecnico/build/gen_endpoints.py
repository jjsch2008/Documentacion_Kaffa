#!/usr/bin/env python3
"""Genera el capítulo de matriz de endpoints a partir de route:list y OpenAPI."""
import json, re, os
from collections import OrderedDict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
routes = json.load(open(os.path.join(BASE, 'data/routes.json'), encoding='utf-8'))
openapi = json.load(open(os.path.join(BASE, 'data/openapi.json'), encoding='utf-8'))

MODULES = [
    ('Autenticación y sesión', ['login', 'registro', 'forgot-password', 'reset-password', 'email/', 'me', 'user', 'logout', 'auth/', 'perfil', 'health']),
    ('Sitio público y eventos', ['equipo', 'eventos']),
    ('Catálogo', ['categorias', 'productos', 'insumos', 'recetas', 'medios-pago']),
    ('Pedidos, pagos y facturas', ['pedidos', 'pago-pedidos', 'factura-ventas']),
    ('Caja y movimientos', ['cajas', 'movimiento-cajas', 'turno-activo']),
    ('Compras y proveedores', ['compras', 'detalle-compras', 'compra-pagos', 'proveedores']),
    ('Gastos y mermas', ['gastos', 'gasto-pagos', 'mermas']),
    ('Turnos', ['turnos', 'mis-turnos']),
    ('Chat y reportes', ['mensajes', 'reportes']),
    ('Usuarios y roles', ['usuarios', 'usuario-roles', 'roles']),
    ('Asistente KAFFA', ['asistente']),
]

def module_for(path):
    p = path.replace('/api/v1/', '')
    for name, prefixes in MODULES:
        for pref in prefixes:
            if p == pref or p.startswith(pref + '/') or p.startswith(pref + '?') or (pref.endswith('/') and p.startswith(pref)):
                return name
    return 'Otros'

def norm_path(path):
    return re.sub(r'\{[^}]+\}', '{id}', path)

def short_mw(mw):
    return mw.split('\\')[-1]

def parse_route(r):
    methods = [m for m in r['method'].split('|') if m != 'HEAD']
    if not methods:
        return []
    method = 'PUT/PATCH' if set(methods) == {'PUT', 'PATCH'} else methods[0]
    mws = [short_mw(m) for m in r['middleware']]
    auth = any(m.startswith('Authenticate') for m in mws)
    roles = None
    ability = None
    turno = any(m.startswith('EnsureActiveTurno') for m in mws)
    throttle = None
    for m in mws:
        if m.startswith('CheckRole:'):
            roles = m.split(':', 1)[1].split(',')
        if m.startswith('EnsureTokenCanAbility:'):
            ability = m.split(':', 1)[1]
        if m.startswith('ThrottleRequests:'):
            throttle = m.split(':', 1)[1]
    return [{
        'method': method,
        'path': norm_path('/' + r['uri']),
        'auth': auth,
        'roles': roles,
        'ability': ability,
        'turno': turno,
        'throttle': throttle,
        'name': r.get('name') or '',
        'action': r.get('action') or '',
    }]

ops = []
seen = set()
for r in routes:
    if not r['uri'].startswith('api/v1'):
        continue
    for op in parse_route(r):
        key = (op['method'], op['path'])
        if key in seen:
            continue
        seen.add(key)
        ops.append(op)

# Descripciones legibles.
SPECIAL = {
    ('POST', '/api/v1/login'): 'Inicia sesión y emite un token Bearer con las abilities del rol.',
    ('POST', '/api/v1/registro'): 'Alta diferida de cliente: guarda el pendiente y envía un código OTP.',
    ('POST', '/api/v1/forgot-password'): 'Envía un código OTP para restablecer la contraseña.',
    ('POST', '/api/v1/reset-password'): 'Valida el código OTP, cambia la contraseña y revoca todos los tokens.',
    ('POST', '/api/v1/email/verify-code'): 'Verifica el código OTP y crea el usuario ya verificado.',
    ('POST', '/api/v1/email/verification-notification'): 'Reenvía el código de verificación del alta pendiente.',
    ('GET', '/api/v1/me'): 'Devuelve el perfil del usuario autenticado con sus roles.',
    ('GET', '/api/v1/user'): 'Alias de /me: perfil del usuario autenticado.',
    ('POST', '/api/v1/logout'): 'Revoca el token actual.',
    ('POST', '/api/v1/auth/refresh'): 'Rota el token actual y emite uno nuevo.',
    ('POST', '/api/v1/auth/logout-all'): 'Revoca todos los tokens del usuario.',
    ('PUT', '/api/v1/perfil'): 'Actualiza nombre, correo, contraseña o foto del propio usuario.',
    ('GET', '/api/v1/health'): 'Comprueba que el token es válido.',
    ('GET', '/api/v1/equipo'): 'Equipo visible en la landing (administradora y baristas por turno).',
    ('GET', '/api/v1/eventos'): 'Lista pública de eventos publicados.',
    ('GET', '/api/v1/eventos/{id}'): 'Detalle público de un evento publicado.',
    ('GET', '/api/v1/eventos/admin'): 'Listado de gestión de eventos, incluidos borradores.',
    ('POST', '/api/v1/eventos/imagen'): 'Sube una imagen de evento (multipart) y devuelve su URL.',
    ('GET', '/api/v1/asistente/mensajes'): 'Historial paginado del hilo del Asistente KAFFA.',
    ('POST', '/api/v1/asistente/chat'): 'Envía un mensaje al Asistente y devuelve la respuesta adaptada al rol.',
    ('DELETE', '/api/v1/asistente/mensajes'): 'Reinicia la conversación del usuario autenticado.',
}

RESOURCE_NAMES = {
    'categorias': 'categoría', 'productos': 'producto', 'insumos': 'insumo', 'recetas': 'receta',
    'medios-pago': 'medio de pago', 'pedidos': 'pedido', 'pago-pedidos': 'pago de pedido',
    'factura-ventas': 'factura de venta', 'cajas': 'caja', 'movimiento-cajas': 'movimiento de caja',
    'compras': 'compra', 'detalle-compras': 'detalle de compra', 'compra-pagos': 'pago de compra',
    'proveedores': 'proveedor', 'gastos': 'gasto', 'gasto-pagos': 'pago de gasto', 'mermas': 'merma',
    'turnos': 'turno', 'mensajes': 'mensaje', 'reportes': 'reporte', 'usuarios': 'usuario',
    'usuario-roles': 'asignación usuario-rol', 'roles': 'rol', 'eventos': 'evento',
}

def describe(op):
    key = (op['method'], op['path'])
    if key in SPECIAL:
        return SPECIAL[key]
    base = op['path'].replace('/api/v1/', '').split('/')[0]
    res = RESOURCE_NAMES.get(base, base.replace('-', ' '))
    m = op['method']
    has_id = op['path'].rstrip('/').endswith('{id}')
    if m == 'GET':
        return f"Lista {res}s." if not has_id else f"Consulta un {res} por ID."
    if m == 'POST':
        return f"Crea un {res}."
    if m in ('PUT', 'PATCH', 'PUT/PATCH'):
        return f"Actualiza un {res}."
    if m == 'DELETE':
        return f"Elimina un {res}."
    return 'Operación de la API.'

for op in ops:
    op['module'] = module_for(op['path'])
    op['desc'] = describe(op)

# OpenAPI summary como respaldo cuando existe y es útil.
for path, item in openapi.get('paths', {}).items():
    for method, o in item.items():
        if method.lower() not in ('get', 'post', 'put', 'patch', 'delete'):
            continue
        for op in ops:
            if op['path'] == path and op['method'].lower().startswith(method):
                summary = re.sub(r'\s+', ' ', (o.get('summary') or '')).strip()
                if summary and summary.lower() not in op['desc'].lower():
                    op['desc'] = summary[0].upper() + summary[1:] + ('' if summary.endswith('.') else '.')

module_order = [m[0] for m in MODULES] + ['Otros']
grouped = OrderedDict((m, []) for m in module_order)
for op in ops:
    grouped.setdefault(op['module'], []).append(op)

def cell(v):
    return str(v).replace('|', '\\|') if v else '—'

lines = []
lines.append('# 26. Matriz completa de endpoints\n')
lines.append('Esta matriz se genera automáticamente a partir de `php artisan route:list` y se contrasta con `openapi.json`. Una misma ruta puede aparecer una vez por operación; `PUT/PATCH` se muestra junto porque Laravel acepta ambos métodos. La columna **Throttle** indica el límite específico de la ruta; todas las rutas heredan además el límite global de 60 peticiones por minuto por usuario o IP.\n')
lines.append('> **Nota.** `route:list` reporta 142 entradas porque separa lecturas y escrituras de los `apiResource` y añade el prefijo `HEAD` a los `GET`. Al normalizar métodos y rutas quedan las operaciones funcionales de esta matriz; OpenAPI documenta 69 paths porque agrupa operaciones por recurso.\n')
lines.append('## 26.1 Resumen por módulo\n')
lines.append('| Módulo | Operaciones | Rutas con auth | Rutas con rol | Rutas con ability |')
lines.append('|---|---:|---:|---:|---:|')
for mod, items in grouped.items():
    if not items:
        continue
    lines.append(f"| {mod} | {len(items)} | {sum(1 for x in items if x['auth'])} | {sum(1 for x in items if x['roles'])} | {sum(1 for x in items if x['ability'])} |")
lines.append(f"| **Total** | **{len(ops)}** | **{sum(1 for x in ops if x['auth'])}** | **{sum(1 for x in ops if x['roles'])}** | **{sum(1 for x in ops if x['ability'])}** |\n")

lines.append('## 26.2 Detalle por módulo\n')
for mod, items in grouped.items():
    if not items:
        continue
    lines.append(f'### {mod}\n')
    lines.append('| Método | Endpoint | Auth | Roles | Ability | Turno | Throttle | Operación |')
    lines.append('|---|---|---:|---|---|---:|---|---|')
    for op in sorted(items, key=lambda x: (x['path'], x['method'])):
        roles = ', '.join(op['roles']) if op['roles'] else ('Todos los autenticados' if op['auth'] else 'Público')
        throttle = (op['throttle'].split(',')[0] + '/min') if op['throttle'] else '60/min global'
        lines.append(f"| `{op['method']}` | `{op['path']}` | {'Sí' if op['auth'] else 'No'} | {cell(roles)} | `{cell(op['ability'])}` | {'Sí' if op['turno'] else '—'} | {throttle} | {cell(op['desc'])} |")
    lines.append('')

lines.append('## 26.3 Cómo leer la matriz\n')
lines.append('- **Auth**: exige `Authorization: Bearer {token}`. Sin token, la API responde 401 en JSON.\n- **Roles**: el middleware `role:` exige al menos uno de los roles indicados. Admin, barista y cliente son acumulables.\n- **Ability**: el token debe poseer el alcance indicado; de lo contrario responde 403 `TOKEN_SIN_ABILITY`. El token de admin usa `*`.\n- **Turno**: el middleware `turno.activo` solo afecta a baristas; admin y cliente están exentos.\n- **Throttle**: límite específico por usuario/IP. Las lecturas operativas se separaron de las escrituras para no agotar el cupo de 10/min al listar.\n')
lines.append('> **Recomendación.** Para clientes nuevos, obtenga el token con `POST /api/v1/login` y consulte `GET /api/v1/me` antes de asumir roles. No deduzca permisos solo por el nombre de la ruta: la fuente de verdad es la combinación rol + ability + policy.\n')

out = os.path.join(BASE, 'src', '26-matriz.md')
open(out, 'w', encoding='utf-8').write('\n'.join(lines))
print(f"Generado {out}: {len(ops)} operaciones, {sum(1 for x in ops if x['auth'])} con auth")

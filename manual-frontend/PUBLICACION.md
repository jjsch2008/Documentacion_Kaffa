# Publicación del manual en el frontend

El manual interactivo se publica como sitio estático dentro de la SPA:

```text
REACT_clean/REACT_kaffa/public/manual/
├── index.html
├── assets/                 capturas JPG y fuentes
├── styles/manual.css
├── scripts/manual.js
└── KAFFA_Manual_Frontend_v1.0.pdf
```

La URL pública es:

```text
/manual/index.html
```

Se abre en una pestaña nueva desde el home, el footer, el login y los paneles de barista/administrador.

## Actualizar el manual

Cada vez que se regenere el PDF o el sitio interactivo:

```bash
cd docs/manual-frontend
node build/build-all.mjs
node build/publish.mjs
```

O desde el frontend:

```bash
cd REACT_clean/REACT_kaffa
pnpm manual:sync
pnpm build
```

`publish.mjs` copia **solo** lo necesario. No publica `editor.html`, `editor.js`, `editor.css`, el ZIP ni los PDF intermedios.

## Verificación local

```bash
pnpm dev
```

Abre:

```text
http://localhost:5173/manual/index.html
```

Comprueba:

- que cargue la portada del manual,
- que las capturas se vean,
- que el botón **Descargar PDF** funcione,
- que el editor no exista en `public/manual`.

## Apache / VPS

El manual son archivos reales; la regla de la SPA no debe interceptarlos. Ejemplo de `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Archivos y carpetas reales (incluye /manual/) se sirven directamente.
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # El resto va a la SPA.
  RewriteRule ^ index.html [L]
</IfModule>
```

El enlace debe apuntar a `/manual/index.html` (no solo a `/manual/`) para evitar problemas de `DirectoryIndex`.

Caché opcional para las capturas:

```apache
<Directory "/ruta/al/frontend/dist/manual/assets">
  Header set Cache-Control "public, max-age=604800, immutable"
</Directory>
```

## Limpieza de cuentas demo en el VPS

El manual **se deja como está** y seguirá mostrando las credenciales demo. Esas cuentas dejarán de funcionar cuando se limpien en producción. No agregues las credenciales reales al manual.

Orden seguro:

1. **Respalda la base de datos.**
2. Crea el administrador real y verifica que pueda iniciar sesión.
3. Desactiva primero las cuentas demo:

```sql
UPDATE users
SET activo = false
WHERE correo IN (
  'admin@kaffa.com',
  'barista@kaffa.com',
  'cliente@kaffa.com',
  'camila@kaffa.com',
  'maria@kaffa.com',
  'carlos@kaffa.com'
);
```

4. Revoca sus tokens:

```sql
DELETE FROM personal_access_tokens
WHERE tokenable_id IN (
  SELECT id FROM users
  WHERE correo IN (
    'admin@kaffa.com', 'barista@kaffa.com', 'cliente@kaffa.com',
    'camila@kaffa.com', 'maria@kaffa.com', 'carlos@kaffa.com'
  )
);
```

5. Antes de borrar definitivamente, revisa si tienen historial:

```sql
SELECT 'pedidos' AS tabla, COUNT(*) FROM pedidos p
JOIN users u ON u.id = p.cliente_id
WHERE u.correo LIKE '%@kaffa.com'
UNION ALL
SELECT 'cajas', COUNT(*) FROM cajas c
JOIN users u ON u.id = c.abierta_por
WHERE u.correo LIKE '%@kaffa.com';
```

Si hay pedidos, cajas, compras o turnos asociados, **no borres** las cuentas: déjalas inactivas o reasigna el historial. Borrar usuarios con historial puede romper reportes y facturas.

## Cuándo regenerar

- Si cambia el manual: `build-all.mjs` + `publish.mjs`.
- Si cambia el frontend: `pnpm build` (copia `public/manual` a `dist/manual`).
- Si cambias el enlace o el texto del home: solo `pnpm build`.

# 31. Mantenimiento y contribución

Este capítulo explica cómo evolucionar el backend sin romper la documentación ni la operación.

## 31.1 Añadir un endpoint

1. Defina la ruta en `routes/api.php` con middleware y nombre.
2. Cree/actualice el Form Request.
3. Implemente el controlador (delgado).
4. Si hay reglas complejas, cree un servicio.
5. Añada policy/gate si aplica.
6. Actualice `openapi.json`.
7. Actualice la matriz del capítulo 26.
8. Añada prueba.
9. Documente en el capítulo correspondiente.

Checklist:

- [ ] ¿Requiere auth?
- [ ] ¿Qué roles?
- [ ] ¿Qué ability?
- [ ] ¿Requiere turno?
- [ ] ¿Qué throttle?
- [ ] ¿Qué pasa si falta un dato?
- [ ] ¿Qué pasa en concurrencia?
- [ ] ¿Afecta stock/caja/factura?
- [ ] ¿Es idempotente?

## 31.2 Añadir una tabla o columna

1. Cree la migración.
2. Actualice el modelo (`fillable`, `casts`, relaciones).
3. Actualice requests y validaciones.
4. Actualice policies si cambia el ownership.
5. Actualice el diccionario del capítulo 8.
6. Añada índices si se filtra/ordena.
7. Pruebe `migrate:fresh --seed`.
8. Documente el impacto en reportes.

## 31.3 Regenerar OpenAPI

```bash
cd backend-kaffa
php artisan serve
curl -s http://localhost:8000/docs/api.json -o ../docs/openapi.json
```

Luego:

```bash
python3 manual-tecnico/build/gen_endpoints.py
```

Y reconstruya el PDF.

## 31.4 Mantener el manual

```bash
cd docs/manual-tecnico
node build/build-all.mjs
```

El script:

1. Genera HTML.
2. Imprime portada/cuerpo/contraportada.
3. Calcula páginas del índice.
4. Reimprime si cambió.
5. Une el PDF final.

Revise:

- Que el índice tenga páginas correctas.
- Que no haya tablas cortadas.
- Que los diagramas rendericen.
- Que las tildes se vean bien.
- Que el PDF final esté en `docs/`.

## 31.5 Convenciones de documentación

- Español formal.
- Código y rutas en `mono`.
- Tablas con encabezado.
- Figuras con caption.
- Marcas `[NO VERIFICADO]`, `[GAP]`, **Recomendación**.
- Sin secretos reales.
- Sin números de línea; citar archivo/símbolo.

## 31.6 Deuda técnica conocida

**Tabla.** _Deuda técnica conocida_

| Tema | Impacto | Sugerencia |
|---|---|---|
| Sin idempotencia | Duplicados por reintento | `Idempotency-Key` |
| Sin tests de frontend | Regresiones visuales | Playwright/Vitest |
| Sin CI/CD | Despliegues manuales | GitHub Actions |
| Cloudinary unsigned | Abuso de cuota | Subida firmada |
| Scramble en dev | Exposición si se olvida | Bloquear en prod |
| `QUEUE_CONNECTION=sync` | Bloqueo por SMTP | Redis + worker |
| Sin facturación fiscal | Incumplimiento | Proveedor autorizado |
| Sin métricas | Incidentes tardíos | APM/alertas |

## 31.7 Roadmap sugerido

1. Endurecer Cloudinary (firma).
2. Idempotencia en pedidos/pagos.
3. CI/CD con pruebas y migraciones.
4. Observabilidad (Sentry/Prometheus).
5. Facturación electrónica.
6. App móvil con manejo seguro de tokens.
7. Reportes exportables y conciliación.

## 31.8 Contacto y soporte

Documente en el repositorio:

- Responsable funcional.
- Responsable técnico.
- Proveedor de hosting/DB.
- Cuentas Brevo/Cloudinary.
- Procedimiento de escalamiento.

> **Recomendación.** Trate este manual como artefacto vivo: cada cambio de código debe actualizar la sección correspondiente y regenerar el PDF. La documentación que no se ejecuta se desactualiza en semanas.

> **Evaluación de calidad.** La gestión de cambios y el mantenimiento se evalúan frente a ISO/IEC/IEEE 12207 en el capítulo 32 (§32.7).

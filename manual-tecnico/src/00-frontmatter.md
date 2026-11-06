## Control documental

<table class="doc-control">
<tr><td>Título</td><td>Manual Técnico del Backend — Sistema POS KAFFA</td></tr>
<tr><td>Versión</td><td>1.0</td></tr>
<tr><td>Fecha de emisión</td><td>Octubre de 2026</td></tr>
<tr><td>Código documental</td><td>KAFFA-MT-BE-001</td></tr>
<tr><td>Audiencia</td><td>Ingenieros de software, DevOps, QA y personal técnico ajeno al proyecto</td></tr>
<tr><td>Alcance</td><td>Backend Laravel 10 + PostgreSQL, API REST, base de datos, servicios externos, seguridad y operación</td></tr>
<tr><td>Fuente de verdad</td><td>Código del backend auditado y documentación de <code>docs/</code></td></tr>
<tr><td>Commit auditado</td><td><code>01fb00d</code> — <code>fix(turnos): fecha_fin opcional</code></td></tr>
<tr><td>Medición de calidad</td><td>Commit <code>1ea1e76</code>, 2 de noviembre de 2026 (capítulo 32)</td></tr>
<tr><td>Marco de calidad</td><td>ISO 9001, ISO/IEC 25010, ISO/IEC 27001, ISO/IEC 29119, ISO 8601 (alineación evaluada, no certificación)</td></tr>
<tr><td>Estado</td><td>Verificado contra código; recomendaciones marcadas como tales</td></tr>
</table>

## Resumen ejecutivo

KAFFA es un sistema POS para cafetería con una API REST en Laravel 10 y PostgreSQL. El backend concentra autenticación, catálogo, pedidos, pagos, facturación interna, caja, inventario, compras, gastos, mermas, turnos, chat, reportes, eventos y un asistente local. La interfaz web y la app móvil son clientes desacoplados que consumen JSON.

El sistema está diseñado para una operación de una o varias sedes pequeñas: usa transacciones y bloqueos pesimistas para evitar sobreventa, cierres dobles y facturas duplicadas; aplica RBAC con roles, abilities y policies; y separa el correo transaccional (Brevo/Mailpit) de las imágenes (Cloudinary o disco local).

Este manual permite a un ingeniero externo instalar el backend desde cero, entender el modelo de datos, operar la API, desplegarlo y mantenerlo. No es una certificación de seguridad ni un manual fiscal: las limitaciones se documentan de forma explícita.

## Alcance y exclusiones

**Incluido:** instalación, configuración, base de datos, servicios externos, API completa, seguridad, pruebas, despliegue, operación y mantenimiento.

**Excluido:** manual de usuario final de la SPA, diseño visual del frontend, facturación electrónica certificada, pasarela de pagos en línea, aplicación móvil nativa y infraestructura como código (no presentes en el repositorio).

## Cómo leer este manual

Este documento está pensado para que una persona que nunca ha visto KAFFA pueda instalar, entender, operar y extender el backend sin depender de sus autores. Se recomienda leer las partes I y II completas antes de tocar el código; después, usar la parte V como referencia de consulta.

Los capítulos combinan explicación, procedimiento y verificación. Cuando una afirmación no pudo comprobarse contra el código, se marca de forma explícita.

## Convenciones y evidencias

- **Verificado**: comportamiento comprobado en rutas, controladores, servicios, migraciones o pruebas.
- **Recomendación**: práctica sugerida para producción, no necesariamente implementada.
- **[NO VERIFICADO]**: el repositorio no contiene evidencia suficiente.
- **[GAP]**: funcionalidad existente sin cobertura de pruebas o con documentación incompleta.

> **Nota.** Los ejemplos usan datos ficticios y nunca incluyen credenciales reales. Los importes se muestran en pesos colombianos (COP) salvo que se indique otra moneda.

## Historial de revisiones

| Versión | Fecha | Autor | Cambio |
|---|---|---|---|
| 1.0 | Octubre 2026 | Equipo KAFFA | Creación del manual consolidado y verificado del backend |
| 1.0 (rev. 2) | Noviembre 2026 | Equipo KAFFA | Corrección de diagramas, numeración e índice de tablas, y evaluación de calidad frente a normas ISO |

## Soporte y mantenimiento

El manual se regenera con `node build/build-all.mjs` desde `docs/manual-tecnico/`. Las fuentes están en `src/` y los datos extraídos del backend en `data/`. Cualquier cambio de código debe reflejarse en el capítulo correspondiente y en la matriz de endpoints.

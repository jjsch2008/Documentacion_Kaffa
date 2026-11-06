# 32. Calidad del sistema frente a normas ISO

Este capítulo responde a una pregunta distinta de las anteriores: no describe cómo funciona KAFFA, sino **cómo se midió su calidad** y qué tan cerca está de las normas internacionales que definen qué es un sistema de calidad. La evaluación se hizo sobre el backend y sus interfaces, con evidencia verificable en el repositorio, y se documenta con el mismo criterio que el resto del manual: lo que no se pudo medir se marca como brecha, no se presume.

> **Alcance de la afirmación.** Este capítulo es una **evaluación interna basada en evidencia**, no una certificación. Ninguna de las normas citadas fue auditada por un organismo certificador. Cuando se dice que una práctica "se alinea" con una cláusula, significa que existe evidencia documental o técnica coherente con ella; no implica conformidad formal.

## 32.1 Método de evaluación

La evaluación sigue el proceso de la familia **ISO/IEC 25040** (evaluación de la calidad de producto de software): establecer los requisitos de evaluación, especificar la evaluación, diseñar el plan, ejecutar las mediciones y concluir. Para cada característica se definió un indicador, una forma de cálculo y un nivel en una escala de madurez de cinco valores.

**Tabla.** _Escala de madurez usada en la evaluación_

| Nivel | Nombre | Criterio |
|---:|---|---|
| 0 | Inexistente | No hay práctica ni evidencia |
| 1 | Inicial | Hay una práctica aislada, sin medición ni documentación |
| 2 | Definido | La práctica está implementada y documentada, pero no se mide |
| 3 | Medido | La práctica está implementada, probada y existe una métrica |
| 4 | Optimizado | Existe umbral, seguimiento y mejora continua sobre la métrica |

El puntaje de cada característica es el promedio simple de sus subcaracterísticas aplicables; el índice global es el promedio simple de las nueve características de ISO/IEC 25010:2023. Los valores no aplicables se excluyen y se justifican.

**Fuentes de evidencia.** Código del backend en el commit `1ea1e76`, suite de pruebas sobre PostgreSQL `kaffa_test`, `php artisan route:list`, `docs/openapi.json`, migraciones, configuración, análisis estático del texto del manual y las herramientas del propio ecosistema PHP.

**Tabla.** _Mediciones ejecutadas y comando reproducible_

| Medición | Resultado | Comando |
|---|---|---|
| Pruebas automatizadas | 88 aprobadas, 2 marcadas como deprecated, 298 aserciones, 2,78 s | `php artisan test` |
| Archivos y líneas del backend | 141 archivos PHP, 7.311 líneas en `app/` | `find app -name "*.php"` |
| Operaciones de API | 140 operaciones, 127 con autenticación, 104 con rol, 92 con ability | matriz del capítulo 26 |
| Estructura | 30 controladores, 10 servicios, 18 policies, 26 Form Requests, 29 modelos, 44 migraciones | `ls app/...` |
| Índices declarados | 30 declaraciones `index`/`unique`, 12 índices de rendimiento | `grep` en `database/migrations` |
| Transacciones y bloqueos | 25 usos de transacción, 14 `lockForUpdate` | `grep` en `app/` |
| Estilo de código | 120 de 228 archivos con desviaciones, 24 reglas | `vendor/bin/pint --test` |
| Vulnerabilidades de dependencias | 39 avisos en 10 paquetes de producción; 43 en 11 con desarrollo | `composer audit --no-dev` |
| Cobertura de pruebas | No medida: no hay `xdebug` ni `pcov` instalados | `php -m` |
| Análisis estático | No configurado: no hay PHPStan, Psalm ni PHPMD | `composer.json` |

> **Nota.** Las cifras corresponden al 2 de noviembre de 2026. El manual base fue auditado en el commit `01fb00d`; el repositorio avanzó hasta `1ea1e76` con dos commits de despliegue (dockerización y credenciales desde `.env`). Esa diferencia se registra en las limitaciones de la sección 32.11.

## 32.2 Correspondencia entre las normas y el manual

**Tabla.** _Normas ISO consideradas y lugar donde se aplican_

| Norma | Objeto | Dónde se aplica en KAFFA | Sección de este manual |
|---|---|---|---|
| ISO 9001:2015 | Sistema de gestión de la calidad | Control documental, enfoque a procesos, mejora | 32.5; preliminares; capítulo 31 |
| ISO/IEC 25000 (SQuaRE) | Marco de evaluación de calidad | Método, escala y conclusiones | 32.1, 32.3, 32.9 |
| ISO/IEC 25010:2023 | Modelo de calidad de producto | Las nueve características medidas | 32.3; capítulos 2, 9, 11, 14 y 30 |
| ISO/IEC 27001:2022 | Sistema de gestión de seguridad | Controles organizativos y tecnológicos | 32.4; capítulos 11 y 29 |
| ISO/IEC 27002:2022 | Guía de controles de seguridad | Prácticas operativas y de acceso | 32.4; capítulo 29 |
| ISO/IEC 29119-1:2022 | Conceptos y procesos de prueba | Estrategia, niveles y métricas de prueba | 32.6; capítulo 30 |
| ISO/IEC/IEEE 12207:2017 | Procesos del ciclo de vida | Mantenimiento, configuración y cambios | 32.7; capítulo 31 |
| ISO/IEC/IEEE 42010:2011 | Descripción de arquitectura | Vistas, interesados y decisiones | 32.7; capítulo 2 |
| ISO 8601-1:2019 | Fechas y horas | Formato de fechas de la API | 32.8; sección 15.2 |
| ISO 14289-1:2014 (PDF/UA) | Accesibilidad de documentos PDF | PDF etiquetado y texto extraíble | 32.8; este manual |
| ISO 31000:2018 | Gestión del riesgo | Identificación y mitigación de riesgos | 32.4 y 32.10; sección 2.9 |

## 32.3 ISO/IEC 25010:2023 — calidad de producto

ISO/IEC 25010:2023 define nueve características de calidad de producto. Cada subsección presenta el indicador usado, el resultado y el nivel asignado. Las métricas se obtuvieron del repositorio y de la suite; las que no pudieron medirse se declaran como brecha.

### 32.3.1 Adecuación funcional

**Tabla.** _Medición de la adecuación funcional_

| Subcaracterística | Indicador | Resultado | Nivel |
|---|---|---|---:|
| Completitud funcional | Operaciones documentadas / operaciones de la matriz | 140/140 = 100 % | 3 |
| Corrección funcional | Pruebas aprobadas / pruebas ejecutadas | 88/88 = 100 % | 3 |
| Pertinencia funcional | Escrituras con validación dedicada | 26 Form Requests; 25 rutas con throttle | 3 |

**Puntaje: 3,0.** La API está completamente documentada y la suite pasa sin fallos. La limitación es que la completitud se mide sobre la documentación, no sobre una prueba por endpoint: solo 28 rutas aparecen referenciadas de forma explícita en los archivos de prueba.

### 32.3.2 Eficiencia de desempeño

**Tabla.** _Medición de la eficiencia de desempeño_

| Subcaracterística | Indicador | Resultado | Nivel |
|---|---|---|---:|
| Comportamiento temporal | Prueba de carga con umbral de latencia | No existe | 1 |
| Utilización de recursos | Índices y bloqueos controlados | 30 índices; 14 bloqueos puntuales | 2 |
| Capacidad | Prueba de esfuerzo o estimación de concurrencia | No existe; solo límites de throttle | 1 |

**Puntaje: 1,3.** Hay trabajo real de optimización (índices por tabla, bloqueos acotados, `GREATEST` para evitar negativos), pero **no hay ninguna medición de tiempo de respuesta ni de concurrencia**. Sin esa evidencia no se puede afirmar eficiencia; se afirma únicamente que el diseño la favorece.

### 32.3.3 Compatibilidad

**Tabla.** _Medición de la compatibilidad_

| Subcaracterística | Indicador | Resultado | Nivel |
|---|---|---|---:|
| Coexistencia | Clientes y servicios conviviendo en el mismo entorno | SPA, app móvil, Brevo, Cloudinary y SMTP | 3 |
| Interoperabilidad | Contrato de intercambio documentado | JSON, OpenAPI con 69 paths, fechas ISO 8601 | 3 |

**Puntaje: 3,0.** El backend expone un contrato estable y versionado en `/api/v1`; los clientes son desacoplados y las integraciones externas están documentadas con sus modos de fallo.

### 32.3.4 Capacidad de interacción

**Tabla.** _Medición de la capacidad de interacción_

| Subcaracterística | Indicador | Resultado | Nivel |
|---|---|---|---:|
| Reconocibilidad | Catálogo de errores y mensajes accionables | 9 códigos de negocio y respuestas uniformes | 3 |
| Aprendizaje | Documentación de uso de la API | Manual, OpenAPI y ejemplos `curl` | 3 |
| Operabilidad | Paginación, filtros y envelope consistentes | Documentado en el capítulo 15 | 3 |
| Protección ante errores de usuario | Validación de entrada | 26 Form Requests | 3 |
| Inclusividad | Accesibilidad de la documentación | PDF etiquetado y texto extraíble; sin auditoría PDF/UA | 2 |

**Puntaje: 2,8.** La API es predecible y está bien documentada. La accesibilidad del PDF mejoró al eliminar las ligaduras que rompían el copiado, pero no se ejecutó una validación formal con un lector de pantalla.

### 32.3.5 Fiabilidad

**Tabla.** _Medición de la fiabilidad_

| Subcaracterística | Indicador | Resultado | Nivel |
|---|---|---|---:|
| Ausencia de fallos | Pruebas verdes y defectos abiertos conocidos | 88/88; sin registro de defectos | 2 |
| Disponibilidad | Health checks y monitoreo | Health checks documentados; sin SLA medido | 2 |
| Tolerancia a fallos | Operaciones críticas en transacción | 25 transacciones; rollback en pagos y stock | 3 |
| Recuperabilidad | Respaldo y restauración probados | Respaldo documentado; restauración no probada | 2 |

**Puntaje: 2,3.** La tolerancia a fallos está bien resuelta con transacciones y bloqueos, pero no hay evidencia de disponibilidad medida ni de una prueba real de restauración.

### 32.3.6 Seguridad

**Tabla.** _Medición de la seguridad_

| Subcaracterística | Indicador | Resultado | Nivel |
|---|---|---|---:|
| Confidencialidad | Hash de contraseñas, secretos y dependencias | bcrypt con 12 rondas; `.env` fuera de Git; 39 avisos de dependencias | 2 |
| Integridad | Validación y transacciones | Form Requests y transacciones en escrituras críticas | 3 |
| No repudio | Registro de auditoría inmutable | No existe tabla de auditoría | 1 |
| Responsabilidad | Trazabilidad de autoría | `usuario_id`, `abierto_por`, `cerrada_por`, timestamps | 3 |
| Autenticidad | Autenticación y verificación | Sanctum con abilities y OTP de un solo uso | 3 |

**Puntaje: 2,4.** El control de acceso es sólido, pero la gestión de vulnerabilidades y el no repudio son brechas concretas. Los 39 avisos de `composer audit` en dependencias de producción son la evidencia más contundente de que falta un proceso de actualización.

### 32.3.7 Mantenibilidad

**Tabla.** _Medición de la mantenibilidad_

| Subcaracterística | Indicador | Resultado | Nivel |
|---|---|---|---:|
| Modularidad | Separación de responsabilidades | 30 controladores, 10 servicios, 18 policies, 29 modelos | 3 |
| Reusabilidad | Componentes compartidos | `BasePolicy`, `HasBasicQueries`, `TransactionService` | 3 |
| Analizabilidad | Análisis estático y cobertura | Sin PHPStan/Psalm/PHPMD; sin cobertura | 1 |
| Modificabilidad | Deuda técnica y estilo | 120/228 archivos fuera de Pint; Laravel 10 sin soporte de seguridad | 1 |
| Capacidad de prueba | Suite automatizada | 14 archivos, 88 pruebas, 298 aserciones, 2,78 s | 3 |

**Puntaje: 2,2.** La arquitectura es entendible y la suite es rápida, pero la ausencia de análisis estático y el volumen de desviaciones de estilo hacen que el cambio sea más riesgoso de lo necesario.

### 32.3.8 Flexibilidad

**Tabla.** _Medición de la flexibilidad_

| Subcaracterística | Indicador | Resultado | Nivel |
|---|---|---|---:|
| Adaptabilidad | Configuración por entorno | Variables en `.env` y `config/` | 3 |
| Escalabilidad | Procesamiento asíncrono y escala horizontal | `QUEUE_CONNECTION=sync`; sin evidencia de escala | 1 |
| Instalabilidad | Procedimiento reproducible | Manual de instalación; dockerización posterior al commit auditado | 2 |
| Reemplazabilidad | Abstracciones de servicios externos | Integraciones directas, sin interfaces de proveedor | 1 |

**Puntaje: 1,8.** La configuración es flexible, pero el acoplamiento directo a Cloudinary y Brevo, y la cola síncrona, limitan la sustitución y la escala.

### 32.3.9 Seguridad funcional (safety)

**Tabla.** _Medición de la seguridad funcional_

| Subcaracterística | Indicador | Resultado | Nivel |
|---|---|---|---:|
| Mitigación de fallos operativos | Reglas que evitan daño al negocio | Stock no negativo, caja con arqueo, factura única | 3 |
| Identificación de riesgos | Registro y tratamiento de riesgos | Tabla de riesgos arquitectónicos sin revisión periódica | 2 |

**Puntaje: 2,5.** El dominio está protegido contra los errores más costosos (sobreventa, caja descuadrada, factura duplicada); lo que falta es un proceso formal de gestión de riesgos.

## 32.4 ISO/IEC 27001:2022 — controles de seguridad

La norma organiza los controles en cuatro temas. La tabla siguiente no afirma conformidad: indica qué controles tienen evidencia en el proyecto y cuáles son brechas.

**Tabla.** _Cobertura de controles de ISO/IEC 27001:2022_

| Control | Tema | Estado | Evidencia o brecha |
|---|---|---|---|
| A.5.1 Políticas de seguridad | Organizativo | Parcial | Capítulo 11 y `docs/05-seguridad.md`; sin aprobación formal |
| A.5.15 Control de acceso | Organizativo | Implementado | RBAC con roles, abilities y policies |
| A.5.23 Seguridad en servicios cloud | Organizativo | Parcial | Brevo y Cloudinary documentados; sin contrato de nivel de servicio |
| A.6.3 Concienciación y formación | Personas | Brecha | No hay plan de formación |
| A.7.4 Seguridad física | Físico | No aplica | Infraestructura de terceros |
| A.8.2 Acceso privilegiado | Tecnológico | Implementado | Rol `admin` separado y abilities específicas |
| A.8.5 Autenticación segura | Tecnológico | Implementado | Sanctum, OTP y hash bcrypt |
| A.8.7 Protección contra malware | Tecnológico | No aplica | Backend sin ejecución de archivos de usuario |
| A.8.8 Gestión de vulnerabilidades | Tecnológico | Brecha | 39 avisos de dependencias; sin proceso de actualización |
| A.8.9 Gestión de configuración | Tecnológico | Parcial | `.env.example` documentado; sin inventario de configuración |
| A.8.12 Prevención de fuga de datos | Tecnológico | Parcial | Respuestas filtradas por rol; sin DLP |
| A.8.13 Respaldo de información | Tecnológico | Parcial | Respaldo documentado; restauración no probada |
| A.8.15 Registro de eventos | Tecnológico | Parcial | Logs de Laravel; sin registro de auditoría de negocio |
| A.8.16 Monitoreo | Tecnológico | Parcial | Health checks y métricas recomendadas; sin alertas activas |
| A.8.24 Uso de criptografía | Tecnológico | Implementado | bcrypt, tokens y TLS recomendado |
| A.8.25 Ciclo de vida de desarrollo seguro | Tecnológico | Parcial | Pruebas y revisión; sin análisis estático |
| A.8.28 Codificación segura | Tecnológico | Parcial | Form Requests y ORM; 120/228 archivos fuera de Pint |
| A.8.32 Gestión de cambios | Tecnológico | Implementado | Git, CHANGELOG y control de versiones del manual |
| A.8.34 Protección durante auditoría | Tecnológico | No aplica | Sin auditorías externas |

**Lectura del resultado.** De 19 controles evaluados: 6 implementados, 9 parciales, 2 brechas y 2 no aplican. Las brechas críticas son la **gestión de vulnerabilidades** (A.8.8) y la **prueba de restauración** (A.8.13), porque ambas afectan la continuidad del negocio.

## 32.5 ISO 9001:2015 — gestión de la calidad

ISO 9001 no evalúa software: evalúa la capacidad de una organización para cumplir requisitos y mejorar. El proyecto se alinea con sus principios en cuatro puntos verificables.

**Tabla.** _Alineación con ISO 9001:2015_

| Cláusula | Práctica en KAFFA | Evidencia |
|---|---|---|
| 4.4 Enfoque a procesos | Flujos con entradas, salidas y responsables | Capítulo 9 |
| 7.5 Información documentada | Control documental, versión y código | Preliminares: `KAFFA-MT-BE-001` |
| 8.5 Provisión del servicio | Despliegue, operación y runbook | Capítulos 27 y 28 |
| 9.1 Seguimiento y medición | Suite de pruebas y métricas de calidad | Este capítulo y capítulo 30 |
| 10.2 No conformidad y acción correctiva | Registro de cambios y brechas | `CHANGELOG.md`; sección 32.10 |
| 10.3 Mejora continua | Mantenimiento y deuda técnica | Capítulo 31 |

**Puntaje: 2,5.** La documentación y el control de cambios son comparables a los de un proceso definido; lo que falta es un ciclo formal de auditoría interna y revisión por la dirección.

## 32.6 ISO/IEC 29119 — proceso de pruebas

**Tabla.** _Métricas del proceso de prueba_

| Métrica | Resultado | Lectura |
|---|---|---|
| Casos automatizados | 88 pruebas en 14 archivos | Cobertura funcional amplia de los flujos críticos |
| Aserciones | 298 | Verificación de comportamiento, no solo de código HTTP |
| Tiempo de ejecución | 2,78 s | Apto para integración continua |
| Niveles de prueba | Predominio de pruebas de integración (`Feature`) | Falta una capa unitaria significativa |
| Trazabilidad | Requisito → prueba en el anexo F | Parcial: 28 rutas referenciadas de forma explícita |
| Cobertura de código | No medida | Brecha principal del proceso |

**Puntaje: 2,3.** El proceso existe, es rápido y cubre los flujos de dinero, stock y acceso. No cumple el nivel "medido" de ISO/IEC 29119 porque no hay cobertura ni criterios de salida cuantificados por módulo.

## 32.7 ISO/IEC/IEEE 12207 y 42010 — ciclo de vida y arquitectura

**Tabla.** _Alineación con los procesos de ciclo de vida y arquitectura_

| Norma | Proceso | Evidencia | Nivel |
|---|---|---|---:|
| ISO/IEC/IEEE 12207 | Mantenimiento y gestión de configuración | Git, `CHANGELOG.md`, capítulo 31 | 3 |
| ISO/IEC/IEEE 12207 | Gestión de cambios | Commits convencionales y control de versiones del manual | 2 |
| ISO/IEC/IEEE 42010 | Descripción de arquitectura | Vistas de contexto, capas, despliegue y decisiones (capítulo 2) | 3 |
| ISO/IEC/IEEE 42010 | Interesados y preocupaciones | Actores y riesgos (secciones 1.2 y 2.9) | 2 |

## 32.8 ISO 8601 y PDF/UA — formatos y accesibilidad

**Fechas (ISO 8601).** La API devuelve fechas en formato ISO 8601 con desplazamiento horario (`2026-10-20T15:47:46-05:00`) y el backend opera en `America/Bogota`. La convención está documentada en la sección 15.2 y se aplica en todos los `timestamps` de Eloquent. **Nivel: 4.**

**Accesibilidad del PDF (ISO 14289-1, PDF/UA).** El PDF se genera etiquetado (`generateTaggedPDF`) y con esquema de documento; las imágenes llevan texto alternativo y el texto es extraíble. La corrección de las ligaduras tipográficas eliminó un defecto que impedía buscar y copiar palabras con `fi` y `fl`. No se ejecutó una validación formal con un validador PDF/UA, por lo que el nivel es **2 (definido)**, no 4.

## 32.9 Resultado global

**Tabla.** _Resumen de la evaluación ISO/IEC 25010:2023_

| Característica | Puntaje (0–4) | Nivel |
|---|---:|---|
| Adecuación funcional | 3,0 | Medido |
| Eficiencia de desempeño | 1,3 | Inicial |
| Compatibilidad | 3,0 | Medido |
| Capacidad de interacción | 2,8 | Definido |
| Fiabilidad | 2,3 | Definido |
| Seguridad | 2,4 | Definido |
| Mantenibilidad | 2,2 | Definido |
| Flexibilidad | 1,8 | Inicial |
| Seguridad funcional | 2,5 | Definido |
| **Índice global** | **2,4 / 4** | **Definido** |

**Interpretación.** KAFFA es un sistema **funcionalmente completo y seguro en su control de acceso**, con una arquitectura mantenible y una suite de pruebas rápida. Su debilidad no está en lo que hace, sino en **cómo se demuestra**: no hay cobertura, no hay pruebas de carga, no hay análisis estático y las dependencias acumulan avisos de seguridad. El índice de 2,4 sobre 4 es coherente con esa realidad: un sistema bien construido, con un proceso de medición todavía inmaduro.

## 32.10 Brechas y plan de mejora

**Tabla.** _Brechas priorizadas y acciones de mejora_

| # | Brecha | Norma | Impacto | Acción | Prioridad |
|---:|---|---|---|---|---|
| 1 | 39 avisos de seguridad en dependencias de producción | 27001 A.8.8 | Alto | Actualizar Laravel y dependencias; fijar política de parches | Alta |
| 2 | Cobertura de pruebas no medida | 25010 / 29119 | Alto | Instalar `xdebug` o `pcov` y publicar cobertura por módulo | Alta |
| 3 | Restauración de respaldos no probada | 27001 A.8.13 | Alto | Ejecutar un simulacro trimestral de restauración | Alta |
| 4 | Sin registro de auditoría de negocio | 27001 A.8.15 | Medio | Agregar tabla de auditoría para operaciones sensibles | Media |
| 5 | Sin análisis estático | 25010 mantenibilidad | Medio | Incorporar PHPStan nivel 6 y ejecutarlo en CI | Media |
| 6 | 120/228 archivos fuera de Pint | 25010 mantenibilidad | Medio | Aplicar Pint y bloquear el merge si falla | Media |
| 7 | Sin pruebas de carga | 25010 eficiencia | Medio | Medir latencia y concurrencia de los diez endpoints críticos | Media |
| 8 | Cola síncrona y acoplamiento a proveedores | 25010 flexibilidad | Bajo | Introducir colas y adaptadores de proveedor | Baja |
| 9 | Documentación desincronizada con la dockerización | 9001 7.5 | Medio | Documentar el despliegue con Docker en el capítulo 27 | Media |

## 32.11 Limitaciones de la evaluación

- **No es una certificación.** No hubo auditoría externa ni revisión por pares independiente.
- **Alcance backend.** La calidad del frontend, de la app móvil y de la infraestructura no se midió; solo se evaluaron sus interfaces.
- **Commit de referencia.** Las métricas se tomaron sobre `1ea1e76`, posterior al commit auditado del manual (`01fb00d`). La diferencia incluye dockerización y lectura de credenciales desde `.env`, que no alteran las métricas de código pero sí la evaluación de instalabilidad.
- **Datos no verificados.** No se midió cobertura, latencia, disponibilidad ni satisfacción de usuario. Cualquier afirmación sobre esas dimensiones queda fuera de este capítulo.
- **Puntajes interpretativos.** La escala 0–4 es una herramienta de gestión, no un estándar certificable. Su valor está en la evidencia que la acompaña y en el plan de mejora, no en el número.

> **Recomendación.** Repetir esta evaluación en cada release mayor, con la misma escala y las mismas fuentes, para que el índice global se convierta en una serie histórica. Un puntaje aislado no demuestra mejora; una serie sí.

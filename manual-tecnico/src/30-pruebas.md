# 30. Pruebas y calidad

El backend usa PHPUnit 10 sobre PostgreSQL. La suite documentada tiene **88 pruebas y 298 aserciones**; el conteo literal de métodos puede variar al añadir casos. Este capítulo explica qué cubre, qué no y cómo ampliarla.

> **Verificado (2026-10-20).** `php artisan test` sobre `kaffa_test`: **88 pruebas aprobadas, 298 aserciones, 2 pruebas marcadas como deprecated** y avisos de PHP 8.5 por la constante `PDO::MYSQL_ATTR_SSL_CA` en `config/database.php`, ajenos a la lógica de negocio.

## 30.1 Configuración

`phpunit.xml`:

- Base `kaffa_test` (PostgreSQL).
- `BCRYPT_ROUNDS=4` para acelerar.
- Caché/cola/sesión en `array`.
- `RefreshDatabase` por prueba.

```bash
php artisan test
vendor/bin/phpunit
```

## 30.2 Inventario de pruebas

**Tabla.** _Inventario de archivos de prueba_

| Archivo | Qué verifica |
|---|---|
| `ApiTest` | Login, 401 sin token, catálogo público, paginación |
| `EquipoTest` | `/equipo`: público, administradora, filtros, sin datos sensibles |
| `EmailVerificationTest` | Registro, OTP, expiración, intentos, reenvío |
| `PasswordResetTest` | OTP, respuesta uniforme, reseteo, revocación de tokens |
| `PedidoTest` | Autoría, nota, factura, stock, comprobante, pagos, scope |
| `CajaTest` | Apertura, turno, arqueo, movimientos, eliminación, caja ajena |
| `CompraMermaTest` | Stock, comprobante, reversión, merma, usuario forzado |
| `TurnoMiddlewareTest` | Turno activo, códigos, exenciones, `abierto`, `fecha_fin` |
| `ChatReporteTest` | Chat, no leídos, reportes, roles |
| `TokenSessionTest` | Refresh, logout, logout-all, ability |
| `AsistenteTest` | Multi-rol, respuesta local, historial, 401 |
| `EventoTest` | Público/publicado, admin, galería, subida, 403 |

## 30.3 Qué cubre la suite

- Autenticación y sesión.
- Verificación por OTP y reseteo.
- Catálogo público sin sesión.
- Pedidos: autoría, stock, pagos, factura, scope.
- Caja: apertura, cierre, arqueo, movimientos.
- Compras/mermas: stock y reversión.
- Turnos: `abierto`, rango, exenciones.
- Chat/reportes.
- Tokens: rotación, revocación, ability.
- Asistente: roles e historial.
- Eventos: publicación, galería, imagen.

## 30.4 Gaps

**Tabla.** _Brechas de cobertura conocidas_

| Área | Estado |
|---|---|
| CRUD completo de catálogo | `[GAP]` |
| Gestión de usuarios/roles/turnos | `[GAP]` |
| Gastos con caja | `[GAP]` |
| Subida a Cloudinary | `[GAP]` (frontend) |
| Filtros avanzados | `[GAP]` |
| Throttle por ruta | `[GAP]` |
| Cobertura de código | No medida |
| Frontend | Sin tests |

## 30.5 Cómo añadir una prueba

1. Cree el archivo en `tests/Feature`.
2. Use `RefreshDatabase`.
3. Cree usuarios con `User::factory()` o manualmente.
4. Obtenga token con `postJson('/api/v1/login', ...)`.
5. Ejecute la acción.
6. Afirme status, estructura y efectos en base.
7. Limpie el guard entre usuarios: `$this->app['auth']->forgetGuards()`.

Ejemplo:

```php
public function test_cliente_solo_ve_sus_pedidos(): void
{
    $cliente = User::factory()->create();
    $otro = User::factory()->create();
    // crear pedidos...
    $token = $this->postJson('/api/v1/login', [
        'correo' => $cliente->correo,
        'password' => 'password',
    ])->json('access_token');

    $response = $this->withHeader('Authorization', "Bearer $token")
        ->getJson('/api/v1/pedidos');

    $response->assertOk();
    $this->assertCount(1, $response->json('data'));
}
```

## 30.6 Pruebas manuales de aceptación

**Tabla.** _Pruebas manuales de aceptación_

| # | Flujo | Resultado |
|---|---|---|
| 1 | Login 3 roles | Redirección/roles correctos |
| 2 | Registro → OTP → login | Usuario verificado |
| 3 | Pedido cliente con pago virtual sin comprobante | 422 |
| 4 | Pedido con comprobante | 201 y stock descontado |
| 5 | Barista fuera de turno | 403 `FUERA_HORARIO`/`TURNO_INACTIVO` |
| 6 | Barista abre/cierra caja | Arqueo correcto |
| 7 | Compra sube stock | Verificar insumo |
| 8 | Merma baja stock | Verificar insumo |
| 9 | Eliminar merma restaura stock | Verificar |
| 10 | Admin crea turno con rango | Barista opera dentro |
| 11 | Asistente admin/barista/cliente | Respuestas por rol |
| 12 | Evento con imagen móvil | URL accesible |

## 30.7 Calidad de código

```bash
vendor/bin/pint --test
vendor/bin/phpunit
```

- PSR-12.
- Sin `dd()`/`dump()` en producción.
- Sin `env()` fuera de `config`.
- Sin consultas en bucles.
- Sin secretos en código.
- Migraciones reversibles.

## 30.8 CI recomendado

```yaml
# pseudocódigo
services:
  postgres:
    image: postgres:16
    env: POSTGRES_DB=kaffa_test ...
steps:
  - composer install
  - cp .env.example .env
  - php artisan key:generate
  - php artisan test
  - vendor/bin/pint --test
```

No hay CI en el repositorio; este pipeline es una recomendación.

## 30.9 Criterios de aceptación de un cambio

- [ ] Pruebas nuevas/actualizadas.
- [ ] Suite completa verde.
- [ ] Migración probada en limpio.
- [ ] OpenAPI regenerado.
- [ ] Matriz de endpoints actualizada.
- [ ] Sin secretos.
- [ ] Documentación sincronizada.

> **Evaluación de calidad.** Las métricas de este proceso se comparan con ISO/IEC 29119 en el capítulo 32 (§32.6).

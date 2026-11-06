<?php
/**
 * Datos de demostración para las capturas del Manual del Frontend.
 * Se ejecuta SIEMPRE contra la base clonada kaffa_manual:
 *
 *   DB_DATABASE=kaffa_manual php docs/manual-frontend/build/seed-demo.php
 *
 * No modifica archivos del backend ni la base original `kaffa`.
 */

require_once '/home/juanjose/Escritorio/KAFFA/backend-kaffa/vendor/autoload.php';

$app = require '/home/juanjose/Escritorio/KAFFA/backend-kaffa/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\{User, Rol, Turno, Categoria, Producto, Insumo, Pedido, Detalle_Pedido,
    Pago_Pedido, Factura_Venta, Caja, Movimiento_Caja, Compra, Detalle_Compra, Compra_Pago,
    Gasto, Gasto_Pago, Merma, Proveedor, Reporte, Mensaje, Evento, EventoImagen, Medio_Pago};
use App\Services\FacturaService;
use Illuminate\Support\Facades\Hash;

function usuario(string $nombre, string $correo, string $pass, string $rol, ?string $foto = null): User
{
    $u = User::firstOrCreate(
        ['correo' => $correo],
        [
            'nombre' => $nombre,
            'password' => Hash::make($pass),
            'activo' => true,
            'email_verified_at' => now(),
        ]
    );
    $u->fill(['nombre' => $nombre, 'activo' => true, 'email_verified_at' => now()]);
    if ($foto) $u->foto = $foto;
    $u->save();

    $r = Rol::where('nombre', $rol)->first();
    if ($r && !$u->roles()->where('nombre', $rol)->exists()) {
        $u->roles()->attach($r->id);
    }
    return $u;
}

$admin   = usuario('Ana María Joaquí', 'admin@kaffa.com', 'admin123', 'admin',
    'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face/rural-people.jpg');
$barista = usuario('Santiago Salamanca', 'barista@kaffa.com', 'barista123', 'barista',
    'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face/man.jpg');
$cliente = usuario('Juan José Sandoval', 'cliente@kaffa.com', 'cliente123', 'cliente',
    'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face/boy.jpg');

$barista2 = usuario('Camila Restrepo', 'camila@kaffa.com', 'barista123', 'barista',
    'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face/woman.jpg');
$cliente2 = usuario('María Fernanda López', 'maria@kaffa.com', 'cliente123', 'cliente',
    'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face/woman-1.jpg');
$cliente3 = usuario('Carlos Ramírez', 'carlos@kaffa.com', 'cliente123', 'cliente',
    'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,g_face/men-1.jpg');

// ── Turnos de hoy y asignación de baristas ──
$hoy = now()->toDateString();
$manana = Turno::firstOrCreate(['fecha' => $hoy, 'tipo' => 'mañana'], ['fecha_fin' => $hoy]);
$tarde  = Turno::firstOrCreate(['fecha' => $hoy, 'tipo' => 'tarde'], ['fecha_fin' => $hoy]);
$manana->baristas()->syncWithoutDetaching([$barista->id, $barista2->id]);
$tarde->baristas()->syncWithoutDetaching([$barista->id]);
// Turno de ayer (histórico para la tabla de turnos)
$ayer = now()->subDay()->toDateString();
$mananaAyer = Turno::firstOrCreate(['fecha' => $ayer, 'tipo' => 'mañana'], ['fecha_fin' => $ayer]);
$mananaAyer->baristas()->syncWithoutDetaching([$barista->id]);

// ── Proveedores ──
$prov1 = Proveedor::firstOrCreate(['nit' => '900123456-1'], [
    'nombre' => 'Café del Cauca S.A.S.', 'telefono' => '310 555 1122',
    'correo' => 'ventas@cafedelcauca.co', 'direccion' => 'Cra. 5 #12-40, Popayán', 'activo' => true,
]);
$prov2 = Proveedor::firstOrCreate(['nit' => '901987654-2'], [
    'nombre' => 'Lácteos La Pradera', 'telefono' => '320 444 8899',
    'correo' => 'pedidos@lapradera.co', 'direccion' => 'Vía Timbío km 3', 'activo' => true,
]);
$prov3 = Proveedor::firstOrCreate(['nit' => '800555333-7'], [
    'nombre' => 'Insumos y Empaques Andinos', 'telefono' => '301 222 7766',
    'correo' => 'contacto@andinos.co', 'direccion' => 'Calle 18 #9-70, Cali', 'activo' => true,
]);

// ── Compras ──
if (Compra::count() === 0) {
    $c1 = Compra::create([
        'proveedor_id' => $prov1->id, 'numero_factura_proveedor' => 'FV-20451',
        'fecha_compra' => now()->subDays(2), 'total_compra' => 420000,
    ]);
    Detalle_Compra::create(['compra_id' => $c1->id, 'insumo_id' => Insumo::where('nombre', 'Café en Grano')->value('id'), 'cantidad' => 14, 'precio_costo' => 30000]);
    Compra_Pago::create(['compra_id' => $c1->id, 'medio_pago_id' => Medio_Pago::where('nombre', 'Transferencia Bancaria')->value('id'), 'monto' => 420000, 'fecha_pago' => now()->subDays(2), 'comprobante_url' => 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg']);

    $c2 = Compra::create([
        'proveedor_id' => $prov2->id, 'numero_factura_proveedor' => 'LP-8891',
        'fecha_compra' => now()->subDays(5), 'total_compra' => 235000,
    ]);
    Detalle_Compra::create(['compra_id' => $c2->id, 'insumo_id' => Insumo::where('nombre', 'Leche')->value('id'), 'cantidad' => 50, 'precio_costo' => 4700]);
    Compra_Pago::create(['compra_id' => $c2->id, 'medio_pago_id' => Medio_Pago::where('nombre', 'Efectivo')->value('id'), 'monto' => 235000, 'fecha_pago' => now()->subDays(5)]);
}

// ── Gastos ──
if (Gasto::count() === 0) {
    $g1 = Gasto::create(['descripcion' => 'Servicio de energía', 'categoria' => 'Servicios públicos', 'usuario_id' => $admin->id]);
    Gasto_Pago::create(['gasto_id' => $g1->id, 'medio_pago_id' => Medio_Pago::where('nombre', 'Transferencia Bancaria')->value('id'), 'monto' => 185000, 'fecha_pago' => now()->subDays(3), 'comprobante_url' => 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/leather-bag-gray.jpg']);
    $g2 = Gasto::create(['descripcion' => 'Domicilio de insumos', 'categoria' => 'Transporte', 'usuario_id' => $admin->id]);
    Gasto_Pago::create(['gasto_id' => $g2->id, 'medio_pago_id' => Medio_Pago::where('nombre', 'Efectivo')->value('id'), 'monto' => 25000, 'fecha_pago' => now()->subDays(1)]);
    $g3 = Gasto::create(['descripcion' => 'Publicidad para redes sociales', 'categoria' => 'Marketing', 'usuario_id' => $admin->id]);
    Gasto_Pago::create(['gasto_id' => $g3->id, 'medio_pago_id' => Medio_Pago::where('nombre', 'Tarjeta de Crédito')->value('id'), 'monto' => 90000, 'fecha_pago' => now()->subDays(2)]);
}

// ── Mermas ──
if (Merma::count() === 0) {
    Merma::create(['insumo_id' => Insumo::where('nombre', 'Leche')->value('id'), 'cantidad' => 3, 'motivo' => 'Leche vencida', 'usuario_id' => $barista->id]);
    Merma::create(['insumo_id' => Insumo::where('nombre', 'Aguacate')->value('id'), 'cantidad' => 4, 'motivo' => 'Producto golpeado', 'usuario_id' => $barista->id]);
}

// ── Reportes de novedad ──
if (Reporte::count() === 0) {
    Reporte::create(['barista_id' => $barista->id, 'mensaje' => 'Se agotó el jarabe de caramelo. Quedan 2 botellas en bodega.', 'prioridad' => 'alta', 'leido' => false]);
    Reporte::create(['barista_id' => $barista2->id, 'mensaje' => 'El grifo de agua caliente está goteando; requiere revisión técnica.', 'prioridad' => 'media', 'leido' => false]);
    Reporte::create(['barista_id' => $barista->id, 'mensaje' => 'Se recibió el pedido de vasos de 12 oz completo.', 'prioridad' => 'baja', 'leido' => true]);
}

// ── Eventos ──
if (Evento::count() === 0) {
    $ev1 = Evento::create(['titulo' => 'Feria del Café de Popayán', 'descripcion' => 'Cata de cafés de especialidad, música en vivo y talleres de barismo. Entrada libre con consumo mínimo.', 'lugar' => 'Parque Caldas, Popayán', 'fecha' => now()->addDays(12)->toDateString(), 'hora' => '09:30', 'publicado' => true]);
    $ev2 = Evento::create(['titulo' => 'Taller de Latte Art', 'descripcion' => 'Aprende a dibujar corazones, tulipanes y cisnes sobre la espuma. Cupo limitado a 12 personas.', 'lugar' => 'Sede KAFFA, Calle 5 #8-21', 'fecha' => now()->addDays(5)->toDateString(), 'hora' => '15:00', 'publicado' => true]);
    $ev3 = Evento::create(['titulo' => 'Noche de Acústicos', 'descripcion' => 'Música en vivo, promociones 2x1 en capuchinos y postres de la casa.', 'lugar' => 'Terraza KAFFA', 'fecha' => now()->addDays(20)->toDateString(), 'hora' => '18:30', 'publicado' => true]);
    EventoImagen::create(['evento_id' => $ev1->id, 'url' => 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80', 'orden' => 0]);
    EventoImagen::create(['evento_id' => $ev2->id, 'url' => 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&q=80', 'orden' => 0]);
    EventoImagen::create(['evento_id' => $ev3->id, 'url' => 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80', 'orden' => 0]);
}

// ── Chat cliente ↔ barista ──
if (Mensaje::count() === 0) {
    $conv = [
        [$cliente->id, $barista->id, 'Hola, buen día. ¿El capuchino se puede pedir con leche deslactosada?', true, 95],
        [$barista->id, $cliente->id, '¡Hola! Claro que sí, tenemos leche deslactosada sin costo adicional. ☕', true, 93],
        [$cliente->id, $barista->id, 'Perfecto. Acabo de hacer un pedido con pago por transferencia. ¿Ya les llegó el comprobante?', true, 60],
        [$barista->id, $cliente->id, 'Sí, ya lo estamos verificando. En cuanto se confirme, tu pedido pasa a preparación.', true, 58],
        [$cliente->id, $barista->id, 'Gracias. ¿Cuánto tarda aproximadamente?', false, 24],
        [$cliente->id, $barista->id, 'Y una última cosa: ¿tienen opción sin azúcar?', false, 22],
        [$cliente2->id, $barista->id, 'Buenas tardes, ¿tienen mesas disponibles para trabajar con portátil?', false, 12],
    ];
    foreach ($conv as [$de, $para, $texto, $leido, $min]) {
        $m = Mensaje::create(['remitente_id' => $de, 'destinatario_id' => $para, 'mensaje' => $texto, 'leido' => $leido]);
        $m->created_at = now()->subMinutes($min);
        $m->updated_at = now()->subMinutes($min);
        $m->save();
    }
}

// ── Pedidos de demostración ──
$medios = Medio_Pago::all()->keyBy('nombre');
$productos = Producto::where('activo', true)->orderBy('id')->get();

function crearPedido(array $o): Pedido
{
    global $productos, $medios;
    $pedido = Pedido::create([
        'cliente_id' => $o['cliente_id'] ?? null,
        'barista_id' => $o['barista_id'] ?? null,
        'total' => 0,
        'propina' => 0,
        'estado' => $o['estado'],
    ]);

    $total = 0;
    foreach ($o['items'] as $i => [$idx, $cant, $nota]) {
        $p = $productos[$idx % $productos->count()];
        $sub = (float) $p->precio_venta * $cant;
        $total += $sub;
        Detalle_Pedido::create([
            'pedido_id' => $pedido->id, 'producto_id' => $p->id, 'cantidad' => $cant,
            'precio_unitario' => $p->precio_venta, 'subtotal' => $sub, 'nota' => $nota,
        ]);
    }

    $pedido->total = $total;
    $pedido->save();

    if (!empty($o['pagos'])) {
        foreach ($o['pagos'] as [$medioNombre, $monto, $comprobante]) {
            Pago_Pedido::create([
                'pedido_id' => $pedido->id,
                'medio_pago_id' => $medios[$medioNombre]->id,
                'monto' => $monto,
                'comprobante_url' => $comprobante,
            ]);
        }
    }

    if (!empty($o['factura'])) {
        Factura_Venta::create([
            'pedido_id' => $pedido->id,
            'numero_factura' => FacturaService::generarNumeroFactura(),
            'subtotal' => $total,
            'impuestos' => 0,
            'total' => $total,
            'fecha_emision' => $o['fecha'],
        ]);
    }

    // Fechas históricas para las gráficas del panel.
    $pedido->created_at = $o['fecha'];
    $pedido->updated_at = $o['fecha'];
    $pedido->save();

    return $pedido;
}

if (Pedido::count() === 0) {
    $tarjeta = 'Tarjeta de Crédito';
    $transf = 'Transferencia Bancaria';
    $movil = 'Pago Móvil';
    $efectivo = 'Efectivo';
    $qr = 'QR (Pago Digital)';
    $comp = 'https://res.cloudinary.com/demo/image/upload/v1/samples/ecommerce/accessories-bag.jpg';

    $p1 = crearPedido(['cliente_id' => $cliente->id, 'estado' => 'pendiente', 'fecha' => now()->subMinutes(6),
        'items' => [[0, 1, 'Sin azúcar'], [7, 1, '']]]);
    $p2 = crearPedido(['cliente_id' => $cliente->id, 'estado' => 'pagado', 'fecha' => now()->subMinutes(38),
        'items' => [[1, 2, ''], [9, 1, 'Para llevar']], 'pagos' => [[$transf, 24000, $comp]], 'factura' => true]);
    $p3 = crearPedido(['cliente_id' => $cliente2->id, 'estado' => 'entregado', 'fecha' => now()->subHours(2),
        'items' => [[2, 1, 'Con crema batida'], [5, 1, '']], 'pagos' => [[$efectivo, 16500, null]], 'factura' => true]);
    $p4 = crearPedido(['cliente_id' => $cliente3->id, 'estado' => 'entregado', 'barista_id' => $barista->id, 'fecha' => now()->subHours(4),
        'items' => [[3, 2, ''], [8, 2, '']], 'pagos' => [[$movil, 26000, $comp]], 'factura' => true]);
    $p5 = crearPedido(['cliente_id' => $cliente->id, 'estado' => 'cancelado', 'barista_id' => $barista->id, 'fecha' => now()->subDays(1)->setTime(16, 20),
        'items' => [[4, 1, '']]]);
    $p6 = crearPedido(['cliente_id' => null, 'estado' => 'entregado', 'barista_id' => $barista->id, 'fecha' => now()->subDays(2)->setTime(10, 15),
        'items' => [[0, 2, ''], [6, 1, '']], 'pagos' => [[$efectivo, 23500, null]], 'factura' => true]);
    $p7 = crearPedido(['cliente_id' => $cliente2->id, 'estado' => 'entregado', 'barista_id' => $barista->id, 'fecha' => now()->subDays(3)->setTime(15, 40),
        'items' => [[1, 1, ''], [9, 1, '']], 'pagos' => [[$qr, 18000, $comp]], 'factura' => true]);
    $p8 = crearPedido(['cliente_id' => $cliente3->id, 'estado' => 'entregado', 'barista_id' => $barista->id, 'fecha' => now()->subDays(4)->setTime(11, 5),
        'items' => [[2, 2, ''], [7, 1, '']], 'pagos' => [[$tarjeta, 24500, null]], 'factura' => true]);
    $p9 = crearPedido(['cliente_id' => $cliente->id, 'estado' => 'entregado', 'barista_id' => $barista->id, 'fecha' => now()->subDays(5)->setTime(9, 30),
        'items' => [[0, 1, ''], [3, 1, '']], 'pagos' => [[$efectivo, 16500, null]], 'factura' => true]);
    $p10 = crearPedido(['cliente_id' => $cliente2->id, 'estado' => 'entregado', 'barista_id' => $barista->id, 'fecha' => now()->subDays(6)->setTime(13, 10),
        'items' => [[5, 2, ''], [1, 1, '']], 'pagos' => [[$transf, 27000, $comp]], 'factura' => true]);

    // Caja abierta de hoy (turno mañana) con movimientos de los pagos de hoy.
    $caja = Caja::create([
        'abierta_por' => $barista->id, 'turno_id' => $manana->id, 'estado' => 'abierta',
        'monto_apertura_sistema' => 100000, 'monto_apertura_fisico' => 100000,
        'monto_apertura_efectivo' => 80000, 'monto_apertura_digital' => 20000,
        'fecha_apertura' => now()->setTime(7, 0),
    ]);
    foreach ([$p2, $p3, $p4] as $pp) {
        foreach ($pp->pagos as $pago) {
            Movimiento_Caja::create([
                'caja_id' => $caja->id, 'tipo' => 'ingreso', 'monto' => $pago->monto,
                'pedido_pago_id' => $pago->id, 'descripcion' => 'Ingreso por pago de pedido #' . $pp->id,
            ]);
        }
    }
    Movimiento_Caja::create(['caja_id' => $caja->id, 'tipo' => 'egreso', 'monto' => 25000, 'gasto_pago_id' => Gasto_Pago::first()->id, 'descripcion' => 'Pago de domicilio de insumos']);

    // Caja cerrada de ayer (histórico).
    Caja::create([
        'abierta_por' => $barista->id, 'cerrada_por' => $barista->id, 'turno_id' => $mananaAyer->id,
        'estado' => 'cerrada',
        'monto_apertura_sistema' => 100000, 'monto_apertura_fisico' => 100000,
        'monto_apertura_efectivo' => 70000, 'monto_apertura_digital' => 30000,
        'monto_cierre_sistema' => 168500, 'monto_cierre_fisico' => 167500,
        'monto_cierre_efectivo' => 115500, 'monto_cierre_digital' => 52000,
        'fecha_apertura' => now()->subDay()->setTime(7, 0),
        'fecha_cierre' => now()->subDay()->setTime(13, 5),
    ]);
}

// ── Inventario con estados variados ──
$ajustes = [
    'Café en Grano' => [2.4, 5], 'Leche' => [7, 10], 'Vainilla' => [0.3, 0.5],
    'Caramelo' => [0.9, 0.5], 'Harina' => [15, 3], 'Huevos' => [8, 12],
    'Aguacate' => [0, 3], 'Mascarpone' => [4, 1], 'Frutos Rojos' => [2, 1],
];
foreach ($ajustes as $n => [$stock, $min]) {
    Insumo::where('nombre', $n)->update(['stock_actual' => $stock, 'stock_minimo' => $min]);
}

echo "Datos demo listos: "
    . User::count() . " usuarios, "
    . Pedido::count() . " pedidos, "
    . Mensaje::count() . " mensajes, "
    . Evento::count() . " eventos, "
    . Caja::count() . " cajas.\n";

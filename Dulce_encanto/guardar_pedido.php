<?php
// ============================================================
// POST /guardar_pedido.php
// ------------------------------------------------------------
// Recibe el pedido (carrito armado) en JSON desde el front-end
// cuando la persona presiona "Enviar pedido por WhatsApp", y lo
// guarda en las tablas "pedidos" + "detalle_pedido".
//
// JSON de entrada esperado (ejemplo):
// {
//   "nombreCliente": "Ana Pérez",
//   "telefono": "968135439",
//   "moneda": "PEN",
//   "metodoPago": "yape",          // efectivo | yape | plin
//   "pagoCon": 100,                // opcional: solo para efectivo (con cuánto paga)
//   "items": [
//     { "id": "torta-chocolate", "nombre": "Torta de Chocolate Belga",
//       "precioUnitarioPEN": 65.00, "cantidad": 2 }
//   ]
// }
//
// Los precios y nombres se vuelven a leer de la tabla "productos"
// para que nadie pueda alterar el total desde el navegador.
// ============================================================

require "conexion.php";
session_start();
header("Content-Type: application/json; charset=utf-8");

$datos = json_decode(file_get_contents("php://input"), true);

if (!$datos || empty($datos["items"]) || !is_array($datos["items"])) {
    http_response_code(400);
    echo json_encode(["error" => "El pedido no tiene productos."]);
    exit;
}

$idUsuario = $_SESSION["id_usuario"] ?? null; // null si el cliente no inició sesión
$nombreCliente = $datos["nombreCliente"] ?? ($_SESSION["nombre_usuario"] ?? null);
$telefono = $datos["telefono"] ?? null;

$moneda = strtoupper((string) ($datos["moneda"] ?? "PEN"));
if (!preg_match('/^[A-Z]{3}$/', $moneda)) {
    $moneda = "PEN";
}

// ---------- Método de pago ----------
$metodosValidos = ["efectivo", "yape", "plin"];
$metodoPago = strtolower((string) ($datos["metodoPago"] ?? "efectivo"));
if (!in_array($metodoPago, $metodosValidos, true)) {
    $metodoPago = "efectivo";
}

$pagoCon = null; // solo aplica a efectivo (para preparar el vuelto)
if ($metodoPago === "efectivo" && isset($datos["pagoCon"]) && is_numeric($datos["pagoCon"]) && $datos["pagoCon"] > 0) {
    $pagoCon = round((float) $datos["pagoCon"], 2);
}

// ---------- Calcula el total en soles con los precios reales de la BD ----------
$stmtProducto = $pdo->prepare(
    "SELECT id, nombre, precio_referencial_pen FROM productos WHERE id = :id AND activo = 1"
);

$lineas = [];
$total = 0;
foreach ($datos["items"] as $item) {
    $idProducto = (string) ($item["id"] ?? "");
    $cantidad = (int) ($item["cantidad"] ?? 0);

    if ($idProducto === "" || $cantidad < 1 || $cantidad > 99) {
        http_response_code(400);
        echo json_encode(["error" => "Hay un producto con datos inválidos en el pedido."]);
        exit;
    }

    $stmtProducto->execute(["id" => $idProducto]);
    $producto = $stmtProducto->fetch();
    if (!$producto) {
        http_response_code(400);
        echo json_encode(["error" => "El producto '{$idProducto}' ya no está disponible."]);
        exit;
    }

    $precio = (float) $producto["precio_referencial_pen"];
    $subtotal = round($precio * $cantidad, 2);
    $total += $subtotal;

    $lineas[] = [
        "id" => $producto["id"],
        "nombre" => $producto["nombre"],
        "precio" => $precio,
        "cantidad" => $cantidad,
        "subtotal" => $subtotal,
    ];
}
$total = round($total, 2);

// Si dice que paga con menos de lo que cuesta el pedido, se ignora ese dato.
if ($pagoCon !== null && $pagoCon < $total) {
    $pagoCon = null;
}

try {
    $pdo->beginTransaction();

    $stmtPedido = $pdo->prepare(
        "INSERT INTO pedidos (id_usuario, nombre_cliente, telefono, moneda, total, metodo_pago, pago_con_pen)
         VALUES (:id_usuario, :nombre, :telefono, :moneda, :total, :metodo_pago, :pago_con)"
    );
    $stmtPedido->execute([
        "id_usuario" => $idUsuario,
        "nombre" => $nombreCliente,
        "telefono" => $telefono,
        "moneda" => $moneda,
        "total" => $total,
        "metodo_pago" => $metodoPago,
        "pago_con" => $pagoCon,
    ]);

    $idPedido = $pdo->lastInsertId();

    $stmtDetalle = $pdo->prepare(
        "INSERT INTO detalle_pedido
            (id_pedido, id_producto, nombre_producto, precio_unitario_pen, cantidad, subtotal_pen)
         VALUES (:id_pedido, :id_producto, :nombre_producto, :precio, :cantidad, :subtotal)"
    );

    foreach ($lineas as $linea) {
        $stmtDetalle->execute([
            "id_pedido" => $idPedido,
            "id_producto" => $linea["id"],
            "nombre_producto" => $linea["nombre"],
            "precio" => $linea["precio"],
            "cantidad" => $linea["cantidad"],
            "subtotal" => $linea["subtotal"],
        ]);
    }

    $pdo->commit();

    echo json_encode([
        "exito" => true,
        "idPedido" => $idPedido,
        "total" => $total,
        "metodoPago" => $metodoPago,
        "pagoCon" => $pagoCon,
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(["error" => "No se pudo guardar el pedido.", "detalle" => $e->getMessage()]);
}

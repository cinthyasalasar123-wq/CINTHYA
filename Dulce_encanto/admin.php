<?php
// ============================================================
// admin.php — Panel de administración
// Protegido: si no hay sesión de admin, manda a admin_login.php
// ============================================================
session_start();
require "conexion.php";

if (empty($_SESSION["es_admin"])) {
    header("Location: admin_login.php");
    exit;
}

// ---------- Acción: marcar un pedido como pagado / pago pendiente ----------
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["accion"]) && $_POST["accion"] === "cambiar_pago") {
    $idPedido = (int) $_POST["id_pedido"];
    $nuevoEstadoPago = $_POST["estado_pago"] ?? "";
    if (in_array($nuevoEstadoPago, ["pendiente", "pagado"], true)) {
        $stmt = $pdo->prepare("UPDATE pedidos SET estado_pago = :ep WHERE id_pedido = :id");
        $stmt->execute(["ep" => $nuevoEstadoPago, "id" => $idPedido]);
    }
    header("Location: admin.php");
    exit;
}

// ---------- Acción: cambiar el estado de un pedido ----------
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["accion"]) && $_POST["accion"] === "cambiar_estado") {
    $idPedido = (int) $_POST["id_pedido"];
    $nuevoEstado = $_POST["estado"];
    $estadosValidos = ["pendiente", "confirmado", "entregado", "cancelado"];
    if (in_array($nuevoEstado, $estadosValidos, true)) {
        $stmt = $pdo->prepare("UPDATE pedidos SET estado = :estado WHERE id_pedido = :id");
        $stmt->execute(["estado" => $nuevoEstado, "id" => $idPedido]);
    }
    header("Location: admin.php");
    exit;
}

$pedidos = $pdo->query(
    "SELECT p.id_pedido, p.nombre_cliente, p.telefono, p.total, p.estado, p.fecha, p.metodo_pago, p.pago_con_pen, p.estado_pago, u.correo
     FROM pedidos p
     LEFT JOIN usuarios u ON u.id_usuario = p.id_usuario
     ORDER BY p.fecha DESC"
)->fetchAll();

$etiquetasPago = ["efectivo" => "💵 Efectivo", "yape" => "📱 Yape", "plin" => "💙 Plin"];

$productos = $pdo->query(
    "SELECT id, categoria, nombre, precio_referencial_pen, activo FROM productos ORDER BY categoria, nombre"
)->fetchAll();

$totalUsuarios = $pdo->query("SELECT COUNT(*) AS n FROM usuarios")->fetch()["n"];
$totalPedidos = count($pedidos);
$ventasTotales = array_sum(array_column($pedidos, "total"));
$totalConversaciones = $pdo->query("SELECT COUNT(*) AS n FROM chat_conversaciones")->fetch()["n"];

$mensajesChat = $pdo->query(
    "SELECT cm.rol, cm.contenido, cm.creado_en, cc.session_id, u.nombre
     FROM chat_mensajes cm
     JOIN chat_conversaciones cc ON cc.id_conversacion = cm.id_conversacion
     LEFT JOIN usuarios u ON u.id_usuario = cc.id_usuario
     ORDER BY cm.creado_en DESC
     LIMIT 30"
)->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Panel de Administración — Dulce Encanto</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Work Sans', Arial, sans-serif; background: #fdedf3; margin: 0; color: #6d2350; }
  header {
    background: linear-gradient(135deg, #6d2350, #e0417e);
    color: #fff; padding: 18px 28px; display: flex; justify-content: space-between; align-items: center;
  }
  header h1 { margin: 0; font-size: 1.2rem; }
  header a { color: #fff; text-decoration: none; background: rgba(255,255,255,0.2); padding: 8px 14px; border-radius: 10px; font-size: 0.85rem; }
  main { padding: 26px; max-width: 1100px; margin: 0 auto; }
  .tarjetas { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 14px; margin-bottom: 28px; }
  .tarjeta { background: #fff; border-radius: 14px; padding: 16px 18px; box-shadow: 0 6px 18px rgba(109,35,80,0.1); }
  .tarjeta .valor { font-size: 1.5rem; font-weight: 700; color: #e0417e; }
  .tarjeta .etiqueta { font-size: 0.78rem; color: #9c6b7c; }
  h2 { font-size: 1.05rem; margin: 30px 0 12px; }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 18px rgba(109,35,80,0.08); }
  th, td { padding: 10px 12px; text-align: left; font-size: 0.82rem; border-bottom: 1px solid #f6dbe7; }
  th { background: #fdedf3; color: #6d2350; }
  select { padding: 5px 8px; border-radius: 8px; border: 1px solid #e8b9d0; font-size: 0.78rem; }
  button.guardar { border: none; background: #e0417e; color: #fff; padding: 5px 10px; border-radius: 8px; font-size: 0.75rem; cursor: pointer; }
  .estado { padding: 3px 9px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
  .estado.pendiente { background: #ffe9b3; color: #8a6100; }
  .estado.confirmado { background: #cfe8ff; color: #1a5a99; }
  .estado.entregado { background: #d4f5d4; color: #1e7e1e; }
  .estado.cancelado { background: #ffd6d6; color: #a8285a; }
  .estado-pago { padding: 2px 8px; border-radius: 20px; font-size: 0.68rem; font-weight: 600; display: inline-block; margin-top: 3px; }
  .estado-pago.pendiente { background: #ffe9b3; color: #8a6100; }
  .estado-pago.pagado { background: #d4f5d4; color: #1e7e1e; }
  .activo-si { color: #1e7e1e; font-weight: 600; }
  .activo-no { color: #a8285a; font-weight: 600; }
</style>
</head>
<body>
  <header>
    <h1>🧁 Panel de Administración — Dulce Encanto</h1>
    <a href="admin_logout.php">Cerrar sesión (<?= htmlspecialchars($_SESSION["admin_nombre"]) ?>)</a>
  </header>

  <main>
    <div class="tarjetas">
      <div class="tarjeta"><div class="valor"><?= $totalPedidos ?></div><div class="etiqueta">Pedidos totales</div></div>
      <div class="tarjeta"><div class="valor">S/ <?= number_format($ventasTotales, 2) ?></div><div class="etiqueta">Ventas acumuladas</div></div>
      <div class="tarjeta"><div class="valor"><?= $totalUsuarios ?></div><div class="etiqueta">Clientes registrados</div></div>
      <div class="tarjeta"><div class="valor"><?= count($productos) ?></div><div class="etiqueta">Productos en catálogo</div></div>
      <div class="tarjeta"><div class="valor"><?= $totalConversaciones ?></div><div class="etiqueta">Conversaciones del chat</div></div>
    </div>

    <h2>Pedidos</h2>
    <table>
      <tr>
        <th>#</th><th>Cliente</th><th>Correo</th><th>Teléfono</th><th>Total</th><th>Pago</th><th>Fecha</th><th>Estado</th><th></th>
      </tr>
      <?php foreach ($pedidos as $p): ?>
      <tr>
        <td>#<?= $p["id_pedido"] ?></td>
        <td><?= htmlspecialchars($p["nombre_cliente"] ?? "—") ?></td>
        <td><?= htmlspecialchars($p["correo"] ?? "invitado") ?></td>
        <td><?= htmlspecialchars($p["telefono"] ?? "—") ?></td>
        <td>S/ <?= number_format($p["total"], 2) ?></td>
        <td>
          <?= htmlspecialchars($etiquetasPago[$p["metodo_pago"]] ?? $p["metodo_pago"]) ?>
          <?php if ($p["metodo_pago"] === "efectivo" && $p["pago_con_pen"]): ?>
            <br><small>Paga con S/ <?= number_format($p["pago_con_pen"], 2) ?></small>
          <?php endif; ?>
          <br><span class="estado-pago <?= htmlspecialchars($p["estado_pago"]) ?>"><?= htmlspecialchars($p["estado_pago"]) ?></span>
        </td>
        <td><?= date("d/m/Y H:i", strtotime($p["fecha"])) ?></td>
        <td><span class="estado <?= $p["estado"] ?>"><?= $p["estado"] ?></span></td>
        <td>
          <form method="POST" style="display:flex; gap:6px;">
            <input type="hidden" name="accion" value="cambiar_estado">
            <input type="hidden" name="id_pedido" value="<?= $p["id_pedido"] ?>">
            <select name="estado">
              <?php foreach (["pendiente","confirmado","entregado","cancelado"] as $op): ?>
                <option value="<?= $op ?>" <?= $op === $p["estado"] ? "selected" : "" ?>><?= ucfirst($op) ?></option>
              <?php endforeach; ?>
            </select>
            <button class="guardar" type="submit">Guardar</button>
          </form>
          <form method="POST" style="display:flex; gap:6px; margin-top:6px;">
            <input type="hidden" name="accion" value="cambiar_pago">
            <input type="hidden" name="id_pedido" value="<?= $p["id_pedido"] ?>">
            <select name="estado_pago">
              <?php foreach (["pendiente","pagado"] as $op): ?>
                <option value="<?= $op ?>" <?= $op === $p["estado_pago"] ? "selected" : "" ?>>Pago <?= $op ?></option>
              <?php endforeach; ?>
            </select>
            <button class="guardar" type="submit">Guardar</button>
          </form>
        </td>
      </tr>
      <?php endforeach; ?>
      <?php if (!$pedidos): ?>
        <tr><td colspan="9">Todavía no hay pedidos.</td></tr>
      <?php endif; ?>
    </table>

    <h2>Catálogo de productos</h2>
    <table>
      <tr><th>ID</th><th>Categoría</th><th>Nombre</th><th>Precio (S/)</th><th>Activo</th></tr>
      <?php foreach ($productos as $prod): ?>
      <tr>
        <td><?= htmlspecialchars($prod["id"]) ?></td>
        <td><?= htmlspecialchars($prod["categoria"]) ?></td>
        <td><?= htmlspecialchars($prod["nombre"]) ?></td>
        <td>S/ <?= number_format($prod["precio_referencial_pen"], 2) ?></td>
        <td class="<?= $prod["activo"] ? "activo-si" : "activo-no" ?>"><?= $prod["activo"] ? "Sí" : "No" ?></td>
      </tr>
      <?php endforeach; ?>
    </table>
    <p style="font-size:0.78rem; color:#9c6b7c;">Para editar precios o agregar productos nuevos, hazlo directamente desde phpMyAdmin en la tabla "productos" por ahora.</p>

    <h2>Últimos mensajes del Chat Bot</h2>
    <table>
      <tr><th>Cliente</th><th>Rol</th><th>Mensaje</th><th>Fecha</th></tr>
      <?php foreach ($mensajesChat as $m): ?>
      <tr>
        <td><?= htmlspecialchars($m["nombre"] ?? "Invitado") ?></td>
        <td><?= $m["rol"] === "usuario" ? "🧑 Cliente" : "🧁 Asistente" ?></td>
        <td><?= htmlspecialchars(mb_strimwidth($m["contenido"], 0, 90, "…")) ?></td>
        <td><?= date("d/m/Y H:i", strtotime($m["creado_en"])) ?></td>
      </tr>
      <?php endforeach; ?>
      <?php if (!$mensajesChat): ?>
        <tr><td colspan="4">Todavía no hay conversaciones registradas.</td></tr>
      <?php endif; ?>
    </table>
  </main>
</body>
</html>
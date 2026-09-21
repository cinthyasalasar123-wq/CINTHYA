<?php
// ============================================================
// admin/index.php — Acceso y panel de administración (un solo archivo)
// ------------------------------------------------------------
//   - Sin sesión de administrador  → muestra el formulario de acceso.
//   - Con sesión                   → muestra el panel.
//   - ?salir=1                     → cierra la sesión.
// Los administradores se guardan en la tabla "administradores"
// (crear uno nuevo: sql/actualizar_bd.sql).
// ============================================================
session_start();
require __DIR__ . "/../config/conexion.php";

function e($valor): string
{
    return htmlspecialchars((string) $valor, ENT_QUOTES, "UTF-8");
}

// ---------- Cerrar sesión ----------
if (isset($_GET["salir"])) {
    $_SESSION = [];
    session_destroy();
    header("Location: index.php");
    exit;
}

// ---------- Acceso ----------
if (empty($_SESSION["es_admin"])) {
    $error = "";

    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        $stmt = $pdo->prepare("SELECT nombre_usuario, contrasena_hash FROM administradores WHERE nombre_usuario = :u");
        $stmt->execute(["u" => trim($_POST["usuario"] ?? "")]);
        $admin = $stmt->fetch();

        if ($admin && password_verify((string) ($_POST["contrasena"] ?? ""), $admin["contrasena_hash"])) {
            session_regenerate_id(true);
            $_SESSION["es_admin"] = true;
            $_SESSION["admin_nombre"] = $admin["nombre_usuario"];
            header("Location: index.php");
            exit;
        }
        $error = "Usuario o contraseña incorrectos.";
    }
    ?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Acceso administrador — Dulce Encanto</title>
<link rel="stylesheet" href="admin.css">
</head>
<body class="pagina-login">
  <div class="caja">
    <h1>🧁 Panel de Administración</h1>
    <?php if ($error): ?><div class="error"><?= e($error) ?></div><?php endif; ?>
    <form method="POST">
      <label for="usuario">Usuario</label>
      <input type="text" id="usuario" name="usuario" required autofocus>
      <label for="contrasena">Contraseña</label>
      <input type="password" id="contrasena" name="contrasena" required>
      <button type="submit">Ingresar</button>
    </form>
    <a href="../index.html">← Volver a la tienda</a>
  </div>
</body>
</html>
    <?php
    exit;
}

// ---------- Acciones sobre un pedido (estado del pedido / estado del pago) ----------
$estadosPedido = ["pendiente", "confirmado", "entregado", "cancelado"];
$estadosPago = ["pendiente", "pagado"];
$acciones = [
    "cambiar_estado" => ["estado", $estadosPedido],
    "cambiar_pago" => ["estado_pago", $estadosPago],
];

$accion = $_POST["accion"] ?? "";
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($acciones[$accion])) {
    [$columna, $validos] = $acciones[$accion]; // la columna sale de esta lista fija, nunca del formulario
    $valor = $_POST[$columna] ?? "";
    if (in_array($valor, $validos, true)) {
        $pdo->prepare("UPDATE pedidos SET {$columna} = :valor WHERE id_pedido = :id")
            ->execute(["valor" => $valor, "id" => (int) $_POST["id_pedido"]]);
    }
    header("Location: index.php");
    exit;
}

// ---------- Datos del panel ----------
$etiquetasPago = ["efectivo" => "💵 Efectivo", "yape" => "📱 Yape", "plin" => "💙 Plin"];

$pedidos = $pdo->query(
    "SELECT p.id_pedido, p.nombre_cliente, p.telefono, p.total, p.estado, p.fecha,
            p.metodo_pago, p.pago_con_pen, p.estado_pago, u.correo
     FROM pedidos p
     LEFT JOIN usuarios u ON u.id_usuario = p.id_usuario
     ORDER BY p.fecha DESC"
)->fetchAll();

$productos = $pdo->query(
    "SELECT id, categoria, nombre, precio_referencial_pen, activo FROM productos ORDER BY categoria, nombre"
)->fetchAll();

$totalUsuarios = $pdo->query("SELECT COUNT(*) AS n FROM usuarios")->fetch()["n"];
$totalConversaciones = $pdo->query("SELECT COUNT(*) AS n FROM chat_conversaciones")->fetch()["n"];
$totalPedidos = count($pedidos);
$ventasTotales = array_sum(array_column($pedidos, "total"));

$mensajesChat = $pdo->query(
    "SELECT cm.rol, cm.contenido, cm.creado_en, u.nombre
     FROM chat_mensajes cm
     JOIN chat_conversaciones cc ON cc.id_conversacion = cm.id_conversacion
     LEFT JOIN usuarios u ON u.id_usuario = cc.id_usuario
     ORDER BY cm.creado_en DESC
     LIMIT 30"
)->fetchAll();

// Formulario pequeño "selector + Guardar" que se repite en cada fila de pedidos
function formularioCambio(string $accion, string $campo, int $idPedido, array $opciones, string $actual, string $prefijo = ""): void
{
    ?>
    <form method="POST" class="form-fila">
      <input type="hidden" name="accion" value="<?= e($accion) ?>">
      <input type="hidden" name="id_pedido" value="<?= $idPedido ?>">
      <select name="<?= e($campo) ?>">
        <?php foreach ($opciones as $op): ?>
          <option value="<?= e($op) ?>" <?= $op === $actual ? "selected" : "" ?>><?= e($prefijo . ucfirst($op)) ?></option>
        <?php endforeach; ?>
      </select>
      <button class="guardar" type="submit">Guardar</button>
    </form>
    <?php
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panel de Administración — Dulce Encanto</title>
<link rel="stylesheet" href="admin.css">
</head>
<body>
  <header>
    <h1>🧁 Panel de Administración — Dulce Encanto</h1>
    <div class="acciones-header">
      <a href="../index.html">Ver tienda</a>
      <a href="?salir=1">Cerrar sesión (<?= e($_SESSION["admin_nombre"]) ?>)</a>
    </div>
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
        <td><?= e($p["nombre_cliente"] ?? "—") ?></td>
        <td><?= e($p["correo"] ?? "invitado") ?></td>
        <td><?= e($p["telefono"] ?? "—") ?></td>
        <td>S/ <?= number_format($p["total"], 2) ?></td>
        <td>
          <?= e($etiquetasPago[$p["metodo_pago"]] ?? $p["metodo_pago"]) ?>
          <?php if ($p["metodo_pago"] === "efectivo" && $p["pago_con_pen"]): ?>
            <br><small>Paga con S/ <?= number_format($p["pago_con_pen"], 2) ?></small>
          <?php endif; ?>
          <br><span class="etiqueta-estado pago-<?= e($p["estado_pago"]) ?>"><?= e($p["estado_pago"]) ?></span>
        </td>
        <td><?= date("d/m/Y H:i", strtotime($p["fecha"])) ?></td>
        <td><span class="etiqueta-estado <?= e($p["estado"]) ?>"><?= e($p["estado"]) ?></span></td>
        <td>
          <?php formularioCambio("cambiar_estado", "estado", $p["id_pedido"], $estadosPedido, $p["estado"]); ?>
          <?php formularioCambio("cambiar_pago", "estado_pago", $p["id_pedido"], $estadosPago, $p["estado_pago"], "Pago "); ?>
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
        <td><?= e($prod["id"]) ?></td>
        <td><?= e($prod["categoria"]) ?></td>
        <td><?= e($prod["nombre"]) ?></td>
        <td>S/ <?= number_format($prod["precio_referencial_pen"], 2) ?></td>
        <td class="<?= $prod["activo"] ? "activo-si" : "activo-no" ?>"><?= $prod["activo"] ? "Sí" : "No" ?></td>
      </tr>
      <?php endforeach; ?>
    </table>
    <p class="nota">Para editar precios o agregar productos nuevos, hazlo desde phpMyAdmin en la tabla "productos" por ahora.</p>

    <h2>Últimos mensajes del Chat Bot</h2>
    <table>
      <tr><th>Cliente</th><th>Rol</th><th>Mensaje</th><th>Fecha</th></tr>
      <?php foreach ($mensajesChat as $m): ?>
      <tr>
        <td><?= e($m["nombre"] ?? "Invitado") ?></td>
        <td><?= $m["rol"] === "usuario" ? "🧑 Cliente" : "🧁 Asistente" ?></td>
        <td><?= e(mb_strimwidth($m["contenido"], 0, 90, "…")) ?></td>
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

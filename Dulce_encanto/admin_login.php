<?php
// ============================================================
// admin_login.php

// ============================================================
session_start();
require "conexion.php";

$error = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $usuario = trim($_POST["usuario"] ?? "");
    $contrasena = (string) ($_POST["contrasena"] ?? "");

    $stmt = $pdo->prepare("SELECT id_admin, nombre_usuario, contrasena_hash FROM administradores WHERE nombre_usuario = :u");
    $stmt->execute(["u" => $usuario]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($contrasena, $admin["contrasena_hash"])) {
        $_SESSION["es_admin"] = true;
        $_SESSION["admin_nombre"] = $admin["nombre_usuario"];
        header("Location: admin.php");
        exit;
    }

    $error = "Usuario o contraseña incorrectos.";
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Acceso administrador — Dulce Encanto</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    font-family: 'Work Sans', Arial, sans-serif;
    background: #fdedf3;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    margin: 0;
  }
  .caja {
    background: #fff;
    padding: 36px 32px;
    border-radius: 18px;
    box-shadow: 0 12px 34px rgba(109,35,80,0.18);
    width: 100%;
    max-width: 340px;
  }
  h1 { font-size: 1.3rem; color: #6d2350; margin-bottom: 18px; text-align: center; }
  label { font-size: 0.85rem; font-weight: 600; color: #6d2350; display: block; margin-bottom: 4px; }
  input {
    width: 100%; padding: 10px 12px; margin-bottom: 16px;
    border: 1px solid #e8b9d0; border-radius: 10px; box-sizing: border-box; font-size: 0.9rem;
  }
  button {
    width: 100%; padding: 11px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #e0417e, #ad2f64); color: #fff;
    font-weight: 700; cursor: pointer; font-size: 0.95rem;
  }
  a { display: block; text-align: center; margin-top: 14px; font-size: 0.8rem; color: #9c6b7c; }
  .error { background: #ffe1e1; color: #a8285a; padding: 8px 12px; border-radius: 8px; font-size: 0.82rem; margin-bottom: 14px; }
</style>
</head>
<body>
  <div class="caja">
    <h1>🧁 Panel de Administración</h1>
    <?php if ($error): ?>
      <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <form method="POST">
      <label for="usuario">Usuario</label>
      <input type="text" id="usuario" name="usuario" required autofocus>
      <label for="contrasena">Contraseña</label>
      <input type="password" id="contrasena" name="contrasena" required>
      <button type="submit">Ingresar</button>
    </form>
    <a href="admin_registro.php">Crear una cuenta de administrador nueva</a>
  </div>
</body>
</html>
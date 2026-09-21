<?php
// ============================================================
// api/cuenta.php — cuenta del cliente (todo en un solo archivo)
// ------------------------------------------------------------
//   GET  ?accion=sesion    → { conectado, nombre }
//   POST ?accion=login     → { correo, contrasena }
//   POST ?accion=registro  → { nombre, correo, telefono, contrasena }
//   POST ?accion=logout    → cierra la sesión
// Respuesta siempre en JSON.
// ============================================================

session_start();
require __DIR__ . "/../config/conexion.php";
header("Content-Type: application/json; charset=utf-8");

function responder(array $datos, int $codigo = 200): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function iniciarSesionCliente($id, string $nombre): void
{
    $_SESSION["id_usuario"] = $id;
    $_SESSION["nombre_usuario"] = $nombre;
}

$accion = $_GET["accion"] ?? "";
$datos = json_decode(file_get_contents("php://input"), true) ?? [];

switch ($accion) {
    case "sesion":
        if (!empty($_SESSION["id_usuario"])) {
            responder(["conectado" => true, "nombre" => $_SESSION["nombre_usuario"]]);
        }
        responder(["conectado" => false]);

    case "login":
        $correo = trim($datos["correo"] ?? "");
        $contrasena = (string) ($datos["contrasena"] ?? "");
        if ($correo === "" || $contrasena === "") {
            responder(["error" => "Ingresa tu correo y contraseña."], 400);
        }

        $stmt = $pdo->prepare("SELECT id_usuario, nombre, contrasena_hash FROM usuarios WHERE correo = :correo");
        $stmt->execute(["correo" => $correo]);
        $usuario = $stmt->fetch();

        if (!$usuario || !password_verify($contrasena, $usuario["contrasena_hash"])) {
            responder(["error" => "Correo o contraseña incorrectos."], 401);
        }

        iniciarSesionCliente($usuario["id_usuario"], $usuario["nombre"]);
        responder(["exito" => true, "nombre" => $usuario["nombre"]]);

    case "registro":
        $nombre = trim($datos["nombre"] ?? "");
        $correo = trim($datos["correo"] ?? "");
        $telefono = trim($datos["telefono"] ?? "");
        $contrasena = (string) ($datos["contrasena"] ?? "");

        if ($nombre === "" || $correo === "" || strlen($contrasena) < 6) {
            responder(["error" => "Completa nombre, correo y una contraseña de al menos 6 caracteres."], 400);
        }

        $stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE correo = :correo");
        $stmt->execute(["correo" => $correo]);
        if ($stmt->fetch()) {
            responder(["error" => "Ya existe una cuenta registrada con ese correo."], 409);
        }

        $stmt = $pdo->prepare(
            "INSERT INTO usuarios (nombre, correo, telefono, contrasena_hash)
             VALUES (:nombre, :correo, :telefono, :hash)"
        );
        $stmt->execute([
            "nombre" => $nombre,
            "correo" => $correo,
            "telefono" => $telefono,
            "hash" => password_hash($contrasena, PASSWORD_DEFAULT),
        ]);

        // Inicia sesión automáticamente después de registrarse
        iniciarSesionCliente($pdo->lastInsertId(), $nombre);
        responder(["exito" => true, "nombre" => $nombre]);

    case "logout":
        $_SESSION = [];
        session_destroy();
        responder(["exito" => true]);

    default:
        responder(["error" => "Acción no válida."], 400);
}

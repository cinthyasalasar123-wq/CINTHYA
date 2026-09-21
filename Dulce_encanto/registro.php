<?php
// ============================================================
// POST /registro.php
// Crea una cuenta de cliente nueva.
// JSON de entrada: { "nombre": "...", "correo": "...", "telefono": "...", "contrasena": "..." }
// ============================================================

session_start();
require "conexion.php";
header("Content-Type: application/json; charset=utf-8");

$datos = json_decode(file_get_contents("php://input"), true);

$nombre = trim($datos["nombre"] ?? "");
$correo = trim($datos["correo"] ?? "");
$telefono = trim($datos["telefono"] ?? "");
$contrasena = (string) ($datos["contrasena"] ?? "");

if ($nombre === "" || $correo === "" || strlen($contrasena) < 6) {
    http_response_code(400);
    echo json_encode(["error" => "Completa nombre, correo y una contraseña de al menos 6 caracteres."]);
    exit;
}

// ¿Ya existe una cuenta con ese correo?
$stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE correo = :correo");
$stmt->execute(["correo" => $correo]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "Ya existe una cuenta registrada con ese correo."]);
    exit;
}

$hash = password_hash($contrasena, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
    "INSERT INTO usuarios (nombre, correo, telefono, contrasena_hash)
     VALUES (:nombre, :correo, :telefono, :hash)"
);
$stmt->execute([
    "nombre" => $nombre,
    "correo" => $correo,
    "telefono" => $telefono,
    "hash" => $hash,
]);

$idUsuario = $pdo->lastInsertId();

// Inicia sesión automáticamente después de registrarse
$_SESSION["id_usuario"] = $idUsuario;
$_SESSION["nombre_usuario"] = $nombre;

echo json_encode(["exito" => true, "nombre" => $nombre]);
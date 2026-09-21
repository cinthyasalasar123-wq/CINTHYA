<?php
// ============================================================
// POST /login.php

// ============================================================

session_start();
require "conexion.php";
header("Content-Type: application/json; charset=utf-8");

$datos = json_decode(file_get_contents("php://input"), true);
$correo = trim($datos["correo"] ?? "");
$contrasena = (string) ($datos["contrasena"] ?? "");

if ($correo === "" || $contrasena === "") {
    http_response_code(400);
    echo json_encode(["error" => "Ingresa tu correo y contraseña."]);
    exit;
}

$stmt = $pdo->prepare("SELECT id_usuario, nombre, contrasena_hash FROM usuarios WHERE correo = :correo");
$stmt->execute(["correo" => $correo]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($contrasena, $usuario["contrasena_hash"])) {
    http_response_code(401);
    echo json_encode(["error" => "Correo o contraseña incorrectos."]);
    exit;
}

$_SESSION["id_usuario"] = $usuario["id_usuario"];
$_SESSION["nombre_usuario"] = $usuario["nombre"];

echo json_encode(["exito" => true, "nombre" => $usuario["nombre"]]);
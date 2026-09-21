<?php
// ============================================================
// GET /sesion_actual.php
// Le dice al front-end si hay un cliente con sesión iniciada
// ahora mismo, para mostrar su nombre en vez del botón de login.
// ============================================================

session_start();
header("Content-Type: application/json; charset=utf-8");

if (!empty($_SESSION["id_usuario"])) {
    echo json_encode([
        "conectado" => true,
        "nombre" => $_SESSION["nombre_usuario"],
    ]);
} else {
    echo json_encode(["conectado" => false]);
}
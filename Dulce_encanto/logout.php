<?php
// ============================================================
// POST /logout.php
// Cierra la sesión del cliente actual.
// ============================================================

session_start();
header("Content-Type: application/json; charset=utf-8");

$_SESSION = [];
session_destroy();

echo json_encode(["exito" => true]);
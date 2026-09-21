<?php
// ============================================================
// CONEXIÓN A LA BASE DE DATOS — Dulce Encanto Pastelería
// ------------------------------------------------------------
// Usa PDO (más seguro y moderno que mysqli). Todos los demás
// archivos PHP incluyen este archivo con require para reutilizar
// la misma conexión.
//
// Ajusta estos 4 valores según tu instalación local
// (XAMPP/WAMP/Laragon normalmente usan usuario "root" y
// contraseña vacía por defecto).
// ============================================================

$DB_HOST = "localhost";
$DB_NOMBRE = "dulce_encanto_db";
$DB_USUARIO = "root";
$DB_PASSWORD = "";

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NOMBRE;charset=utf8mb4",
        $DB_USUARIO,
        $DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode([
        "error" => "No se pudo conectar a la base de datos.",
        "detalle" => $e->getMessage(),
    ]);
    exit;
}
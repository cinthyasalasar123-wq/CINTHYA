<?php
// ============================================================
// GET /obtener_productos.php

// ============================================================

require "conexion.php";
header("Content-Type: application/json; charset=utf-8");

$sentencia = $pdo->query(
    "SELECT id, categoria, nombre, descripcion, presentacion,
            precio_referencial_pen AS precioReferencialPEN, imagen
     FROM productos
     WHERE activo = 1
     ORDER BY categoria, nombre"
);

$productos = $sentencia->fetchAll();

// Convierte el precio a número (PDO a veces lo entrega como string)
foreach ($productos as &$p) {
    $p["precioReferencialPEN"] = (float) $p["precioReferencialPEN"];
}

echo json_encode($productos, JSON_UNESCAPED_UNICODE);
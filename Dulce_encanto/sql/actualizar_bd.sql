-- ============================================================
-- ACTUALIZACIÓN de una base ya creada — Dulce Encanto
-- Ejecútalo en phpMyAdmin (base dulce_encanto_db → pestaña SQL).
-- Se puede ejecutar varias veces sin problema (XAMPP usa MariaDB).
-- Si importas sql/base_datos.sql desde cero NO lo necesitas.
-- ============================================================
USE dulce_encanto_db;

-- 1) Método de pago en los pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS metodo_pago  VARCHAR(20)   NOT NULL DEFAULT 'efectivo' AFTER total,
  ADD COLUMN IF NOT EXISTS pago_con_pen DECIMAL(10,2) NULL AFTER metodo_pago,
  ADD COLUMN IF NOT EXISTS estado_pago  ENUM('pendiente','pagado') NOT NULL DEFAULT 'pendiente' AFTER pago_con_pen;

-- 2) Administrador del panel:  usuario paola / contraseña ccorimanya
DELETE FROM administradores WHERE nombre_usuario = 'admin';
INSERT INTO administradores (nombre_usuario, contrasena_hash)
VALUES ('paola', '$2y$10$DW7q0QnbOc2HsSBXe4rHwepntOcoYWajjNxtcXhuOxs8BwnEJHkxO')
ON DUPLICATE KEY UPDATE contrasena_hash = VALUES(contrasena_hash);

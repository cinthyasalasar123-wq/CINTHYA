-- ============================================================
-- ACTUALIZACIÓN para bases de datos YA CREADAS — Dulce Encanto
-- Agrega el método de pago a la tabla "pedidos".
-- Ejecútalo UNA sola vez en phpMyAdmin (pestaña SQL) sobre la
-- base "dulce_encanto_db". No borra ningún dato existente.
-- (Si importas base_datos.sql desde cero, NO necesitas este archivo.)
-- ============================================================
USE dulce_encanto_db;

ALTER TABLE pedidos
  ADD COLUMN metodo_pago  VARCHAR(20)   NOT NULL DEFAULT 'efectivo' AFTER total,
  ADD COLUMN pago_con_pen DECIMAL(10,2) NULL AFTER metodo_pago,
  ADD COLUMN estado_pago  ENUM('pendiente','pagado') NOT NULL DEFAULT 'pendiente' AFTER pago_con_pen;

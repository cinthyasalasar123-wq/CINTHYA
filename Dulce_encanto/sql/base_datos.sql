-- ============================================================
-- BASE DE DATOS COMPLETA — Dulce Encanto Pastelería

-- ============================================================

CREATE DATABASE IF NOT EXISTS dulce_encanto_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dulce_encanto_db;

-- ------------------------------------------------------------
-- 1) CATEGORÍAS — tabla nueva. 

-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(50)  NOT NULL UNIQUE,
  descripcion  VARCHAR(200),
  orden        INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO categorias (nombre, descripcion, orden) VALUES
('Tortas',    'Tortas completas para compartir, por porciones o para eventos.', 1),
('Cupcakes',  'Mini tortas individuales con distintos sabores y decorados.',    2),
('Postres',   'Postres individuales: cheesecakes, tiramisú, mousses y más.',   3),
('Panadería', 'Croissants, pie y productos horneados del día.',                4),
('Combos',    'Combinaciones especiales para cumpleaños, citas y reuniones.',  5)
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- ------------------------------------------------------------
-- 2) PRODUCTOS — catálogo del negocio
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id                     VARCHAR(50)    NOT NULL PRIMARY KEY,
  categoria              VARCHAR(50)    NOT NULL,
  nombre                 VARCHAR(150)   NOT NULL,
  descripcion            TEXT,
  presentacion           VARCHAR(100),
  precio_referencial_pen DECIMAL(10,2)  NOT NULL,
  imagen                 VARCHAR(500),
  activo                 TINYINT(1)     NOT NULL DEFAULT 1,
  creado_en              TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_producto_categoria
    FOREIGN KEY (categoria) REFERENCES categorias(nombre)
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3) USUARIOS — clientes que se registran en la página
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(150)   NOT NULL,
  correo          VARCHAR(150)   NOT NULL UNIQUE,
  telefono        VARCHAR(30),
  contrasena_hash VARCHAR(255)   NOT NULL,
  creado_en       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4) DIRECCIONES 
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS direcciones (
  id_direccion   INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT            NOT NULL,
  etiqueta       VARCHAR(50)    NOT NULL DEFAULT 'Casa',
  direccion      VARCHAR(255)   NOT NULL,
  referencia     VARCHAR(255),
  distrito       VARCHAR(100),
  predeterminada TINYINT(1)     NOT NULL DEFAULT 0,
  creado_en      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_direccion_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5) ADMINISTRADORES — login del panel de administración
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS administradores (
  id_admin        INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario  VARCHAR(100)   NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255)   NOT NULL,
  creado_en       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6) CUPONES — tabla nueva.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cupones (
  id_cupon         INT AUTO_INCREMENT PRIMARY KEY,
  codigo           VARCHAR(30)    NOT NULL UNIQUE,
  tipo             ENUM('porcentaje', 'monto_fijo') NOT NULL DEFAULT 'porcentaje',
  valor            DECIMAL(10,2)  NOT NULL,
  activo           TINYINT(1)     NOT NULL DEFAULT 1,
  fecha_expiracion DATE           NULL,
  creado_en        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO cupones (codigo, tipo, valor, fecha_expiracion) VALUES
('BIENVENIDO10', 'porcentaje', 10.00, NULL),
('DULCE5',       'monto_fijo',  5.00, NULL)
ON DUPLICATE KEY UPDATE tipo = VALUES(tipo);

-- ------------------------------------------------------------
-- 7) PEDIDOS — cabecera de cada pedido
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido       INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario      INT NULL,
  id_cupon        INT NULL,
  nombre_cliente  VARCHAR(150),
  telefono        VARCHAR(30),
  moneda          VARCHAR(5)     NOT NULL DEFAULT 'PEN',
  descuento_pen   DECIMAL(10,2)  NOT NULL DEFAULT 0,
  total           DECIMAL(10,2)  NOT NULL,
  metodo_pago     VARCHAR(20)    NOT NULL DEFAULT 'efectivo',  -- efectivo | yape | plin
  pago_con_pen    DECIMAL(10,2)  NULL,                          -- con cuánto paga el cliente (efectivo)
  estado_pago     ENUM('pendiente','pagado') NOT NULL DEFAULT 'pendiente',
  estado          ENUM('pendiente','confirmado','entregado','cancelado')
                    NOT NULL DEFAULT 'pendiente',
  fecha           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedido_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE SET NULL,
  CONSTRAINT fk_pedido_cupon
    FOREIGN KEY (id_cupon) REFERENCES cupones(id_cupon)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8) DETALLE_PEDIDO — productos dentro de cada pedido
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedido (
  id_detalle          INT AUTO_INCREMENT PRIMARY KEY,
  id_pedido           INT            NOT NULL,
  id_producto         VARCHAR(50)    NOT NULL,
  nombre_producto     VARCHAR(150)   NOT NULL,
  precio_unitario_pen DECIMAL(10,2)  NOT NULL,
  cantidad            INT            NOT NULL,
  subtotal_pen        DECIMAL(10,2)  NOT NULL,
  CONSTRAINT fk_detalle_pedido
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9) RESEÑAS —
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resenas (
  id_resena      INT AUTO_INCREMENT PRIMARY KEY,
  id_producto    VARCHAR(50)    NOT NULL,
  id_usuario     INT NULL,
  nombre_cliente VARCHAR(150)   NOT NULL,
  calificacion   TINYINT        NOT NULL,
  comentario     TEXT,
  creado_en      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resena_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE,
  CONSTRAINT fk_resena_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  CONSTRAINT chk_resena_calificacion CHECK (calificacion BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 10) FAVORITOS 
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favoritos (
  id_usuario   INT            NOT NULL,
  id_producto  VARCHAR(50)    NOT NULL,
  agregado_en  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_producto),
  CONSTRAINT fk_favorito_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_favorito_producto
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 11) CHAT_CONVERSACIONES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_conversaciones (
  id_conversacion INT AUTO_INCREMENT PRIMARY KEY,
  session_id      VARCHAR(100)   NOT NULL,
  id_usuario      INT NULL,
  iniciada_en     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_chat_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 12) CHAT_MENSAJES — cada mensaje del chatbot
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_mensajes (
  id_mensaje      INT AUTO_INCREMENT PRIMARY KEY,
  id_conversacion INT NOT NULL,
  rol             ENUM('usuario','asistente') NOT NULL,
  contenido       TEXT NOT NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mensaje_conversacion
    FOREIGN KEY (id_conversacion) REFERENCES chat_conversaciones(id_conversacion)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- DATOS: catálogo de 20 productos
-- ------------------------------------------------------------
INSERT INTO productos (id, categoria, nombre, descripcion, presentacion, precio_referencial_pen, imagen) VALUES
('torta-chocolate', 'Tortas', 'Torta de Chocolate Belga', 'Bizcocho húmedo de chocolate con relleno cremoso y ganache brillante.', 'Mediana · 12 porciones', 65.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80'),
('torta-red-velvet', 'Tortas', 'Torta Red Velvet', 'Suave bizcocho aterciopelado con frosting de queso crema, clásico e irresistible.', 'Mediana · 12 porciones', 70.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGfd1Xi1N1vlfv7km2iJvxo5A5EBUoaSY_nxRCH1s8UQ&s=10'),
('torta-fresa', 'Tortas', 'Torta de Fresa con Crema Chantilly', 'Bizcocho esponjoso relleno de fresas naturales y crema chantilly suave.', 'Mediana · 12 porciones', 60.00, 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=800&q=80'),
('torta-tres-leches', 'Tortas', 'Torta Tres Leches', 'El clásico postre bien empapado, decorado con crema batida y canela.', 'Mediana · 12 porciones', 55.00, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=80'),
('cupcake-vainilla', 'Cupcakes', 'Cupcake de Vainilla', 'Suave bizcocho de vainilla con frosting de mantequilla y chispas de colores.', 'Por unidad', 6.00, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80'),
('cupcake-chocolate', 'Cupcakes', 'Cupcake de Chocolate', 'Bizcocho de chocolate intenso con frosting de chocolate y virutas.', 'Por unidad', 6.50, 'https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80'),
('cupcake-red-velvet', 'Cupcakes', 'Cupcake Red Velvet', 'Delicado bizcocho aterciopelado con frosting de queso crema.', 'Por unidad', 7.00, 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80'),
('cupcake-oreo', 'Cupcakes', 'Cupcake de Oreo', 'Bizcocho de vainilla con trozos de galleta Oreo y frosting cremoso.', 'Por unidad', 7.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDTMPAJ8plYwGHJF6V5ek08kREhJ2iH4DpgC34VLhnsw&s=10'),
('cheesecake-fresa', 'Postres', 'Cheesecake de Fresa', 'Base de galleta con relleno cremoso de queso y cobertura de fresas naturales.', 'Por porción', 15.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSP7GSgm8H9uroC8ha2nRNg7S8Tdz0OhPOUwOjWXYlzA&s=10'),
('tiramisu', 'Postres', 'Tiramisú Clásico', 'El tradicional postre italiano con capas de café, mascarpone y cacao.', 'Por porción', 16.00, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80'),
('brownie-helado', 'Postres', 'Brownie con Helado', 'Brownie tibio de chocolate con bola de helado de vainilla y salsa de fudge.', 'Por porción', 14.00, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80'),
('mousse-chocolate', 'Postres', 'Mousse de Chocolate', 'Textura ligera y sedosa de chocolate oscuro, decorada con virutas de cacao.', 'Por porción', 12.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpZfdy0xnqgpfPoNKPGYJTQ3Z1TsZVI_M6YcLZ-ausGA&s=10'),
('croissant-almendras', 'Panadería', 'Croissant Relleno de Almendras', 'Hojaldre crocante relleno de crema de almendras, horneado al momento.', 'Por unidad', 8.50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'),
('cinnamon-roll', 'Panadería', 'Cinnamon Roll', 'Enrollado de canela esponjoso, cubierto con glaseado de queso crema.', 'Por unidad', 9.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKffVS0b0_oXsPVlAhHxBbbFoiVoOa9iLWNzwctiuUMQ&s=10'),
('alfajores', 'Panadería', 'Alfajores Rellenos de Manjar', 'Galletas suaves rellenas de manjar blanco, bañadas en coco rallado.', 'Por unidad', 3.50, 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80'),
('pie-manzana', 'Panadería', 'Pie de Manzana', 'Masa quebrada rellena de manzanas caramelizadas con canela.', 'Por porción', 13.00, 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80'),
('combo-cumpleanos', 'Combos', 'Combo Cumpleaños Feliz', 'Torta mediana + 6 cupcakes decorados + vela de número. Ideal para celebrar en casa.', 'Combo completo', 95.00, 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=800&q=80'),
('combo-san-valentin', 'Combos', 'Combo San Valentín', 'Torta corazón de fresa + 2 copas de mousse de chocolate + tarjeta dedicatoria.', 'Combo completo', 85.00, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80'),
('combo-cafe-postre', 'Combos', 'Combo Café + Postre', 'Un café artesanal a elección junto a una porción de tu postre favorito.', 'Combo completo', 18.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmbZZ3YoqqJl_M7xXxuBEeFHAK7Ehutm1VsmlG4WPpWA&s=10'),
('combo-fiesta-grande', 'Combos', 'Combo Fiesta Grande', 'Torta grande (24 porciones) + 12 cupcakes surtidos. Perfecto para eventos y reuniones.', 'Combo completo', 150.00, 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=80')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ------------------------------------------------------------
-- DATO: reseñas de ejemplo (para que la tabla no quede vacía)
-- ------------------------------------------------------------
INSERT INTO resenas (id_producto, nombre_cliente, calificacion, comentario) VALUES
('torta-chocolate', 'Ana Pérez', 5, 'Buenísima, no quedó nada en la reunión familiar.'),
('cupcake-oreo', 'Luis Ramos', 4, 'Ricos, aunque me hubiera gustado un poco más de relleno.'),
('tiramisu', 'Carla Díaz', 5, 'El mejor tiramisú que he probado en Arequipa.');

-- ------------------------------------------------------------
-- DATO: administrador del panel
--   usuario:    paola
--   contraseña: ccorimanya
-- ------------------------------------------------------------
INSERT INTO administradores (nombre_usuario, contrasena_hash)
VALUES ('paola', '$2y$10$DW7q0QnbOc2HsSBXe4rHwepntOcoYWajjNxtcXhuOxs8BwnEJHkxO')
ON DUPLICATE KEY UPDATE contrasena_hash = VALUES(contrasena_hash);

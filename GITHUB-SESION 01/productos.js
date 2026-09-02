// ============================================================
// MODELADO DE DATOS — Dulce Encanto Pastelería
// ------------------------------------------------------------
// Catálogo único de productos. Cada objeto es la "fuente de la
// verdad" para: el buscador, el render de tarjetas por categoría,
// el selector de moneda y el carrito/pedido (base de datos).
// ============================================================

const productos = [
  // ---------- TORTAS ----------
  {
    id: "torta-chocolate",
    categoria: "Tortas",
    nombre: "Torta de Chocolate Belga",
    descripcion: "Bizcocho húmedo de chocolate con relleno cremoso y ganache brillante.",
    presentacion: "Mediana · 12 porciones",
    precioReferencialPEN: 65.0,
    imagen: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "torta-red-velvet",
    categoria: "Tortas",
    nombre: "Torta Red Velvet",
    descripcion: "Suave bizcocho aterciopelado con frosting de queso crema, clásico e irresistible.",
    presentacion: "Mediana · 12 porciones",
    precioReferencialPEN: 70.0,
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGfd1Xi1N1vlfv7km2iJvxo5A5EBUoaSY_nxRCH1s8UQ&s=10",
  },
  {
    id: "torta-fresa",
    categoria: "Tortas",
    nombre: "Torta de Fresa con Crema Chantilly",
    descripcion: "Bizcocho esponjoso relleno de fresas naturales y crema chantilly suave.",
    presentacion: "Mediana · 12 porciones",
    precioReferencialPEN: 60.0,
    imagen: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "torta-tres-leches",
    categoria: "Tortas",
    nombre: "Torta Tres Leches",
    descripcion: "El clásico postre bien empapado, decorado con crema batida y canela.",
    presentacion: "Mediana · 12 porciones",
    precioReferencialPEN: 55.0,
    imagen: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=80",
  },

  // ---------- CUPCAKES ----------
  {
    id: "cupcake-vainilla",
    categoria: "Cupcakes",
    nombre: "Cupcake de Vainilla",
    descripcion: "Suave bizcocho de vainilla con frosting de mantequilla y chispas de colores.",
    presentacion: "Por unidad",
    precioReferencialPEN: 6.0,
    imagen: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cupcake-chocolate",
    categoria: "Cupcakes",
    nombre: "Cupcake de Chocolate",
    descripcion: "Bizcocho de chocolate intenso con frosting de chocolate y virutas.",
    presentacion: "Por unidad",
    precioReferencialPEN: 6.5,
    imagen: "https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cupcake-red-velvet",
    categoria: "Cupcakes",
    nombre: "Cupcake Red Velvet",
    descripcion: "Delicado bizcocho aterciopelado con frosting de queso crema.",
    presentacion: "Por unidad",
    precioReferencialPEN: 7.0,
    imagen: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cupcake-oreo",
    categoria: "Cupcakes",
    nombre: "Cupcake de Oreo",
    descripcion: "Bizcocho de vainilla con trozos de galleta Oreo y frosting cremoso.",
    presentacion: "Por unidad",
    precioReferencialPEN: 7.0,
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDTMPAJ8plYwGHJF6V5ek08kREhJ2iH4DpgC34VLhnsw&s=10",
  },

  // ---------- POSTRES ----------
  {
    id: "cheesecake-fresa",
    categoria: "Postres",
    nombre: "Cheesecake de Fresa",
    descripcion: "Base de galleta con relleno cremoso de queso y cobertura de fresas naturales.",
    presentacion: "Por porción",
    precioReferencialPEN: 15.0,
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSP7GSgm8H9uroC8ha2nRNg7S8Tdz0OhPOUwOjWXYlzA&s=10",
  },
  {
    id: "tiramisu",
    categoria: "Postres",
    nombre: "Tiramisú Clásico",
    descripcion: "El tradicional postre italiano con capas de café, mascarpone y cacao.",
    presentacion: "Por porción",
    precioReferencialPEN: 16.0,
    imagen: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "brownie-helado",
    categoria: "Postres",
    nombre: "Brownie con Helado",
    descripcion: "Brownie tibio de chocolate con bola de helado de vainilla y salsa de fudge.",
    presentacion: "Por porción",
    precioReferencialPEN: 14.0,
    imagen: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "mousse-chocolate",
    categoria: "Postres",
    nombre: "Mousse de Chocolate",
    descripcion: "Textura ligera y sedosa de chocolate oscuro, decorada con virutas de cacao.",
    presentacion: "Por porción",
    precioReferencialPEN: 12.0,
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpZfdy0xnqgpfPoNKPGYJTQ3Z1TsZVI_M6YcLZ-ausGA&s=10",
  },

  // ---------- PANADERÍA ----------
  {
    id: "croissant-almendras",
    categoria: "Panadería",
    nombre: "Croissant Relleno de Almendras",
    descripcion: "Hojaldre crocante relleno de crema de almendras, horneado al momento.",
    presentacion: "Por unidad",
    precioReferencialPEN: 8.5,
    imagen: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cinnamon-roll",
    categoria: "Panadería",
    nombre: "Cinnamon Roll",
    descripcion: "Enrollado de canela esponjoso, cubierto con glaseado de queso crema.",
    presentacion: "Por unidad",
    precioReferencialPEN: 9.0,
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKffVS0b0_oXsPVlAhHxBbbFoiVoOa9iLWNzwctiuUMQ&s=10",
  },
  {
    id: "alfajores",
    categoria: "Panadería",
    nombre: "Alfajores Rellenos de Manjar",
    descripcion: "Galletas suaves rellenas de manjar blanco, bañadas en coco rallado.",
    presentacion: "Por unidad",
    precioReferencialPEN: 3.5,
    imagen: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "pie-manzana",
    categoria: "Panadería",
    nombre: "Pie de Manzana",
    descripcion: "Masa quebrada rellena de manzanas caramelizadas con canela.",
    presentacion: "Por porción",
    precioReferencialPEN: 13.0,
    imagen: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80",
  },

  // ---------- COMBOS ----------
  {
    id: "combo-cumpleanos",
    categoria: "Combos",
    nombre: "Combo Cumpleaños Feliz",
    descripcion: "Torta mediana + 6 cupcakes decorados + vela de número. Ideal para celebrar en casa.",
    presentacion: "Combo completo",
    precioReferencialPEN: 95.0,
    imagen: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "combo-san-valentin",
    categoria: "Combos",
    nombre: "Combo San Valentín",
    descripcion: "Torta corazón de fresa + 2 copas de mousse de chocolate + tarjeta dedicatoria.",
    presentacion: "Combo completo",
    precioReferencialPEN: 85.0,
    imagen: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "combo-cafe-postre",
    categoria: "Combos",
    nombre: "Combo Café + Postre",
    descripcion: "Un café artesanal a elección junto a una porción de tu postre favorito.",
    presentacion: "Combo completo",
    precioReferencialPEN: 18.0,
    imagen: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmbZZ3YoqqJl_M7xXxuBEeFHAK7Ehutm1VsmlG4WPpWA&s=10",
  },
  {
    id: "combo-fiesta-grande",
    categoria: "Combos",
    nombre: "Combo Fiesta Grande",
    descripcion: "Torta grande (24 porciones) + 12 cupcakes surtidos. Perfecto para eventos y reuniones.",
    presentacion: "Combo completo",
    precioReferencialPEN: 150.0,
    imagen: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=80",
  },
];

// Lista de categorías en el orden en que se muestran en el sitio.
const categorias = ["Tortas", "Cupcakes", "Postres", "Panadería", "Combos"];

// Se exporta para poder usarse tanto en el navegador (script clásico)
// como en un entorno con módulos, sin romper ninguno de los dos.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { productos, categorias };
}
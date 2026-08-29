// ============================================================
// MODELADO DE DATOS — Sesión 2: E-business & E-commerce
// ------------------------------------------------------------
// Catálogo de Dulce Encanto Pastelería. Cada producto refleja
// las tarjetas mostradas en el sitio (Tortas, Cupcakes, Postres,
// Panadería y Combos), con su precio referencial en Soles (PEN)
// para poder convertirlo a otras monedas con el Puente Digital.
// ============================================================

const productos = [
  // ---------- TORTAS ----------
  {
    id: "torta-chocolate",
    categoria: "Tortas",
    nombre: "Torta de Chocolate Belga",
    descripcion: "Bizcocho húmedo de chocolate con relleno cremoso y ganache brillante.",
    presentacion: "Mediana (12 porciones)",
    precioReferencialPEN: 65.0,
  },
  {
    id: "torta-red-velvet",
    categoria: "Tortas",
    nombre: "Torta Red Velvet",
    descripcion: "Suave bizcocho aterciopelado con frosting de queso crema, clásico e irresistible.",
    presentacion: "Mediana (12 porciones)",
    precioReferencialPEN: 70.0,
  },
  {
    id: "torta-fresa",
    categoria: "Tortas",
    nombre: "Torta de Fresa con Crema Chantilly",
    descripcion: "Bizcocho esponjoso relleno de fresas naturales y crema chantilly suave.",
    presentacion: "Mediana (12 porciones)",
    precioReferencialPEN: 60.0,
  },
  {
    id: "torta-tres-leches",
    categoria: "Tortas",
    nombre: "Torta Tres Leches",
    descripcion: "El clásico postre bien empapado, decorado con crema batida y canela.",
    presentacion: "Mediana (12 porciones)",
    precioReferencialPEN: 55.0,
  },

  // ---------- CUPCAKES ----------
  {
    id: "cupcake-vainilla",
    categoria: "Cupcakes",
    nombre: "Cupcake de Vainilla",
    descripcion: "Suave bizcocho de vainilla con frosting de mantequilla y chispas de colores.",
    presentacion: "Por unidad",
    precioReferencialPEN: 6.0,
  },
  {
    id: "cupcake-chocolate",
    categoria: "Cupcakes",
    nombre: "Cupcake de Chocolate",
    descripcion: "Bizcocho de chocolate intenso con frosting de chocolate y virutas.",
    presentacion: "Por unidad",
    precioReferencialPEN: 6.5,
  },
  {
    id: "cupcake-red-velvet",
    categoria: "Cupcakes",
    nombre: "Cupcake Red Velvet",
    descripcion: "Delicado bizcocho aterciopelado con frosting de queso crema.",
    presentacion: "Por unidad",
    precioReferencialPEN: 7.0,
  },
  {
    id: "cupcake-oreo",
    categoria: "Cupcakes",
    nombre: "Cupcake de Oreo",
    descripcion: "Bizcocho de vainilla con trozos de galleta Oreo y frosting cremoso.",
    presentacion: "Por unidad",
    precioReferencialPEN: 7.0,
  },

  // ---------- POSTRES ----------
  {
    id: "cheesecake-fresa",
    categoria: "Postres",
    nombre: "Cheesecake de Fresa",
    descripcion: "Base de galleta con relleno cremoso de queso y cobertura de fresas naturales.",
    presentacion: "Por porción",
    precioReferencialPEN: 15.0,
  },
  {
    id: "tiramisu",
    categoria: "Postres",
    nombre: "Tiramisú Clásico",
    descripcion: "El tradicional postre italiano con capas de café, mascarpone y cacao.",
    presentacion: "Por porción",
    precioReferencialPEN: 16.0,
  },
  {
    id: "brownie-helado",
    categoria: "Postres",
    nombre: "Brownie con Helado",
    descripcion: "Brownie tibio de chocolate con bola de helado de vainilla y salsa de fudge.",
    presentacion: "Por porción",
    precioReferencialPEN: 14.0,
  },
  {
    id: "mousse-chocolate",
    categoria: "Postres",
    nombre: "Mousse de Chocolate",
    descripcion: "Textura ligera y sedosa de chocolate oscuro, decorada con virutas de cacao.",
    presentacion: "Por porción",
    precioReferencialPEN: 12.0,
  },

  // ---------- PANADERÍA ----------
  {
    id: "croissant-almendras",
    categoria: "Panadería",
    nombre: "Croissant Relleno de Almendras",
    descripcion: "Hojaldre crocante relleno de crema de almendras, horneado al momento.",
    presentacion: "Por unidad",
    precioReferencialPEN: 8.5,
  },
  {
    id: "cinnamon-roll",
    categoria: "Panadería",
    nombre: "Cinnamon Roll",
    descripcion: "Enrollado de canela esponjoso, cubierto con glaseado de queso crema.",
    presentacion: "Por unidad",
    precioReferencialPEN: 9.0,
  },
  {
    id: "alfajores",
    categoria: "Panadería",
    nombre: "Alfajores Rellenos de Manjar",
    descripcion: "Galletas suaves rellenas de manjar blanco, bañadas en coco rallado.",
    presentacion: "Por unidad",
    precioReferencialPEN: 3.5,
  },
  {
    id: "pie-manzana",
    categoria: "Panadería",
    nombre: "Pie de Manzana",
    descripcion: "Masa quebrada rellena de manzanas caramelizadas con canela.",
    presentacion: "Por porción",
    precioReferencialPEN: 13.0,
  },

  // ---------- COMBOS ----------
  {
    id: "combo-cumpleanos",
    categoria: "Combos",
    nombre: "Combo Cumpleaños Feliz",
    descripcion: "Torta mediana + 6 cupcakes decorados + vela de número. Ideal para celebrar en casa.",
    presentacion: "Combo completo",
    precioReferencialPEN: 95.0,
  },
  {
    id: "combo-san-valentin",
    categoria: "Combos",
    nombre: "Combo San Valentín",
    descripcion: "Torta corazón de fresa + 2 copas de mousse de chocolate + tarjeta dedicatoria.",
    presentacion: "Combo completo",
    precioReferencialPEN: 85.0,
  },
  {
    id: "combo-cafe-postre",
    categoria: "Combos",
    nombre: "Combo Café + Postre",
    descripcion: "Un café artesanal a elección junto a una porción de tu postre favorito.",
    presentacion: "Combo completo",
    precioReferencialPEN: 18.0,
  },
  {
    id: "combo-fiesta-grande",
    categoria: "Combos",
    nombre: "Combo Fiesta Grande",
    descripcion: "Torta grande (24 porciones) + 12 cupcakes surtidos. Perfecto para eventos y reuniones.",
    presentacion: "Combo completo",
    precioReferencialPEN: 150.0,
  },
];

// Se exporta para poder usarse tanto en el navegador (script clásico)
// como en un entorno con módulos, sin romper ninguno de los dos.
if (typeof module !== "undefined" && module.exports) {
  module.exports = productos;
}
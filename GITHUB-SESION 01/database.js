// ============================================================
// BASE DE DATOS — Dulce Encanto Pastelería
// ------------------------------------------------------------
// Base de datos real del lado del cliente, hecha con IndexedDB
// (la API de base de datos del navegador). No es una simulación
// con variables en memoria: los datos sobreviven a que se cierre
// la pestaña o se apague el equipo.
//
// Dos almacenes (tablas):
//   - "carrito": el pedido que la persona está armando ahora.
//     Clave primaria: id del producto.
//   - "pedidos": historial de pedidos ya enviados por WhatsApp.
//     Clave primaria: idPedido (autoincremental).
//
// Todo el módulo se expone en window.DulceDB con métodos async
// que devuelven Promesas, para poder usarse con await.
// ============================================================

const DB_NOMBRE = "DulceEncantoDB";
const DB_VERSION = 1;
const TABLA_CARRITO = "carrito";
const TABLA_PEDIDOS = "pedidos";

let _dbPromise = null;

function abrirBaseDeDatos() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("Este navegador no soporta IndexedDB."));
      return;
    }

    const solicitud = indexedDB.open(DB_NOMBRE, DB_VERSION);

    solicitud.onupgradeneeded = (evento) => {
      const db = evento.target.result;

      if (!db.objectStoreNames.contains(TABLA_CARRITO)) {
        db.createObjectStore(TABLA_CARRITO, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(TABLA_PEDIDOS)) {
        db.createObjectStore(TABLA_PEDIDOS, {
          keyPath: "idPedido",
          autoIncrement: true,
        });
      }
    };

    solicitud.onsuccess = (evento) => resolve(evento.target.result);
    solicitud.onerror = (evento) => reject(evento.target.error);
  });

  return _dbPromise;
}

// Helper genérico para envolver una transacción en una Promesa.
async function conTabla(nombreTabla, modo, callback) {
  const db = await abrirBaseDeDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(nombreTabla, modo);
    const tabla = tx.objectStore(nombreTabla);
    const resultado = callback(tabla);

    tx.oncomplete = () => resolve(resultado?.__resultado ?? resultado);
    tx.onerror = () => reject(tx.error);
  });
}

// ---------- CARRITO ----------

async function obtenerCarrito() {
  const db = await abrirBaseDeDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TABLA_CARRITO, "readonly");
    const solicitud = tx.objectStore(TABLA_CARRITO).getAll();
    solicitud.onsuccess = () => resolve(solicitud.result || []);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

async function agregarAlCarrito(producto, cantidad) {
  const db = await abrirBaseDeDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TABLA_CARRITO, "readwrite");
    const tabla = tx.objectStore(TABLA_CARRITO);
    const solicitudGet = tabla.get(producto.id);

    solicitudGet.onsuccess = () => {
      const existente = solicitudGet.result;
      const nuevaCantidad = (existente ? existente.cantidad : 0) + cantidad;

      tabla.put({
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        precioReferencialPEN: producto.precioReferencialPEN,
        presentacion: producto.presentacion,
        cantidad: nuevaCantidad,
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function actualizarCantidadCarrito(id, cantidad) {
  if (cantidad <= 0) return eliminarDelCarrito(id);

  const db = await abrirBaseDeDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TABLA_CARRITO, "readwrite");
    const tabla = tx.objectStore(TABLA_CARRITO);
    const solicitudGet = tabla.get(id);

    solicitudGet.onsuccess = () => {
      const item = solicitudGet.result;
      if (item) {
        item.cantidad = cantidad;
        tabla.put(item);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function eliminarDelCarrito(id) {
  return conTabla(TABLA_CARRITO, "readwrite", (tabla) => tabla.delete(id));
}

async function vaciarCarrito() {
  return conTabla(TABLA_CARRITO, "readwrite", (tabla) => tabla.clear());
}

// ---------- PEDIDOS (historial) ----------

async function guardarPedido(pedido) {
  const db = await abrirBaseDeDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TABLA_PEDIDOS, "readwrite");
    const solicitud = tx.objectStore(TABLA_PEDIDOS).add({
      ...pedido,
      fecha: new Date().toISOString(),
    });
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

async function obtenerPedidos() {
  const db = await abrirBaseDeDatos();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TABLA_PEDIDOS, "readonly");
    const solicitud = tx.objectStore(TABLA_PEDIDOS).getAll();
    solicitud.onsuccess = () => resolve((solicitud.result || []).reverse());
    solicitud.onerror = () => reject(solicitud.error);
  });
}

window.DulceDB = {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito,
  guardarPedido,
  obtenerPedidos,
};
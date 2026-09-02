// ============================================================
// EL PUENTE DIGITAL — E-business & E-commerce
// ------------------------------------------------------------
// Objetivo pedagógico: demostrar, con una prueba de concepto real,
// que la tienda puede CONECTARSE a un servicio externo mediante
// una API para ampliar su alcance de negocio. Este script no
// vende nada por sí mismo (eso sería E-COMMERCE); es un proceso
// de soporte que hace más inteligente al negocio, y por eso
// pertenece al mundo del E-BUSINESS.
//
// Caso de uso: los precios del catálogo se manejan en Soles (PEN),
// pero el selector de moneda de cada producto necesita mostrar el
// valor equivalente en Dólares y Euros. Este módulo consulta el
// tipo de cambio del día usando una API pública GRATUITA y SIN
// NECESIDAD DE API KEY, y cachea el resultado para no golpear la
// API en cada clic.
//
// API utilizada: open.er-api.com (Exchange Rate API - Open Access)
// Documentación: https://www.exchangerate-api.com/docs/free
// ============================================================

const API_TIPO_CAMBIO = "https://open.er-api.com/v6/latest/PEN";

let _tasasCache = null;
let _tasasPromesa = null;

/**
 * Obtiene las tasas de cambio actuales desde la API externa.
 * Cachea el resultado en memoria durante la sesión para que cada
 * producto reutilice la misma consulta en vez de disparar una
 * llamada por tarjeta.
 * @returns {Promise<Object>} objeto con tasas, ej: { USD: 0.27, EUR: 0.25, ... }
 */
async function obtenerTasasDeCambio() {
  if (_tasasCache) return _tasasCache;
  if (_tasasPromesa) return _tasasPromesa;

  _tasasPromesa = (async () => {
    const respuesta = await fetch(API_TIPO_CAMBIO);

    if (!respuesta.ok) {
      throw new Error(`La API respondió con error: ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    if (datos.result !== "success") {
      throw new Error("La API no devolvió tasas de cambio válidas.");
    }

    _tasasCache = datos.rates; // { USD: 0.27, EUR: 0.25, ... }
    return _tasasCache;
  })();

  try {
    return await _tasasPromesa;
  } finally {
    _tasasPromesa = null;
  }
}

/**
 * Convierte un monto en Soles a la moneda indicada usando las
 * tasas ya obtenidas.
 */
function convertirMonto(montoPEN, moneda, tasas) {
  if (moneda === "PEN" || !tasas || !tasas[moneda]) return montoPEN;
  return montoPEN * tasas[moneda];
}

window.PuenteDigital = { obtenerTasasDeCambio, convertirMonto };
// ============================================================
// EL PUENTE DIGITAL — Sesión 2: E-business & E-commerce
// ------------------------------------------------------------
// Objetivo pedagógico: demostrar, con una prueba de concepto real,
// que una tienda puede CONECTARSE a un servicio externo mediante
// una API para ampliar su alcance de negocio. Aquí no compramos
// nada ni vendemos nada: E-COMMERCE sería la transacción en sí.
// Este script pertenece al mundo del E-BUSINESS: es un proceso de
// integración/soporte que hace más inteligente al negocio.
//
// Caso elegido: Grafiluz vende a empresas que podrían tener
// clientes o proveedores en otros países. Este script consulta el
// tipo de cambio del día (Soles -> Dólares / Euros) usando una API
// pública GRATUITA y SIN NECESIDAD DE API KEY, y muestra los
// precios referenciales del catálogo ya convertidos.
//
// API utilizada: open.er-api.com (Exchange Rate API - Open Access)
// Documentación: https://www.exchangerate-api.com/docs/free
// ============================================================

const API_TIPO_CAMBIO = "https://open.er-api.com/v6/latest/PEN";

/**
 * Obtiene las tasas de cambio actuales desde la API externa.
 * @returns {Promise<Object>} objeto con tasas, ej: { USD: 0.27, EUR: 0.25, ... }
 */
async function obtenerTasasDeCambio() {
  const respuesta = await fetch(API_TIPO_CAMBIO);

  if (!respuesta.ok) {
    throw new Error(`La API respondió con error: ${respuesta.status}`);
  }

  const datos = await respuesta.json();

  if (datos.result !== "success") {
    throw new Error("La API no devolvió tasas de cambio válidas.");
  }

  return datos.rates; // { USD: 0.27, EUR: 0.25, ... }
}

/**
 * Convierte el catálogo de productos (en Soles) a las monedas
 * indicadas, usando las tasas obtenidas de la API.
 * @param {Array} productos - arreglo de productos (ver productos-data.js)
 * @param {Object} tasas - tasas de cambio devueltas por la API
 * @param {string[]} monedasDestino - ej: ["USD", "EUR"]
 */
function convertirCatalogo(productos, tasas, monedasDestino = ["USD", "EUR"]) {
  return productos.map((producto) => {
    const conversiones = {};

    monedasDestino.forEach((moneda) => {
      const tasa = tasas[moneda];
      if (tasa) {
        conversiones[moneda] = Number(
          (producto.precioReferencialPEN * tasa).toFixed(2)
        );
      }
    });

    return { ...producto, preciosConvertidos: conversiones };
  });
}

/**
 * Pinta el catálogo convertido dentro de un contenedor HTML.
 * Sirve como demo visual del "Puente Digital" funcionando.
 */
function renderizarCatalogoConvertido(catalogoConvertido, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  contenedor.innerHTML = catalogoConvertido
    .map((p) => {
      const conversiones = Object.entries(p.preciosConvertidos)
        .map(([moneda, valor]) => `${moneda} ${valor}`)
        .join(" · ");

      return `
        <div class="pd-producto">
          <strong>${p.nombre}</strong> (${p.categoria})
          <div>S/ ${p.precioReferencialPEN.toFixed(2)} &rarr; ${conversiones}</div>
        </div>
      `;
    })
    .join("");
}

/**
 * Punto de entrada de la demo: conecta con la API, convierte el
 * catálogo y lo muestra en pantalla. Si algo falla (sin internet,
 * API caída, etc.) se informa el error sin romper el resto del sitio.
 */
async function iniciarPuenteDigital(productos, contenedorId = "pd-catalogo") {
  const estado = document.getElementById("pd-estado");

  try {
    if (estado) estado.textContent = "Consultando tipo de cambio...";

    const tasas = await obtenerTasasDeCambio();
    const catalogoConvertido = convertirCatalogo(productos, tasas);

    renderizarCatalogoConvertido(catalogoConvertido, contenedorId);

    if (estado) {
      estado.textContent = `Tipo de cambio actualizado. 1 PEN = ${tasas.USD} USD | ${tasas.EUR} EUR`;
    }
  } catch (error) {
    console.error("Error en el Puente Digital:", error);
    if (estado) {
      estado.textContent =
        "No se pudo conectar con la API externa. Intenta nuevamente más tarde.";
    }
  }
}

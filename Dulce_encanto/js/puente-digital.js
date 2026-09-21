// ============================================================
// PUENTE DIGITAL — Conversor Global de Divisas (versión mejorada)
// ------------------------------------------------------------
// - Varias fuentes de tasas con respaldo automático (si una falla,
//   prueba la siguiente): open.er-api.com → currency-api (jsDelivr)
//   → currency-api (Cloudflare Pages).
// - Límite de espera (6 s) para que la página nunca se quede colgada.
// - Caché de 12 h en localStorage. Si no hay internet, usa la última
//   tasa guardada (aunque esté vencida) antes de recurrir a las
//   tasas de emergencia.
// - Se actualiza sola mientras la página está abierta.
// - Validación de tasas (solo monedas ISO reales, valores > 0).
// - Nombres de monedas en español para TODAS las divisas (Intl).
// - Decimales correctos por moneda (Yen y Peso chileno sin decimales).
// - Buscador de moneda con input + lista (sin tildes, por código
//   o por nombre) y navegación con teclado.
// Base de conversión: PEN (Soles peruanos)
// ============================================================

const PuenteDigital = (() => {
  const CACHE_KEY = "tasas_cambio_mundiales";
  const CACHE_EXPIRY = 12 * 60 * 60 * 1000; // 12 horas de caché
  const TIMEOUT_MS = 6000; // máximo de espera por cada fuente
  const REVISION_MS = 30 * 60 * 1000; // cada 30 min revisa si la caché venció

  // Nombres descriptivos para las principales divisas de referencia
  const NOMBRES_COMUNES = {
    PEN: "Sol Peruano (PEN)",
    USD: "Dólar Estadounidense (USD)",
    EUR: "Euro (EUR)",
    CLP: "Peso Chileno (CLP)",
    COP: "Peso Colombiano (COP)",
    ARS: "Peso Argentino (ARS)",
    MXN: "Peso Mexicano (MXN)",
    BOB: "Boliviano (BOB)",
    BRL: "Real Brasileño (BRL)",
    GBP: "Libra Esterlina (GBP)",
    CAD: "Dólar Canadiense (CAD)",
    JPY: "Yen Japonés (JPY)",
    CHF: "Franco Suizo (CHF)",
  };

  // Monedas que aparecen primero en la lista
  const PRIORITARIAS = ["PEN", "USD", "EUR", "CLP", "COP", "ARS", "MXN", "BOB", "BRL"];

  // Fuentes de tasas (todas gratuitas y sin API key). Cada una sabe
  // "traducir" su respuesta al mismo formato: { rates, fechaMs }.
  const parsearCurrencyApi = (json) => {
    if (!json || !json.pen) return null;
    const rates = {};
    Object.entries(json.pen).forEach(([codigo, valor]) => {
      rates[codigo.toUpperCase()] = valor;
    });
    const fechaMs = Date.parse(json.date);
    return { rates, fechaMs: Number.isFinite(fechaMs) ? fechaMs : Date.now() };
  };

  const FUENTES = [
    {
      nombre: "open.er-api.com",
      url: "https://open.er-api.com/v6/latest/PEN",
      parsear: (json) => {
        if (!json || json.result === "error" || !json.rates) return null;
        const fechaMs = json.time_last_update_unix ? json.time_last_update_unix * 1000 : Date.now();
        return { rates: json.rates, fechaMs };
      },
    },
    {
      nombre: "currency-api (jsDelivr)",
      url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/pen.json",
      parsear: parsearCurrencyApi,
    },
    {
      nombre: "currency-api (Cloudflare)",
      url: "https://latest.currency-api.pages.dev/v1/currencies/pen.json",
      parsear: parsearCurrencyApi,
    },
  ];

  // Tasas aproximadas de emergencia: solo se usan si no hay internet Y
  // nunca se guardó una tasa real en este navegador.
  const TASAS_RESPALDO = { PEN: 1, USD: 0.27, EUR: 0.25, CLP: 250, ARS: 260, MXN: 4.6 };

  // ---------- Utilidades ----------
  function leerLS(clave) {
    try { return localStorage.getItem(clave); } catch { return null; }
  }
  function guardarLS(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch { /* modo privado / sin espacio */ }
  }

  let codigosISO = null;
  try { codigosISO = new Set(Intl.supportedValuesOf("currency")); } catch { /* navegador antiguo */ }

  let nombresIntl = null;
  try { nombresIntl = new Intl.DisplayNames(["es"], { type: "currency" }); } catch { /* navegador antiguo */ }

  // Solo aceptamos códigos de 3 letras que sean monedas reales (así se
  // descartan criptomonedas y códigos raros que traen algunas APIs).
  function esMonedaValida(cod) {
    if (!/^[A-Z]{3}$/.test(cod)) return false;
    return codigosISO ? codigosISO.has(cod) : true;
  }

  function normalizar(texto) {
    return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function nombreSimple(cod) {
    if (NOMBRES_COMUNES[cod]) return NOMBRES_COMUNES[cod].replace(/\s*\([A-Z]{3}\)\s*$/, "");
    try {
      const n = nombresIntl && nombresIntl.of(cod);
      if (n && n !== cod) return n.charAt(0).toUpperCase() + n.slice(1);
    } catch { /* usa el código */ }
    return cod;
  }

  function etiquetaMoneda(cod) {
    const simple = nombreSimple(cod);
    return simple === cod ? cod : `${cod} — ${simple}`;
  }

  // Deja solo tasas numéricas válidas; devuelve null si la respuesta no es confiable.
  function limpiarTasas(crudas) {
    const limpias = {};
    Object.entries(crudas || {}).forEach(([codigo, valor]) => {
      const cod = String(codigo).toUpperCase();
      const num = Number(valor);
      if (esMonedaValida(cod) && Number.isFinite(num) && num > 0) limpias[cod] = num;
    });
    limpias.PEN = 1;
    return Object.keys(limpias).length >= 10 && limpias.USD ? limpias : null;
  }

  async function pedirJSON(url) {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);
    try {
      const resp = await fetch(url, { signal: controlador.signal, cache: "no-store" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      return await resp.json();
    } finally {
      clearTimeout(temporizador);
    }
  }

  // ---------- Estado ----------
  let tasas = null;
  // null = la persona todavía no eligió moneda (la web no muestra precios hasta que elija)
  let monedaSeleccionada = leerLS("moneda_elegida") || null;
  let info = { fuente: null, fechaMs: null, desactualizado: false, respaldo: false };
  let cargando = null;
  let revisionProgramada = false;
  const oyentesActualizacion = [];

  function aplicarTasas(datos, fuente, fechaMs, desactualizado, respaldo = false) {
    tasas = datos;
    info = { fuente, fechaMs, desactualizado, respaldo };
  }

  function leerCache() {
    try {
      const guardado = JSON.parse(leerLS(CACHE_KEY));
      if (guardado && guardado.data && guardado.timestamp) return guardado;
    } catch { /* caché dañada */ }
    return null;
  }

  // Obtiene tasas actualizadas relativas al Sol Peruano (PEN)
  async function cargarTasas(forzar = false) {
    if (cargando) return cargando;

    cargando = (async () => {
      const cache = leerCache();
      const vigente = cache && Date.now() - cache.timestamp < CACHE_EXPIRY;

      if (vigente && !forzar) {
        aplicarTasas(cache.data, cache.fuente || "caché local", cache.fechaMs || cache.timestamp, false);
        return tasas;
      }

      for (const fuente of FUENTES) {
        try {
          const json = await pedirJSON(fuente.url);
          const resultado = fuente.parsear(json);
          const limpias = resultado && limpiarTasas(resultado.rates);
          if (limpias) {
            guardarLS(
              CACHE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                data: limpias,
                fuente: fuente.nombre,
                fechaMs: resultado.fechaMs,
              })
            );
            aplicarTasas(limpias, fuente.nombre, resultado.fechaMs, false);
            return tasas;
          }
        } catch (err) {
          console.warn(`No se pudo obtener las tasas desde ${fuente.nombre}.`, err);
        }
      }

      // Sin internet: mejor la última tasa real guardada (aunque esté vencida)
      if (cache) {
        aplicarTasas(cache.data, cache.fuente || "caché local", cache.fechaMs || cache.timestamp, true);
        return tasas;
      }

      // Último recurso: tasas de respaldo de emergencia
      aplicarTasas(TASAS_RESPALDO, "tasas de respaldo", null, true, true);
      return tasas;
    })().finally(() => {
      cargando = null;
    });

    return cargando;
  }

  // Mientras la página está abierta, revisa cada 30 min si la caché
  // venció y, de ser así, refresca las tasas y avisa a quien quiera repintar.
  function programarRevision() {
    if (revisionProgramada) return;
    revisionProgramada = true;
    setInterval(async () => {
      const cache = leerCache();
      if (cache && Date.now() - cache.timestamp < CACHE_EXPIRY) return;
      await cargarTasas(true);
      oyentesActualizacion.forEach((cb) => {
        try { cb(monedaSeleccionada); } catch (e) { console.warn(e); }
      });
    }, REVISION_MS);
  }

  function alActualizarTasas(callback) {
    if (typeof callback === "function") oyentesActualizacion.push(callback);
  }

  function textoEstadoTasas() {
    const fecha = info.fechaMs
      ? new Date(info.fechaMs).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })
      : "";
    if (info.respaldo) return "Sin conexión: usando tasas aproximadas de respaldo.";
    if (info.desactualizado) return `Sin conexión: usando las últimas tasas guardadas (${fecha}).`;
    return `Tasas del ${fecha} · ${info.fuente}`;
  }

  // ---------- Buscador de moneda (input + lista desplegable) ----------
  // Es el que usa index.html: <input id="selector-moneda"> + <div id="lista-monedas">
  async function inicializarBuscadorMoneda(inputId, listaId, alCambiarCallback) {
    const input = document.getElementById(inputId);
    const lista = document.getElementById(listaId);
    if (!input || !lista) return;

    await cargarTasas();
    programarRevision();
    if (monedaSeleccionada && !tasas[monedaSeleccionada]) monedaSeleccionada = null;

    let indiceActivo = -1;

    function pintarLista(termino = "") {
      const t = normalizar(termino.trim());
      const coincide = (cod) =>
        !t || normalizar(cod).includes(t) || normalizar(nombreSimple(cod)).includes(t);

      const codigos = Object.keys(tasas).filter(esMonedaValida);
      const frecuentes = PRIORITARIAS.filter((c) => tasas[c] && coincide(c));
      const otras = codigos.filter((c) => !PRIORITARIAS.includes(c) && coincide(c)).sort();

      lista.innerHTML = "";
      indiceActivo = -1;

      const agregarGrupo = (titulo, codigosGrupo) => {
        if (!codigosGrupo.length) return;
        const encabezado = document.createElement("div");
        encabezado.className = "grupo-titulo";
        encabezado.textContent = titulo;
        lista.appendChild(encabezado);
        codigosGrupo.forEach((cod) => {
          const opcion = document.createElement("div");
          opcion.className = "opcion-moneda";
          opcion.dataset.codigo = cod;
          opcion.textContent = etiquetaMoneda(cod);
          if (cod === monedaSeleccionada) opcion.style.fontWeight = "700";
          lista.appendChild(opcion);
        });
      };

      agregarGrupo("Monedas frecuentes", frecuentes);
      agregarGrupo("Todas las monedas del mundo", otras);

      if (!frecuentes.length && !otras.length) {
        const vacio = document.createElement("div");
        vacio.className = "sin-resultados";
        vacio.textContent = "No encontramos esa moneda";
        lista.appendChild(vacio);
      }

      const pie = document.createElement("div");
      pie.className = "pie-tasas";
      pie.textContent = textoEstadoTasas();
      lista.appendChild(pie);
    }

    const abrir = () => lista.classList.add("abierta");
    const cerrar = () => lista.classList.remove("abierta");

    function marcarActivo(nuevo) {
      const opciones = lista.querySelectorAll(".opcion-moneda");
      if (!opciones.length) return;
      indiceActivo = (nuevo + opciones.length) % opciones.length;
      opciones.forEach((el, i) => el.classList.toggle("activa", i === indiceActivo));
      opciones[indiceActivo].scrollIntoView({ block: "nearest" });
    }

    function seleccionar(cod) {
      if (!tasas[cod]) return;
      monedaSeleccionada = cod;
      guardarLS("moneda_elegida", cod);
      input.value = etiquetaMoneda(cod);
      cerrar();
      input.blur();
      if (typeof alCambiarCallback === "function") alCambiarCallback(cod);
    }

    input.value = monedaSeleccionada ? etiquetaMoneda(monedaSeleccionada) : "";

    const abrirCompleta = () => {
      input.select();
      pintarLista("");
      abrir();
    };
    input.addEventListener("focus", abrirCompleta);
    input.addEventListener("click", () => {
      if (!lista.classList.contains("abierta")) abrirCompleta();
    });

    input.addEventListener("input", () => {
      pintarLista(input.value);
      abrir();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); abrir(); marcarActivo(indiceActivo + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); marcarActivo(indiceActivo - 1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const opciones = lista.querySelectorAll(".opcion-moneda");
        const elegida = opciones[indiceActivo >= 0 ? indiceActivo : 0];
        if (elegida) seleccionar(elegida.dataset.codigo);
      } else if (e.key === "Escape") {
        cerrar();
        input.blur();
      }
    });

    // mousedown (y no click) para que el input no pierda el foco antes de elegir
    lista.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const opcion = e.target.closest(".opcion-moneda");
      if (opcion) seleccionar(opcion.dataset.codigo);
    });

    input.addEventListener("blur", () => {
      cerrar();
      input.value = monedaSeleccionada ? etiquetaMoneda(monedaSeleccionada) : ""; // si no eligió nada, restaura
    });
  }

  // ---------- Conversión y formato ----------
  // Convierte un monto base en PEN a la moneda actualmente activa o a una dada
  function convertir(montoPEN, codigoMoneda = monedaSeleccionada) {
    if (!tasas || !tasas[codigoMoneda]) return Number(montoPEN);
    return Number(montoPEN) * tasas[codigoMoneda];
  }

  // Da formato de moneda internacional según el estándar ISO (ej: US$ 10.50, € 9.80, ¥ 1,200)
  // Cada moneda usa sus propios decimales (el Yen y el Peso chileno no llevan).
  function formatear(montoPEN, codigoMoneda = monedaSeleccionada) {
    // Si no tenemos la tasa de esa moneda, mostramos en soles (nunca un
    // monto en soles con el símbolo de otra moneda).
    const codigo = tasas && tasas[codigoMoneda] ? codigoMoneda : "PEN";
    const valorConvertido = convertir(montoPEN, codigo);
    try {
      return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: codigo,
      }).format(valorConvertido);
    } catch {
      return `${codigo} ${valorConvertido.toFixed(2)}`;
    }
  }

  return {
    inicializarBuscadorMoneda,
    formatear,
    alActualizarTasas,
    getMonedaActual: () => monedaSeleccionada,
  };
})();

window.PuenteDigital = PuenteDigital;

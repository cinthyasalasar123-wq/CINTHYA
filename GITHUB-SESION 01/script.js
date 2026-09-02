// ============================================================
// DULCE ENCANTO — script principal
// ============================================================

const WHATSAPP_NUMERO = "51968135439";
const ICONO_WHATSAPP = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/></svg>`;

const estado = {
  tasas: null, // se llena una sola vez con { USD: ..., EUR: ... } al cargar la página
};

// ------------------------------------------------------------
// EFECTO: PASTELES Y CUPCAKES CAYENDO
// ------------------------------------------------------------
const dulcesCayendo = ['🎂', '🧁', '🍰', '🍪'];

function crearDulceCayendo() {
  const contenedor = document.getElementById('efectoCaida');
  if (!contenedor) return;

  const dulce = document.createElement('div');
  dulce.classList.add('cayendo');
  dulce.textContent = dulcesCayendo[Math.floor(Math.random() * dulcesCayendo.length)];

  dulce.style.left = Math.random() * 100 + 'vw';

  const duracion = Math.random() * 5 + 7; // entre 7 y 12s, caída suave
  const escala = Math.random() * 0.5 + 0.7;
  const retraso = Math.random() * 2;
  const deriva = (Math.random() * 70 - 35) + 'px';

  dulce.style.animationDuration = `${duracion}s`;
  dulce.style.animationDelay = `${retraso}s`;
  dulce.style.fontSize = (1.5 * escala) + 'rem';
  dulce.style.setProperty('--deriva', deriva);

  contenedor.appendChild(dulce);
  setTimeout(() => dulce.remove(), (duracion + retraso) * 1000);
}

setInterval(crearDulceCayendo, 900);

// ------------------------------------------------------------
// CARRUSEL HERO
// ------------------------------------------------------------
let slideActual = 0;
let intervaloAuto;

function iniciarCarruselHero() {
  const slides = document.querySelectorAll('.carousel-item');
  const indicadores = document.querySelectorAll('.indicator');
  const total = slides.length;
  if (total === 0) return;

  function mostrar(indice) {
    slideActual = (indice + total) % total;
    document.querySelector('.carousel-inner').style.transform = `translateX(${-slideActual * 100}%)`;
    indicadores.forEach((ind, i) => ind.classList.toggle('active', i === slideActual));
  }

  function reiniciarAuto() {
    clearInterval(intervaloAuto);
    intervaloAuto = setInterval(() => mostrar(slideActual + 1), 5500);
  }

  window.avanzarSlide = () => { mostrar(slideActual + 1); reiniciarAuto(); };
  window.retrocederSlide = () => { mostrar(slideActual - 1); reiniciarAuto(); };
  window.irASlide = (i) => { mostrar(i); reiniciarAuto(); };

  reiniciarAuto();
}

// ------------------------------------------------------------
// PRECIOS EN LAS TRES MONEDAS (Soles, Dólares, Euros)
// ------------------------------------------------------------
function formatoTripleMoneda(montoPEN) {
  const principal = `S/ ${montoPEN.toFixed(2)}`;

  if (!estado.tasas) {
    return { principal, secundaria: 'US$ · € — calculando tipo de cambio…' };
  }

  const usd = window.PuenteDigital.convertirMonto(montoPEN, 'USD', estado.tasas);
  const eur = window.PuenteDigital.convertirMonto(montoPEN, 'EUR', estado.tasas);
  return {
    principal,
    secundaria: `US$ ${usd.toFixed(2)} · € ${eur.toFixed(2)}`,
  };
}

async function cargarTiposDeCambio() {
  try {
    estado.tasas = await window.PuenteDigital.obtenerTasasDeCambio();
  } catch (error) {
    console.error('No se pudo obtener el tipo de cambio:', error);
  }
  actualizarPreciosEnPantalla();
}

function actualizarPreciosEnPantalla() {
  document.querySelectorAll('.card').forEach((card) => {
    const producto = productos.find((p) => p.id === card.dataset.id);
    if (!producto) return;
    const precios = formatoTripleMoneda(producto.precioReferencialPEN);
    card.querySelector('.precio-principal').textContent = precios.principal;
    card.querySelector('.precio-secundaria').textContent = precios.secundaria;
  });
  renderizarCarrito();
}

// ------------------------------------------------------------
// RENDER DE PRODUCTOS
// ------------------------------------------------------------
function productoCoincideBusqueda(producto, termino) {
  if (!termino) return true;
  const t = termino.toLowerCase();
  return (
    producto.nombre.toLowerCase().includes(t) ||
    producto.descripcion.toLowerCase().includes(t) ||
    producto.categoria.toLowerCase().includes(t)
  );
}

function crearTarjetaProducto(producto) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = producto.id;

  const precios = formatoTripleMoneda(producto.precioReferencialPEN);

  card.innerHTML = `
    <div class="card-foto">
      <img loading="lazy" src="${producto.imagen}" alt="${producto.nombre}">
    </div>
    <div class="info">
      <h3>${producto.nombre}</h3>
      <p class="descripcion">${producto.descripcion}</p>
      <div class="presentacion">${producto.presentacion}</div>
      <div class="bloque-precio">
        <div class="precio precio-principal">${precios.principal}</div>
        <div class="precio-secundaria">${precios.secundaria}</div>
      </div>
      <div class="fila-cantidad">
        <span class="etiqueta-cantidad">Cantidad</span>
        <div class="stepper">
          <button type="button" class="menos" aria-label="Quitar unidad">−</button>
          <span class="cantidad">1</span>
          <button type="button" class="mas" aria-label="Agregar unidad">+</button>
        </div>
      </div>
      <div class="card-acciones">
        <button type="button" class="btn-agregar">Agregar al pedido</button>
        <a href="#" class="btn-whatsapp-mini" title="Consultar por WhatsApp">${ICONO_WHATSAPP}</a>
      </div>
    </div>
  `;

  const cantidadSpan = card.querySelector('.cantidad');
  card.querySelector('.menos').addEventListener('click', () => {
    const actual = Math.max(1, parseInt(cantidadSpan.textContent, 10) - 1);
    cantidadSpan.textContent = actual;
  });
  card.querySelector('.mas').addEventListener('click', () => {
    const actual = Math.min(99, parseInt(cantidadSpan.textContent, 10) + 1);
    cantidadSpan.textContent = actual;
  });

  card.querySelector('.btn-agregar').addEventListener('click', async () => {
    const cantidad = parseInt(cantidadSpan.textContent, 10);
    await window.DulceDB.agregarAlCarrito(producto, cantidad);
    await actualizarBadgeCarrito();
    mostrarToast(`${producto.nombre} agregado al pedido (x${cantidad})`);
    cantidadSpan.textContent = '1';
  });

  card.querySelector('.btn-whatsapp-mini').addEventListener('click', (evento) => {
    evento.preventDefault();
    const cantidad = parseInt(cantidadSpan.textContent, 10);
    const preciosActuales = formatoTripleMoneda(producto.precioReferencialPEN);
    const mensaje = `¡Hola! Me interesa el producto: *${producto.nombre}* (${preciosActuales.principal} c/u, cantidad: ${cantidad}). ¿Podrían darme mayor información y disponibilidad?`;
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');
  });

  return card;
}

function renderizarCatalogo() {
  const contenedor = document.getElementById('secciones-productos');
  contenedor.innerHTML = '';
  const termino = document.getElementById('campo-busqueda').value.trim();
  let totalVisibles = 0;

  categorias.forEach((categoria) => {
    const items = productos.filter(
      (p) => p.categoria === categoria && productoCoincideBusqueda(p, termino)
    );
    if (items.length === 0) return;
    totalVisibles += items.length;

    const idAncla = categoria
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const section = document.createElement('section');
    section.className = 'categoria';
    section.id = idAncla;
    section.innerHTML = `
      <div class="categoria-titulo">
        <h2>${categoria}</h2>
        <span class="conteo">${items.length} ${items.length === 1 ? 'producto' : 'productos'}</span>
      </div>
      <div class="grid"></div>
    `;

    const grid = section.querySelector('.grid');
    items.forEach((producto) => grid.appendChild(crearTarjetaProducto(producto)));
    contenedor.appendChild(section);
  });

  if (totalVisibles === 0) {
    contenedor.innerHTML = `
      <div class="sin-resultados">
        <strong>No encontramos nada con ese nombre</strong>
        Prueba buscando por otra palabra, como "torta" o "cupcake".
      </div>
    `;
  }
}

// ------------------------------------------------------------
// CARRITO / PEDIDO (usa DulceDB, base de datos con IndexedDB)
// ------------------------------------------------------------
async function actualizarBadgeCarrito() {
  const carrito = await window.DulceDB.obtenerCarrito();
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  document.querySelector('.btn-carrito .badge').textContent = totalItems;
}

async function renderizarCarrito() {
  const lista = document.getElementById('lista-carrito');
  const carrito = await window.DulceDB.obtenerCarrito();

  if (carrito.length === 0) {
    lista.innerHTML = `<div class="carrito-vacio">Tu pedido está vacío.<br>Agrega productos desde el catálogo.</div>`;
    const vacio = formatoTripleMoneda(0);
    document.getElementById('monto-total-carrito').textContent = vacio.principal;
    document.getElementById('monto-total-secundario').textContent = '';
    document.getElementById('btn-enviar-pedido').disabled = true;
    return;
  }

  lista.innerHTML = '';
  let totalPEN = 0;

  carrito.forEach((item) => {
    const subtotalPEN = item.precioReferencialPEN * item.cantidad;
    totalPEN += subtotalPEN;
    const precios = formatoTripleMoneda(subtotalPEN);

    const fila = document.createElement('div');
    fila.className = 'item-carrito';
    fila.innerHTML = `
      <div class="info-item">
        <h4>${item.nombre}</h4>
        <div class="subtotal">${precios.principal}</div>
        <div class="subtotal-secundaria">${precios.secundaria}</div>
        <button type="button" class="quitar">Quitar</button>
      </div>
      <div class="stepper">
        <button type="button" class="menos" aria-label="Quitar unidad">−</button>
        <span class="cantidad">${item.cantidad}</span>
        <button type="button" class="mas" aria-label="Agregar unidad">+</button>
      </div>
    `;

    fila.querySelector('.menos').addEventListener('click', async () => {
      await window.DulceDB.actualizarCantidadCarrito(item.id, item.cantidad - 1);
      await actualizarBadgeCarrito();
      renderizarCarrito();
    });
    fila.querySelector('.mas').addEventListener('click', async () => {
      await window.DulceDB.actualizarCantidadCarrito(item.id, item.cantidad + 1);
      await actualizarBadgeCarrito();
      renderizarCarrito();
    });
    fila.querySelector('.quitar').addEventListener('click', async () => {
      await window.DulceDB.eliminarDelCarrito(item.id);
      await actualizarBadgeCarrito();
      renderizarCarrito();
    });

    lista.appendChild(fila);
  });

  const totales = formatoTripleMoneda(totalPEN);
  document.getElementById('monto-total-carrito').textContent = totales.principal;
  document.getElementById('monto-total-secundario').textContent = totales.secundaria;
  document.getElementById('btn-enviar-pedido').disabled = false;
}

function abrirCarrito() {
  document.getElementById('overlay-carrito').classList.add('abierto');
  document.getElementById('panel-carrito').classList.add('abierto');
  renderizarCarrito();
}

function cerrarCarrito() {
  document.getElementById('overlay-carrito').classList.remove('abierto');
  document.getElementById('panel-carrito').classList.remove('abierto');
}

async function enviarPedidoPorWhatsApp() {
  const carrito = await window.DulceDB.obtenerCarrito();
  if (carrito.length === 0) return;

  let totalPEN = 0;
  const lineas = carrito.map((item) => {
    totalPEN += item.precioReferencialPEN * item.cantidad;
    return `• ${item.nombre} x${item.cantidad}`;
  });

  const totales = formatoTripleMoneda(totalPEN);
  const totalTexto = `${totales.principal} (${totales.secundaria})`;
  const mensaje = `¡Hola! Quisiera hacer este pedido en Dulce Encanto Pastelería:\n\n${lineas.join('\n')}\n\nTotal referencial: ${totalTexto}\n\n¿Podrían confirmarme disponibilidad y tiempo de entrega?`;

  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');

  await window.DulceDB.guardarPedido({
    items: carrito,
    totalPEN,
  });
  await window.DulceDB.vaciarCarrito();
  await actualizarBadgeCarrito();
  renderizarCarrito();
  renderizarHistorial();
  mostrarToast('Pedido enviado. ¡Gracias por tu compra!');
}

async function renderizarHistorial() {
  const contenedor = document.getElementById('historial-lista');
  const pedidos = await window.DulceDB.obtenerPedidos();

  if (pedidos.length === 0) {
    contenedor.innerHTML = `<div class="fila">Aún no hay pedidos guardados.</div>`;
    return;
  }

  contenedor.innerHTML = pedidos
    .slice(0, 8)
    .map((pedido) => {
      const fecha = new Date(pedido.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      const items = pedido.items.reduce((acc, i) => acc + i.cantidad, 0);
      return `<div class="fila"><span>${fecha}</span><span>${items} art. · S/ ${pedido.totalPEN.toFixed(2)}</span></div>`;
    })
    .join('');
}

// ------------------------------------------------------------
// TOAST
// ------------------------------------------------------------
let toastTimeout;
function mostrarToast(texto) {
  const toast = document.getElementById('toast');
  toast.textContent = texto;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2600);
}

// ------------------------------------------------------------
// SCROLL / NAVEGACIÓN
// ------------------------------------------------------------
function configurarScrollYNav() {
  const btnInicio = document.getElementById('btnInicio');
  window.addEventListener('scroll', () => {
    btnInicio.classList.toggle('visible', window.pageYOffset > 400);
  });
  btnInicio.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  document.querySelectorAll('nav a').forEach((enlace) => {
    enlace.addEventListener('click', (evento) => {
      const destinoId = enlace.getAttribute('href');
      const destino = document.querySelector(destinoId);
      if (!destino) return;
      evento.preventDefault();
      const alturaBarra = document.querySelector('.barra-utilidad').offsetHeight;
      const posicion = destino.getBoundingClientRect().top + window.pageYOffset - alturaBarra - 12;
      window.scrollTo({ top: posicion, behavior: 'smooth' });
    });
  });
}

// ------------------------------------------------------------
// INICIALIZACIÓN
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  iniciarCarruselHero();
  renderizarCatalogo();
  configurarScrollYNav();
  await actualizarBadgeCarrito();
  cargarTiposDeCambio(); // consulta la API una sola vez y luego actualiza US$ y € en cada tarjeta

  document.getElementById('campo-busqueda').addEventListener('input', renderizarCatalogo);

  document.querySelector('.btn-carrito').addEventListener('click', abrirCarrito);
  document.getElementById('cerrar-panel').addEventListener('click', cerrarCarrito);
  document.getElementById('overlay-carrito').addEventListener('click', cerrarCarrito);
  document.getElementById('btn-enviar-pedido').addEventListener('click', enviarPedidoPorWhatsApp);

  document.getElementById('historial-toggle').addEventListener('click', () => {
    const lista = document.getElementById('historial-lista');
    const abierto = lista.style.display === 'block';
    lista.style.display = abierto ? 'none' : 'block';
    if (!abierto) renderizarHistorial();
  });
});
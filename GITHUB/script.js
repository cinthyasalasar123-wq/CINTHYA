// ========== EFECTO ESPECIAL: MARIPOSAS Y PÉTALOS DE COLORES CAYENDO ==========
const coloresPetalos = ['#ff3366', '#ff99bb', '#ffd700', '#ba55d3', '#ff66b2', '#ffffff', '#c41e3a'];

function crearMariposa() {
  const container = document.getElementById('efectoCaida');
  if (!container) return;

  const mariposa = document.createElement('div');
  mariposa.classList.add('mariposa');
  mariposa.textContent = '🦋';

  // Tono de color aleatorio (rosados, morados, rojos) usando filtro hue-rotate
  const tonos = [0, 40, 90, 140, 200, 260, 300];
  const tono = tonos[Math.floor(Math.random() * tonos.length)];

  // Posición inicial aleatoria a lo ancho de la pantalla
  mariposa.style.left = Math.random() * 100 + 'vw';

  // Duración, tamaño y retraso aleatorios para dar profundidad natural
  const duracion = Math.random() * 5 + 5; // Entre 5 y 10 segundos
  const escala = Math.random() * 0.8 + 0.7;
  const retraso = Math.random() * 2;

  mariposa.style.animationDuration = `${duracion}s, 0.6s`;
  mariposa.style.animationDelay = `${retraso}s, 0s`;
  mariposa.style.fontSize = (1.2 * escala) + 'rem';
  mariposa.style.filter = `hue-rotate(${tono}deg) drop-shadow(0 2px 4px rgba(196, 30, 58, 0.25))`;

  container.appendChild(mariposa);

  setTimeout(() => {
    mariposa.remove();
  }, (duracion + retraso) * 1000);
}

function crearPetalo() {
  const container = document.getElementById('efectoCaida');
  if (!container) return;

  const petalo = document.createElement('div');
  petalo.classList.add('caida-elemento', 'petalo-color');
  petalo.style.background = coloresPetalos[Math.floor(Math.random() * coloresPetalos.length)];

  petalo.style.left = Math.random() * 100 + 'vw';

  const duracion = Math.random() * 4 + 4; // Entre 4 y 8 segundos
  const escala = Math.random() * 0.8 + 0.6;
  const retraso = Math.random() * 2;

  petalo.style.animationDuration = duracion + 's';
  petalo.style.animationDelay = retraso + 's';
  petalo.style.transform = `scale(${escala})`;

  container.appendChild(petalo);

  setTimeout(() => {
    petalo.remove();
  }, (duracion + retraso) * 1000);
}

// Generar mariposas y pétalos de colores de forma constante y mezclada
setInterval(crearMariposa, 500);
setInterval(crearPetalo, 300);


// ========== CARRUSEL PRINCIPAL (HERO) ==========
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-item');
const indicators = document.querySelectorAll('.indicator');
const totalSlides = slides.length;
let autoSlideInterval;

function showSlide(index) {
  if (index >= totalSlides) currentSlide = 0;
  else if (index < 0) currentSlide = totalSlides - 1;
  else currentSlide = index;

  const offset = -currentSlide * 100;
  const inner = document.querySelector('.carousel-inner');
  if (inner) {
    inner.style.transform = `translateX(${offset}%)`;
  }

  indicators.forEach((ind, i) => {
    ind.classList.toggle('active', i === currentSlide);
  });
}

function nextSlide() {
  showSlide(currentSlide + 1);
  resetAutoSlide();
}

function previousSlide() {
  showSlide(currentSlide - 1);
  resetAutoSlide();
}

function goToSlide(index) {
  showSlide(index);
  resetAutoSlide();
}

function startAutoSlide() {
  autoSlideInterval = setInterval(() => {
    nextSlide();
  }, 5000);
}

function resetAutoSlide() {
  clearInterval(autoSlideInterval);
  startAutoSlide();
}

if (slides.length > 0) {
  startAutoSlide();
}

// ========== BOTÓN FLOTANTE Y NAVEGACIÓN SUAVE ==========
const btnInicio = document.getElementById('btnInicio');

window.addEventListener('scroll', () => {
  if (btnInicio) {
    if (window.pageYOffset > 300) {
      btnInicio.classList.add('visible');
    } else {
      btnInicio.classList.remove('visible');
    }
  }
});

function irAlInicio() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

document.querySelectorAll('nav a').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const target = document.querySelector(targetId);

    if (target) {
      const navHeight = document.querySelector('nav').offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ========== CARRUSELES DE TARJETAS (CARDS) ==========
const cardCarousels = new Map();

function changeCardSlide(button, direction) {
  const card = button.closest('.card');
  changeCardSlideLogic(card, direction);
  resetCardAutoPlay(card);
}

function changeCardSlideLogic(card, direction) {
  const carousel = card.querySelector('.card-carousel');
  const inner = carousel.querySelector('.card-carousel-inner');
  const items = carousel.querySelectorAll('.card-carousel-item');
  const dots = carousel.querySelectorAll('.card-carousel-dot');
  const infoItems = card.querySelectorAll('.card-info-item');
  const totalItems = items.length;

  if (totalItems <= 1) return;

  let currentIndex = 0;
  dots.forEach((dot, index) => {
    if (dot.classList.contains('active')) currentIndex = index;
  });

  let newIndex = currentIndex + direction;
  if (newIndex >= totalItems) newIndex = 0;
  if (newIndex < 0) newIndex = totalItems - 1;

  const offset = -newIndex * 100;
  inner.style.transform = `translateX(${offset}%)`;

  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === newIndex);
  });

  infoItems.forEach((info, index) => {
    info.classList.toggle('active', index === newIndex);
  });
}

function startCardAutoPlay(card) {
  const items = card.querySelectorAll('.card-carousel-item');
  if (items.length > 1) {
    const interval = setInterval(() => {
      changeCardSlideLogic(card, 1);
    }, 4000);
    cardCarousels.set(card, interval);
  }
}

function stopCardAutoPlay(card) {
  if (cardCarousels.has(card)) {
    clearInterval(cardCarousels.get(card));
    cardCarousels.delete(card);
  }
}

function resetCardAutoPlay(card) {
  stopCardAutoPlay(card);
  startCardAutoPlay(card);
}

document.addEventListener('DOMContentLoaded', () => {
  const allCards = document.querySelectorAll('.card');
  allCards.forEach(card => {
    startCardAutoPlay(card);
    card.addEventListener('mouseenter', () => stopCardAutoPlay(card));
    card.addEventListener('mouseleave', () => startCardAutoPlay(card));
  });
});

// ========== WHATSAPP INTEGRATION ==========
function enviarWhatsApp(event, nombreProducto, precio) {
  event.preventDefault();
  const numeroWhatsApp = '51968135439';
  const mensaje = `¡Hola! Me interesa el producto: *${nombreProducto}* (${precio}). ¿Podrían darme mayor información y disponibilidad?`;
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  window.open(urlWhatsApp, '_blank');
}
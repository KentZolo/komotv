const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const SERVERS = [
  {
    name: 'Apimocine (No Ads)',
    id: 'apimocine',
    url: (type, id) => `https://apimocine.vercel.app/${type}/${id}?autoplay=true`
  },
  {
    name: 'Vidsrc.to',
    id: 'vidsrc',
    url: (type, id) => `https://vidsrc.to/embed/${type}/${id}`
  },
  {
    name: 'Vidsrc.cc',
    id: 'vidsrccc',
    url: (type, id) => `https://vidsrc.cc/v2/embed/${type}/${id}`
  }
];

// DOM Elements
const searchBtn = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');

// Initialize Swipers
function initSwipers() {
  const swiperOptions = {
    slidesPerView: 2,
    spaceBetween: 10,
    breakpoints: {
      640: { slidesPerView: 3 },
      768: { slidesPerView: 4 },
      1024: { slidesPerView: 6 }
    }
  };

  new Swiper('.trending-swiper', swiperOptions);
  new Swiper('.movie-swiper', swiperOptions);
  new Swiper('.tv-swiper', swiperOptions);
}

// Banner Slider
let bannerIndex = 0;
let bannerItems = [];

async function loadBannerSlider() {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch banner data');
    const data = await res.json();
    bannerItems = data.results.slice(0, 10);
    showBannerSlide(bannerIndex);
    
    // Add event listeners after loading
    document.querySelector('.prev').addEventListener('click', prevSlide);
    document.querySelector('.next').addEventListener('click', nextSlide);
  } catch (error) {
    console.error('Banner error:', error);
  }
}

function showBannerSlide(index) {
  const item = bannerItems[index];
  if (!item) return;

  const img = document.getElementById('poster-img');
  const meta = document.getElementById('poster-meta');
  const summary = document.getElementById('poster-summary');

  img.src = IMG_BASE + (item.backdrop_path || item.poster_path);
  img.alt = item.title;
  img.dataset.id = item.id;
  img.dataset.title = item.title;
  img.dataset.type = 'movie';

  meta.textContent = `⭐ ${item.vote_average.toFixed(1)} · 🎬 Movie · ${item.release_date?.slice(0, 4) || ''}`;
  summary.textContent = item.title;
}

function prevSlide() {
  bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

function nextSlide() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

// Fetch and display media
async function fetchAndDisplay(endpoint, containerSelector, type) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch media');
    const data = await res.json();
    displayMedia(data.results, containerSelector, type);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

function displayMedia(items, containerSelector, defaultType) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = items.map(item => {
    const id = item.id;
    const title = item.title || item.name;
    const poster = item.poster_path ? IMG_BASE + item.poster_path : 'placeholder.jpg';
    const mediaType = item.media_type || defaultType;

    return `
      <div class="swiper-slide poster-wrapper">
        <img src="${poster}" alt="${title}" 
             data-id="${id}" 
             data-title="${title}" 
             data-type="${mediaType}">
        <div class="poster-label">${title}</div>
      </div>
    `;
  }).join('');

  // Add click events to all posters
  document.querySelectorAll('.poster-wrapper img').forEach(img => {
    img.addEventListener('click', () => {
      openPlayer(
        img.dataset.id,
        img.dataset.title,
        img.dataset.type
      );
    });
  });
}

// Video Player Modal
function openPlayer(itemId, title, mediaType) {
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  // Disable body scrolling
  document.body.style.overflow = 'hidden';

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">×</span>
      <label style="color:white;">Server:</label>
      <select id="server-select"></select>
      <div class="iframe-shield"></div>
      <iframe id="player-frame" allowfullscreen></iframe>
    </div>
  `;

  document.body.appendChild(modal);

  // Add server options
  const select = modal.querySelector('#server-select');
  SERVERS.forEach(server => {
    const option = document.createElement('option');
    option.value = server.id;
    option.textContent = server.name;
    select.appendChild(option);
  });

  // Load first server by default
  loadServer(0);

  function loadServer(index) {
    const server = SERVERS[index];
    select.value = server.id;
    const iframe = modal.querySelector('#player-frame');
    iframe.src = server.url(mediaType, itemId);

    // Show loading shield
    const shield = modal.querySelector('.iframe-shield');
    shield.style.display = 'block';
    setTimeout(() => shield.style.display = 'none', 3000);

    // Fallback to next server if error
    iframe.onerror = () => {
      if (index + 1 < SERVERS.length) {
        loadServer(index + 1);
      } else {
        alert('No working server found. Please try again later.');
      }
    };
  }

  // Server change handler
  select.addEventListener('change', () => {
    const selectedServer = SERVERS.find(s => s.id === select.value);
    if (selectedServer) {
      modal.querySelector('#player-frame').src = selectedServer.url(mediaType, itemId);
    }
  });

  // Close handlers
  modal.querySelector('.close-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    document.body.style.overflow = '';
    modal.remove();
  }
}

// Search functionality
if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query.length > 1) {
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
  });
}

// Initialize everything
window.addEventListener('DOMContentLoaded', () => {
  loadBannerSlider();
  
  Promise.all([
    fetchAndDisplay('/trending/all/day', '.movie-list', 'movie'),
    fetchAndDisplay('/movie/popular', '.popular-list', 'movie'),
    fetchAndDisplay('/tv/popular', '.tv-list', 'tv')
  ]).then(initSwipers);
});

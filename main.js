const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_IMAGE = 'https://via.placeholder.com/500x750?text=No+Poster';

// Helper function for image URLs
function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop 
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner' 
      : FALLBACK_IMAGE;
  }
  return `${IMG_BASE}${path}`;
}

// DOM Elements
const searchBtn = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');

// Banner Slider
let bannerIndex = 0;
let bannerItems = [];

async function loadBannerSlider() {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    
    const data = await res.json();
    bannerItems = data.results.slice(0, 10);
    
    if (bannerItems.length > 0) {
      showBannerSlide(bannerIndex);
      
      // Add event listeners
      document.querySelector('.prev').addEventListener('click', prevSlide);
      document.querySelector('.next').addEventListener('click', nextSlide);
    }
  } catch (error) {
    console.error('Banner error:', error);
    document.getElementById('poster-summary').textContent = "Failed to load featured content";
  }
}

function showBannerSlide(index) {
  const item = bannerItems[index];
  const img = document.getElementById('poster-img');
  
  img.src = getImageUrl(item.backdrop_path, true);
  img.onload = () => img.style.animation = 'none';
  img.alt = item.title;
  img.dataset.id = item.id;
  img.dataset.title = item.title;
  img.dataset.type = 'movie';

  document.getElementById('poster-meta').textContent = 
    `⭐ ${item.vote_average?.toFixed(1) || 'N/A'} · 🎬 Movie · ${item.release_date?.slice(0, 4) || ''}`;
  
  document.getElementById('poster-summary').textContent = item.title;
}

function prevSlide() {
  bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

function nextSlide() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

// Load and display media content
async function fetchAndDisplay(endpoint, containerSelector, type) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    
    const data = await res.json();
    displayMedia(data.results, containerSelector, type);
  } catch (error) {
    console.error(`Failed to load ${type}:`, error);
    const container = document.querySelector(containerSelector);
    if (container) {
      container.innerHTML = `<div class="error">Failed to load content</div>`;
    }
  }
}

function displayMedia(items, containerSelector, defaultType) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = items.map(item => {
    return `
      <div class="swiper-slide poster-wrapper">
        <img src="${getImageUrl(item.poster_path)}" 
             alt="${item.title || item.name}" 
             data-id="${item.id}"
             data-title="${item.title || item.name}"
             data-type="${item.media_type || defaultType}"
             onload="this.style.animation='none'">
        <div class="poster-label">${item.title || item.name}</div>
      </div>
    `;
  }).join('');

  // Add click events
  container.querySelectorAll('.poster-wrapper').forEach(poster => {
    poster.addEventListener('click', () => {
      const img = poster.querySelector('img');
      openPlayer(img.dataset.id, img.dataset.title, img.dataset.type);
    });
  });
}

// Video Player Modal
function openPlayer(itemId, title, mediaType) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  document.body.style.overflow = 'hidden';

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">×</span>
      <label style="color:white;">Server:</label>
      <select id="server-select"></select>
      <div class="iframe-shield">Loading...</div>
      <iframe id="player-frame" allowfullscreen></iframe>
    </div>
  `;

  document.body.appendChild(modal);

  // Server selection
  const select = modal.querySelector('#server-select');
  const servers = [
    { id: 'apimocine', name: 'Apimocine', url: (t, id) => `https://apimocine.vercel.app/${t}/${id}?autoplay=true` },
    { id: 'vidsrc', name: 'Vidsrc.to', url: (t, id) => `https://vidsrc.to/embed/${t}/${id}` },
    { id: 'vidsrccc', name: 'Vidsrc.cc', url: (t, id) => `https://vidsrc.cc/v2/embed/${t}/${id}` }
  ];

  servers.forEach(server => {
    const option = document.createElement('option');
    option.value = server.id;
    option.textContent = server.name;
    select.appendChild(option);
  });

  // Load first server
  loadServer(0);

  function loadServer(index) {
    const server = servers[index];
    select.value = server.id;
    const iframe = modal.querySelector('#player-frame');
    iframe.src = server.url(mediaType, itemId);

    const shield = modal.querySelector('.iframe-shield');
    shield.style.display = 'block';
    setTimeout(() => shield.style.display = 'none', 3000);

    iframe.onerror = () => {
      if (index + 1 < servers.length) loadServer(index + 1);
      else shield.textContent = 'Failed to load video';
    };
  }

  // Close handlers
  modal.querySelector('.close-btn').addEventListener('click', () => {
    document.body.style.overflow = '';
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.style.overflow = '';
      modal.remove();
    }
  });
}

// Initialize Swipers
function initSwipers() {
  const options = {
    slidesPerView: 2,
    spaceBetween: 10,
    breakpoints: {
      640: { slidesPerView: 3 },
      768: { slidesPerView: 4 },
      1024: { slidesPerView: 6 }
    }
  };

  new Swiper('.trending-swiper', options);
  new Swiper('.movie-swiper', options);
  new Swiper('.tv-swiper', options);
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

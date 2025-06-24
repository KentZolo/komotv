const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_IMAGE = 'https://via.placeholder.com/500x750?text=No+Poster';

function getImageUrl(path, isBackdrop = false) {
  if (!path) {
    return isBackdrop
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
      : FALLBACK_IMAGE;
  }
  return `${IMG_BASE}${path}`;
}

let bannerIndex = 0;
let bannerItems = [];

async function loadBannerSlider() {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    const data = await res.json();
    bannerItems = data.results.slice(0, 10);
    if (bannerItems.length > 0) {
      showBannerSlide(bannerIndex);
      document.querySelector('.prev').addEventListener('click', prevSlide);
      document.querySelector('.next').addEventListener('click', nextSlide);
    }
  } catch (err) {
    console.error('Banner error:', err);
    document.getElementById('poster-summary').textContent = 'Failed to load banner.';
  }
}

function showBannerSlide(index) {
  const item = bannerItems[index];
  const img = document.getElementById('poster-img');
  img.src = getImageUrl(item.backdrop_path, true);
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

async function fetchAndDisplay(endpoint, containerSelector, type) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    const data = await res.json();
    displayMedia(data.results, containerSelector, type);
  } catch (err) {
    console.error(`Failed to load ${type}:`, err);
  }
}

function displayMedia(items, containerSelector, defaultType) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = items.map(item => {
    const title = item.title || item.name;
    const posterPath = item.poster_path || item.backdrop_path;
    const imageUrl = getImageUrl(posterPath);
    return `
      <div class="swiper-slide poster-wrapper">
        <img src="${imageUrl}" 
             alt="${title}" 
             data-id="${item.id}" 
             data-title="${title}" 
             data-type="${item.media_type || defaultType}">
        <div class="poster-label">${title}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.poster-wrapper').forEach(poster => {
    poster.addEventListener('click', () => {
      const img = poster.querySelector('img');
      openPlayer(img.dataset.id, img.dataset.title, img.dataset.type);
    });
  });
}

function openPlayer(itemId, title, mediaType) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  document.body.style.overflow = 'hidden';

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">×</span>
      <h3>${title}</h3>
      <label>Server:</label>
      <select id="server-select"></select>
      <div class="iframe-shield">Loading player...</div>
      <iframe id="player-frame" allowfullscreen></iframe>
    </div>
  `;
  document.body.appendChild(modal);

  const servers = [
    { id: 'apimocine', name: 'Apimocine', url: (t, id) => `https://apimocine.vercel.app/${t}/${id}?autoplay=true` },
    { id: 'vidsrc', name: 'Vidsrc.to', url: (t, id) => `https://vidsrc.to/embed/${t}/${id}` },
    { id: 'vidsrccc', name: 'Vidsrc.cc', url: (t, id) => `https://vidsrc.cc/v2/embed/${t}/${id}` }
  ];

  const select = modal.querySelector('#server-select');
  servers.forEach(server => {
    const option = document.createElement('option');
    option.value = server.id;
    option.textContent = server.name;
    select.appendChild(option);
  });

  function loadServer(index) {
    const server = servers[index];
    select.value = server.id;
    const iframe = modal.querySelector('#player-frame');
    iframe.src = server.url(mediaType, itemId);

    const shield = modal.querySelector('.iframe-shield');
    shield.style.display = 'block';
    setTimeout(() => shield.style.display = 'none', 3000);

    iframe.onerror = () => {
      if (index + 1 < servers.length) {
        loadServer(index + 1);
      } else {
        shield.textContent = 'No working server found.';
      }
    };
  }

  loadServer(0);

  select.addEventListener('change', () => {
    const selected = servers.find(s => s.id === select.value);
    if (selected) {
      modal.querySelector('#player-frame').src = selected.url(mediaType, itemId);
    }
  });

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
  new Swiper('.genre-swiper', options);
}

function setupSearchRedirect() {
  const searchBtn = document.getElementById('search-button');
  const searchInput = document.getElementById('search-input');

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
}

function toggleMenu() {
  const toggle = document.getElementById('menu-toggle');
  const panel = document.getElementById('menu-panel');

  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });
  }
}

async function loadGenres() {
  const container = document.getElementById('genre-buttons');
  if (!container) return;

  try {
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    const data = await res.json();
    const genres = data.genres;

    // Generate genre buttons
    container.innerHTML = genres.map(genre => `
      <button class="genre-btn" data-id="${genre.id}">${genre.name}</button>
    `).join('');

    // Add event listeners to buttons
    document.querySelectorAll('.genre-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const genreId = btn.dataset.id;
        const genreName = btn.textContent.trim();
        window.location.href = `genre.html?genre=${encodeURIComponent(genreName)}&id=${genreId}`;
      });
    });

  } catch (err) {
    console.error('Failed to load genres:', err);
  }
}

  } catch (err) {
    console.error('Failed to load genres:', err);
  }
}

async function loadByGenre(genreId) {
  const container = document.getElementById('genre-results');
  if (!container) return;

  const section = document.querySelector('.genre-section');
  if (section) section.classList.add('active');
  
  container.innerHTML = '<p>Loading...</p>';

  let url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc`;
  if (genreId) url += `&with_genres=${genreId}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    displayMedia(data.results, '#genre-results', 'movie');
  } catch (err) {
    console.error('Failed to load by genre:', err);
    container.innerHTML = '<p>Failed to load genre movies.</p>';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  toggleMenu();
  setupSearchRedirect();
  loadBannerSlider();
  loadGenres();
  fetchAndDisplay('/trending/all/day', '.movie-list', 'movie');
  fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
  fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
  initSwipers();
});
            

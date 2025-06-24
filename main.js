const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_IMAGE = 'https://via.placeholder.com/500x750?text=No+Poster';

function getImageUrl(path, isBackdrop = false) {
  return path
    ? `${IMG_BASE}${path}`
    : (isBackdrop
      ? 'https://via.placeholder.com/1920x1080?text=No+Banner'
      : FALLBACK_IMAGE);
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
    const imageUrl = getImageUrl(item.poster_path || item.backdrop_path);
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
      const id = img.dataset.id;
      const type = img.dataset.type;
      window.location.href = `poster.html?id=${id}&type=${type}`;
    });
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

    container.innerHTML = genres.map(genre => `
      <button class="genre-btn" data-id="${genre.id}">${genre.name}</button>
    `).join('');

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

window.addEventListener('DOMContentLoaded', () => {
  toggleMenu();
  setupSearchRedirect();
  loadGenres();
  loadBannerSlider();
  fetchAndDisplay('/trending/all/day', '.movie-list', 'movie');
  fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
  fetchAndDisplay('/tv/popular', '.tv-list', 'tv');
  initSwipers();
});

const API_KEY = '77312bdd4669c80af3d08e0bf719d7ff';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_IMAGE = 'https://via.placeholder.com/500x750?text=No+Poster';

// Initialize with error handling
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Load banner first
    await loadBannerSlider();
    
    // Then load other content
    await Promise.all([
      fetchAndDisplay('/trending/all/day', '.movie-list', 'movie'),
      fetchAndDisplay('/movie/popular', '.popular-list', 'movie'),
      fetchAndDisplay('/tv/popular', '.tv-list', 'tv')
    ]);
    
    // Initialize swipers after content loads
    initSwipers();
  } catch (error) {
    console.error("Initialization failed:", error);
    alert("Failed to load content. Please try again later.");
  }
});

async function loadBannerSlider() {
  try {
    const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      throw new Error("No movies found");
    }
    
    bannerItems = data.results.slice(0, 10);
    showBannerSlide(bannerIndex);
    
    // Add event listeners
    document.querySelector('.prev').addEventListener('click', prevSlide);
    document.querySelector('.next').addEventListener('click', nextSlide);
    
  } catch (error) {
    console.error("Banner error:", error);
    // Fallback banner
    document.getElementById('poster-img').src = 'https://via.placeholder.com/1920x1080?text=Banner+Error';
    document.getElementById('poster-summary').textContent = "Failed to load featured content";
  }
}

function showBannerSlide(index) {
  const item = bannerItems[index];
  const img = document.getElementById('poster-img');
  
  // Use backdrop if available, otherwise poster, otherwise fallback
  img.src = item.backdrop_path 
    ? IMG_BASE + item.backdrop_path
    : item.poster_path
      ? IMG_BASE + item.poster_path
      : FALLBACK_IMAGE;
  
  img.alt = item.title;
  img.dataset.id = item.id;
  img.dataset.title = item.title;
  img.dataset.type = 'movie';

  document.getElementById('poster-meta').textContent = 
    `⭐ ${item.vote_average?.toFixed(1) || 'N/A'} · 🎬 Movie · ${item.release_date?.slice(0, 4) || ''}`;
  
  document.getElementById('poster-summary').textContent = item.title;
}

async function fetchAndDisplay(endpoint, containerSelector, type) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      throw new Error("No results found");
    }
    
    displayMedia(data.results, containerSelector, type);
  } catch (error) {
    console.error(`Failed to load ${type}:`, error);
    // Show error message in container
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
    const posterPath = item.poster_path 
      ? IMG_BASE + item.poster_path
      : FALLBACK_IMAGE;
    
    return `
      <div class="swiper-slide poster-wrapper">
        <img src="${posterPath}" 
             alt="${item.title || item.name}" 
             data-id="${item.id}"
             data-title="${item.title || item.name}"
             data-type="${item.media_type || defaultType}">
        <div class="poster-label">${item.title || item.name}</div>
      </div>
    `;
  }).join('');
}

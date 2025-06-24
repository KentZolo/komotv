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

// ----------------------
// Featured Poster Logic
// ----------------------
let bannerIndex = 0;
let bannerItems = [];

async function loadBannerSlider() {
  const res = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}`);
  const data = await res.json();
  bannerItems = data.results.slice(0, 10); // top 10 now playing
  showBannerSlide(bannerIndex);
}

function showBannerSlide(index) {
  const item = bannerItems[index];
  if (!item) return;

  const img = document.getElementById('poster-img');
  const meta = document.getElementById('poster-meta');
  const title = document.getElementById('poster-title');

  img.src = IMG_BASE + (item.backdrop_path || item.poster_path);
  img.setAttribute('data-id', item.id);
  img.setAttribute('data-title', item.title);
  img.setAttribute('data-type', 'movie');

  title.textContent = item.title;
  meta.textContent = `⭐ ${item.vote_average.toFixed(1)} · 🎬 Movie · ${item.release_date?.slice(0, 4) || ''}`;
}

function prevSlide() {
  bannerIndex = (bannerIndex - 1 + bannerItems.length) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

function nextSlide() {
  bannerIndex = (bannerIndex + 1) % bannerItems.length;
  showBannerSlide(bannerIndex);
}

// Poster click = open player
document.addEventListener('click', e => {
  if (e.target.id === 'poster-img') {
    const id = e.target.getAttribute('data-id');
    const title = e.target.getAttribute('data-title');
    const type = e.target.getAttribute('data-type');
    openPlayer(id, title, type);
  }
});
 // ✅ Load banner slider
  loadBannerSlider();

async function fetchAndDisplay(endpoint, containerSelector, type) {
  const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
  const data = await res.json();
  displayMedia(data.results, containerSelector, type);
}

function displayMedia(items, containerSelector, defaultType) {
  const container = document.querySelector(containerSelector);
  container.innerHTML = '';

  items.forEach(item => {
    const id = item.id;
    const title = item.title || item.name;
    const poster = item.poster_path ? IMG_BASE + item.poster_path : '';
    const mediaType = item.media_type || defaultType;

    const card = document.createElement('div');
    card.classList.add('swiper-slide', 'poster-wrapper');
    card.innerHTML = `
      <img src="${poster}" alt="${title}" style="cursor:pointer;" data-id="${id}" data-title="${title}" data-type="${mediaType}" />
      <div class="poster-label">${title}</div>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll('.poster-wrapper img').forEach(img => {
    img.addEventListener('click', () => {
      const id = img.getAttribute('data-id');
      const title = img.getAttribute('data-title');
      const type = img.getAttribute('data-type');
      openPlayer(id, title, type);
    });
  });
}

// ----------------------
// Video Player Modal
// ----------------------

function openPlayer(itemId, title, mediaType) {
  const modal = document.createElement('div');
  modal.classList.add('modal');

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn">×</span>
      <label style="color:white;">Change Server:</label>
      <select id="server-select"></select>
      <div class="iframe-shield"></div>
      <iframe id="player-frame" width="100%" height="500" frameborder="0" allowfullscreen sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
  `;

  document.body.appendChild(modal);

  const iframe = modal.querySelector('#player-frame');
  const select = modal.querySelector('#server-select');

  SERVERS.forEach(server => {
    const option = document.createElement('option');
    option.value = server.id;
    option.textContent = server.name;
    select.appendChild(option);
  });

  function loadServer(index) {
    const server = SERVERS[index];
    select.value = server.id;
    const url = server.url(mediaType, itemId);
    iframe.src = url;

    const shield = modal.querySelector('.iframe-shield');
    shield.style.display = 'block';
    setTimeout(() => shield.remove(), 5000);

    iframe.onerror = () => {
      if (index + 1 < SERVERS.length) loadServer(index + 1);
      else alert('⚠️ No working server found.');
    };
  }

  loadServer(0);

  modal.querySelector('.close-btn').onclick = () => modal.remove();
  select.onchange = () => {
    const i = SERVERS.findIndex(s => s.id === select.value);
    if (i !== -1) loadServer(i);
  };
}

// ----------------------
// Search Redirect
// ----------------------

if (document.getElementById('search-button')) {
  document.getElementById('search-button').addEventListener('click', () => {
    const q = document.getElementById('search-input').value.trim();
    if (q.length > 1) {
      window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    }
  });
}

// ----------------------
// Init on Page Load
// ----------------------

window.addEventListener('DOMContentLoaded', () => {
  fetchAndDisplay('/trending/all/day', '.movie-list', 'movie');
  fetchAndDisplay('/movie/popular', '.popular-list', 'movie');
  fetchAndDisplay('/tv/popular', '.tv-list', 'tv');

  new Swiper('.trending-swiper', {
    slidesPerView: 2,
    spaceBetween: 10,
    breakpoints: {
      640: { slidesPerView: 3 },
      768: { slidesPerView: 4 },
      1024: { slidesPerView: 6 }
    }
  });

  new Swiper('.movie-swiper', {
    slidesPerView: 2,
    spaceBetween: 10,
    breakpoints: {
      640: { slidesPerView: 3 },
      768: { slidesPerView: 4 },
      1024: { slidesPerView: 6 }
    }
  });

  new Swiper('.tv-swiper', {
    slidesPerView: 2,
    spaceBetween: 10,
    breakpoints: {
      640: { slidesPerView: 3 },
      768: { slidesPerView: 4 },
      1024: { slidesPerView: 6 }
    }
  });

  // ✅ Load Featured Poster (top section)
  loadFeaturedPosters();
});

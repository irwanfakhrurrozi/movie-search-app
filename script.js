const API_KEY = "41ee980e4b5f05f6693fda00eb7c4fd4";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_PATH = "https://image.tmdb.org/t/p/w500";

const ENDPOINTS = {
  discover: `${BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`,
  search: `${BASE_URL}/search/movie?api_key=${API_KEY}&query=`,
};

const $ = (id) => document.getElementById(id);

const main = $("section");
const form = $("form");
const searchInput = $("query");
const nextBtn = $("nextBtn");
const prevBtn = $("prevBtn");

let currentPage = 1;
let currentQuery = "";
let isSearchMode = false;
let totalPages = Infinity;
const cache = new Map();

// === Debounce Utility ===
function debounce(fn, delay = 500) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// === Load Initial Movies ===
document.addEventListener("DOMContentLoaded", () => {
  fetchAndRender(ENDPOINTS.discover, currentPage);
});

// === Input Debounced Search ===
searchInput.addEventListener(
  "input",
  debounce(() => {
    const term = searchInput.value.trim();
    if (term) {
      currentQuery = term;
      isSearchMode = true;
      currentPage = 1;
      fetchAndRender(`${ENDPOINTS.search}${encodeURIComponent(currentQuery)}`, currentPage);
    } else {
      isSearchMode = false;
      currentPage = 1;
      fetchAndRender(ENDPOINTS.discover, currentPage);
    }
  }, 600)
);

// === Pagination Events ===
nextBtn.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    const baseURL = isSearchMode
      ? `${ENDPOINTS.search}${encodeURIComponent(currentQuery)}`
      : ENDPOINTS.discover;
    fetchAndRender(baseURL, currentPage);
  }
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    const baseURL = isSearchMode
      ? `${ENDPOINTS.search}${encodeURIComponent(currentQuery)}`
      : ENDPOINTS.discover;
    fetchAndRender(baseURL, currentPage);
  }
});

// === Fetch + Cache + Render ===
async function fetchAndRender(baseURL, page = 1) {
  const url = baseURL.includes("page=")
    ? baseURL.replace(/page=\d+/, `page=${page}`)
    : `${baseURL}&page=${page}`;

  updatePaginationButtons();
  showSkeletonLoading();

  if (cache.has(url)) {
    const data = cache.get(url);
    totalPages = data.total_pages || Infinity;
    renderMovies(data.results);
    updatePaginationButtons();
    return;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");

    const data = await res.json();
    cache.set(url, data);
    totalPages = data.total_pages || Infinity;
    renderMovies(data.results);
    updatePaginationButtons();
  } catch (err) {
    console.error(err);
    main.innerHTML = `<p style="color:red; text-align:center;">Gagal mengambil data.</p>`;
  }
}

// === Skeleton Loading ===
function showSkeletonLoading() {
  main.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "card skeleton";
    skeleton.innerHTML = `
      <div style="background:#ccc; height:300px;"></div>
      <div class="card-content"><h3 style="background:#eee; height:1em; width:80%; margin:10px auto;"></h3></div>
    `;
    main.appendChild(skeleton);
  }
}

// === Efficient DOM Rendering ===
function renderMovies(movies) {
  main.innerHTML = "";

  if (!movies.length) {
    main.innerHTML = `<p style="color:orange; text-align:center;">Film tidak ditemukan.</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const { title, poster_path } of movies) {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "thumbnail";
    img.src = poster_path
      ? `${IMG_PATH}${poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Image";
    img.alt = title;

    const content = document.createElement("div");
    content.className = "card-content";

    const h3 = document.createElement("h3");
    h3.textContent = title;

    content.appendChild(h3);
    card.appendChild(img);
    card.appendChild(content);
    fragment.appendChild(card);
  }

  main.appendChild(fragment);
}

// === Pagination Control ===
function updatePaginationButtons() {
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

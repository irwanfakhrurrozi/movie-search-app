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
const cache = new Map();

// === Load Initial Movies ===
document.addEventListener("DOMContentLoaded", () => {
  fetchAndRender(ENDPOINTS.discover, currentPage);
});

// === Form Search ===
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const term = searchInput.value.trim();

  if (term) {
    currentQuery = term;
    isSearchMode = true;
    currentPage = 1;
    fetchAndRender(`${ENDPOINTS.search}${currentQuery}`, currentPage);
    searchInput.value = "";
    searchInput.focus();
  }
});

// === Pagination Events ===
nextBtn.addEventListener("click", () => {
  currentPage++;
  const baseURL = isSearchMode ? `${ENDPOINTS.search}${currentQuery}` : ENDPOINTS.discover;
  fetchAndRender(baseURL, currentPage);
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    const baseURL = isSearchMode ? `${ENDPOINTS.search}${currentQuery}` : ENDPOINTS.discover;
    fetchAndRender(baseURL, currentPage);
  }
});

// === Fetch + Cache + Render ===
async function fetchAndRender(baseURL, page = 1) {
  const url = baseURL.includes("page=")
    ? baseURL.replace(/page=\d+/, `page=${page}`)
    : `${baseURL}&page=${page}`;

  updatePaginationButtons();
  main.innerHTML = `<p style="text-align:center;">Loading...</p>`;

  if (cache.has(url)) {
    renderMovies(cache.get(url));
    return;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");

    const data = await res.json();
    cache.set(url, data.results);
    renderMovies(data.results);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<p style="color:red; text-align:center;">Gagal mengambil data.</p>`;
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

function updatePaginationButtons() {
  prevBtn.disabled = currentPage <= 1;
}

const anilistEndpoint = "https://graphql.anilist.co";
const jikanEndpoint = "https://api.jikan.moe/v4";

const topAnimeContainer = document.querySelector("#top-anime");
const topStatus = document.querySelector("#top-status");
const detailsContainer = document.querySelector("#details");
const animeForm = document.querySelector("#anime-search-form");
const characterForm = document.querySelector("#character-search-form");
const animeResults = document.querySelector("#anime-results");
const characterResults = document.querySelector("#character-results");
const cardTemplate = document.querySelector("#anime-card-template");

const cleanText = (html = "") => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function fetchAniList(query, variables) {
  const response = await fetch(anilistEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList error (${response.status})`);
  }

  const payload = await response.json();
  if (payload.errors) {
    throw new Error(payload.errors[0]?.message || "AniList query error");
  }

  return payload.data;
}

function renderTopCards(items) {
  topAnimeContainer.innerHTML = "";

  for (const anime of items) {
    const clone = cardTemplate.content.cloneNode(true);
    const card = clone.querySelector(".anime-card");
    const title = anime.title.romaji || anime.title.english;

    clone.querySelector(".cover").src = anime.coverImage.extraLarge || anime.coverImage.large;
    clone.querySelector(".cover").alt = `Portada de ${title}`;
    clone.querySelector("h3").textContent = title;
    clone.querySelector(".meta").textContent = `${anime.seasonYear || "N/A"} · ⭐ ${anime.averageScore || "?"}/100 · ${anime.episodes || "?"} eps`;
    clone.querySelector(".description").textContent = cleanText(anime.description).slice(0, 165);

    clone.querySelector(".open-details").addEventListener("click", () => renderDetails(anime));
    card.dataset.id = anime.id;
    topAnimeContainer.appendChild(clone);
  }
}

function renderDetails(anime) {
  const title = anime.title.romaji || anime.title.english;
  const genres = anime.genres?.join(", ") || "Sin datos";
  const studios = anime.studios?.nodes?.map((s) => s.name).join(", ") || "Sin datos";

  detailsContainer.innerHTML = `
    <img src="${anime.coverImage.extraLarge || anime.coverImage.large}" alt="${title}" />
    <div>
      <h3>${title}</h3>
      <p>${cleanText(anime.description)}</p>
      <ul>
        <li><strong>Estado:</strong> ${anime.status}</li>
        <li><strong>Capítulos:</strong> ${anime.episodes || "Desconocido"}</li>
        <li><strong>Puntuación:</strong> ${anime.averageScore || "Sin voto"}/100</li>
        <li><strong>Géneros:</strong> ${genres}</li>
        <li><strong>Estudio:</strong> ${studios}</li>
        <li><strong>Popularidad:</strong> #${anime.popularity || "N/A"}</li>
      </ul>
    </div>
  `;
  detailsContainer.classList.remove("hidden");
  detailsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadTopAnime() {
  topStatus.textContent = "Cargando top...";

  const query = `
    query {
      Page(page: 1, perPage: 10) {
        media(sort: [POPULARITY_DESC, SCORE_DESC], type: ANIME, isAdult: false) {
          id
          title { romaji english }
          description(asHtml: false)
          coverImage { large extraLarge }
          averageScore
          episodes
          seasonYear
          status
          genres
          popularity
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList(query, {});
    const topAnime = data.Page.media;
    renderTopCards(topAnime);
    topStatus.textContent = "Top actualizado";
  } catch (error) {
    topAnimeContainer.innerHTML = `<p>No se pudo cargar el top: ${error.message}</p>`;
    topStatus.textContent = "Error";
  }
}

animeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const queryText = document.querySelector("#anime-query").value.trim();
  if (!queryText) return;

  animeResults.innerHTML = "<p>Buscando...</p>";

  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 6) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          seasonYear
          averageScore
        }
      }
    }
  `;

  try {
    const data = await fetchAniList(query, { search: queryText });
    const results = data.Page.media;

    animeResults.innerHTML = results
      .map((item) => {
        const name = item.title.romaji || item.title.english;
        return `<div class="result-item"><strong>${name}</strong><br><small>${item.seasonYear || "N/A"} · ⭐ ${item.averageScore || "?"}/100</small></div>`;
      })
      .join("");

    if (!results.length) animeResults.innerHTML = "<p>No se encontraron animes.</p>";
  } catch (error) {
    animeResults.innerHTML = `<p>Error: ${error.message}</p>`;
  }
});

characterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const queryText = document.querySelector("#character-query").value.trim();
  if (!queryText) return;

  characterResults.innerHTML = "<p>Buscando...</p>";

  try {
    const response = await fetch(`${jikanEndpoint}/characters?q=${encodeURIComponent(queryText)}&limit=6`);
    if (!response.ok) throw new Error(`Jikan error (${response.status})`);

    const payload = await response.json();
    const results = payload.data || [];

    characterResults.innerHTML = results
      .map(
        (character) => `
          <div class="result-item">
            <strong>${character.name}</strong><br>
            <small>${character.nicknames?.slice(0, 2).join(", ") || "Sin apodos"}</small>
          </div>
        `,
      )
      .join("");

    if (!results.length) characterResults.innerHTML = "<p>No se encontraron personajes.</p>";
  } catch (error) {
    characterResults.innerHTML = `<p>Error: ${error.message}</p>`;
  }
});

loadTopAnime();

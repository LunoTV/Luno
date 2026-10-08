import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.TMDB_API_TOKEN || "";
if (!token) throw new Error("TMDB_API_TOKEN is missing. Add it to GitHub Actions secrets.");

const API = "https://api.themoviedb.org/3";
const IMAGE = "https://image.tmdb.org/t/p";
const headers = {
  accept: "application/json",
  authorization: "Bearer " + token
};

async function tmdb(path, params = {}) {
  const url = new URL(API + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error("TMDB HTTP " + response.status + " " + path);
  return response.json();
}

function image(path, size = "w500") {
  return path ? IMAGE + "/" + size + path : "";
}

function normalize(item, type, genres) {
  const movie = type === "movie";
  const tmdbId = Number(item.id);
  const releaseInfo = movie ? item.release_date : item.first_air_date;
  const originalName = movie ? item.original_title : item.original_name;
  const name = movie ? item.title : item.name;
  return {
    id: "tmdb:" + tmdbId,
    tmdbId,
    type,
    name: name || originalName || "Без названия",
    originalName: originalName || "",
    poster: image(item.poster_path, "w500"),
    background: image(item.backdrop_path, "w1280"),
    description: item.overview || "",
    releaseInfo: releaseInfo || "",
    rating: Number(item.vote_average) || 0,
    popularity: Number(item.popularity) || 0,
    genres: Array.isArray(item.genre_ids) ? item.genre_ids.map(id => genres.get(id)).filter(Boolean) : [],
    adult: Boolean(item.adult)
  };
}

async function collect(type, sort, pages, genres) {
  const result = [];
  for (let page = 1; page <= pages; page++) {
    const data = await tmdb("/discover/" + type, {
      language: "ru-RU",
      region: "RU",
      include_adult: "false",
      include_video: "false",
      sort_by: sort,
      page,
      "vote_count.gte": sort === "vote_average.desc" ? 200 : 25
    });
    result.push(...(data.results || []).map(item => normalize(item, type, genres)));
  }
  return result;
}

async function enrichExternalIds(items) {
  const output = [...items];
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= output.length) return;
      const item = output[index];
      try {
        const endpoint = item.type === "movie" ? "/movie/" + item.tmdbId : "/tv/" + item.tmdbId;
        const data = await tmdb(endpoint, { language: "ru-RU", append_to_response: "external_ids" });
        const imdbId = data?.external_ids?.imdb_id || "";
        if (imdbId) output[index] = { ...item, imdbId };
      } catch (error) {
        console.warn("TMDB external ids failed:", item.id, error.message);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return output;
}

const [movieGenresData, seriesGenresData] = await Promise.all([
  tmdb("/genre/movie/list", { language: "ru-RU" }),
  tmdb("/genre/tv/list", { language: "ru-RU" })
]);

const movieGenres = new Map((movieGenresData.genres || []).map(g => [g.id, g.name]));
const seriesGenres = new Map((seriesGenresData.genres || []).map(g => [g.id, g.name]));

const [popularMovies, popularSeries, topMovies, topSeries] = await Promise.all([
  collect("movie", "popularity.desc", 8, movieGenres),
  collect("tv", "popularity.desc", 8, seriesGenres),
  collect("movie", "vote_average.desc", 4, movieGenres),
  collect("tv", "vote_average.desc", 4, seriesGenres)
]);

function unique(items) {
  return [...new Map(items.filter(x => x?.tmdbId).map(x => [x.id, x])).values()];
}

let movies = unique([...popularMovies, ...topMovies]);
let series = unique([...popularSeries, ...topSeries]);

movies = await enrichExternalIds(movies.slice(0, 260));
series = await enrichExternalIds(series.slice(0, 260));

const all = [...movies, ...series];

const payload = {
  generatedAt: new Date().toISOString(),
  source: "TMDB",
  language: "ru-RU",
  sections: {
    popularMovies: popularMovies.map(x => x.id).filter(Boolean),
    popularSeries: popularSeries.map(x => x.id).filter(Boolean),
    topMovies: topMovies.map(x => x.id).filter(Boolean),
    topSeries: topSeries.map(x => x.id).filter(Boolean)
  },
  items: all
};

await mkdir("public", { recursive: true });
await writeFile("public/tmdb-catalog.json", JSON.stringify(payload));

console.log("LUNO TMDB catalog:", all.length);
console.log("Movies:", movies.length, "Series:", series.length);
console.log("With IMDb IDs:", all.filter(x => x.imdbId).length);

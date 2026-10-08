import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.TMDB_API_TOKEN || "";
if (!token) throw new Error("TMDB_API_TOKEN is missing. Add it to GitHub Actions secrets.");

const API = "https://api.themoviedb.org/3";
const IMAGE = "https://image.tmdb.org/t/p";
const headers = { accept: "application/json", authorization: "Bearer " + token };

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
  const originalName = movie ? (item.original_title || item.original_name) : (item.original_name || item.original_title);
  const name = movie ? (item.title || item.name) : (item.name || item.title);
  return {
    id: "tmdb:" + tmdbId,
    tmdbId,
    type,
    name: name || originalName || "Без названия",
    originalName: originalName || "",
    poster: image(item.poster_path, "w500"),
    background: image(item.backdrop_path, "w1280"),
    description: item.overview || "",
    releaseInfo: (movie ? item.release_date : item.first_air_date) || "",
    rating: Number(item.vote_average) || 0,
    popularity: Number(item.popularity) || 0,
    genreIds: Array.isArray(item.genre_ids) ? item.genre_ids.map(Number).filter(Boolean) : [],
    genres: Array.isArray(item.genre_ids) ? item.genre_ids.map(id => genres.get(id)).filter(Boolean) : [],
    originalLanguage: item.original_language || "",
    originCountry: Array.isArray(item.origin_country) ? item.origin_country : [],
    adult: Boolean(item.adult),
    posterPath: item.poster_path || "",
    backdropPath: item.backdrop_path || ""
  };
}

async function collect(type, sort, pages, genres, genreId = "") {
  const result = [];
  for (let page = 1; page <= pages; page++) {
    const data = await tmdb("/discover/" + type, {
      language: "ru-RU",
      region: "RU",
      include_adult: "false",
      include_video: "false",
      sort_by: sort,
      page,
      "vote_count.gte": sort === "vote_average.desc" ? 200 : 25,
      with_genres: genreId
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
        const data = await tmdb(endpoint, { language: "ru-RU", append_to_response: "external_ids,credits" });
        const imdbId = data?.external_ids?.imdb_id || "";
        const collectionId = Number(data?.belongs_to_collection?.id) || 0;
        const cast = Array.isArray(data?.credits?.cast)
          ? data.credits.cast.slice(0, 10).map(person => ({
              name: person?.name || "",
              character: person?.character || "",
              profile: image(person?.profile_path, "w185")
            })).filter(person => person.name)
          : [];
        if (imdbId || collectionId || cast.length) {
          const posterPath = data?.poster_path || item?.posterPath || "";
        const backdropPath = data?.backdrop_path || item?.backdropPath || "";
        output[index] = {
          ...item,
          ...(imdbId ? { imdbId } : {}),
          ...(collectionId ? { collectionId } : {}),
          ...(posterPath ? { posterPath } : {}),
          ...(backdropPath ? { backdropPath } : {}),
          ...(posterPath ? { poster: image(posterPath, "w500") } : {}),
          ...(backdropPath ? { background: image(backdropPath, "w1280") } : {}),
          ...(cast.length ? { cast } : {})
        };
        }
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

const [popularMovies, popularSeries, topMovies, topSeries, animationMovies, animationSeries] = await Promise.all([
  collect("movie", "popularity.desc", 20, movieGenres),
  collect("tv", "popularity.desc", 20, seriesGenres),
  collect("movie", "vote_average.desc", 12, movieGenres),
  collect("tv", "vote_average.desc", 12, seriesGenres),
  collect("movie", "popularity.desc", 8, movieGenres, 16),
  collect("tv", "popularity.desc", 8, seriesGenres, 16)
]);

function unique(items) {
  return [...new Map(items.filter(x => x?.tmdbId).map(x => [x.id, x])).values()];
}

let movies = unique([...popularMovies, ...topMovies]);
let series = unique([...popularSeries, ...topSeries]);
let animationMoviesClean = unique(animationMovies);
let animationSeriesClean = unique(animationSeries);
animationMoviesClean = await enrichExternalIds(animationMoviesClean);
animationSeriesClean = await enrichExternalIds(animationSeriesClean);

movies = await enrichExternalIds(movies.slice(0, 1000));
series = await enrichExternalIds(series.slice(0, 1000));

async function expandMovieCollections(items) {
  const collectionIds = [...new Set(items.map(x => Number(x?.collectionId) || 0).filter(Boolean))];
  const additions = [];
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= collectionIds.length) return;
      const collectionId = collectionIds[index];
      try {
        const data = await tmdb("/collection/" + collectionId, { language: "ru-RU" });
        for (const part of data?.parts || []) {
          if (!part?.id) continue;
          additions.push(normalize(part, "movie", movieGenres));
        }
      } catch (error) {
        console.warn("TMDB collection failed:", collectionId, error.message);
      }
    }
  };

  await Promise.all(Array.from({ length: 6 }, worker));
  return unique(additions);
}

async function loadOpenCinemaItems() {
  const imdbIds = ["tt1254207", "tt1727587", "tt2285752", "tt0807840"];
  const output = [];
  for (const imdbId of imdbIds) {
    try {
      const data = await tmdb("/find/" + imdbId, {
        external_source: "imdb_id",
        language: "ru-RU"
      });
      const movie = Array.isArray(data?.movie_results) ? data.movie_results[0] : null;
      if (!movie?.id) continue;
      const item = normalize(movie, "movie", movieGenres);
      output.push({
        ...item,
        imdbId,
        openCinema: true
      });
    } catch (error) {
      console.warn("Open Cinema metadata failed:", imdbId, error.message);
    }
  }
  return await enrichExternalIds(output);
}

const collectionMovies = await expandMovieCollections(movies);
movies = unique([...movies, ...collectionMovies]);
const openCinemaMovies = await loadOpenCinemaItems();
movies = unique([...openCinemaMovies, ...movies]);
movies = await enrichExternalIds(movies);

movies = unique([...movies, ...animationMoviesClean]);
series = unique([...series, ...animationSeriesClean]);

const all = [...movies, ...series]
  .sort((a, b) => {
    const popularityDiff = Number(b?.popularity || 0) - Number(a?.popularity || 0);
    if (popularityDiff !== 0) return popularityDiff;
    return Number(b?.rating || 0) - Number(a?.rating || 0);
  });
const movieSection = unique([...popularMovies, ...movies]).map(x => x.id).filter(Boolean);
const seriesSection = unique([...popularSeries, ...series]).map(x => x.id).filter(Boolean);
const payload = {
  generatedAt: new Date().toISOString(),
  source: "TMDB",
  language: "ru-RU",
  sections: {
    popularMovies: movieSection,
    popularSeries: seriesSection,
    topMovies: unique([...topMovies, ...movies]).map(x => x.id).filter(Boolean),
    topSeries: unique([...topSeries, ...series]).map(x => x.id).filter(Boolean),
    animation: unique([...animationMoviesClean, ...animationSeriesClean]).map(x => x.id).filter(Boolean)
  },
  items: all
};

await mkdir("public/tmdb-posters", { recursive: true });

async function cachePosters(items) {
  let cursor = 0;
  let cached = 0;
  let fallbackCached = 0;
  let failed = 0;

  async function download(url, file) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(url, { headers: { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" } });
        if (!response.ok) throw new Error("HTTP " + response.status);
        const bytes = Buffer.from(await response.arrayBuffer());
        if (!bytes.length) throw new Error("empty response");
        await writeFile(file, bytes);
        return true;
      } catch (error) {
        if (attempt === 3) console.warn("TMDB image failed:", url, error.message);
        await new Promise(resolve => setTimeout(resolve, attempt * 300));
      }
    }
    return false;
  }

  const worker = async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;

      const item = items[index];
      const file = "public/tmdb-posters/" + item.tmdbId + ".jpg";
      const candidates = [
        item?.poster,
        item?.posterPath ? IMAGE + "/w500" + String(item.posterPath).replace(/^\//, "") : "",
        item?.posterPath ? IMAGE + "/original" + String(item.posterPath).replace(/^\//, "") : ""
      ].filter(Boolean);

      let success = false;
      for (const source of [...new Set(candidates)]) {
        if (await download(source, file)) {
          item.posterSource = source;
          item.poster = "./tmdb-posters/" + item.tmdbId + ".jpg";
          cached++;
          success = true;
          break;
        }
      }

      if (!success && item?.backdropPath) {
        const source = IMAGE + "/w1280" + String(item.backdropPath).replace(/^\//, "");
        if (await download(source, file)) {
          item.posterSource = source;
          item.posterFallback = "backdrop";
          item.poster = "./tmdb-posters/" + item.tmdbId + ".jpg";
          fallbackCached++;
          success = true;
        }
      }

      if (!success && item?.background) {
        const source = item.background;
        if (await download(source, file)) {
          item.posterSource = source;
          item.posterFallback = "background";
          item.poster = "./tmdb-posters/" + item.tmdbId + ".jpg";
          fallbackCached++;
          success = true;
        }
      }

      if (!success) {
        failed++;
        item.poster = "";
      }
    }
  };

  await Promise.all(Array.from({ length: 8 }, worker));
  console.log("TMDB posters cached:", cached, "backdrop fallbacks:", fallbackCached, "failed:", failed);
}

await mkdir("public", { recursive: true });
await cachePosters(all);
await writeFile("public/tmdb-catalog.json", JSON.stringify(payload));
await writeFile("tmdb-catalog.generated.js", "export default " + JSON.stringify(payload) + ";");
console.log("LUNO TMDB catalog:", all.length);
console.log("Movies:", movies.length, "Series:", series.length);
console.log("With IMDb IDs:", all.filter(x => x.imdbId).length);

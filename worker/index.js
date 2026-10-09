const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p";

function corsHeaders(origin) {
  const allowed = [
    "https://lunotv.github.io",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ];
  return {
    "access-control-allow-origin": allowed.includes(origin) ? origin : "https://lunotv.github.io",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
    "cache-control": "no-store"
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(origin)
    }
  });
}

function normalize(item) {
  const movie = item.media_type === "movie" ||
    item.type === "movie" ||
    (!item.media_type && !item.type && Boolean(item.title || item.original_title) && !item.name && !item.first_air_date);
  return {
    id: "tmdb:" + item.id,
    tmdbId: Number(item.id),
    type: movie ? "movie" : "series",
    name: movie ? (item.title || item.original_title || "") : (item.name || item.original_name || ""),
    originalName: movie ? (item.original_title || item.title || "") : (item.original_name || item.name || ""),
    poster: item.poster_path ? TMDB_IMAGE + "/w500" + item.poster_path : "",
    background: item.backdrop_path ? TMDB_IMAGE + "/w1280" + item.backdrop_path : "",
    description: item.overview || "",
    releaseInfo: movie ? (item.release_date || "") : (item.first_air_date || ""),
    rating: Number(item.vote_average) || 0,
    popularity: Number(item.popularity) || 0,
    genreIds: Array.isArray(item.genre_ids) ? item.genre_ids.map(Number).filter(Boolean) : [],
    genres: Array.isArray(item.genre_ids) ? item.genre_ids : [],
    originalLanguage: item.original_language || "",
    originCountry: Array.isArray(item.origin_country) ? item.origin_country : [],
    adult: Boolean(item.adult)
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);

    const isSearch = url.pathname === "/api/tmdb/search";
    const isDiscover = url.pathname === "/api/tmdb/discover";
    if ((!isSearch && !isDiscover) || request.method !== "GET") {
      return json({ error: "Not found" }, 404, origin);
    }

    const query = String(url.searchParams.get("query") || "").trim();
    if (isSearch && !query) return json({ error: "query is required" }, 400, origin);

    const page = url.searchParams.get("page") || "1";
    const token = env.TMDB_API_TOKEN;
    let primaryError = token ? "" : "TMDB_API_TOKEN is not configured";

    if (token) {
      const tmdb = new URL(TMDB_BASE + (isSearch ? "/search/multi" : "/trending/all/week"));
      if (isSearch) tmdb.searchParams.set("query", query);
      tmdb.searchParams.set("language", "ru-RU");
      tmdb.searchParams.set("include_adult", "false");
      tmdb.searchParams.set("page", page);

      try {
        const response = await fetch(tmdb, {
          headers: { accept: "application/json", authorization: "Bearer " + token }
        });
        if (!response.ok) {
          primaryError = "TMDB HTTP " + response.status;
        } else {
          const data = await response.json();
          const results = (data.results || [])
            .filter(item => item?.media_type === "movie" || item?.media_type === "tv")
            .map(normalize);
          if (results.length) {
            return json({
              query, page: Number(data.page) || 1,
              totalPages: Number(data.total_pages) || 1,
              totalResults: Number(data.total_results) || results.length,
              results, source: "TMDB"
            }, 200, origin);
          }
          primaryError = "TMDB returned no results";
        }
      } catch (error) {
        primaryError = String(error?.message || error);
      }
    }

    // Match Lampa's TMDB proxy strategy: use the current CUB mirror list,
    // trying each host server-side so browser CORS does not block catalog loading.
    const cubMirrors = ["cub.best", "cub.black", "durex.monster", "cubnotrip.top", "cub.red"];
    let cubError = "";
    for (const domain of cubMirrors) {
      try {
        const cub = new URL("https://apitmdb." + domain + "/3/" + (isSearch ? "search/multi" : "trending/all/week"));
        if (isSearch) cub.searchParams.set("query", query);
        cub.searchParams.set("language", "ru-RU");
        cub.searchParams.set("include_adult", "false");
        cub.searchParams.set("page", page);
        const response = await fetch(cub, { headers: { accept: "application/json" } });
        if (!response.ok) throw new Error(domain + " HTTP " + response.status);
        const data = await response.json();
        const raw = Array.isArray(data?.results) ? data.results : [];
        const results = raw
          .filter(item => item?.id && (item?.title || item?.name || item?.original_title || item?.original_name))
          .map(item => {
            const inferredType = item.media_type || item.type ||
              ((!item.title && (item.name || item.first_air_date)) ? "tv" : "movie");
            return normalize({ ...item, media_type: inferredType === "series" ? "tv" : inferredType });
          });
        if (!results.length) throw new Error(domain + " returned no results");
        return json({
          query, page: Number(data.page) || Number(page),
          totalPages: Number(data.total_pages) || 1,
          totalResults: Number(data.total_results) || results.length,
          results, source: "Lampa-compatible CUB mirror (" + domain + ")",
          fallbackFrom: primaryError
        }, 200, origin);
      } catch (error) {
        cubError = String(error?.message || error);
      }
    }
    return json({
      error: "TMDB and CUB catalog unavailable",
      detail: cubError || "All CUB mirrors failed",
      primary: primaryError
    }, 502, origin);
  }
};

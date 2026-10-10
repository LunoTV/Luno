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
    id: "tmdb:" + (movie ? "movie:" : "tv:") + item.id,
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

    if (url.pathname === "/api/tmdb/image") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405, origin);
      const imagePath = String(url.searchParams.get("path") || "");
      if (!/^\/(?:w\d{1,4}|original)\/[A-Za-z0-9._/-]+$/.test(imagePath) || imagePath.includes("..") || imagePath.includes("//")) {
        return json({ error: "Invalid image path" }, 400, origin);
      }

      // Lampa-style mirror list. Race mirrors instead of waiting for a blocked
      // host one by one; the first valid image wins and slow requests are aborted.
      const imageHosts = [
        "https://imagetmdb.com/t/p",
        "https://nl.imagetmdb.com/t/p",
        "https://de.imagetmdb.com/t/p",
        "https://pl.imagetmdb.com/t/p",
        "https://lampa.byskaz.ru/tmdb/img/t/p",
        "https://image.tmdb.org/t/p"
      ];
      const controllers = [];
      const attempts = imageHosts.map(async (host) => {
        const controller = new AbortController();
        controllers.push(controller);
        const timer = setTimeout(() => controller.abort("TMDB mirror timeout"), 2500);
        try {
          const response = await fetch(host + imagePath, {
            headers: { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
            signal: controller.signal,
            cf: { cacheTtl: 86400, cacheEverything: true }
          });
          if (!response.ok) throw new Error(host + " HTTP " + response.status);
          const contentType = response.headers.get("content-type") || "";
          if (!contentType.toLowerCase().startsWith("image/")) throw new Error(host + " returned non-image content");
          return { response, contentType, controller };
        } finally {
          clearTimeout(timer);
        }
      });
      try {
        const winner = await Promise.any(attempts);
        controllers.forEach(controller => { if (controller !== winner.controller) controller.abort("Another mirror responded first"); });
        const headers = new Headers({
          "content-type": winner.contentType,
          "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
          "access-control-allow-origin": "https://lunotv.github.io",
          "x-content-type-options": "nosniff"
        });
        const etag = winner.response.headers.get("etag");
        if (etag) headers.set("etag", etag);
        return new Response(winner.response.body, { status: 200, headers });
      } catch (error) {
        const reasons = error instanceof AggregateError ? error.errors.map(reason => String(reason?.message || reason)) : [String(error?.message || error)];
        return json({ error: "TMDB image mirrors unavailable", detail: reasons.slice(0, 6) }, 502, origin);
      }
    }

    const isSearch = url.pathname === "/api/tmdb/search";
    const isDiscover = url.pathname === "/api/tmdb/discover";
    if ((!isSearch && !isDiscover) || request.method !== "GET") {
      return json({ error: "Not found" }, 404, origin);
    }

    const query = String(url.searchParams.get("query") || "").trim();
    if (isSearch && !query) return json({ error: "query is required" }, 400, origin);

    const page = url.searchParams.get("page") || "1";
    const buildApiUrl = (base) => {
      const endpoint = isSearch ? "search/multi" : "trending/all/week";
      const target = new URL(base + endpoint);
      if (isSearch) target.searchParams.set("query", query);
      target.searchParams.set("language", "ru-RU");
      target.searchParams.set("include_adult", "false");
      target.searchParams.set("page", page);
      return target;
    };
    let primaryError = "";

    // Query the public TMDB-compatible mirrors concurrently. Sequential
    // attempts could take 15+ seconds on mobile networks and look like a
    // successful empty search while every mirror is still timing out.
    const cubMirrors = ["cub.red", "cub.best", "cub.black", "durex.monster", "cubnotrip.top"];
    const apiMirrors = cubMirrors.map(domain => "https://apitmdb." + domain + "/3/");
    apiMirrors.push("https://lampa.byskaz.ru/tmdb/api/3/");
    const mirrorAttempts = apiMirrors.map(async (base) => {
      const response = await fetch(buildApiUrl(base), {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(3500)
      });
      if (!response.ok) throw new Error(base + " HTTP " + response.status);
      const data = await response.json();
      const raw = Array.isArray(data?.results) ? data.results : [];
      const results = raw
        .filter(item => item?.id && (item?.title || item?.name || item?.original_title || item?.original_name))
        .map(item => {
          const inferredType = item.media_type || item.type ||
            ((!item.title && (item.name || item.first_air_date)) ? "tv" : "movie");
          return normalize({ ...item, media_type: inferredType === "series" ? "tv" : inferredType });
        });
      if (!results.length) throw new Error(base + " returned no results");
      return {
        query, page: Number(data.page) || Number(page),
        totalPages: Number(data.total_pages) || 1,
        totalResults: Number(data.total_results) || results.length,
        results, source: "Lampa-compatible TMDB mirror"
      };
    });
    try {
      const data = await Promise.any(mirrorAttempts);
      return json(data, 200, origin);
    } catch (error) {
      const reasons = error instanceof AggregateError
        ? error.errors.map(reason => String(reason?.message || reason))
        : [String(error?.message || error)];
      primaryError = reasons.slice(0, 6).join("; ");
    }

    const token = env.TMDB_API_TOKEN;
    if (token) {
      try {
        const tmdb = buildApiUrl(TMDB_BASE + "/");
        const response = await fetch(tmdb, {
          headers: { accept: "application/json", authorization: "Bearer " + token },
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) throw new Error("TMDB HTTP " + response.status);
        const data = await response.json();
        const results = (data.results || [])
          .filter(item => item?.media_type === "movie" || item?.media_type === "tv")
          .map(normalize);
        if (results.length) {
          return json({
            query, page: Number(data.page) || 1,
            totalPages: Number(data.total_pages) || 1,
            totalResults: Number(data.total_results) || results.length,
            results, source: "TMDB",
            fallbackFrom: primaryError
          }, 200, origin);
        }
        primaryError = "TMDB returned no results";
      } catch (error) {
        primaryError = String(error?.message || error);
      }
    } else {
      primaryError = primaryError || "TMDB_API_TOKEN is not configured";
    }

    return json({
      error: "TMDB and Lampa-compatible mirrors unavailable",
      detail: primaryError
    }, 502, origin);

  }
};

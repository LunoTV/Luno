export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const query = String(req.query?.query || "").trim();
  if (!query) return res.status(400).json({ error: "query is required" });

  const token = process.env.TMDB_API_TOKEN;
  if (!token) return res.status(500).json({ error: "TMDB_API_TOKEN is not configured" });

  const url = new URL("https://api.themoviedb.org/3/search/multi");
  url.searchParams.set("query", query);
  url.searchParams.set("language", "ru-RU");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", "1");

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        authorization: "Bearer " + token
      }
    });

    if (!response.ok) {
      const body = await response.text();
      return res.status(response.status).json({ error: "TMDB request failed", detail: body.slice(0, 500) });
    }

    const data = await response.json();
    const results = (data.results || [])
      .filter(item => item?.media_type === "movie" || item?.media_type === "tv")
      .map(item => ({
        id: "tmdb:" + item.id,
        tmdbId: Number(item.id),
        type: item.media_type === "tv" ? "series" : "movie",
        name: item.media_type === "movie" ? (item.title || item.original_title) : (item.name || item.original_name),
        originalName: item.media_type === "movie" ? (item.original_title || item.title) : (item.original_name || item.name),
        poster: item.poster_path ? "https://image.tmdb.org/t/p/w500" + item.poster_path : "",
        background: item.backdrop_path ? "https://image.tmdb.org/t/p/w1280" + item.backdrop_path : "",
        description: item.overview || "",
        releaseInfo: item.media_type === "movie" ? (item.release_date || "") : (item.first_air_date || ""),
        rating: Number(item.vote_average) || 0,
        popularity: Number(item.popularity) || 0,
        genres: Array.isArray(item.genre_ids) ? item.genre_ids : [],
        adult: Boolean(item.adult)
      }));

    return res.status(200).json({ query, results });
  } catch (error) {
    return res.status(502).json({ error: "TMDB unavailable", detail: String(error?.message || error) });
  }
}
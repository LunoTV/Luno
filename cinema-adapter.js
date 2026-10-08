const CINEMA_HOST = "https://ab2024.ru";
const CINEMA_TIMEOUT = 12000;
const MAX_PROVIDERS = 8;
const MAX_STREAMS = 12;
const BLOCKED_NAMES = new Set([
  "phub",
  "pornhub",
  "xvideos",
  "xnxx",
  "hentai",
  "18+",
  "adult"
]);

function withTimeout(promise, ms = CINEMA_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Cinema request timeout")), ms))
  ]);
}

function addParam(url, key, value) {
  if (value === undefined || value === null || value === "") return url;
  const next = new URL(url);
  next.searchParams.set(key, String(value));
  return next.href;
}

function cinemaRequestUrl(item) {
  const tmdbId = Number(item?.tmdbId) || 0;
  const imdbId = String(item?.imdbId || "").trim();
  const rawId = tmdbId || String(item?.id || "").replace(/^tmdb:/i, "");
  const title = String(item?.name || item?.originalName || "").trim();
  const originalTitle = String(item?.originalName || item?.name || "").trim();
  const year = String(item?.releaseInfo || "").match(/\d{4}/)?.[0] || "";
  let url = CINEMA_HOST + "/lite/events?life=true";
  url = addParam(url, "id", rawId);
  url = addParam(url, "imdb_id", imdbId);
  url = addParam(url, "tmdb_id", tmdbId || "");
  url = addParam(url, "title", title);
  url = addParam(url, "original_title", originalTitle);
  url = addParam(url, "original_language", item?.originalLanguage || "");
  url = addParam(url, "year", year);
  url = addParam(url, "serial", item?.type === "series" ? 1 : 0);
  url = addParam(url, "anime", -1);
  url = addParam(url, "source", "tmdb");
  url = addParam(url, "similar", false);
  url = addParam(url, "rchtype", "cors");
  return url;
}

async function readRemote(url, { timeout = CINEMA_TIMEOUT } = {}) {
  const response = await withTimeout(fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json, text/plain, */*" }
  }), timeout);
  if (!response.ok) throw new Error("Cinema HTTP " + response.status);
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return parseCinemaHtml(text);
  }
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseCinemaHtml(html = "") {
  const result = [];
  const pattern = /data-json=(?:"([^"]+)"|'([^']+)')/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const raw = decodeHtml(match[1] || match[2] || "");
    try {
      result.push(JSON.parse(raw));
    } catch {}
  }
  return result.length ? result : html;
}

function isDirectMediaUrl(value = "") {
  try {
    const url = new URL(String(value));
    if (!/^https?:$/i.test(url.protocol)) return false;
    const path = url.pathname.toLowerCase();
    return /\.(m3u8|mp4|webm|mkv|mov|ts|m4v)(?:$|\?)/i.test(path) ||
      /(?:stream|video|playlist|manifest)/i.test(path);
  } catch {
    return false;
  }
}

function qualityLabel(item = {}) {
  const quality = item?.qualitys || item?.quality || {};
  if (quality && typeof quality === "object" && !Array.isArray(quality)) {
    return Object.keys(quality).filter(Boolean).slice(0, 3).join(" / ");
  }
  return String(item?.quality || "").trim();
}

function providerName(item) {
  return String(item?.name || item?.balanser || "Cinema").trim();
}

function appendRjson(url) {
  try {
    const next = new URL(url, CINEMA_HOST);
    next.searchParams.set("rjson", "true");
    return next.href;
  } catch {
    return url;
  }
}

async function collectPlayable(value, context, depth = 0, visited = new Set(), output = []) {
  if (!value || output.length >= MAX_STREAMS || depth > 3) return output;

  if (Array.isArray(value)) {
    for (const entry of value) {
      await collectPlayable(entry, context, depth, visited, output);
      if (output.length >= MAX_STREAMS) break;
    }
    return output;
  }

  if (typeof value !== "object") return output;

  const method = String(value.method || "").toLowerCase();
  const title = String(value.title || value.text || value.name || context || "Cinema").trim();
  const direct = value.url || value.stream || "";
  const quality = qualityLabel(value);

  if ((method === "play" || method === "call" || method === "") && isDirectMediaUrl(direct)) {
    output.push({
      url: String(direct),
      title: title || context || "Cinema",
      quality,
      provider: context || "Cinema"
    });
  }

  if (value.qualitys && typeof value.qualitys === "object" && !Array.isArray(value.qualitys)) {
    for (const [qualityName, qualityUrl] of Object.entries(value.qualitys)) {
      if (isDirectMediaUrl(qualityUrl)) {
        output.push({
          url: String(qualityUrl),
          title: title || context || "Cinema",
          quality: qualityName,
          provider: context || "Cinema"
        });
      }
    }
  }

  if ((method === "link" || method === "call") && value.url && depth < 3) {
    const nextUrl = appendRjson(value.url);
    if (!visited.has(nextUrl)) {
      visited.add(nextUrl);
      try {
        const next = await readRemote(nextUrl, { timeout: 10000 });
        await collectPlayable(next, context, depth + 1, visited, output);
      } catch {}
    }
  }

  for (const key of ["data", "results", "streams", "videos", "items"]) {
    if (value[key]) await collectPlayable(value[key], context, depth + 1, visited, output);
    if (output.length >= MAX_STREAMS) break;
  }

  return output;
}

async function resolveProvider(provider, item) {
  const providerUrl = String(provider?.url || "").trim();
  if (!providerUrl) return [];
  const sourceName = providerName(provider);
  if (BLOCKED_NAMES.has(sourceName.toLowerCase())) return [];

  try {
    const url = appendRjson(providerUrl);
    const payload = await readRemote(url, { timeout: 10000 });
    if (payload?.rch) return [];
    return collectPlayable(payload, sourceName);
  } catch {
    return [];
  }
}

async function loadCinemaProviders(item) {
  const initialUrl = cinemaRequestUrl(item);
  const first = await readRemote(initialUrl);
  if (!first) return [];

  if (!first.life) {
    return Array.isArray(first?.online) ? first.online : (Array.isArray(first) ? first : []);
  }

  const memkey = String(first.memkey || "");
  if (!memkey) return [];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 700));
    const pollUrl = new URL(initialUrl);
    pollUrl.searchParams.set("memkey", memkey);
    try {
      const payload = await readRemote(pollUrl.href, { timeout: 10000 });
      const providers = Array.isArray(payload?.online) ? payload.online : [];
      if (providers.length || payload?.ready) return providers;
    } catch {}
  }

  return [];
}

export async function resolveCinemaStreams(item) {
  if (!item || item.type === "series") return [];

  try {
    const providers = await loadCinemaProviders(item);
    const usable = providers
      .filter((provider) => provider?.show !== false && provider?.url)
      .filter((provider) => !BLOCKED_NAMES.has(providerName(provider).toLowerCase()))
      .slice(0, MAX_PROVIDERS);

    const groups = await Promise.all(usable.map((provider) => resolveProvider(provider, item)));
    const seen = new Set();
    const streams = [];

    for (const group of groups) {
      for (const candidate of group) {
        const url = String(candidate?.url || "");
        if (!url || seen.has(url)) continue;
        seen.add(url);
        streams.push({
          stream: {
            title: [candidate.provider || "Cinema", candidate.title].filter(Boolean).join(" • "),
            name: candidate.title || candidate.provider || "Cinema",
            url,
            behaviorHints: {
              bingeGroup: "luno-cinema"
            }
          },
          request: {
            base: CINEMA_HOST,
            path: {
              resource: "stream",
              type: "movie",
              id: String(item.imdbId || item.id || ""),
              extra: []
            }
          },
          addon: {
            manifest: {
              name: "Cinema"
            },
            transportUrl: CINEMA_HOST
          }
        });
        if (streams.length >= MAX_STREAMS) return streams;
      }
    }

    return streams;
  } catch (error) {
    console.warn("LUNO Cinema source unavailable", error);
    return [];
  }
}

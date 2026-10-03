/**
 * LUNO Source Adapter contract
 *
 * This module is deliberately independent from Prisma/Lampa/Z01 UI.
 * It normalizes source responses into the data shape required by the
 * future LUNO player.
 *
 * Supported source item modes:
 *   - play: item.url is already a playable URL
 *   - call: item.url is a resolver URL; its response is normalized
 *   - stream: item.stream is a directly playable URL
 *   - link: navigation item (season/voice/similar), not a playable item
 */

export const SOURCE_METHODS = Object.freeze({
  PLAY: 'play',
  CALL: 'call',
  LINK: 'link'
});

export function createMovieQuery(movie = {}, extra = {}) {
  const title = movie.title || movie.name || '';
  const originalTitle = movie.original_title || movie.original_name || '';

  return {
    id: movie.id,
    imdb_id: movie.imdb_id || '',
    kinopoisk_id: movie.kinopoisk_id || '',
    tmdb_id: movie.tmdb_id || '',
    title,
    original_title: originalTitle,
    serial: Boolean(movie.name),
    original_language: movie.original_language || '',
    year: String(movie.release_date || movie.first_air_date || '0000').slice(0, 4),
    source: movie.source || 'tmdb',
    ...extra
  };
}

export function classifySourceItem(item = {}) {
  if (item.method === SOURCE_METHODS.LINK) return 'link';
  if (item.method === SOURCE_METHODS.PLAY) return 'play';
  if (item.method === SOURCE_METHODS.CALL) return 'call';
  if (item.stream) return 'stream';
  if (item.url) return 'url';
  return 'unknown';
}

export function normalizeQuality(quality) {
  if (!quality || typeof quality !== 'object') return {};

  const result = {};
  for (const [name, value] of Object.entries(quality)) {
    if (typeof value !== 'string' || !value) continue;
    const parts = value.split(' or ');
    result[name] = parts[0];
  }
  return result;
}

export function normalizeSourceItem(item = {}) {
  const kind = classifySourceItem(item);

  return {
    kind,
    title: item.title || item.text || '',
    url: typeof item.url === 'string' ? item.url : '',
    stream: typeof item.stream === 'string' ? item.stream : '',
    method: item.method || '',
    quality: normalizeQuality(item.quality || item.qualitys),
    subtitles: item.subtitles ?? null,
    subtitles_call: item.subtitles_call ?? null,
    segments: item.segments ?? null,
    headers: item.headers ?? null,
    season: Number.isFinite(Number(item.season)) ? Number(item.season) : null,
    episode: Number.isFinite(Number(item.episode)) ? Number(item.episode) : null,
    voice_name: item.voice_name || item.text || '',
    thumbnail: item.thumbnail || null,
    active: Boolean(item.active),
    raw: item
  };
}

export function normalizeSourceResponse(response) {
  if (!response) return { type: 'empty', items: [] };

  if (Array.isArray(response)) {
    return {
      type: 'items',
      items: response.map(normalizeSourceItem)
    };
  }

  if (response.rch) {
    return {
      type: 'rch',
      rch: response.rch,
      raw: response
    };
  }

  if (response.url || response.stream || response.quality) {
    return {
      type: 'resolved',
      item: normalizeSourceItem({
        ...response,
        method: response.method || SOURCE_METHODS.PLAY
      })
    };
  }

  return {
    type: 'json',
    items: Array.isArray(response.items)
      ? response.items.map(normalizeSourceItem)
      : [],
    raw: response
  };
}

export function splitSourceItems(items = []) {
  const normalized = items.map(normalizeSourceItem);

  return {
    playable: normalized.filter(item => item.kind === 'play' || item.kind === 'call' || item.kind === 'stream' || item.kind === 'url'),
    navigation: normalized.filter(item => item.kind === 'link'),
    unknown: normalized.filter(item => item.kind === 'unknown')
  };
}

export function createPlayableRequest(item) {
  const normalized = normalizeSourceItem(item);

  if (normalized.kind === 'stream') {
    return {
      type: 'play',
      url: normalized.stream,
      headers: normalized.headers,
      quality: normalized.quality,
      subtitles: normalized.subtitles,
      segments: normalized.segments
    };
  }

  if (normalized.kind === 'play') {
    return {
      type: 'play',
      url: normalized.url,
      headers: normalized.headers,
      quality: normalized.quality,
      subtitles: normalized.subtitles,
      segments: normalized.segments
    };
  }

  if (normalized.kind === 'call') {
    return {
      type: 'resolve',
      url: normalized.url,
      headers: normalized.headers
    };
  }

  return null;
}

export function normalizeResolvedStream(response, originalItem = {}) {
  const base = normalizeSourceItem(originalItem);
  const result = normalizeSourceItem(response || {});

  const url = result.url || result.stream || base.stream || base.url;

  if (!url) return null;

  return {
    url,
    headers: result.headers || base.headers || null,
    quality: Object.keys(result.quality).length ? result.quality : base.quality,
    subtitles: result.subtitles ?? base.subtitles ?? null,
    subtitles_call: result.subtitles_call ?? base.subtitles_call ?? null,
    segments: result.segments ?? base.segments ?? null,
    hls_manifest_timeout: response?.hls_manifest_timeout ?? null,
    thumbnail: base.thumbnail || null,
    season: base.season,
    episode: base.episode,
    voice_name: base.voice_name,
    raw: response
  };
}

/**
 * Browser transport used by the future LUNO source manager.
 *
 * This intentionally uses normal browser fetch. A source can request
 * additional headers explicitly; no proxy or hidden relay is introduced.
 */
export async function requestSource(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body,
    credentials: options.credentials || 'include',
    signal: options.signal
  });

  if (!response.ok) {
    throw new Error(`Source request failed: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

/**
 * Minimal adapter factory.
 *
 * A concrete LUNO source implements:
 *   search(movie)
 *   resolve(item)
 *
 * Optional:
 *   getSeasons(movie)
 *   getEpisodes(movie, season)
 */
export function defineSourceAdapter(definition) {
  if (!definition || typeof definition !== 'object') {
    throw new TypeError('Source adapter definition must be an object');
  }

  if (!definition.id || !definition.name) {
    throw new TypeError('Source adapter requires id and name');
  }

  if (typeof definition.search !== 'function') {
    throw new TypeError(`Source "${definition.id}" requires search()`);
  }

  if (typeof definition.resolve !== 'function') {
    throw new TypeError(`Source "${definition.id}" requires resolve()`);
  }

  return Object.freeze({
    id: String(definition.id),
    name: String(definition.name),
    version: definition.version || '1',
    auth: definition.auth || null,
    capabilities: Object.freeze({
      movies: definition.capabilities?.movies !== false,
      series: definition.capabilities?.series !== false,
      seasons: Boolean(definition.capabilities?.seasons),
      episodes: Boolean(definition.capabilities?.episodes),
      subtitles: Boolean(definition.capabilities?.subtitles),
      qualities: Boolean(definition.capabilities?.qualities),
      ...definition.capabilities
    }),
    search: definition.search,
    resolve: definition.resolve,
    getSeasons: definition.getSeasons,
    getEpisodes: definition.getEpisodes
  });
}

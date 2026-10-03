import {
  defineSourceAdapter,
  createMovieQuery,
  normalizeSourceItem,
  normalizeResolvedStream,
  requestSource,
  SOURCE_METHODS
} from './source-adapter.js';

const DEFAULT_BASE_URL = 'https://z01.online/';

function appendQuery(url, query) {
  const target = new URL(url, window.location.href);
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === '') continue;
    target.searchParams.set(key, String(value));
  }
  return target.toString();
}

function sourceName(source) {
  return String(source?.name || source?.title || source?.url || '')
    .trim()
    .toLowerCase();
}

function decodeHtml(value) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function parseJsonAttribute(value) {
  if (!value) return null;

  const candidates = [
    value,
    decodeHtml(value),
    value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (_) {}
  }

  return null;
}

function parseSourceHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const items = [];

  doc.querySelectorAll('.videos__item').forEach((element) => {
    const raw = parseJsonAttribute(
      element.getAttribute('data-json') ||
      element.dataset?.json ||
      ''
    );

    if (!raw || typeof raw !== 'object') return;

    items.push(normalizeSourceItem({
      ...raw,
      title: raw.title || raw.text || element.textContent?.trim() || ''
    }));
  });

  doc.querySelectorAll('.videos__button').forEach((element) => {
    const raw = parseJsonAttribute(
      element.getAttribute('data-json') ||
      element.dataset?.json ||
      ''
    ) || {};

    const url = raw.url || element.getAttribute('data-url') || '';
    if (!url) return;

    items.push(normalizeSourceItem({
      ...raw,
      method: SOURCE_METHODS.LINK,
      url,
      title: raw.title || raw.text || element.textContent?.trim() || '',
      active: raw.active ?? element.classList.contains('active')
    }));
  });

  return items;
}

function parseResponse(response) {
  if (typeof response === 'string') {
    return {
      type: 'items',
      items: parseSourceHtml(response),
      raw: response
    };
  }

  if (response?.rch) {
    return {
      type: 'rch',
      rch: response.rch,
      raw: response
    };
  }

  if (Array.isArray(response)) {
    return {
      type: 'items',
      items: response.map(normalizeSourceItem),
      raw: response
    };
  }

  if (response && typeof response === 'object') {
    const list = Array.isArray(response.items)
      ? response.items
      : Array.isArray(response.videos)
        ? response.videos
        : [];

    return {
      type: 'items',
      items: list.map(normalizeSourceItem),
      raw: response
    };
  }

  return { type: 'empty', items: [] };
}

function buildZ01Query(movie, options = {}) {
  const query = createMovieQuery(movie, options.query || {});

  return {
    id: query.id,
    imdb_id: query.imdb_id,
    kinopoisk_id: query.kinopoisk_id,
    tmdb_id: query.tmdb_id,
    title: query.title,
    original_title: query.original_title,
    serial: query.serial,
    original_language: query.original_language,
    year: query.year,
    source: query.source,
    clarification: options.clarification || '',
    similar: options.similar || '',
    rchtype: options.rchtype || ''
  };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: options.headers || {},
    credentials: 'include',
    signal: options.signal
  });

  if (!response.ok) {
    throw new Error(`Z01 request failed: ${response.status} ${response.statusText}`);
  }

  const type = response.headers.get('content-type') || '';
  return type.includes('application/json')
    ? response.json()
    : response.text();
}

export function createZ01SourceAdapter(config = {}) {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;

  return defineSourceAdapter({
    id: 'z01',
    name: 'Z01 Online',
    version: '1',
    auth: {
      type: 'browser-session',
      credentials: 'include'
    },
    capabilities: {
      movies: true,
      series: true,
      seasons: true,
      episodes: true,
      subtitles: true,
      qualities: true
    },

    async search(movie, options = {}) {
      const query = buildZ01Query(movie, options);
      const discoveryUrl = appendQuery(
        new URL('lite/events?life=true', baseUrl).toString(),
        query
      );

      const discovery = await requestJson(discoveryUrl, {
        headers: options.headers,
        signal: options.signal
      });

      if (!discovery || discovery.accsdb) {
        throw new Error('Z01 source discovery rejected the request');
      }

      if (discovery.title) {
        query.title = discovery.title;
      }

      const online = Array.isArray(discovery.online) ? discovery.online : [];
      if (!online.length) {
        throw new Error('Z01 returned no online sources');
      }

      const requested = String(
        options.sourceName ||
        options.balanser ||
        ''
      ).trim().toLowerCase();

      const selected =
        online.find(item => requested && sourceName(item) === requested) ||
        online.find(item => item?.show !== false) ||
        online[0];

      if (!selected?.url) {
        throw new Error('Z01 returned a source without URL');
      }

      const sourceUrl = appendQuery(selected.url, query);
      const response = await requestSource(sourceUrl, {
        headers: {
          ...(discovery.headers || {}),
          ...(selected.headers || {}),
          ...(options.headers || {})
        },
        credentials: 'include',
        signal: options.signal
      });

      const parsed = parseResponse(response);

      return {
        ...parsed,
        source: {
          id: sourceName(selected),
          name: selected.name || sourceName(selected),
          url: selected.url,
          show: selected.show !== false
        },
        memkey: discovery.memkey || null,
        query
      };
    },

    async resolve(item, options = {}) {
      if (!item?.url) {
        throw new Error('Z01 resolver item has no URL');
      }

      const response = await requestSource(item.url, {
        headers: {
          ...(item.headers || {}),
          ...(options.headers || {})
        },
        credentials: 'include',
        signal: options.signal
      });

      if (response?.rch) {
        return response;
      }

      if (typeof response === 'string') {
        const parsed = parseResponse(response);
        const first = parsed.items?.find(entry =>
          entry.method === SOURCE_METHODS.PLAY ||
          entry.stream ||
          entry.url
        );

        if (!first) {
          throw new Error('Z01 resolver returned no playable item');
        }

        return normalizeResolvedStream(first, item);
      }

      return normalizeResolvedStream(response, item);
    }
  });
}

export const z01Source = createZ01SourceAdapter();

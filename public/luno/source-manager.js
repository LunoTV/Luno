import {
  createMovieQuery,
  normalizeSourceResponse,
  splitSourceItems,
  createPlayableRequest,
  normalizeResolvedStream
} from './source-adapter.js';

/**
 * LUNO Source Manager
 *
 * Owns source registration and source execution. It has no dependency on
 * Prisma, Lampa, Z01, or a proxy server.
 */
export class SourceManager {
  constructor({ request = null } = {}) {
    this.sources = new Map();
    this.request = request;
  }

  register(source) {
    if (!source || !source.id) {
      throw new TypeError('Source must have an id');
    }

    if (this.sources.has(source.id)) {
      throw new Error(`Source already registered: ${source.id}`);
    }

    this.sources.set(source.id, source);
    return source;
  }

  unregister(sourceId) {
    return this.sources.delete(sourceId);
  }

  get(sourceId) {
    return this.sources.get(sourceId) || null;
  }

  list() {
    return Array.from(this.sources.values());
  }

  async search(sourceId, movie, options = {}) {
    const source = this.require(sourceId);
    const query = createMovieQuery(movie, options.query || {});
    const response = await source.search(query, options);
    return {
      source: source.id,
      query,
      ...normalizeSourceResponse(response)
    };
  }

  async navigate(sourceId, item, options = {}) {
    const source = this.require(sourceId);

    if (item?.kind !== 'link' && item?.method !== 'link') {
      throw new Error('Source item is not navigation');
    }

    if (typeof source.navigate !== 'function') {
      throw new Error(`Source ${sourceId} does not support navigation`);
    }

    const response = await source.navigate(item, options);
    return {
      source: source.id,
      ...normalizeSourceResponse(response)
    };
  }

  async resolve(sourceId, item, options = {}) {
    const source = this.require(sourceId);
    const request = createPlayableRequest(item);

    if (!request) {
      throw new Error('Source item is not playable or resolvable');
    }

    if (request.type === 'play') {
      return {
        source: source.id,
        ...normalizeResolvedStream(request, item)
      };
    }

    const response = await source.resolve(item, options);
    const normalized = normalizeSourceResponse(response);

    if (normalized.type === 'rch') {
      return {
        source: source.id,
        type: 'rch',
        rch: normalized.rch,
        raw: normalized.raw
      };
    }

    if (normalized.type === 'resolved') {
      return {
        source: source.id,
        type: 'play',
        ...normalizeResolvedStream(normalized.item, item)
      };
    }

    const first = normalized.items?.[0];
    if (first) {
      return {
        source: source.id,
        type: 'play',
        ...normalizeResolvedStream(first, item)
      };
    }

    throw new Error('Source resolver returned no playable stream');
  }

  split(response) {
    return splitSourceItems(response?.items || response || []);
  }

  require(sourceId) {
    const source = this.get(sourceId);
    if (!source) {
      throw new Error(`Unknown LUNO source: ${sourceId}`);
    }
    return source;
  }
}

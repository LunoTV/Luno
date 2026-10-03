import sourceManager from './index.js';

function assertMovie(movie) {
  if (!movie || typeof movie !== 'object') {
    throw new TypeError('LUNO source runtime requires a movie object');
  }
  return movie;
}

export async function searchSource(movie, options = {}) {
  assertMovie(movie);
  return sourceManager.search(options.sourceId || 'z01', movie, options);
}

export async function resolveSourceItem(item, options = {}) {
  if (!item || typeof item !== 'object') {
    throw new TypeError('LUNO source runtime requires a source item');
  }
  return sourceManager.resolve(options.sourceId || 'z01', item, options);
}

export async function resolveMovie(movie, options = {}) {
  const result = await searchSource(movie, options);

  return {
    ...result,
    navigation: result.items?.filter(item => item.kind === 'link') || [],
    playable: result.items?.filter(item =>
      item.kind === 'play' ||
      item.kind === 'call' ||
      item.kind === 'stream' ||
      item.kind === 'url'
    ) || []
  };
}

if (typeof window !== 'undefined') {
  window.LUNO = window.LUNO || {};
  window.LUNO.sourceRuntime = Object.freeze({
    search: searchSource,
    resolveItem: resolveSourceItem,
    resolveMovie
  });
}

(function(global){
  'use strict';

  /*
   * LUNO <-> Lampa compatibility boundary.
   *
   * The upstream Lampa controller/router are UI-coupled. LUNO must not load
   * those UI controllers, because that would bring Lampa screens/modals back.
   * This adapter exposes only the contracts that a future source/runtime
   * integration needs.
   */

  const Core = global.LunoCore;
  if (!Core) throw new Error('LunoCore must load before luno-adapter');

  const subscriptions = new Map();

  const emit = (name, data) => Core.emit('adapter:' + name, data);

  const listen = (name, fn) => {
    const key = 'adapter:' + name;
    const off = Core.on(key, fn);
    const list = subscriptions.get(name) || [];
    list.push(off);
    subscriptions.set(name, list);
    return off;
  };

  const content = {
    normalize(item = {}, fallback = {}) {
      const value = { ...fallback, ...item };
      const id = value.id ?? value.tmdb_id ?? value.imdb_id ?? value.mal_id;
      const type = value.type || (value.original_name || value.first_air_date ? 'series' : 'movie');

      return {
        ...value,
        id: id == null ? '' : String(id),
        type,
        title: value.title || value.name || value.original_title || value.original_name || 'Без названия',
        poster: value.poster || value.poster_path || '',
        backdrop: value.backdrop || value.backdrop_path || '',
        year: value.year || String(value.release_date || value.first_air_date || '').slice(0, 4),
        rating: value.rating ?? value.vote_average ?? value.imdbRating ?? null,
        description: value.description || value.overview || value.synopsis || ''
      };
    }
  };

  const source = {
    registry: new Map(),

    register(name, provider) {
      if (!name || !provider || typeof provider !== 'object') {
        throw new TypeError('Source must have a name and provider object');
      }

      this.registry.set(String(name), provider);
      emit('source:registered', { name: String(name) });
      return provider;
    },

    unregister(name) {
      this.registry.delete(String(name));
      emit('source:removed', { name: String(name) });
    },

    get(name) {
      return this.registry.get(String(name)) || null;
    },

    list() {
      return [...this.registry.keys()];
    },

    async call(name, method, payload = {}) {
      const provider = this.get(name);
      if (!provider) throw new Error('Unknown source: ' + name);

      const fn = provider[method];
      if (typeof fn !== 'function') {
        throw new Error('Source method is not available: ' + method);
      }

      const result = await fn(payload, {
        core: Core,
        content,
        storage: Core.storage
      });

      emit('source:result', {
        name: String(name),
        method,
        payload,
        result
      });

      return result;
    }
  };

  const activity = {
    open(route, data = {}) {
      const previous = Core.router.current();
      Core.router.go(route);
      emit('activity:open', { route, previous, data });
      return { route, data };
    },

    back() {
      const result = Core.router.back();
      emit('activity:back', { result, route: Core.router.current() });
      return result;
    }
  };

  const storage = {
    get: Core.storage.get,
    set: Core.storage.set,
    remove: Core.storage.remove,
    clear: Core.storage.clear
  };

  global.LunoAdapter = {
    version: '1.0.0',
    core: Core,
    content,
    source,
    activity,
    storage,
    on: listen,
    emit
  };

})(window);

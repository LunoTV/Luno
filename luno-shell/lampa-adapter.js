/* LUNO ↔ Lampa service facade.
 * The upstream stock app.js also mounts Lampa's UI, so runtimeEntry must point
 * only to a dedicated LUNO-safe build. Never point it at the stock bundle.
 */
(() => {
  const config = window.LUNO_CONFIG || {};
  const listeners = new Map();
  let runtime = null;
  let runtimePromise = null;
  const pluginState = new Map();
  const pluginErrors = new Map();

  function emit(name, detail) {
    (listeners.get(name) || []).forEach(fn => { try { fn(detail); } catch (e) { console.error(e); } });
  }
  function on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => listeners.get(name)?.delete(fn);
  }
  function loadRuntime() {
    if (runtime) return Promise.resolve(runtime);
    if (runtimePromise) return runtimePromise;
    runtimePromise = (async () => {
      const entry = config.runtimeEntry;
      if (!entry) throw new Error('LUNO runtime is not built yet; stock Lampa bundle is intentionally not loaded.');
      // Set this before loading the shared bundle so its stock UI boot path is skipped.
      window.LUNO_HEADLESS_RUNTIME = true;
      const script = document.createElement('script');
      script.src = entry;
      script.async = true;
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('Could not load LUNO-safe Lampa runtime bundle'));
        document.head.appendChild(script);
      });
      const api = window.Lampa;
      const missing = [];
      if (window.LUNO_RUNTIME_READY !== true) missing.push('LUNO_RUNTIME_READY');
      if (!api) missing.push('window.Lampa');
      if (api && !api.Api) missing.push('Lampa.Api');
      if (api && !api.Parser) missing.push('Lampa.Parser');
      if (api && !api.Player) missing.push('Lampa.Player');
      if (missing.length) {
        const loadedScript = script.src || entry;
        throw new Error(
          'LUNO runtime API check failed: ' + missing.join(', ') +
          '. Runtime URL: ' + loadedScript +
          '. Ready marker: ' + String(window.LUNO_RUNTIME_READY) +
          '. Lampa keys: ' + (api ? Object.keys(api).slice(0, 30).join(', ') : 'none')
        );
      }
      runtime = api;
      emit('runtime:ready', {version: config.runtimeVersion || 'unknown'});
      return runtime;
    })().catch(error => {
      runtimePromise = null;
      emit('runtime:error', error);
      throw error;
    });
    return runtimePromise;
  }
  function callbackCall(target, method, params = {}) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const done = value => { if (!settled) { settled = true; resolve(value); } };
      const fail = error => { if (!settled) { settled = true; reject(error || new Error(method + ' failed')); } };
      try {
        const fn = target && target[method];
        if (typeof fn !== 'function') return fail(new Error('Unsupported runtime API: ' + method));
        const returned = fn(params, done, fail);
        if (returned && typeof returned.then === 'function') returned.then(done, fail);
      } catch (e) { fail(e); }
    });
  }
  async function catalog(params = {}) {
    const api = await loadRuntime();
    return callbackCall(api.Api, params.category ? 'category' : 'main', params);
  }
  async function search(query) {
    const api = await loadRuntime();
    return callbackCall(api.Api, 'search', {query: String(query || '').trim()});
  }
  async function details(params = {}) {
    const api = await loadRuntime();
    return callbackCall(api.Api, 'full', params);
  }
  async function loadPlugins() {
    const api = await loadRuntime();
    if (!api.Utils || typeof api.Utils.putScriptAsync !== 'function') {
      throw new Error('Runtime plugin loader is unavailable');
    }
    const urls = Array.isArray(config.plugins) ? config.plugins : [];
    const results = [];
    for (const originalUrl of urls) {
      if (pluginState.get(originalUrl) === 'loaded') {
        results.push({url: originalUrl, status: 'loaded'});
        continue;
      }
      pluginState.set(originalUrl, 'loading');
      pluginErrors.delete(originalUrl);
      const url = location.protocol === 'https:' && /^http:\/\//i.test(originalUrl)
        ? originalUrl.replace(/^http:\/\//i, 'https://') : originalUrl;
      try {
        await new Promise((resolve, reject) => {
          let settled = false;
          const timer = window.setTimeout(() => finish(new Error('Plugin load timed out')), 12000);
          const finish = (error) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timer);
            error ? reject(error) : resolve();
          };
          try {
            api.Utils.putScriptAsync([url], false,
              () => finish(new Error('Plugin failed to load: ' + originalUrl)),
              () => finish(),
              false);
          } catch (error) { finish(error); }
        });
        pluginState.set(originalUrl, 'loaded');
        results.push({url: originalUrl, status: 'loaded'});
      } catch (error) {
        pluginState.set(originalUrl, 'error');
        pluginErrors.set(originalUrl, error.message || String(error));
        results.push({url: originalUrl, status: 'error', error: pluginErrors.get(originalUrl)});
        emit('plugin:error', {url: originalUrl, error: pluginErrors.get(originalUrl)});
      }
    }
    emit('plugins:ready', results);
    const cub = urls.find(url => /cub\.red\/plugin\/tmdb-proxy/i.test(url));
    const z01 = urls.find(url => /z01\.online\/online\.js/i.test(url));
    if (cub && z01 && pluginState.get(cub) === 'loaded' && pluginState.get(z01) === 'loaded') {
      emit('plugins:dependencies-ready', {cub, z01});
    }
    return results;
  }
  function pluginDiagnostics() {
    const urls = Array.isArray(config.plugins) ? config.plugins : [];
    return urls.map(url => ({url, status: pluginState.get(url) || 'not-loaded', error: pluginErrors.get(url) || null}));
  }
  window.LunoLampa = Object.freeze({
    on, loadRuntime, catalog, search, details, loadPlugins, pluginDiagnostics,
    status: () => runtime ? 'ready' : config.runtimeEntry ? 'configured' : 'not-configured',
    config: Object.freeze({plugins: config.plugins || []})
  });
})();
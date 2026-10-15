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
      let runtimeExecutionError = null;
      const captureRuntimeError = event => {
        const target = event && event.filename ? String(event.filename) : '';
        if (target && target.indexOf('luno-runtime.js') !== -1) {
          runtimeExecutionError = {
            message: event.message || 'Unknown runtime execution error',
            line: event.lineno || 0,
            column: event.colno || 0,
            filename: target
          };
        }
      };
      window.addEventListener('error', captureRuntimeError);
      const script = document.createElement('script');
      script.src = entry;
      script.async = true;
      try {
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Could not load LUNO-safe Lampa runtime bundle'));
          document.head.appendChild(script);
        });
      } finally {
        window.removeEventListener('error', captureRuntimeError);
      }
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
          '. Lampa keys: ' + (api ? Object.keys(api).slice(0, 30).join(', ') : 'none') +
          '. Runtime execution error: ' + (runtimeExecutionError
            ? runtimeExecutionError.message + ' at ' + runtimeExecutionError.line + ':' + runtimeExecutionError.column
            : 'not captured')
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
  // A successful script request does not prove that Z01 registered its online
  // manifest. Inspect the runtime registry separately before attempting launch.
  function onlinePluginDiagnostics() {
    const api = runtime || window.Lampa;
    const manifests = api && api.Manifest && Array.isArray(api.Manifest.plugins) ? api.Manifest.plugins : [];
    const matches = manifests.filter(item => {
      const value = [item && item.name, item && item.description, item && item.component, item && item.url]
        .filter(Boolean).join(' ');
      return /z01|lampac|online/i.test(value) && (item.type === 'video' || typeof item.onContextLauch === 'function');
    });
    return {
      scriptLoaded: pluginState.get('http://z01.online/online.js') === 'loaded',
      runtimeReady: Boolean(api && api.Manifest && api.Activity && api.Component && api.Player),
      registered: matches.length > 0,
      manifests: matches.map(item => ({
        name: item.name || '',
        description: item.description || '',
        component: item.component || '',
        type: item.type || '',
        hasLaunchHook: typeof item.onContextLauch === 'function',
        hasContextMenu: typeof item.onContextMenu === 'function'
      }))
    };
  }
  let playbackCapture = null;
  let playbackCaptureTimer = null;
  function armPlaybackCapture(timeoutMs = 90000) {
    const api = runtime || window.Lampa;
    if (!api || !api.Player || typeof api.Player.play !== 'function') {
      throw new Error('Lampa.Player.play is unavailable; cannot bridge a resolved stream to LUNO.');
    }
    if (playbackCapture) clearTimeout(playbackCaptureTimer);
    const original = api.Player.play;
    const capture = params => {
      const value = params && typeof params === 'object' ? params : {url: params};
      const url = typeof value.url === 'string' ? value.url.trim() : '';
      if (!url) return original.apply(api.Player, arguments);
      const stream = {
        url,
        title: value.title || value.name || '',
        quality: value.quality || value.quality_name || '',
        subtitles: value.subtitles || null,
        playlist: value.playlist || null,
        headers: value.headers || null,
        raw: value
      };
      emit('stream:resolved', stream);
      if (playbackCapture) playbackCapture(stream);
      // Prevent the Lampa player from taking over; LUNO owns playback.
      return undefined;
    };
    api.Player.play = capture;
    playbackCapture = null;
    playbackCaptureTimer = window.setTimeout(() => {
      if (api.Player.play === capture) api.Player.play = original;
      playbackCapture = null;
      playbackCaptureTimer = null;
    }, timeoutMs);
    return {
      cancel() {
        if (api.Player.play === capture) api.Player.play = original;
        clearTimeout(playbackCaptureTimer);
        playbackCapture = null;
        playbackCaptureTimer = null;
      },
      wait() {
        return new Promise((resolve, reject) => {
          playbackCapture = stream => {
            if (api.Player.play === capture) api.Player.play = original;
            clearTimeout(playbackCaptureTimer);
            playbackCapture = null;
            playbackCaptureTimer = null;
            resolve(stream);
          };
          playbackCaptureTimer = window.setTimeout(() => {
            if (api.Player.play === capture) api.Player.play = original;
            playbackCapture = null;
            playbackCaptureTimer = null;
            reject(new Error('Z01 did not pass a video URL to Lampa.Player.play within the timeout.'));
          }, timeoutMs);
        });
      }
    };
  }
  let hiddenActivityHost = null;
  let activityInitialized = false;
  function prepareHiddenActivityHost(api) {
    if (!api.Activity || typeof api.Activity.init !== 'function' ||
        !api.Activity.render || typeof api.Activity.render !== 'function') {
      throw new Error('Lampa Activity lifecycle API is unavailable.');
    }
    if (!activityInitialized) {
      // Initialize only the services needed by plugin activities. Do not call
      // loadApp()/Render.app(), and skip Activity's default home-screen launch.
      api.Platform?.init?.();
      api.Params?.init?.();
      api.Controller?.observe?.();
      api.Keypad?.init?.();
      api.Layer?.init?.();
      api.Head?.init?.();
      api.Activity.init(true);
      activityInitialized = true;
    }
    if (!hiddenActivityHost) {
      hiddenActivityHost = document.createElement('div');
      hiddenActivityHost.id = 'luno-hidden-lampa-activity-host';
      hiddenActivityHost.setAttribute('aria-label', 'Выбор источника видео');
      // The Z01 source/balancer flow is interactive. An offscreen activity
      // prevents users from selecting a source, so show it only during launch.
      hiddenActivityHost.style.cssText = 'display:none;position:fixed;left:-100000px;top:0;width:100%;height:100%;overflow:hidden;visibility:hidden;pointer-events:none;z-index:-1;';
      const activityRoot = api.Activity.render();
      if (!activityRoot) throw new Error('Lampa Activity did not create its activity root.');
      hiddenActivityHost.appendChild(activityRoot);
      document.body.appendChild(hiddenActivityHost);
    }
    return hiddenActivityHost;
  }
  function showOnlineActivityHost() {
    if (!hiddenActivityHost) return;
    hiddenActivityHost.style.display = 'block';
    hiddenActivityHost.setAttribute('aria-hidden', 'false');
  }
  function hideOnlineActivityHost() {
    if (!hiddenActivityHost) return;
    hiddenActivityHost.style.display = 'none';
    hiddenActivityHost.setAttribute('aria-hidden', 'true');
  }
  async function launchOnline(item, options = {}) {
    const api = await loadRuntime();
    await loadPlugins();
    const diagnostics = onlinePluginDiagnostics();
    const manifest = diagnostics.manifests.length
      ? (api.Manifest.plugins || []).find(entry => diagnostics.manifests.some(m =>
          m.component === (entry.component || '') && m.name === (entry.name || '') &&
          typeof entry.onContextLauch === 'function'))
      : null;
    if (!manifest || typeof manifest.onContextLauch !== 'function') {
      throw new Error('Z01 online manifest has no launch hook.');
    }
    if (!api.Activity || typeof api.Activity.push !== 'function' ||
        !api.Component || typeof api.Component.add !== 'function') {
      throw new Error('Lampa Activity/Component APIs are unavailable.');
    }
    prepareHiddenActivityHost(api);
    const card = {
      ...item,
      title: item.title || item.name || item.original_title || item.original_name || '',
      name: item.name || item.title || '',
      original_title: item.original_title || item.title || item.name || '',
      original_name: item.original_name || item.name || item.title || '',
      media_type: item.media_type || (item.first_air_date || item.name ? 'tv' : 'movie'),
      source: item.source || 'tmdb'
    };
    const capture = armPlaybackCapture(options.timeoutMs || 90000);
    const streamPromise = capture.wait();
    try {
      // Keep the Lampa activity UI offscreen. LUNO presents its own source picker;
      // the hidden Z01 activity is only used to resolve a real playback URL.
      hideOnlineActivityHost();
      manifest.onContextLauch(card);
      const stream = await streamPromise;
      return {
        url: stream.url,
        title: stream.title || card.title,
        quality: stream.quality,
        subtitles: stream.subtitles,
        headers: stream.headers,
        raw: stream.raw
      };
    } catch (error) {
      capture.cancel();
      const message = error && error.message || String(error);
      const trace = error && error.stack ? String(error.stack).split('\\n').slice(0, 5).join(' | ') : '';
      throw new Error('Z01 launch failed: ' + message + (trace ? ' [' + trace + ']' : ''));
    } finally {
      hideOnlineActivityHost();
    }
  }
  window.LunoLampa = Object.freeze({
    on, loadRuntime, catalog, search, details, loadPlugins, pluginDiagnostics, onlinePluginDiagnostics, launchOnline, armPlaybackCapture,
    status: () => runtime ? 'ready' : config.runtimeEntry ? 'configured' : 'not-configured',
    config: Object.freeze({plugins: config.plugins || []})
  });
})();
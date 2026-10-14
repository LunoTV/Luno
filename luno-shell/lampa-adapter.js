/* LUNO ↔ Lampa boundary.
 * This file intentionally does not load Lampa's stock UI. A built, pinned Lampa
 * runtime must be supplied by the build pipeline before runtime operations work.
 */
(() => {
  const config = window.LUNO_CONFIG || {};
  const listeners = new Map();
  let runtime = null;
  let runtimePromise = null;

  function emit(name, detail) {
    (listeners.get(name) || []).forEach(fn => { try { fn(detail); } catch (e) { console.error(e); } });
  }
  function on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => listeners.get(name)?.delete(fn);
  }
  async function loadRuntime() {
    if (runtime) return runtime;
    if (runtimePromise) return runtimePromise;
    runtimePromise = (async () => {
      const entry = config.runtimeEntry;
      if (!entry) throw new Error('LUNO runtime is not built yet. Configure runtimeEntry to a pinned, same-origin Lampa runtime bundle.');
      const script = document.createElement('script');
      script.src = entry;
      script.async = true;
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('Could not load Lampa runtime bundle'));
        document.head.appendChild(script);
      });
      const api = window.Lampa;
      if (!api) throw new Error('Runtime bundle loaded but window.Lampa API was not exposed');
      runtime = api;
      emit('runtime:ready', {version: config.runtimeVersion || 'unknown'});
      return runtime;
    })().catch(error => { runtimePromise = null; emit('runtime:error', error); throw error; });
    return runtimePromise;
  }
  async function call(method, ...args) {
    const api = await loadRuntime();
    const parts = String(method).split('.');
    let target = api;
    for (const part of parts.slice(0, -1)) target = target?.[part];
    const fn = target?.[parts[parts.length - 1]];
    if (typeof fn !== 'function') throw new Error('Unsupported Lampa adapter method: ' + method);
    return fn.apply(target, args);
  }
  window.LunoLampa = Object.freeze({
    on, loadRuntime, call,
    status: () => runtime ? 'ready' : config.runtimeEntry ? 'configured' : 'not-configured',
    config: Object.freeze({plugins: config.plugins || []})
  });
})();
(function(global){
  'use strict';

  /*
   * LUNO CORE
   * ----------
   * UI-free application runtime.
   *
   * This layer owns state, storage, events, routing, focus and remote/keyboard
   * input. It deliberately does not create LUNO screens, cards, styles or
   * player UI. Lampa core sources are imported separately by the Pages build
   * and will be adapted behind this API.
   */

  const VERSION = '1.0.0-core-rebuild';
  const STORAGE_KEY = 'luno_core_v4';

  const safeRead = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
    } catch (_) {
      return {};
    }
  };

  const safeWrite = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  };

  const clone = value => {
    if (value === undefined) return undefined;
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
  };

  const state = {
    version: VERSION,
    route: 'home',
    stack: [],
    focus: {},
    settings: {},
    data: {},
    ...safeRead()
  };

  // Normalize persisted state so older LUNO sessions can never break startup.\n  if (!state || typeof state !== 'object' || Array.isArray(state)) {\n    state.route = 'home';\n  }\n  if (typeof state.route !== 'string' || !state.route || state.route.length > 512 || /[\u0000-\u001f]/.test(state.route)) state.route = 'home';\n  if (!Array.isArray(state.stack)) state.stack = [];\n  if (!state.focus || typeof state.focus !== 'object' || Array.isArray(state.focus)) state.focus = {};\n  if (!state.settings || typeof state.settings !== 'object' || Array.isArray(state.settings)) state.settings = {};\n  if (!state.data || typeof state.data !== 'object' || Array.isArray(state.data)) state.data = {};\n\n  const listeners = new Map();

  const emit = (name, payload) => {
    const list = listeners.get(name);
    if (list) list.slice().forEach(fn => {
      try { fn(payload); } catch (error) { setTimeout(() => { throw error; }); }
    });
    try {
      global.dispatchEvent(new CustomEvent('luno:' + name, { detail: payload }));
    } catch (_) {}
  };

  const on = (name, fn) => {
    if (typeof fn !== 'function') return () => {};
    const list = listeners.get(name) || [];
    list.push(fn);
    listeners.set(name, list);
    return () => {
      const current = listeners.get(name) || [];
      listeners.set(name, current.filter(item => item !== fn));
    };
  };

  const setState = (patch) => {
    Object.assign(state, clone(patch) || {});
    safeWrite(state);
    emit('state', clone(state));
    return state;
  };

  const storage = {
    get(key, fallback = null) {
      const value = state.data[key];
      return value === undefined ? fallback : clone(value);
    },
    set(key, value) {
      state.data[key] = clone(value);
      safeWrite(state);
      emit('storage', { key, value: clone(value) });
      return value;
    },
    remove(key) {
      delete state.data[key];
      safeWrite(state);
      emit('storage', { key, removed: true });
    },
    clear() {
      state.data = {};
      safeWrite(state);
      emit('storage', { clear: true });
    }
  };

  const validRoute = route =>
    typeof route === 'string' &&
    route.length > 0 &&
    route.length <= 512 &&
    !/[\u0000-\u001f]/.test(route);

  const router = {
    current: () => state.route,
    stack: () => state.stack.slice(),
    go(route, options = {}) {
      if (!validRoute(route)) return false;
      if (route === state.route && !options.force) return false;

      const previous = state.route;
      const nextStack = state.stack.slice();
      if (!options.replace) {
        if (previous && previous !== route) nextStack.push(previous);
      }

      while (nextStack.length > 50) nextStack.shift();

      state.route = route;
      state.stack = nextStack;
      safeWrite(state);

      emit('navigate', {
        route,
        previous,
        stack: state.stack.slice(),
        replace: !!options.replace
      });
      return true;
    },
    replace(route) {
      return this.go(route, { replace: true, force: true });
    },
    back() {
      if (!state.stack.length) {
        if (state.route === 'home') return false;
        return this.replace('home');
      }

      const route = state.stack.pop() || 'home';
      const previous = state.route;
      state.route = route;
      safeWrite(state);

      emit('navigate', {
        route,
        previous,
        stack: state.stack.slice(),
        back: true
      });
      return true;
    },
    reset(route = 'home') {
      state.route = validRoute(route) ? route : 'home';
      state.stack = [];
      safeWrite(state);
      emit('navigate', { route: state.route, previous: null, stack: [] });
    }
  };

  const focus = {
    key(element) {
      if (!element) return '';
      return element.dataset?.focusKey ||
        element.dataset?.id ||
        element.dataset?.route ||
        element.dataset?.nav ||
        element.id ||
        '';
    },
    remember(scope, key) {
      if (!scope || !key) return;
      state.focus[scope] = String(key);
      safeWrite(state);
      emit('focus', { scope, key: String(key) });
    },
    remembered(scope) {
      return state.focus[scope] || '';
    },
    move(container, active, direction) {
      if (!container || !active) return null;
      const items = [...container.querySelectorAll('button,input,[tabindex="0"]')]
        .filter(item => item !== active && item.offsetParent !== null);
      const a = active.getBoundingClientRect();
      const ax = a.left + a.width / 2;
      const ay = a.top + a.height / 2;
      const candidates = items.map(item => {
        const b = item.getBoundingClientRect();
        const bx = b.left + b.width / 2;
        const by = b.top + b.height / 2;
        const dx = bx - ax;
        const dy = by - ay;
        if (direction === 'left' && dx >= -1) return null;
        if (direction === 'right' && dx <= 1) return null;
        if (direction === 'up' && dy >= -1) return null;
        if (direction === 'down' && dy <= 1) return null;
        const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
        const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
        return { item, score: primary * 10 + secondary };
      }).filter(Boolean).sort((a, b) => a.score - b.score);
      return candidates[0]?.item || null;
    },
    set(element, options = {}) {
      if (!element || typeof element.focus !== 'function') return false;
      const key = this.key(element);
      if (options.scope && key) this.remember(options.scope, key);
      try { element.focus({ preventScroll: !!options.preventScroll }); }
      catch (_) { element.focus(); }
      if (options.scroll !== false && element.scrollIntoView) {
        try {
          element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
        } catch (_) {}
      }
      emit('focus', { element, key, scope: options.scope || null });
      return true;
    }
  };

  const controller = (() => {
    const bindings = new Map();
    let enabled = true;

    const normalize = key => ({
      Esc: 'Escape',
      Back: 'Backspace',
      OK: 'Enter',
      Return: 'Enter'
    }[key] || key);

    const bind = (key, handler) => {
      const normalized = normalize(key);
      if (!bindings.has(normalized)) bindings.set(normalized, []);
      bindings.get(normalized).push(handler);
      return () => {
        const list = bindings.get(normalized) || [];
        bindings.set(normalized, list.filter(fn => fn !== handler));
      };
    };

    const dispatch = event => {
      if (!enabled) return false;
      const key = normalize(event?.key || '');
      const list = bindings.get(key) || [];
      let handled = false;
      list.slice().forEach(handler => {
        try {
          if (handler(event) === true) handled = true;
        } catch (error) {
          setTimeout(() => { throw error; });
        }
      });
      if (handled) {
        try { event.preventDefault(); } catch (_) {}
      }
      return handled;
    };

    global.addEventListener('keydown', dispatch, true);

    return {
      bind,
      dispatch,
      enable() { enabled = true; },
      disable() { enabled = false; },
      enabled: () => enabled
    };
  })();

  const bindDefaultTvNavigation = () => {
    ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].forEach(key => {
      controller.bind(key, event => {
        if (!platform.tv()) return false;
        const active = document.activeElement;
        const scope = active?.closest?.('[data-focus-container]');
        if (!active || !scope) return false;
        const direction = key.slice(5).toLowerCase();
        let target = focus.move(scope, active, direction);
        if (!target) {
          const globalScope = document.querySelector('.screen-host');
          if (globalScope) target = focus.move(globalScope, active, direction);
        }
        if (!target) {
          const globalItems = [...document.querySelectorAll('.luno-app button,input,[tabindex="0"]')]
            .filter(item => item !== active && item.offsetParent !== null && !item.disabled);
          const a = active.getBoundingClientRect();
          const ax = a.left + a.width / 2;
          const ay = a.top + a.height / 2;
          const candidates = globalItems.map(item => {
            const b = item.getBoundingClientRect();
            const bx = b.left + b.width / 2;
            const by = b.top + b.height / 2;
            const dx = bx - ax;
            const dy = by - ay;
            if (direction === 'left' && dx >= -1) return null;
            if (direction === 'right' && dx <= 1) return null;
            if (direction === 'up' && dy >= -1) return null;
            if (direction === 'down' && dy <= 1) return null;
            const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy);
            const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
            return { item, score: primary * 10 + secondary };
          }).filter(Boolean).sort((a,b)=>a.score-b.score);
          target = candidates[0]?.item || null;
        }
        if (!target) return false;
        focus.set(target, {
          scope: target.closest('[data-focus-container]')?.dataset.focusContainer || 'screen',
          preventScroll: false
        });
        return true;
      });
    });

    controller.bind('Escape', () => router.back());
    controller.bind('Backspace', event => {
      const el = document.activeElement;
      if (el && (el.matches('input,textarea') || el.isContentEditable)) {
        const value = typeof el.value === 'string' ? el.value : el.textContent || '';
        const atStart = typeof el.selectionStart === 'number' ? el.selectionStart === 0 && el.selectionEnd === 0 : false;
        if (value.length && !atStart) return false;
      }
      return router.back();
    });
  };

  const platform = {
    width: () => global.innerWidth || document.documentElement.clientWidth || 0,
    height: () => global.innerHeight || document.documentElement.clientHeight || 0,
    touch: () => ('ontouchstart' in global) || navigator.maxTouchPoints > 0,
    tv() {
      const ua = navigator.userAgent || '';
      return /(smart-tv|smarttv|hbbtv|webos|tizen|netcast|viera|bravia|googletv|android tv|androidtv|tv;)/i.test(ua) ||
        (this.width() >= 800 && this.height() >= 450 && this.width() / Math.max(this.height(), 1) >= 1.45);
    }
  };

  const lifecycle = {
    start() {
      emit('ready', { version: VERSION });
      return api;
    },
    destroy() {
      emit('destroy');
    }
  };

  const api = {
    version: VERSION,
    state,
    setState,
    on,
    emit,
    storage,
    router,
    focus,
    controller,
    platform,
    lifecycle
  };

  global.LunoCore = api;
  bindDefaultTvNavigation();
  lifecycle.start();

})(window);

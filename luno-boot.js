/* LUNO startup integration: ES5-compatible for TV WebViews. */
(function () {
  'use strict';
  var state = { started: false, z01: 'pending' };
  window.LUNO = window.LUNO || {};
  window.LUNO.status = function () {
    return { started: state.started, z01: state.z01 };
  };
  function log(message) {
    if (window.console && typeof window.console.info === 'function') window.console.info('[LUNO] ' + message);
  }
  function loadScript(url, done) {
    var script = document.createElement('script');
    var settled = false;
    var timer = window.setTimeout(function () {
      if (settled) return;
      settled = true;
      script.onerror = script.onload = null;
      if (script.parentNode) script.parentNode.removeChild(script);
      done(new Error('timeout: ' + url));
    }, 12000);
    script.async = true;
    script.src = url;
    script.onload = function () {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      done(null);
    };
    script.onerror = function () {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      done(new Error('failed: ' + url));
    };
    (document.head || document.documentElement).appendChild(script);
  }
  function startZ01() {
    if (state.z01 !== 'pending') return;
    state.z01 = 'loading';
    loadScript('https://z01.online/online.js', function (err) {
      if (!err) {
        state.z01 = 'loaded';
        log('Z01 online.js loaded');
        return;
      }
      state.z01 = 'unavailable';
      log('Z01 unavailable over HTTPS; Lampa core was left untouched');
    });
  }
  function start() {
    if (state.started) return;
    state.started = true;
    var attempts = 0;
    var wait = window.setInterval(function () {
      attempts += 1;
      if (window.Lampa && window.Lampa.Utils) {
        window.clearInterval(wait);
        startZ01();
      } else if (attempts >= 40) {
        window.clearInterval(wait);
        state.z01 = 'lampa-not-ready';
        log('Lampa API was not detected; core startup was left untouched');
      }
    }, 250);
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') window.setTimeout(start, 0);
  else if (document.addEventListener) document.addEventListener('DOMContentLoaded', start, false);
  else window.setTimeout(start, 1000);
})();

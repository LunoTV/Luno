window.LUNO_CONFIG = Object.freeze({
  // Set by the build/deployment pipeline after pinning and building upstream Lampa.
  runtimeEntry: null,
  runtimeVersion: null,
  plugins: [
    'http://z01.online/online.js',
    'https://lampaplugins.github.io/store/logo.js',
    'http://cub.red/plugin/tmdb-proxy'
  ]
});
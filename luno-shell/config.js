window.LUNO_CONFIG = Object.freeze({
  // Served by the Pages build pipeline from the pinned Lampa bundle.
  runtimeEntry: './luno-runtime.js',
  runtimeVersion: '3.3.6-luno-runtime',
  // Load CUB before Z01 so its resolver/balancer hooks exist when Z01 initializes.
  plugins: [
    'http://cub.red/plugin/tmdb-proxy',
    'http://z01.online/online.js',
    'https://lampaplugins.github.io/store/logo.js'
  ]
});
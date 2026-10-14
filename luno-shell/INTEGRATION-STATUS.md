# LUNO runtime integration status

## Implemented in this branch
- A separate LUNO UI shell with cosmic-purple design.
- A runtime adapter boundary in `lampa-adapter.js`; it never mounts Lampa's stock UI.
- The agreed plugin inventory in `plugins.json`.

## Not yet complete
The adapter is deliberately fail-closed until a built and pinned Lampa runtime is supplied via `window.LUNO_CONFIG.runtimeEntry`. It does not pretend that Lampa's internals are already available, and it does not guess undocumented APIs for search, catalog, or playback.

## Required integration sequence
1. Pin the upstream `yumata/lampa-source` commit and build it in CI with the repository's documented build task.
2. Publish the generated runtime bundle as a same-origin asset. Review the stock entry point so the Lampa UI is not mounted; preserve runtime/services/source APIs needed by adapters.
3. Add a small, tested LUNO service facade for TMDB metadata, catalog/search, source discovery, and player launch. Keep UI rendering in `luno-shell`.
4. Load the agreed plugin URLs through a plugin manager compatible with the pinned runtime; validate HTTP/mixed-content/CORS behavior. Do not proxy video streams.
5. Add CI checks for build output and smoke tests for runtime readiness, catalog/search, source selection, and playback.

## License
The upstream source declares GPL-2.0. Preserve its license and copyright notices and comply with source/distribution obligations for any derivative distribution.

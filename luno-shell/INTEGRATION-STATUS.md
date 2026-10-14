# LUNO runtime integration status

## Implemented in this branch
- Separate LUNO UI shell with the cosmic-purple design.
- Runtime adapter boundary in `lampa-adapter.js`; it does not intentionally mount Lampa's stock UI.
- The agreed plugin inventory in `plugins.json`.
- Root `src/` matches the upstream `yumata/lampa-source` entrypoint currently pinned below.

## Upstream baseline
- Repository: https://github.com/yumata/lampa-source
- Pinned commit: `5d715fc76667f988ff3d6a9e1ff5994e7856f234`
- License declared upstream: GPL-2.0; preserve copyright/license notices and meet source-distribution obligations for derivative builds.

## Verified integration blocker
The upstream `src/app.js` exposes `window.Lampa`, but it also runs `Render.app()` inside `startApp()`, which mounts the stock Lampa interface. Loading the normal `app.js` bundle directly into the LUNO page would therefore violate the requirement that users never see Lampa UI. The adapter remains fail-closed while the runtime entry is unset; do not point it at the normal stock bundle.

## Not yet complete
- A separate runtime build/entrypoint that initializes the required Lampa services without mounting the stock UI.
- A tested LUNO service facade for metadata, catalog/search, source discovery, and player launch.
- Loading and validating the three agreed plugins against the pinned runtime.
- CI smoke tests for runtime readiness, catalog/search, source selection, and playback.
- Production deployment of the LUNO shell. The current Pages workflow still builds and deploys the stock Lampa distribution; do not switch it to the incomplete shell or claim the player is ready.

## Required integration sequence
1. Create a dedicated runtime entrypoint based on the pinned upstream source, preserving the needed core/services/source APIs while replacing the stock UI render path.
2. Build and publish that runtime as a same-origin asset.
3. Add a small, tested LUNO service facade for TMDB metadata, catalog/search, source discovery, and player launch. Keep UI rendering in `luno-shell`.
4. Load exactly the agreed plugins:
   - `http://z01.online/online.js` — online source
   - `https://lampaplugins.github.io/store/logo.js` — logos
   - `http://cub.red/plugin/tmdb-proxy` — TMDB metadata proxy, not a video-stream proxy
5. Validate browser mixed-content/CORS constraints and actual playback without proxying video streams through a Worker.
6. Add CI smoke tests before changing the production Pages workflow.


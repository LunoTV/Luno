# LUNO

LUNO is a Russian-first streaming interface for mobile Safari, desktop browsers and remote-controlled TVs.

## Architecture

- `index.html` — stable UI integration points for the app controller.
- `ui/luno.css` — the single responsive UI stylesheet for Home, catalog, search, detail, settings and playback surfaces.
- `app.js` — app orchestration and UI state; `source-engine.js` owns stream resolution and playback integration.
- `sources/` — source registry, adapter loading, stream normalization, quality selection, subtitles and request policy.
- `runtime/` — headless Lampa metadata and online-source adapters. Lampa's UI is not shown to users.
- `scripts/build-tmdb-catalog.mjs` — generates the catalog dataset from TMDB during the production build.
- `worker/` — the separate Cloudflare API worker.
- `ui/remote-navigation.js` — directional navigation for remotes and keyboards.

## Preserved runtime contracts

The UI rebuild deliberately preserves player element IDs, source/runtime modules, HLS and DASH dependencies, TMDB catalog generation, and Worker deployment configuration. UI markup can change, but these integration contracts must remain covered by regression tests.

## Development

```sh
npm install
npm test
npm run dev
```

The production build requires `TMDB_API_TOKEN` to generate the current catalog. GitHub Actions builds the Pages artifact, bundles the pinned headless Lampa runtimes, verifies the catalog, and deploys to GitHub Pages.

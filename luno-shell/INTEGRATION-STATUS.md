# LUNO runtime integration status

## Implemented
- Standalone cosmic-purple LUNO shell scaffold.
- Runtime adapter with service methods for catalog, search, details, and loading the agreed plugin list.
- Exact plugin inventory stored in config and plugin manifest.
- Upstream baseline pinned for reproducible work: `yumata/lampa-source@5d715fc76667f988ff3d6a9e1ff5994e7856f234`.

## Important boundary
The upstream `src/app.js` creates `window.Lampa`, but its normal startup calls `Render.app()` and mounts the Lampa interface. Therefore the stock bundle must not be loaded in the LUNO page. `runtimeEntry` remains unset until a separate LUNO-safe runtime build exists.

## Not yet working end-to-end
- Runtime bundle is not yet built or published.
- Catalog/search UI still displays scaffold content and is not yet connected to the facade.
- Z01 source discovery and playback have not been smoke-tested.
- Production Pages still deploys the old upstream Lampa distribution.

## Next engineering steps
1. Build a dedicated entrypoint from the pinned upstream source, retaining required core/service/source APIs while avoiding stock UI startup.
2. Publish it same-origin and set `runtimeEntry` to that verified bundle.
3. Wire the LUNO catalogue/search UI to the adapter and add a player bridge.
4. Validate the three plugins in a browser and test actual playback.
5. Add CI smoke tests before changing production deployment.

## Plugin list
- `http://z01.online/online.js` — online source
- `https://lampaplugins.github.io/store/logo.js` — logos
- `http://cub.red/plugin/tmdb-proxy` — TMDB metadata proxy only, not a stream proxy

## License
The upstream source declares GPL-2.0. Preserve its copyright/license notices and comply with source-distribution obligations for derivative builds.

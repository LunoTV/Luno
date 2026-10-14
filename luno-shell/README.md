# LUNO shell — cosmic purple

This folder is an isolated first UI scaffold based on the supplied mobile references. It establishes the navigation and visual system without embedding the Lampa UI.

## Design tokens
- Background: `#0D0A14`
- Surfaces: `#18121F` and `#24162F`
- Deep purple: `#7542B8`
- Soft glow: `#B56BFF`

## Current state
- Responsive shell and five-tab floating navigation.
- Home, catalogue, search, watchlist, and profile screen scaffolds.
- Placeholder poster artwork and content only.

## Not yet integrated
The Lampa runtime, real catalog/search APIs, source plugins, TMDB data, playback, user storage, and plugin management are not yet connected. Do not present this scaffold as a functioning streaming app until those paths are implemented and tested.

## Required architecture
LUNO owns the user-facing UI. Lampa mechanisms are integrated behind an adapter boundary, with its stock UI excluded. Do not proxy video streams through a Cloudflare Worker. Preserve the agreed plugins:
- `http://z01.online/online.js`
- `https://lampaplugins.github.io/store/logo.js`
- `http://cub.red/plugin/tmdb-proxy`

Before shipping, review plugin trust/CORS/mixed-content constraints and the applicable Lampa GPL-2.0 obligations.
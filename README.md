# LUNO

LUNO is a self-hosted Lampa build with a Prisma-inspired visual theme and a small compatibility layer for the Z01 online plugin.

## Principles

- Keep the upstream Lampa application and its native plugin system as the runtime.
- Layer visual changes on top; do not replace search, metadata, voice tracks, balancers, CUB authorization, or playback with mock implementations.
- Load Z01 as an optional provider integration and report failures instead of breaking startup.
- Keep upstream attribution and license information in the deployed build.

## Deployment

GitHub Actions builds the site from the upstream `yumata/lampa` repository, applies the LUNO theme and deploys the result to GitHub Pages.

In GitHub, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. Then run the **Deploy LUNO** workflow from the Actions tab (or push a change).

The build tracks the upstream `main` branch. Each deployment therefore picks up upstream changes; inspect workflow results after every build.

## Z01

The loader uses Lampa's plugin API when available and attempts to load the published Z01 scripts. Source availability and protocol compatibility depend on the Z01 service. The loader never fakes a successful provider registration.

## License

Lampa remains under the upstream project's GPL-2.0 license. LUNO theme and integration files are provided separately; see upstream license/attribution in the deployed site.

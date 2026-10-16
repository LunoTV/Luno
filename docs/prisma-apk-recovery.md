# Prisma APK recovery — extraction results (2026-10-16)

## What I extracted

Source archive: `prisma-recovery/Prisma.v1.3.4.apk.download`
SHA-256: `d8cfe6eff8daf2133daabbb181027b8401d55b7a43f1aa4635354c778c507e0d`

The APK ZIP has 1,541 entries: 5 under `assets/`, 31 native libraries under `lib/`, and 1,410 Android resources under `res/`.

Relevant non-Android asset:
- `assets/cineplex.ttf` (79,464 bytes)

Web-like resources found under `assets/` and `res/`:
- `assets/cineplex.ttf`
- `res/Ox.js` (257 bytes)
- `res/RV.ttf` (3,316 bytes)
- `res/uD.js` (5,134 bytes)

No `index.html`, complete app JavaScript bundle, or app CSS was found in the APK. The APK's JavaScript snippets are integration code for its WebView, not a complete website.

## Captured browser files

The existing capture contains:
- `app.min(2).js` and `app.min(3).js`: identical app bundle, 2,357,961 bytes each, SHA-256 prefix `928979b252ff5ced`.
- `app.min(1).js`: older/different bundle, 2,345,084 bytes, SHA-256 prefix `d9b1ce78983cde43`.
- Supporting scripts: `dash.js`, `hls(1).js`, `jquery.js`, `jquery.scrollbar.min.js`, `keypad.js`, `navigator.js`, `notify.js`, `qrcode.js`, `webOSTV.js`, plus worker scripts.
- The bundle contains references to `./img/logos.svg`, `./img/img_load.svg`, `./img/logo.svg`, and `./css/app.css?v...`; these files were not in the supplied capture.

The newer bundle includes references to Luno-specific hosts/configuration and calls to the Android bridge. It is not safe to describe it as a clean, standalone official Prisma distribution.

## Android-only dependencies

The web bundle checks for `AndroidJS` before using several Android-only functions. Its native HTTP helper reports `No Native request` when the required Android bridge is absent. Other native-only functions include opening external/native players, torrent links, voice control, and app exit. A browser build can omit those native functions, but API-dependent flows need to be tested and cannot be assumed to work merely because the UI starts.

## What this means

The APK can be unpacked and Android-only code/resources can be separated, but it does not itself contain the full web application. The captured browser bundle is the promising part; the missing CSS, image/sprite assets, and any required configuration/runtime dependencies are the current blockers for a reproducible build.

No incomplete or mocked build has been published as a working Prisma app. The next build step requires the matching `css/app.css`, referenced `img/*` assets, and a tested browser-compatible request path, or an authorized complete web distribution.

# Prisma web capture audit

Status: captured browser resources are not yet a complete standalone web distribution.

## Captured files inspected
- `app.min(1).js`: 2,417,875 bytes; SHA-256 prefix `d9b1ce78983cde43`; identifies app version 3.6.9 and CSS version 3.4.4.
- `app.min(2).js` and `app.min(3).js`: both 2,431,112 bytes and identical SHA-256 `928979b252ff5ced`; identify app version 3.7.2 and CSS version 3.4.5.
- Supporting scripts captured: jQuery, scrollbar, HLS.js, dash.js, QR code, keypad, navigator, notifications, and webOS TV bridge.

## Important findings
- The app bundle contains Luno-specific configuration and host references, including `luno.ws`, `luno.rip`, and `api.stull.xyz`. It should not be treated as a verified, untouched Prisma release.
- No `index.html`, CSS stylesheet, logo/image directory, fonts, or complete asset tree were present in the inspected local capture.
- The bundle contains inline HTML templates, but that does not replace the missing entry point and stylesheets.
- The app relies on remote APIs/services; a standalone copy cannot be assumed to work merely by placing these JavaScript files on GitHub Pages.
- The captured scripts are not being committed here. Before redistributing a copied web client, verify the project owner's permission/licensing and confirm which files are authorized for republication.

## Next technical requirements
1. Obtain an authorized complete web distribution or written permission from the Prisma project owner.
2. Obtain the entry HTML, all CSS, images/icons/fonts, and any required configuration files.
3. Inventory all runtime network/API dependencies and verify which may be used from a separate domain.
4. Integrate Z01 only after the base app can run reliably, then test playback, navigation, remote control, and browser console/network errors.

This audit records findings only; it does not claim that a working Prisma web deployment has been built.

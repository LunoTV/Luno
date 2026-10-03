# LUNO

Stage 1 is a faithful web packaging of the publicly reachable Prisma Web application.

## Stage 1 rules

- Prisma Web is materialized into `public/`; it is not embedded in an iframe.
- No fake APIs, mock player, or replacement UI is introduced.
- Android-only Prisma runtime components are not copied into the browser build.
- The original Prisma Web remains the source of truth until the application is verified.
- Only after verification will the web layer be transformed incrementally into LUNO.

## Verification target

1. Prisma Web entry point is present.
2. Referenced static assets resolve.
3. The application loads without an iframe.
4. Browser playback/navigation flows are verified before redesign.

# LUNO UI System

The UI is intentionally built from one stylesheet: `ui/luno.css`. Do not reintroduce layered page-specific override files or append emergency `!important` patches. Make a component's base style and responsive rules in the same stylesheet.

## Tokens

- Background: `--bg`
- Surfaces: `--surface`, `--surface-raised`, `--surface-soft`
- Text: `--text`, `--muted`, `--subtle`
- Accents: `--accent`, `--accent-strong`, `--violet`
- Borders: `--line`
- Radius: `--radius`, `--radius-lg`
- Layout: `--content`
- Device insets: `--safe-top`, `--safe-bottom`

## Screen ownership

- Home: featured hero and horizontal poster rails.
- Catalog / Watchlist: library overlay, filters, grid and list renderings.
- Search: focused search surface, genre discovery, history and grouped results.
- Detail: full-screen backdrop, metadata, play/favorite actions and secondary information.
- Player: video stage, episode browser and quality / voice / subtitle / source sheets.
- Settings: section menu and focused settings panels.
- Navigation: shared header, mobile floating tab bar and TV remote sidebar.

## Integration rules

1. Keep the existing element IDs and `data-*` attributes consumed by `app.js` unless the controller and tests are updated in the same change.
2. Preserve the video element `#lunoVideo`, player sheets, source manager, and source-engine modules.
3. Keep the detail artwork as a real image element with explicit loaded/missing states; CSS must not conceal a successfully loaded image.
4. Keep responsive rules for phone Safari, desktop, and large remote-controlled displays in this stylesheet.
5. Respect safe-area insets, visible keyboard/remote focus, and reduced-motion preferences.
6. Test the actual image URL / event flow as well as layout. A successful build is not proof that artwork or playback works.

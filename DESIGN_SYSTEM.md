# LUNO Design System v1.0
Status: APPROVED AND MANDATORY
Approved: 2026-10-10
Scope: Every LUNO screen and component.

This document is the source of truth for visual design. Do not introduce page-specific palettes, button styles, radii, typography, spacing systems, or effects. Ask for approval before deviating.

## Approved palette
- --luno-bg: #08090D — application background
- --luno-surface: #14151D — cards and panels
- --luno-surface-raised: #242334 — raised/selected surfaces
- --luno-violet: #8581AD — primary brand accent and primary actions
- --luno-ice: #8CB8CC — secondary accent
- --luno-text: #E7E8EF — primary text
- --luno-text-muted: #989BAA — secondary text
- --luno-border: #30313C — standard border
- --luno-border-strong: #444452 — stronger interactive border
- --luno-input: #0B0C12 — input background

No neon colors or strong glows. Gradients, if used, must be subtle variations of the approved palette. Poster artwork may retain its natural colors.

## Principles
1. One coherent product across home, search, catalog, detail pages, player, settings, history, source manager, forms, dialogs, and future screens.
2. Balanced density: readable and spacious, without oversized empty areas or cramped controls.
3. Preserve current navigation and information architecture. Unify appearance; do not move/remove navigation without approval.
4. Mobile, desktop, and TV layouts may adapt in geometry but share the same visual identity.
5. Reuse shared styles/components. Avoid one-off CSS that makes pages look different.

## Typography
- Keep the existing app font family; do not add page-specific fonts.
- Page titles: typically 30–40 px desktop, 27–32 px mobile, weight 700–800.
- Section headings: 22–28 px desktop, 20–24 px mobile, weight 650–750.
- Body: 14–16 px; essential mobile text should not fall below 14 px.
- Metadata: 11–13 px using --luno-text-muted.
- Use uppercase, letter-spaced text only for small eyebrow labels.

## Spacing and shape
Use a 4 px scale: 4, 8, 12, 16, 24, 32, 40/48 px.
- Buttons and fields: rounded rectangles, default 12 px radius.
- Cards/panels: 16–20 px radius.
- Pills only for compact tags, filters, and metadata.
- Borders are usually 1 px using --luno-border.
- Keep alignment, page gutters, and card dimensions consistent within each layout.

## Buttons and controls
- Primary: --luno-violet fill, high-contrast text, 44–48 px typical height.
- Secondary: graphite/transparent dark surface, thin border, light text.
- Tertiary/icon: restrained surface; consistent icon size and hit area.
- Provide consistent default, hover, pressed, focus-visible, disabled, loading, and selected states.
- Touch targets should be about 44 × 44 px where practical.
- Icon-only controls need accessible names.
- Do not use thick white outlines, dramatic scaling, flashing, or aggressive glow.

## Navigation and media
- Keep the approved navigation structure.
- Headers, back buttons, search/settings actions, and mobile navigation share consistent dimensions, icon weight, borders, and active states.
- Film/series cards share poster ratio, title, metadata, rating badge, year, spacing, and radius.
- Detail-page artwork may be cinematic, but controls and content panels must follow this system.
- Loading, empty, and error states use the same surfaces, borders, typography, and spacing.

## Forms and settings
- Labels sit above fields; placeholders are not the only labels.
- Inputs use --luno-input, 1 px border, 12 px radius, and a visible focus state.
- Switches, checkboxes, radios, and selects use one shared style throughout settings.
- Dialogs and sheets use the shared surfaces, borders, radius, typography, and restrained overlay.
- Destructive actions must be clearly labelled.

## Motion and accessibility
- Motion is very subtle, usually 140–220 ms.
- No neon glow, constant shimmer, excessive parallax, or decorative motion that competes with content.
- Respect prefers-reduced-motion.
- Use semantic HTML, visible keyboard focus, accessible labels, sufficient contrast, and status cues beyond color alone.
- Every relevant view should consider loading, success, empty, error, disabled, and selected states.

## Responsive rules
- Mobile: readable type, touch-friendly controls, safe-area spacing, one-column layouts where appropriate.
- Tablet: intermediate grids; avoid overstretched cards.
- Desktop: use space deliberately and maintain a consistent content max-width.
- TV: prioritize readable type, clear focus, and generous target areas.
- Breakpoints can change layout, not palette or component identity.

## Mandatory implementation rules
1. Use shared CSS custom properties and shared component styles.
2. Reuse existing equivalent components before creating new ones.
3. A change on one page must not accidentally alter another page's visual language.
4. Do not change palette, density, button shape, effects, or navigation structure without explicit user approval.
5. Do not redesign the entire app as part of an unrelated bug fix.
6. Check mobile and desktop and relevant empty/loading/error/focus states.
7. If code conflicts with this document, migrate it deliberately to this standard; do not add another one-off override.

## Acceptance checklist
- [ ] Approved palette only, apart from natural media artwork and semantic status colors.
- [ ] Shared typography and 4 px spacing scale.
- [ ] Consistent buttons, fields, cards, badges, icons, and navigation.
- [ ] Mobile and desktop considered.
- [ ] Loading, empty, error, focus, and disabled states consistent where applicable.
- [ ] Motion remains subtle and reduced-motion is respected.
- [ ] No unapproved information-architecture or brand change.

Binding decision: this is the mandatory LUNO visual standard for all future design and implementation work. Any deviation must be discussed and approved before code changes.

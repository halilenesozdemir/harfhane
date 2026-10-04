# Visual direction: playful soft 3D tiles

Date: 2026-10-04 · Status: accepted

## Decision
The base visual language is the playful soft 3D direction:
- **Colors:**
  - Cream ground `#FFF4DC`, brand orange `#C2410C`.
  - Tile states: correct `#1F8A5B`, present `#F2B544` (dark text), absent `#7A7A7A`.
- **Type:** Baloo 2 for display, Nunito for body.
- **Shape and depth:** 14px tile radius. Tiles and buttons use a bottom "depth" shadow so they read as pressable.

The warm paper/illumination look ships later as the paid **Kâğıt** theme. Other paid themes, such as Gece and Ahşap, are token sets plus an optional tile texture.

Reference screens (Claude Design canvas): https://claude.ai/artifact/Aw4oDMDfBhwUyrikgvw44L

## Reasons
- The owner preferred this direction.
- It is close to the industry's casual-puzzle language (Duolingo, Wordscapes) and gives Harfhane its own identity. The old UI copied NYT Wordle colors one to one.
- A "theme = token set + tile material" model maps directly onto selling visual themes.

## Consequences
- **Theme tokens:** Game state colors move from hard-coded hex in `apps/frontend/tailwind.config.js` into theme tokens.
- **Single token source:** Web (CSS variables + Tailwind) and mobile (Expo) generate tokens from one source. Implementation plan: frontend-architect report.
- **Accessibility:**
  - Contrast: 4.5:1 for text, 3:1 for large text.
  - A high-contrast, color-blind-safe variant remains.
  - Animations respect `prefers-reduced-motion`.

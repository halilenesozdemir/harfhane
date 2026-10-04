---
title: Design tokens for the playful 3D direction
type: feat
date: 2026-10-04
status: approved
---

# Design tokens for the playful 3D direction

## Goal
Move the UI from hard-coded Wordle colors to the playful soft 3D direction. Themes become token sets, so paid themes need no new component code.

ADR: `docs/decisions/2026-10-04-visual-direction-playful-3d.md`. Reference screens: https://claude.ai/artifact/Aw4oDMDfBhwUyrikgvw44L

## Requirements
- R1. All colors, radii, depth shadows, fonts and motion values come from `--hh-*` CSS variables.
- R2. A theme is one `[data-theme="…"]` block plus an optional tile texture. Built-in themes: light, dark, high-contrast.
- R3. High contrast is selectable and color-blind safe: an orange/blue pair plus a non-color cue on tiles.
- R4. Animations respect `prefers-reduced-motion`.
- R5. The same token source feeds the web (CSS + Tailwind) and mobile (Expo).
- R6. At 1024px and wider, a three-column layout: modes | game | stats.

## Key technical decisions
- KTD1. **Stay on Tailwind 3 for the Android MVP.** Map `theme.extend.colors` to CSS variables. Tailwind 4 comes later, as its own plan.
- KTD2. **shadcn/ui** (Dialog, Sheet, Tabs, Sonner, Tooltip, Switch) replaces the custom modal and toast on web. Game components stay custom. On mobile, react-native-reusables on NativeWind v4.
- KTD3. **Token source:** `packages/ui-tokens/tokens.json`, built by a small script into `tokens.css` and `tokens.ts`. Style Dictionary only if the token set grows.
- KTD4. **Motion:**
  - Tile flip: 500ms, staggered 100ms.
  - Pop: 120ms on `cubic-bezier(.34,1.56,.64,1)`.
  - Button press: 100ms, translateY 2px, depth 4px → 1px.

## Units
- U1. Add `--hh-*` variables to `apps/frontend/src/index.css`, alongside the existing ones.
- U2. Point `correct`, `present` and `absent` in `tailwind.config.js` to tile tokens.
- U3. Make high contrast selectable in `useTheme.ts`. It is defined in CSS today but never applied.
- U4. Add the `prefers-reduced-motion` block. No reduced-motion handling exists today.
- U5. Add `packages/ui-tokens` with the build script.
- U6. Replace the modal and toast with shadcn components (optional before MVP).
- U7. Desktop three-column layout.
- U8. Paid theme registry and the locked-theme UI.
- U9. Tailwind 4 migration (separate plan).

Inspiration for pressable 3D buttons and the theme picker comes from 21st.dev. Use the patterns only, never copied code.

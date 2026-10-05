# Mobile — apps/mobile

Expo Android app (Plan 004, `docs/plans/2026-10-05-004-feat-android-mvp-plan.md`). Extends root CLAUDE.md. Expo's own agent notes are in `AGENTS.md` next to this file: read the versioned Expo docs for the SDK in `package.json`, never answer Expo APIs from memory.

@AGENTS.md

## Rules
- Game rules come only from `@harfhane/shared`; colors and radii only from `@harfhane/ui-tokens`. Styling is `StyleSheet` + tokens (Plan 004 KTD2): read colors with `useTheme()` from `src/ThemeProvider.tsx`. No raw hex in components (Invariant 5).
- Add native or Expo packages with `pnpm exec expo install <pkg>` inside `apps/mobile`, not `pnpm add`.
- Tests: Vitest for logic (`src/**/*.test.ts`), jest-expo + React Native Testing Library for components (`src/**/*.test.tsx`; `render` is async in RNTL 14). `pnpm test` runs both.
- Bundle check without a device: `pnpm --filter @harfhane/mobile run export:android`.
- Running on a phone or emulator: `docs/guides/mobile-run.md`.

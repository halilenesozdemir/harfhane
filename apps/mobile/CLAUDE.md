# Mobile — apps/mobile

Expo Android app (Plan 004, `docs/plans/2026-10-05-004-feat-android-mvp-plan.md`). Extends root CLAUDE.md. Expo's own agent notes are in `AGENTS.md` next to this file: read the versioned Expo docs for the SDK in `package.json`, never answer Expo APIs from memory.

@AGENTS.md

## Rules
- Game rules come only from `@harfhane/shared`; colors and radii only from `@harfhane/ui-tokens` (`src/theme.ts`). No raw hex in components (Invariant 5).
- Add native or Expo packages with `pnpm exec expo install <pkg>` inside `apps/mobile`, not `pnpm add`.
- Tests: Vitest for logic (`src/**/*.test.ts`); component tests arrive with jest-expo (Plan 004 KTD3).
- Bundle check without a device: `pnpm --filter @harfhane/mobile run export:android`.

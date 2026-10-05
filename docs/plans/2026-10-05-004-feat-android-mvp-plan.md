---
title: Android MVP on Expo
type: feat
date: 2026-10-05
status: approved
---

# Android MVP on Expo

## Goal
Track A of `docs/decisions/2026-10-04-parallel-tracks.md`: an Android app with the existing daily and unlimited modes, in the playful 3D style, ready for a closed test on Google Play. The first sale (Plan 005) ships on top of it.

Research: `docs/research/2026-10-05-android-mvp-expo.md`.

## Requirements
- R1. `apps/mobile` is a workspace in this monorepo and joins `pnpm typecheck`, `pnpm lint`, `pnpm test` and the commit gate.
- R2. Game rules come only from `@harfhane/shared`; colors and radii only from `@harfhane/ui-tokens`. Nothing is re-implemented in the app.
- R3. Daily and unlimited modes play end to end against the existing API without signing in; progress survives an app restart.
- R4. Light, dark and high-contrast themes, matching the web tokens.
- R5. The Android build targets API 36 (Play requirement for submissions after 2026-08-31).
- R6. No ads, no "Wordle" in names or store text (Invariants 6, 8).

## Acceptance examples
- AE1 (R1). Given a type error in `apps/mobile`, when committing, then the gate fails.
- AE2 (R2). `expo export --platform android` bundles an app that imports `@harfhane/shared` and `@harfhane/ui-tokens` from TypeScript source, with no build step.
- AE3 (R3). Given a daily game with two guesses, when the app restarts, then both guesses are on the board.

## Key technical decisions
Decisions marked *(assumption)* were made without the owner and are open to change.
- KTD1. Expo SDK 57 (React Native 0.86, React 19.2). The research note said SDK 55; npm `expo@latest` was 57.0.26 on 2026-10-05, so the scaffold uses 57.
- KTD2. **StyleSheet + tokens** (owner decision, 2026-10-05). Components take colors from `src/theme` (generated from `@harfhane/ui-tokens`) through a theme context; styles are plain objects, so component tests can assert them. Replaces Plan 002 KTD2 (NativeWind + react-native-reusables) for mobile: NativeWind v4 could not be verified at runtime without a device (`docs/research/2026-10-05-nativewind-spike.md`). Dialogs and sheets are built on React Native `Modal`.
- KTD3. Tests: Vitest for pure logic (hooks, API client, storage), jest-expo + React Native Testing Library for rendered components. `apps/mobile` runs both from its `test` script.
- KTD4. Storage: AsyncStorage behind a small async storage hook; web keys and JSON shapes are kept so a future export or sync is straightforward.
- KTD5. *(assumption)* Anonymous play first. Sign-in arrives with Plan 007; email/password is not added to mobile separately.
- KTD6. *(assumption)* Screens: Home (mode and length picker), Game (daily and unlimited share one screen), How to play, Stats, Settings. Leaderboard and profile stay web-only for the MVP; duels, tournaments and lists were removed from the product entirely on 2026-10-05 (not web-only — not shipping on any platform).
- KTD7. Verification without a device: `expo export --platform android` in CI-like local runs proves Metro resolves the workspace packages. Emulator and device checks are owner steps until an emulator is set up.

## Scope boundaries
- Out of scope: purchases (Plan 005), sign-in and push (Plan 007), iOS, web parity for leaderboard/profile.

## Units
- U1. Scaffold `apps/mobile` (SDK 57, TypeScript), wire scripts into the root gate, prove AE1 and AE2. (R1, R2)
- U2. Theme context: light/dark/system preference and high contrast, stored under the web's keys; jest-expo + React Native Testing Library set up for component tests. (R2, R4)
- U3. Async storage hook and the mobile game-state hook, reusing the web's state shape; Vitest coverage including AE3 at hook level. (R3)
- U4. API client for daily word, random word and validate, reading `EXPO_PUBLIC_API_URL`; tests against mocked `fetch`. (R3)
- U5. Tile, row, grid and keyboard components (Turkish layout from the web keyboard) with jest-expo tests. (R2, R4)
- U6. Game screen for daily and unlimited, toasts, win/lose flow. (R3)
- U7. Home, How to play, Stats, Settings screens. (R3, R4)
- U8. App icon, splash, store text draft; `targetSdkVersion` 36 confirmed in the prebuild output. (R5, R6)
- U9. *Owner:* Expo account, `eas init`, first internal build. Agent prepares `eas.json`.
- U10. *Owner:* Play developer account, identity verification, Data safety form, 12 testers for 14 days, production access.

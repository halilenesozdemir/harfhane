---
title: NativeWind v4 on Expo SDK 57 — spike
date: 2026-10-05
status: research
---

# NativeWind v4 on Expo SDK 57 — spike

Question for Plan 004 U2: can Plan 002 KTD2 (NativeWind v4 + react-native-reusables) run on Expo SDK 57 (React Native 0.86.3, React 19.2.3) in this pnpm monorepo?

Code: branch `spike/nativewind` (commit `60493d0`, throwaway, not for merge).

## Versions
`nativewind` 4.2.7 (npm `latest`; 5.0.0-rc.0 is `rc`), `tailwindcss` 3.4.19, `react-native-reanimated` 4.5.1, `react-native-worklets` 0.10.4, `react-native-safe-area-context` 5.7.0, `react-native-css-interop` 0.2.7.

## Results
- **Bundle: pass.** `expo export --platform android` → 980 modules.
- **pnpm friction:** `react-native-css-interop/jsx-runtime` did not resolve until `react-native-css-interop` was added as a direct dependency of `apps/mobile`.
- **Runtime styles: not verified.** NativeWind v4 turns `className` into styles from a stylesheet compiled by Metro (`withNativeWind`). Under jest-expo there is no such compile step, so a render test sees `style: undefined`. Only a device or emulator run proves styles apply. No Android SDK or emulator is installed on this machine.
- **Themes: open.** The spike maps `themes.light` into `tailwind.config.js` as static colors. Switching light/dark/high-contrast needs NativeWind CSS variables (`vars()`) fed from `@harfhane/ui-tokens`; not tried.
- `pnpm typecheck` and `pnpm lint` pass with the config (`nativewind-env.d.ts` needs `declare module '*.css'`).
- NativeWind v5 RC (Tailwind 4) was not tried; its docs target Expo 57 but it is pre-release.

## Options for the owner
1. **Verify v4 on a device.** Install Android Studio + an emulator (or use a phone with Expo Go/dev build), run the spike branch, check colors and theme switching. Then build U2/U5 on NativeWind.
2. **StyleSheet + tokens.** Components take colors from `src/theme.ts`; styles are plain objects, so jest-expo tests can assert them. Deviates from Plan 002 KTD2; react-native-reusables would not be used.
3. **NativeWind v5 RC.** Not recommended now: pre-release, Tailwind 4 migration.

Recommendation: option 1 if a device check fits in the next session; it keeps the design decision. Option 2 if mobile UI work should continue without a device.

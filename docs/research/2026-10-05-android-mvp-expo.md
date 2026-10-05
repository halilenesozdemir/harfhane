---
title: Android MVP on Expo — research
date: 2026-10-05
status: research
---

# Android MVP on Expo — research

Scope: Track A (`docs/decisions/2026-10-04-parallel-tracks.md`) — Expo Android app, daily + unlimited modes, visual polish, Supporter purchase, first Play Store release.

## 1. Expo SDK / React / monorepo

> Correction (2026-10-05, Plan 004 U1): npm `expo@latest` is 57.0.26 (React Native 0.86.3, React 19.2.3). The SDK 55 claim below is outdated; the NativeWind section's "v5 targets SDK 57" needs re-checking against SDK 57 before Plan 004 U2.

Latest **stable** SDK as of 2026-10 is **SDK 55** (released 2026-02-25): React Native 0.83, React 19.2 ([Expo SDK 55 changelog](https://expo.dev/changelog/sdk-55)). SDK 56 is in beta ([Medium write-up](https://medium.com/@onix_react/whats-new-in-expo-sdk-56-63f704fc8426)) — not production-ready, skip it for MVP. SDK 54 (React Native 0.81, React 19.1) is the prior stable and the last release with Legacy Architecture support; SDK 55+ is New-Architecture-only.

`apps/frontend/package.json:21-22` pins `react@^19.2.0` / `react-dom@^19.2.0` — **SDK 55's React 19.2 matches exactly**. Use SDK 55 for `apps/mobile`, not 54.

Monorepo: Expo's Metro config has had built-in pnpm/Yarn/Bun workspace support since SDK 52+ ([Expo monorepo guide](https://docs.expo.dev/guides/monorepos/)) — no manual `watchFolders`/`nodeModulesPaths` needed in the common case; `metro.config.js` just calls `getDefaultConfig(projectRoot)` from `expo/metro-config`. Known pitfalls:
- pnpm's default isolated `node_modules` can break Metro's resolution of hoisted native modules; the documented fallback is `nodeLinker: hoisted` in `pnpm-workspace.yaml` ([gist](https://gist.github.com/Zn4rK/ed60c380e7b672e3089074f51792a2b8)) — the repo's current `pnpm-workspace.yaml` (`/Users/halilenesozdemir/harfhane/pnpm-workspace.yaml`) has no `nodeLinker` override, so this would need to be verified once `apps/mobile` exists, with `pnpm install` + `pnpm --filter @harfhane/mobile exec expo start` as the smoke test.
- Use `expo install` (not raw `pnpm add`) for any native/Expo-aware package — it pins the version Expo's SDK compatibility table expects; plain `pnpm add` can pull a mismatched peer version.
- EAS Build needs a `--workspace-root` equivalent for monorepos; current EAS CLI handles this via the `eas.json` `build.*.env`/working-directory conventions, no SDK-55-specific flag confirmed (the "SDK 55 ships `--workspace-root`" claim from one blog is **unverified** — see below).

## 2. Consuming `packages/shared` and `packages/ui-tokens` from `apps/mobile`

`packages/shared/package.json:5` — `"main": "./src/index.ts"`, `"exports": { ".": "./src/index.ts" }`. Metro (unlike Vite) needs a transform step for `.ts` files outside the app's own `src/` — this works today for web because Vite handles TS natively; Metro's default config also transpiles TS via `@react-native/metro-babel-transformer`, and since SDK 52 Metro resolves workspace `exports` fields, so `import { evaluateGuess } from '@harfhane/shared'` should resolve directly to the `.ts` source without a build step — same pattern frontend already uses. Worth a one-off spike (`U1` below) before relying on it.

Read `packages/shared/src/` fully:
- `src/index.ts` — re-exports `./game`, plus all cross-app DTOs (`WordEntry`, `WordData`, `DailyWordResponse`, `ApiError`, duel/list/gamification types).
- `src/game/index.ts` exports: `normalizeChar`, `normalizeWord`, `evaluateGuess`, `checkGameStatus` (`evaluate.ts`); `updateKeyboardStatus` (`keyboard.ts`); `generateShareText` (`share.ts`); `getTimeUntilMidnight`, `getTodayString`, `getGameNumber` (`time.ts`); plus `TileStatus`/`TimeCountdown` types.
- **No DOM/browser-only code anywhere in `packages/shared/src`.** All functions are pure (`Date`, `Array`, string methods, `Math`). `share.ts`'s `generateShareText` builds a text string (emoji grid) — it does not touch `navigator.share` or `clipboard`, those live in the frontend's `useShare.ts` hook, not shared. `time.ts`'s `getTodayString`/`getTimeUntilMidnight` use `new Date()`/`toISOString()`, fine in React Native's JS engine (Hermes). **Conclusion: the whole engine is portable as-is, zero changes needed.**

`packages/ui-tokens/package.json:9-12` exports `./generated/tokens.ts` (plain TS object, `base` + `themes`, no CSS-in-JS, no `var(--hh-*)` strings beyond the generated `tokens.css` which mobile won't import) — `generated/tokens.ts` is consumable directly by a NativeWind `tailwind.config.js` `theme.extend.colors` map, same shape the frontend presumably derives its Tailwind config from. No DOM dependency there either. The CSS custom-property file (`generated/tokens.css`) is web-only and mobile skips it, reading `tokens.ts` directly.

Both packages have no build output (`main` points at `.ts` source) — mobile's Metro config must be able to parse TypeScript from `packages/*`, which is Metro's default behavior already, no extra Babel config expected.

## 3. Web game flow → mobile screens, and backend endpoints

Reusable (framework-agnostic, move into `packages/shared` already or trivially movable):
- `packages/shared/src/game/*` — fully reusable (see §2).
- `apps/frontend/src/lib/api.ts` (`/Users/halilenesozdemir/harfhane/apps/frontend/src/lib/api.ts`) — plain `fetch` wrapper reading `BASE_URL` from `import.meta.env.VITE_API_URL`. Not reusable verbatim (Vite-specific env access, `/Users/halilenesozdemir/harfhane/apps/frontend/src/lib/api.ts:21`) but the request/response shape and every function signature ports 1:1 to a mobile `lib/api.ts` that reads `process.env.EXPO_PUBLIC_API_URL` instead.
- Game-state transition logic in `useGameState.ts` (`/Users/halilenesozdemir/harfhane/apps/frontend/src/hooks/useGameState.ts`) is mostly portable: the `addLetter`/`removeLetter`/`applyGuess`/`submitGuess` callbacks call only `@harfhane/shared` + `setState`, no DOM. Two web-only parts inside this same file:
  - `useLocalStorage` (`/Users/halilenesozdemir/harfhane/apps/frontend/src/hooks/useLocalStorage.ts:5,26`) — hardcoded `window.localStorage`. Needs a mobile equivalent hook backed by `@react-native-async-storage/async-storage` (same `get/set/JSON.parse` shape, swap `window.localStorage.getItem/setItem` for the async AsyncStorage calls — note AsyncStorage is async, so the hook's synchronous `useState` initializer in `readStorage` (`useLocalStorage.ts:3-10`) needs restructuring, not a drop-in).
  - The physical-keyboard `window.addEventListener('keydown', …)` effect (`useGameState.ts:164-173`) is irrelevant on mobile — replaced entirely by on-screen `Keyboard`/`Key` taps calling the same `addLetter`/`removeLetter`/`submitGuess`.
- `GamePage.tsx` (`/Users/halilenesozdemir/harfhane/apps/frontend/src/components/GamePage.tsx`) composes: `DesktopShell`, `Header`, `GameGrid`, `Keyboard`, `Toast`, `HowToPlayModal`, `StatsModal`, `GameOverModal`, `SettingsModal`, `AuthModal`, `LeaderboardModal`, `ProfileModal`, `GameLoadingScreen`, `GameErrorScreen`, `GameHint`, `WinConfetti`. Each of these is a DOM component (`div`/`button`/CSS classes) and must be rewritten as a React Native component (`View`/`Pressable`/NativeWind classes) — none of the JSX is reusable, but the **props contracts and the hooks feeding them** (`useGameState`, `useGameModals`, `useAuth`, `useSessionChallenge`, `useHint`) are. `GamePage.tsx:58` also reads `window.location.origin` for the share URL — needs a mobile constant/deep-link scheme instead.
- Screen mapping for MVP: Home (mode picker) → `HomePage.tsx`; Daily game → `GamePage.tsx` (`mode="daily"`); Unlimited game → `GamePage.tsx` (`mode="unlimited"`); How-to-play, Stats, Game-over, Settings, Auth → each existing modal becomes its own native screen/bottom-sheet (react-native-reusables `Dialog`/`Sheet`, per KTD2). Leaderboard, Profile, Duels, Tournament, Lists, Admin are **out of scope** for the Android MVP per the parallel-tracks decision (daily + unlimited only).

Backend endpoints the daily + unlimited flow calls (`apps/backend/src/routes/words.ts`, `results.ts`, `auth.ts`):
- `GET /api/words/daily?length=N` — public, no auth (`words.ts:10-23`).
- `GET /api/words/random?length=N` — public, no auth, used for unlimited mode (`words.ts:25-38`).
- `POST /api/words/validate` — public, rate-limited via `gameRateLimiter` (`words.ts:48-62`), used on every guess submission (`useGameState.ts:135`).
- `POST /api/results` — **requires auth** (`requireAuth`, `results.ts:17`), saves a finished game and triggers XP (`processGameXP`).
- `GET /api/results/me` / `GET /api/results/me/unlimited` — **requires auth** (`results.ts:33,38`), personal stats.
- `GET /api/results/leaderboard` — public.
- Auth: `POST /api/auth/register`, `/login`, `/refresh`, `/forgot-password`, `/reset-password`, `GET /api/auth/google` + `/google/callback`, `GET /api/auth/me`, `DELETE /api/auth/account` (`auth.ts`). JWT bearer token, 30-day expiry (`auth.ts:28`, `JWT_EXPIRES_IN`). **Google OAuth as implemented is a server-redirect flow hardcoded to `GOOGLE_REDIRECT_URI = 'https://api.harfhane.app/api/auth/google/callback'` (`auth.ts:27`)** — this redirect-based flow does not work unmodified inside a native app; mobile needs either `expo-auth-session` with a custom redirect scheme, or email/password auth only for MVP (recommended: ship MVP with email/password + guest/local play, defer Google Sign-In on mobile to a follow-up unit).
- Playing daily/unlimited and seeing a result does **not** require auth (anonymous `localStorage`-keyed state, `useGameState.ts:28-34`); only persisting XP/stats and the personal-stats endpoints require a logged-in user. This means the Android MVP can ship fully playable without forcing sign-in, matching the web's anonymous-first UX.

## 4. Styling: NativeWind v4 vs v5, react-native-reusables

NativeWind **v5 is release-candidate only** (`5.0.0-rc.0` as of its June-2026 plan, still pre-release; built on Tailwind CSS v4 + `react-native-css`, targets Expo SDK 57) and explicitly "not yet recommended for production" ([NativeWind v5 overview](https://www.nativewind.dev/v5), [release-plan discussion #1818](https://github.com/nativewind/nativewind/discussions/1818)). NativeWind **v4** (currently 4.2.x) is the stable, production-proven version, built on Tailwind CSS v3, and remains "the safer default" for most teams in 2026 per community write-ups ([khueapps NativeWind-vs-Uniwind, 2026](https://www.khueapps.com/blog/nativewind-vs-uniwind-which-is-better-for-react-native-in-2026)).

This matches design plan KTD1 (stay on Tailwind 3 for the Android MVP) and KTD2 (react-native-reusables on NativeWind v4) exactly — **confirm NativeWind v4, do not jump to v5 for MVP.** react-native-reusables itself is actively maintained, ports shadcn/ui's "copy the component, own the code" model to RN on top of NativeWind + universal Radix primitives, MIT-licensed ([bestofjs entry](https://bestofjs.org/projects/react-native-reusables), [motionary.dev 2026 RN UI map](https://motionary.dev/blog/best-react-native-ui-libraries-2026)) — no blocking issues found for Expo SDK 55 + NativeWind v4 compatibility, but this pairing should get a 30-minute spike (install + render one themed component) before committing, since react-native-reusables' own compatibility matrix was not directly inspected.

**Recommendation: NativeWind v4 + react-native-reusables**, as the plan already states — v5's Tailwind-v4 dependency and RC status would put the MVP on unstable ground and force an early, unplanned Tailwind-4 migration (explicitly deferred web-side too, per KTD1/U9).

## 5. Testing on mobile

`jest-expo` is Expo's own preset and the only option with confirmed, stable React Native Testing Library compatibility; Vitest's RN support is explicitly called out as incomplete by Expo's own blog ("Vitest is still not fully compatible with React Native Testing Library", [How to build a solid test harness for Expo apps](https://expo.dev/blog/how-to-build-a-solid-test-harness-for-expo-apps)) and third-party comparisons agree Jest/jest-expo remains the stable choice for RN component tests in 2026. Given the repo's stated preference for Vitest everywhere else (`CLAUDE.md` Testing table, all three existing workspaces use Vitest), the pragmatic split is:
- `apps/mobile` tests pure logic (hooks that don't touch native modules) with **Vitest**, same config shape as `packages/shared`.
- `apps/mobile` tests anything rendering React Native components (screens, the on-screen keyboard, tile grid) with **jest-expo** + React Native Testing Library, since that's the only combination with verified support.
- This means `apps/mobile` is the first workspace in the monorepo running two test runners. `pnpm test` at the root (`package.json:16`) chains per-workspace `test` scripts — `apps/mobile`'s own `package.json` `test` script would need to run both (`vitest run && jest`) for the root script and `.githooks/pre-commit` (`/Users/halilenesozdemir/harfhane/.githooks/pre-commit`) to pick it up unchanged; the pre-commit gate already matches on `^(apps|packages)/.*\.(ts|tsx|...)$` so new mobile files trigger it automatically once `apps/mobile` exists — no hook change needed, only `apps/mobile/package.json` wiring and adding `apps/mobile` to root `pnpm-workspace.yaml`'s existing `apps/*` glob (already covers it, no edit needed) plus root `package.json`'s `typecheck`/`lint`/`test`/`build` scripts, which use `--recursive`/`--filter "@harfhane/*"` wildcards (`package.json:11-17`) and so also pick up a new `@harfhane/mobile` package automatically, provided its `package.json` defines matching `typecheck`/`lint`/`test`/`build` scripts (even if some are no-ops initially).

## 6. Play Store path (new personal developer account)

- **Developer account:** one-time $25 USD Google Play Developer registration fee, personal account ([inspiringapps 2026 guide](https://www.inspiringapps.com/blog/how-to-submit-app-to-google-play-store)). Google Play now also requires **developer identity verification** for personal accounts in 2026, with its own deadline/process ([TesterBee Developer Verification 2026](https://testerbee.com/blog/google-play-developer-verification-2026)) — **owner-only, cannot be delegated.**
- **Closed testing gate:** personal accounts created after 2023-11-13 must run a closed test with **≥12 opted-in testers for ≥14 consecutive days** before applying for production access ([primetestlab, "20 to 12 testers"](https://primetestlab.com/blog/google-play-changed-20-to-12-testers); [testerscommunity 12-testers policy](https://www.testerscommunity.com/blog/google-play-12-testers-policy)). "Opted in" means each tester accepted the invite link and installed the app under a matching Google account — an invite alone doesn't count. Production-access review after that typically takes ≤7 days.
- **EAS Build/Submit:** `eas build -p android` produces a signed `.aab`; `eas submit -p android` uploads it to Play Console using stored service-account credentials. Free EAS tier: 15 Android builds/month, enough for MVP iteration ([Expo pricing](https://expo.dev/pricing)).
- **App signing:** EAS can generate/hold the upload key, or the owner can opt into Google Play App Signing (Google holds the final signing key; recommended, smaller `.aab` downloads, recoverable if the upload key is lost).
- **Target API level:** new apps/updates submitted after **2026-08-31** must target **Android 16 (API 36)**; an extension to 2026-11-01 is requestable ([support.google.com target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878)). Since today is 2026-10-05, **an MVP built now must already target API 36** — SDK 55's React Native 0.83 should already default near this; confirm the generated `android/build.gradle` `targetSdkVersion` once the Expo project is scaffolded (`U2` below).
- **Data safety form:** mandatory Play Console questionnaire on what data the app collects/shares (email for auth, gameplay stats, any analytics/ads SDK) — must be filled in Play Console directly by the account owner; cannot be automated from the repo.
- **Owner-only items (cannot be done by an agent or CI):** creating/verifying the developer account, paying the $25 fee, identity verification, inviting and herding ≥12 real testers for 14 days, filling the Data Safety form, approving the store listing content (title/description/screenshots/privacy-policy URL), and the final "promote to production" click.

## 7. Proposed unit breakdown (U1..Un)

Testable locally without any account = no Expo/Google/Apple account needed, just `pnpm` + a device/simulator.

- **U1** — Scaffold `apps/mobile` with `create-expo-app` (SDK 55, TypeScript template), wire into `pnpm-workspace.yaml`/root scripts, add `@harfhane/shared` + `@harfhane/ui-tokens` as workspace deps, confirm `import { evaluateGuess } from '@harfhane/shared'` resolves and typechecks. *Testable locally, no accounts.*
- **U2** — Verify Metro + pnpm workspace resolution end-to-end: `expo start`, run on Android emulator, confirm Fast Refresh works and the generated `android/build.gradle` `targetSdkVersion` is 36 (bump via `expo install` / app config if not). *Local, no accounts; emulator only.*
- **U3** — Install NativeWind v4 + Tailwind config mapping `packages/ui-tokens/generated/tokens.ts` → `theme.extend.colors`; render one themed `View`/`Text` to confirm tokens flow through. *Local.*
- **U4** — Install react-native-reusables, port one component (e.g. `Dialog`) as a spike to confirm NativeWind v4 compatibility before committing further. *Local.*
- **U5** — Build `GameGrid`/`Tile`/`Keyboard`/`Key` native components consuming `@harfhane/shared`'s `evaluateGuess`/`updateKeyboardStatus`/`normalizeWord` — pure logic, testable with Vitest; rendering testable with jest-expo + RNTL. *Local.*
- **U6** — Mobile `useAsyncStorage`-backed game-state hook, ported from `useGameState.ts`/`useLocalStorage.ts`, replacing `window.localStorage` and the `keydown` listener with native taps. *Local.*
- **U7** — Mobile `lib/api.ts` against the real backend (`EXPO_PUBLIC_API_URL` pointed at local `wrangler dev` or deployed API) — daily word, random word, validate-word calls; no auth needed for these three. *Local + existing backend, no new account.*
- **U8** — Daily-mode screen end-to-end (load word, guess, win/lose, toast) on emulator against local backend. *Local.*
- **U9** — Unlimited-mode screen + "new game" flow. *Local.*
- **U10** — Email/password auth screens (register/login) calling existing `/api/auth/*`; defer Google Sign-In (needs `expo-auth-session` + a registered OAuth client — owner decision, see open questions). *Local against existing backend; no new Google client needed if deferred.*
- **U11** — Persist results post-login (`POST /api/results`), show personal stats (`GET /api/results/me/unlimited`). *Local.*
- **U12** — Supporter purchase integration (`react-native-iap` or Expo's in-app-purchase guidance) — **needs owner decision on store** (Google Play Billing requires a published app + billing setup in Play Console) and is likely blocked until after first release; flag as a follow-up track, not part of the MVP build-and-test loop. *Needs owner account/decision.*
- **U13** — App icon, splash, store listing assets, privacy-policy page/URL. *Needs owner decision on branding/legal text; asset creation itself is local.*
- **U14** — EAS project setup (`eas init`, `eas.json` build profiles), first `eas build -p android --profile preview` producing an installable `.apk`/internal `.aab`. *Needs an Expo account (free) — owner creates it; build itself can be kicked off by anyone with that account's token.*
- **U15** — Google Play Developer account creation, identity verification, $25 fee, Data Safety form, closed-testing track setup, invite ≥12 testers, wait 14 days, apply for production. *Owner-only, sequential, not agent-automatable.*
- **U16** — `eas submit -p android` to the closed track, then promote to production after U15's 14-day gate clears. *Owner approval required at each submit/promote step (Invariant: irreversible/outward-facing action).*

## Open questions for the owner

- Google Sign-In on mobile for MVP, or email/password only at first release (affects U10 scope and whether an OAuth client needs registering now)?
- Who are the ≥12 closed-testing testers, and can 14 consecutive opted-in days start immediately once U14 produces a build?
- Target Android API 36 confirmed acceptable now, or is there a reason to still target API 35 and use the extension-to-Nov-1 path?
- Supporter purchase: Google Play Billing (requires store presence) vs. a web-based payment redirect for v1 — which unblocks faster given Invariant 8 (no ads) and the "first 5-10 sales" framing in the parallel-tracks decision?
- Does `apps/mobile` get its own `CLAUDE.md` (per the project's CLAUDE.md hierarchy convention) before or after U1?

## Unverified

- Whether EAS CLI's monorepo handling for SDK 55 includes a literal `--workspace-root` flag — one blog post claimed this for "SDK 55," but Expo's own SDK 55 changelog was not checked line-by-line for this flag; treat as unconfirmed until read directly from `docs.expo.dev`/`eas.json` reference during U1.
- react-native-reusables' explicit, documented compatibility with Expo SDK 55 + NativeWind v4 + New Architecture — inferred from general 2026 ecosystem write-ups, not from the library's own compatibility table or changelog.
- Exact current NativeWind v4 patch version and whether it has any known SDK-55-specific issues — not checked against NativeWind's own GitHub issues.
- Whether `packages/shared`'s `main: ./src/index.ts` resolves through Metro without any `tsconfig`/`babel` tweak in practice (reasoned from Metro's documented TS support + workspace `exports` resolution, not from an actual `expo start` run against this repo).
- Current Google Play Billing requirements/flow specifics for a not-yet-published app (U12) — not researched in this pass; flagged as a follow-up track per the decision doc's own ordering (store first, monetization details after).

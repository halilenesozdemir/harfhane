---
title: Mobile polish before the closed test
type: feat
date: 2026-10-06
status: approved
---

# Mobile polish before the closed test

## Goal
The Android app plays correctly but feels unfinished next to the web app: a game ends with one
line of text, tiles never move, the board leaves a large gap above the keyboard, and the launch
screen may close before data is ready. Fix that before the Play closed test (Phase 4), without
adding accounts, server features or ads.

Research: `docs/research/2026-10-06-mobile-polish-engagement.md`.

Owner decisions, 2026-10-06:
- First slice before the closed test: game-over card, tile animations with responsive tile size,
  small fixes with the splash screen, first-launch how-to-play.
- New mobile dependencies approved: `expo-haptics`, `expo-font` with Baloo 2, and
  `lucide-react-native` (with `react-native-svg`).
- The share text keeps the coloured emoji squares; the no-emoji rule covers the app's own UI, not
  the share grid players paste into chats.
- Later the same day: no accounts at launch either (accounts only solve moving a streak between
  devices; their privacy, KVKK and onboarding cost outweighs that now). Android Auto Backup keeps
  stats across reinstalls: verified 2026-10-06 on the emulator with a local release build
  (`allowBackup` defaults to true in Expo SDK 57; `bmgr backupnow` then uninstall/install restored
  the AsyncStorage game state). In the field it depends on the player's Google backup setting and
  runs roughly daily, so a local streak export/import code stays a fallback only if closed-test
  players report lost streaks. A used hint is marked in the share text (supersedes Plan 008 R7's
  "not shown in share"). No anonymous server-side aggregate for now; closed-test feedback comes
  from a survey. Research: `docs/research/2026-10-06-puzzle-game-ux-engagement.md`.
- Post-launch engagement ideas (streak calendar, hard mode, local achievements, share image) are
  undecided and stay in `docs/backlog.md` until the owner revisits them.

## Requirements
- R1. When a game ends on mobile, a game-over card shows the result, the answer, the guess
  distribution, a share button (React Native `Share`, text from `generateShareText`) and a
  countdown to the next daily word (Turkey day); unlimited also offers "Yeni kelime". Result
  messages vary by guess count (3-5 Turkish variants each).
- R2. Tiles animate: pop when a letter is typed, flip with a per-tile stagger when a row is
  evaluated, shake when a guess is rejected. All animations are skipped when the system
  reduce-motion setting is on. Tile size is computed from the window so the board fills the space
  above the keyboard between a named minimum and maximum.
- R3. Haptics: light feedback on key press, distinct feedback on win and on a rejected guess; a
  Settings switch turns haptics off (stored locally, default on).
- R4. Mobile typography uses Baloo 2 for tiles, titles and keys, matching the web tokens; icons
  come from Lucide, never emoji. The Enter key reads "GİR" or shows a Lucide icon with an
  accessible label.
- R5. Small visual fixes: the hint pill border uses `surfaceBorder` (not brand), one brand colour
  across web logo and app icon, home title as an H-A-R-F tile row.
- R6. Launch: the native splash stays up until theme and stored game state are loaded
  (`preventAutoHideAsync` / `hideAsync`); the web splash no longer waits a fixed 1.9 s.
- R7. First launch opens How to play once; later launches go straight home.
- R8. When a hint was used, the share text says so on its header line (e.g. "Harfhane #279 3/6 ·
  ipucu"), on web and mobile; the grid itself is unchanged. Stats do not count hints.
- R9. Mobile screens follow `docs/design/mobile-ui-standard.md` (proposed 2026-10-07 after owner
  feedback that splash, home and the game header look cheap and web-like): a shared top bar with
  an icon back button labelled "Geri" and a compact centred title, home actions as icon buttons
  instead of text links, a streak chip in the home top bar and depth mode cards with today's status (played or not,
  countdown), a 3D
  tile splash icon with a short reduce-motion-aware intro. Spec: `docs/design/mobile-redesign-spec.md`.

## Acceptance examples
- AE1 (R1). Given a daily game won in three guesses, the game-over card shows the answer, a
  distribution with the third bar highlighted, a share button whose text starts with the game
  number, and a countdown to the next Turkey midnight.
- AE2 (R2). Given reduce-motion is on, submitting a guess shows the evaluated colours with no
  flip animation running.
- AE3 (R3). Given haptics are switched off in Settings, pressing a key triggers no haptic call.
- AE4 (R6). Given stored state loads after 300 ms, the splash screen is hidden only after it has
  loaded.
- AE6 (R8). Given a daily game won in 3 guesses with one hint, the share text's first line ends
  with "· ipucu"; without a hint it does not.
- AE5 (R7). Given a fresh install, the first launch shows How to play; after closing it, the
  next launch shows the home screen.
- AE7 (R9). Given the home screen, "Nasıl oynanır sayfasını aç", "İstatistikleri aç" and
  "Ayarları aç" are
  icon buttons with those accessibility labels and hit areas of at least 48 dp; given a daily
  5-letter game, the game screen shows an icon back button labelled "Geri" and a header "Günlük"
  with a separate "5 harf" chip, not the string "Günlük · 5 harf".

## Key technical decisions
- KTD1. Animations use React Native `Animated` with `useNativeDriver` on transform and opacity
  only; no animation library.
- KTD2. Durations and sizes are tokens in `packages/ui-tokens` (`motion-flip`, `motion-stagger`,
  `tile-size-min`, `tile-size-max`) so web and mobile share them.
- KTD3. The game-over card reuses `generateShareText` and the Turkey-day helpers from
  `@harfhane/shared`; no new share logic on mobile.
- KTD4. Check each dependency's Expo SDK 57 version with `expo install`; the splash screen's real
  look is verified on a release build, not Expo Go.

## Units
File ownership: A owns `GameOverCard` and its wiring; B owns `Tile`, `GameGrid`, animations and
tokens; C owns haptics, Settings and fonts; D owns splash, home title, icons and first launch; E (U7) owns the UI standard
redesign once A-D's open PRs have merged.

- U1 (A). Mobile game-over card with share, distribution, countdown, message variants. (R1, AE1)
- U2 (B, after U1). Tile animations, reduce-motion, responsive tile size, motion tokens. (R2, AE2)
- U3 (C). `expo-haptics` with Settings switch; Baloo 2 via `expo-font`; Lucide icons and the
  Enter key. (R3, R4, AE3)
- U4 (D). Splash hold until loaded, web splash timing, hint pill border, brand colour, home title.
  (R5, R6, AE4)
- U5 (D, after U4). First-launch How to play. (R7, AE5)
- U6 (A, after U1). `generateShareText` takes a hint flag; web and mobile pass it. (R8, AE6)
- U7 (E, approved by the owner 2026-10-07). Mobile UI standard redesign (R9, AE7). Owner choices:
  home actions as top-bar icon buttons (not a bottom row); streak chip shown on home; Nunito added
  for body text (`@expo-google-fonts/nunito`, new dependency approved); launcher icon also moves to
  the 3D "H" tile; splash background stays cream. Starts only
  after U1-U6 have all merged (#87, #88, #89 and the not-yet-started U2, U5, U6), because it
  touches `GameScreen.tsx` (U2), `HowToPlayScreen.tsx` and `App.tsx` (U5) and `GameOverCard.tsx`
  (U1, U6). Ships as four PRs, strictly one after another (each stays under 15 files):
  - U7a: `apps/mobile/src/ui/layout.ts` constants and `apps/mobile/src/ui/{IconButton,TopBar,
    Button,Card}.tsx` with tests.
  - U7b: top bar and buttons on `GameScreen`, `StatsScreen`, `HowToPlayScreen`, `SettingsScreen`
    and `GameOverCard` (including the bar-count contrast fix), with their tests.
  - U7c: `HomeScreen` redesign and `apps/mobile/src/home/today-status.ts` (displayed streak,
    today's state, midnight refresh); Stats uses the same displayed streak. AE7: game half tested in U7b, home half here.
  - U7d: `apps/mobile/scripts/generate-brand-assets.mjs`, regenerated `apps/mobile/assets/*.png`,
    `apps/mobile/app.json` `imageWidth`, `apps/mobile/src/components/LaunchIntro.tsx`, its wiring
    in `App.tsx` and the hero `onLayout` hook in `HomeScreen.tsx` (after U7c).

## Not in this plan
Streak calendar, hard mode, local achievements, share image, sound, themed weeks, timed mode,
local reminders: undecided, recorded in `docs/backlog.md`.

# Mobile polish and engagement (2026-10-06)

Read-only review of the Android app (emulator screenshots, `apps/mobile/src`) against the web app,
plus external constraints. Feeds Plan 011.

## Findings in the current app
- Game end on mobile is one line of text (`GameScreen.tsx`); web has a modal with share,
  distribution, countdown and confetti (`GameOverModal.tsx`, `WinConfetti.tsx`).
- Mobile tiles are static `View`s; web has flip and reduced-motion handling (`index.css`).
- About 400 px of empty space between board and keyboard on a Pixel-size screen: fixed
  `TILE_SIZE = 56` plus `justifyContent: 'space-between'`.
- Mobile falls back to Roboto; web uses Baloo 2 / Nunito from `tokens.json`.
- Enter key label is English ("ENTER"); the hint pill border uses the brand colour and reads like an
  error; the web logo is green while the app icon is brand orange.
- `app.json` configures `expo-splash-screen`, but `preventAutoHideAsync` / `hideAsync` are never
  called, so the splash may close before the first word and stored state load (not verified on a
  release build). The web splash waits a fixed 1.9 s (`SplashScreen.tsx`).
- The gear button seen on emulator screenshots is Expo Go's developer tool, not part of the app.

## External constraints
- Expo SplashScreen (SDK 57): `image`, `imageWidth`, `resizeMode`, `backgroundColor`, `dark`,
  `preventAutoHideAsync`, `hideAsync`; Expo Go and dev builds do not show the real splash.
  https://docs.expo.dev/versions/latest/sdk/splash-screen/
- Android 12+ splash: one opaque background colour and a centred icon; without an icon background
  the icon must fit a 192 dp circle inside 288 dp; branding images are discouraged.
  https://developer.android.com/develop/ui/views/launch/splash-screen
- Expo Haptics: `performAndroidHapticsAsync` needs no VIBRATE permission.
  https://docs.expo.dev/versions/latest/sdk/haptics/
- Wordle's retention is usually attributed to one puzzle a day, a light streak and the
  spoiler-free share grid (secondary source, low confidence):
  https://dinogame.gg/blog/why-is-wordle-so-popular/

## Engagement ideas within the MVP constraints
No accounts, no server XP, no ads, no word meanings. Effort S/M/L.
- Before the closed test (owner chose these): game-over card with countdown and varied messages
  (M), tile animations and responsive size (M), small fixes and splash hold (S-M), first-launch
  how-to-play (S), haptics and Baloo 2 (S).
- Undecided, after launch: local streak calendar (M), hard mode (M), local achievements (M),
  share image (L, needs a dependency), sound off by default (M), themed weeks, visual only (M),
  timed mode (M). Local reminders would need an owner call against the no-push decision.

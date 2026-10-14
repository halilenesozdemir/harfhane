---
title: Web polish for a public link
type: feat
date: 2026-10-14
status: approved
---

# Web polish for a public link

## Goal
The web app works, but it looks older than the Android app and is not ready to be linked from the
owner's public profile: on wide screens the side panels stick to the window corners and the board
stays small; basic Turkish words such as KOYUN and BOYUN are rejected as guesses; screen-reader and
reduce-motion support lag behind mobile. Bring the web to the mobile app's visual language
(`docs/decisions/2026-10-04-visual-direction-playful-3d.md`, `docs/design/mobile-ui-standard.md`)
and fix the guess list, so the web link can be shared while mobile work continues.

Design reference (owner-approved, 2026-10-14): the "Harfhane Web Redesign" canvas — desktop home
and game in the light theme, phone home, game and game-over in the dark theme. Both themes ship on
every screen; the canvas only shows one theme per screen.

Owner decisions, 2026-10-14:
- Web matches the mobile visual language (top bar with icon buttons, H-A-R-F tile hero, depth mode
  cards with today's status, two-tile brand mark); no separate web design.
- Valid guesses: dictionary words are accepted; inflected forms (EVLER, KİTABI) are not, as in
  Wordle. Answers stay curated.
- Growing the answer pools (more reviewed words) is a later plan; no owner review load here.
- The web link goes into the owner's profile README after U1 is live; visual polish follows.
- Production was deployed from `main` on 2026-10-14 (deploys had stopped on 2026-10-10 because of
  GitHub Actions billing on the then-private repository).

In flight, not part of this plan: web brand mark and icons from the mobile generator
(`feat/web-brand-mark`), SEO audit and fixes (`feat/web-seo`, owns `<head>` except icon links).

## Requirements
- R1. Every 4-6 letter Hunspell headword is a valid guess even when it ends like a suffix
  (KOYUN = KOY + -un, BOYUN = BOY + -un). The suffix heuristic in
  `scripts/words/inflection.py` only removes words that are not headwords themselves. The answer
  pools are unchanged.
- R2. A shared web shell: a top bar with the brand mark, a streak chip on home, icon buttons with
  accessible labels and at least 44 px hit areas (help, stats, settings; back on game screens).
  On wide screens all content sits in one centred container (max 1200 px); nothing is pinned to
  the window corners.
- R3. Home: H-A-R-F tile hero with "hane", a subtitle, Günlük and Sınırsız depth cards; the daily
  card shows whether today's word was played and, if so, the countdown to the next Turkey day.
  On wide screens a How to play panel sits beside the cards.
- R4. Game screen: tile size follows the viewport (width and height) between `tile-size-min` and
  `tile-size-max`, so the board fills a large monitor and board plus keyboard fit a 360 x 640
  phone without scrolling. Enter reads "Gönder" in the brand colour, backspace reads "Sil".
  Mode switch and today's stats sit beside the board on wide screens and below it on narrow ones.
- R5. Tiles announce their letter and state to screen readers (e.g. "A, doğru yerde"), as on
  mobile; pop, flip and shake are skipped when `prefers-reduced-motion: reduce` is set.
- R6. Game over: a bottom sheet on phones and a centred dialog on wide screens with the answer
  tiles, stats, distribution with counts outside the filled bar (mobile-ui-standard C2), the
  countdown, "Sonucu paylaş" as the one primary action and a secondary action to continue in
  unlimited mode.
- R7. Pinch zoom works: the viewport meta has no `user-scalable=no` or `maximum-scale=1`.

## Acceptance examples
- AE1 (R1). Given the regenerated lists, `valid-5.txt` contains KOYUN and BOYUN and still does
  not contain EVLER.
- AE2 (R1). Given the backend with the regenerated valid words seeded locally, `POST
  /api/words/validate` accepts KOYUN.
- AE3 (R2). Given a 1920 x 1080 window on the game screen, the left edge of the mode switch and
  the right edge of the stats panel are each within 1200 px centred content, not at the window
  edges.
- AE4 (R3). Given today's daily word not played, the daily card reads "Henüz oynamadın"; given it
  solved, the card shows "Çözdün" and a countdown.
- AE5 (R4). Given a 1920 x 1080 window, a board tile is at least 64 px wide; given a 360 x 640
  window, the whole keyboard is visible without scrolling and there is no horizontal scroll.
- AE6 (R5). Given a revealed row K-İ-T-A-P with A correct, the A tile's accessible name is
  "A, doğru yerde"; given reduced motion, a submitted row has no flip animation class.
- AE7 (R6). Given a daily game won in three guesses on a 390 px window, the game-over sheet shows
  the third distribution bar highlighted with its count outside the bar and "Sonucu paylaş" as
  the only primary button.
- AE8 (R7). Given `apps/frontend/index.html`, the viewport meta allows user scaling.

## Key technical decisions
- KTD1. Colours, radii, motion and tile sizes come from `@harfhane/ui-tokens` CSS variables; depth
  is a solid bottom `box-shadow` in the matching `*-depth` token, as in the canvas. No new hex in
  components.
- KTD2. Tile size is a CSS `clamp()` on the board width, bounded by `min(vw, dvh)` terms and the
  `tile-size-*` tokens; no JS resize listener.
- KTD3. The headword fix keeps a word when it appears as its own entry in the pinned Hunspell
  `.dic` file; the heuristic stays for derived forms. `valid_words` changes reach production only
  as an insert-only SQL file the owner applies (Invariant 4); agents never write to the remote
  database.
- KTD4. Frontend rules apply: Tailwind classes, no inline `style` except computed tile sizes with a
  comment, `cursor-pointer` on every control, Lucide icons.

## Units
File ownership: W owns `scripts/words/**`, `data/words/**`, the insert SQL and backend seed
fixtures; S owns the shell (`Header.tsx`, `DesktopShell.tsx`, new `TopBar.tsx`, `IconButton.tsx`);
H owns `HomePage.tsx` and `home/*`; G owns `GamePage.tsx`, `GameGrid.tsx`, `Tile.tsx`,
`Keyboard.tsx`, `Key.tsx`, `GameHint.tsx`; O owns `GameOverModal.tsx`, `StatsModal.tsx`.

- U1 (W). Headword-aware inflection filter, regenerated lists, insert-only SQL for the new valid
  words, tests. Can start now. (R1, AE1, AE2)
- U2 (S, after the brand-mark PR merges). Top bar, icon buttons, centred container, wide-screen
  layout. (R2, AE3)
- U3 (H, after U2). Home redesign with today's status. (R3, AE4)
- U4 (G, after U2). Responsive board and keyboard, side panels, tile accessibility and reduced
  motion. (R4, R5, AE5, AE6)
- U5 (O, after U2). Game-over sheet and dialog. (R6, AE7)
- U6 (after the SEO PR merges). Viewport meta allows zoom. (R7, AE8)

U3, U4 and U5 run in parallel once U2 merges; each PR stays under 500 lines and 15 files.

## Not in this plan
More reviewed answers for 4, 5 and 6 letters; accepting inflected guesses; streak calendar, hard
mode, share image (`docs/backlog.md`).

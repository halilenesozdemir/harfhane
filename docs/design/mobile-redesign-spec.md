# Mobile redesign spec: launch, home, top bars

Status: proposed, 2026-10-07 · Standard: `docs/design/mobile-ui-standard.md` (rule ids in
brackets) · Implementation: Plan 011 U7, after U1-U6 merge (open PRs #87 game-over card, #88
haptics and Lucide, #89 splash hold, Baloo 2 and H-A-R-F title, plus U2, U5, U6).

## Why

Owner feedback, 2026-10-07: the splash looks cheap; home and its links do not look modern;
"Nasıl oynanır" / "İstatistikler" look like a web app; in the game screen "Günlük · 5 harf" is too
big and too close to the back button; a UI/UX standard is wanted.

What the screenshots show (main, Expo Go; the grey gear top-right is Expo's dev overlay):
- Splash: a flat orange "H" glyph on cream, no tile, no depth: nothing of the 3D tile language.
- Home: everything is vertically centred, so the top ~40 % is empty; "HARFHANE" is plain text
  (PR #89 replaces it with tiles); the two mode cards are flat; three bare text links sit under
  them with 8 dp padding (below the 48 dp target); nothing says whether today's word was played.
- Daily card: 14 dp white body text on `correct` is 4.33:1, below 4.5:1 [C2].
- Game header: a text "‹ Geri" link 12 dp from a 20 sp extra-bold, left-aligned
  "Günlük · 5 harf" title; the "‹" is a Unicode glyph, not an icon [I1, B2, B3].
- Stats, How to play and Settings each end with a green "Kapat" button instead of a top bar
  [C3, B6]; titles use title case ("Nasıl Oynanır?", "En İyi Seri", "Tahmin Dağılımı") [TR2];
  How to play uses "siz" ("tahmin edin") while the rest of the app uses "sen" [TR3].
- PR #89's hero row puts `correctFg` (white) on `present` tiles: 1.9:1 [C1].

All dimensions below are for a 360 × 800 dp screen; the content column is 328 dp
(360 − 2 × `SCREEN_PADDING`).

## A. Native splash and launch

Android 12+ fixes the splash shape: a solid window background and one centred icon, masked to a
192 dp circle inside a 288 dp canvas (no icon background) [Sources: Android splash screen]. We
cannot add text, layouts or a custom image size beyond that. What we can do:

1. **Icon as a 3D tile.** Replace `assets/splash-icon.png` (flat "H") with an "H" tile in the
   playful 3D language:
   - Tile face 120 × 120 dp, radius 30 dp (the 14/56 tile ratio), fill `brand`, the existing
     drawn "H" glyph in `brandFg`; bottom depth edge 15 dp (1/8 of the face, the hero's 6/48
     ratio) in `brandDepth`. Total 120 × 135 dp, centred: its farthest corner is ~90 dp from the
     centre, inside the 96 dp mask radius (rounded corners add margin).
   - `app.json` `imageWidth` changes from 220 to 288, so the 1024 px PNG maps to the full
     288 dp canvas (expo-splash-screen 57 scales the PNG to `imageWidth` dp and centres it). Face
     ≈ 427 px, depth ≈ 53 px, transparent outside the tile. Verify the on-screen size on a release
     build before building the intro on it.
   - Dark variant `splash-icon-dark.png` uses the dark theme's `brand`, `brandFg`, `brandDepth`.
   - The PNGs come from the existing token-driven generator
     `apps/mobile/scripts/generate-brand-assets.mjs` (it already reads `brand-rgb` and `bg` from
     `tokens.json`); U7 adds the tile and depth there instead of a hand-coloured SVG that could
     drift from the tokens.
2. **Background** stays `bg` (cream / `#1c1611` dark) so the hand-off to the home screen has no
   colour jump [S3]. Alternative for the owner: brand-orange background with a cream tile (more
   striking, but the window flashes from orange to cream on hide unless the intro also animates
   the background).
3. **Same object as the launcher icon.** The adaptive icon foreground becomes the same tile, so
   launcher icon → splash → home hero is one continuous object (owner sign-off: it changes the
   store icon, Plan 011 R5).
4. **Short JS intro after `hideAsync`** (`apps/mobile/src/components/LaunchIntro.tsx`, cold start
   only):
   - Frame 0 is pixel-identical to the native splash: full-window `bg`, the same tile at the
     window centre (measure with `useWindowDimensions`, not the safe area).
   - 0–220 ms (`motionBase`, `easePop`): the H tile shrinks from 120 to 48 dp (depth 15 → 6) and moves to the
     hero's H slot (position from the hero's `onLayout`).
   - 160–520 ms: A, R, F tiles pop in with `motion-stagger` (Plan 011 U2), "hane" fades in.
   - 520–740 ms: the rest of the home screen fades in and rises 8 dp.
   - Total ≤ 800 ms; a tap skips to the end; reduce motion skips it entirely [M2, M4]; never
     shown when returning from background. If the hero has not laid out yet, fall back to a
     220 ms cross-fade.
   - The splash hold from #89 stays: the intro starts only after fonts, theme and stored state
     are ready, so there is no blank frame.
5. Verify on a release build, not Expo Go (Plan 011 KTD4): Expo Go shows its own splash.

## B. Home

### Navigation pattern: icon actions in a home top bar (recommended)

How to play, Stats and Settings are utilities, not peer destinations the player switches between
while playing, so an M3 navigation bar (meant for 3–5 persistent top-level destinations) would
cost 80 dp on every screen and would have to hide during play. Two patterns fit:

| | A. Top bar icon buttons (recommended) | B. Bottom row of icon + label tiles |
| - | - | - |
| Look | Game-like (Wordle, NYT Games, most casual puzzles) | Duolingo-like "menu" tiles |
| Space | 0 dp extra; frees the bottom for the cards | 72 dp row at the bottom |
| Discoverability | Icons only; first-launch How to play (U5) and TalkBack labels cover it | Labels visible |
| Reach | Top of screen (less thumb-friendly) | Thumb zone |

Recommendation A: it removes the "web links" look completely, matches the genre, and the actions
are rare. B is the fallback if closed-test players do not find Stats.

### Wireframe (pattern A)

```
 0 ┌──────────────────────── 360 dp ────────────────────────┐
   │ status bar (inset)                                     │
   ├────────────────────────────────────────────────────────┤
   │4│[Flame 3]chip     ·        [?]48 [▥]48 [⚙]48 │4│      │ 64  TOP_BAR_HEIGHT
   ├────────────────────────────────────────────────────────┤
   │                        16                              │
   │        ┌──┐┌──┐┌──┐┌──┐                                │
   │        │H ││A ││R ││F │ hane                           │ 54  hero: tiles 48, gap 8,
   │        └──┘└──┘└──┘└──┘                                │     depth 6, "hane" display 32
   │                     8                                  │
   │              Türkçe kelime oyunu                       │ 22  bodyLarge, textMuted
   │                        24                              │
   │  ┌─ Daily card (surface, r16, p20, depth 4) ────────┐  │
   │  │ ┌────┐  Günlük                                   │  │ 48  icon tile 48 (correct,
   │  │ │ ▦  │  Günün 5 harfli kelimesi                  │  │     CalendarDays 24) +
   │  │ └────┘                                           │  │     title 20 / body 14
   │  │ 12                                               │  │
   │  │ [CircleCheck Çözüldü · 3/6]  [Clock 04:12:09]    │  │ 28  status chips, caption 12
   │  │ 16                                               │  │
   │  │ [            Oyna  ▸            ] primary        │  │ 52  Button primary
   │  └──────────────────────────────────────────────────┘  │ =196 incl. padding
   │                        16                              │
   │  [ 4 harf ][ 5 harf ][ 6 harf ]  (only if >1 length)   │ 40 (+4 hitSlop) chips
   │                        16                              │
   │  ┌─ Unlimited card (pressable, depth 4) ────────────┐  │
   │  │ ┌────┐  Sınırsız                              ›  │  │ 88  icon tile 48 (present,
   │  │ │ ∞  │  Dilediğin kadar oyna, her seferinde yeni │  │     Infinity 24), ChevronRight 20
   │  │ └────┘                                           │  │
   │  └──────────────────────────────────────────────────┘  │
   │            (remaining space: bg, no content)           │
   └────────────────────────────────────────────────────────┘
```

Vertical total ≈ 64 + 16 + 84 + 24 + 196 + 16 + 40 + 16 + 88 = 544 dp, fits 800 dp with the
status and gesture bars; at font scale 1.3 the cards grow and the screen scrolls
(`ScrollView`, top bar fixed).

Details:
- **Top bar (home variant)**: no back. Leading: streak chip (`Flame` 16 + number, `caption`,
  `surface` fill, `RADIUS.full`, 32 dp tall, 48 dp target), hidden when the streak is 0. It shows
  the daily streak of the selected length (stats are per length) and follows the length chips;
  accessibility label "5 harf, 3 günlük seri". The streak appears only here, not again in the
  daily card. Tapping it opens Stats for that length. Trailing:
  three `IconButton`s, 24 dp icons in `text`, 8 dp apart: `CircleQuestionMark` "Nasıl oynanır
  sayfasını aç",
  `ChartColumn` "İstatistikleri aç", `Settings` "Ayarları aç". The home bar is the only bar
  allowed three trailing actions [B4].
- **Hero**: PR #89's H-A-R-F row, tiles 48 dp (was 40), 8 dp apart, with 6 dp `*Depth` edges, fills H
  `correct`, A `present`, R `correct`, F `present`, each letter in its own `*Fg` [C1]; followed by
  "hane" in Baloo 2 `display` `text`, baseline-aligned, so the whole brand name is visible.
  Accessibility label "Harfhane" [AX4]. Row width 4 × 48 + 3 × 8 + 8 + ~80 ≈ 304 dp < 328.
- **Daily card**: the main card and one pressable target (depth 4, lowers as a whole when
  pressed). The button-styled CTA inside it is part of that target, not a nested `Pressable`
  [CA2]; it opens or continues the daily game, or shows the finished game with its game-over
  card. States, from a pure `getTodayStatus(stats, dailyState,
  today)` helper (`apps/mobile/src/home/today-status.ts`):

  | State | Status chips | CTA |
  | ----- | ------------ | --- |
  | Not started | "Yeni kelime hazır" | primary "Oyna" |
  | In progress | "2/6 tahmin" | primary "Devam et" |
  | Won | `CircleCheck` "Çözüldü · 3/6" (`correctText`), `Clock` countdown | secondary "Sonucu gör" |
  | Lost | `CircleX` "Bu sefer olmadı", `Clock` countdown | secondary "Sonucu gör" |

  When the daily is finished, the primary style moves to the Unlimited card's CTA ("Sınırsız
  oyna", shown only then; otherwise that card shows a `ChevronRight`), so there is still exactly
  one primary [K1]. Both cards stay single targets.
  Loading: the cards render at once with title and body only; status chips appear when the
  stored state has loaded (no spinner, no layout jump: the chip row keeps its 28 dp).
  Midnight: when the countdown reaches zero, and whenever the app returns to the foreground
  (`AppState` "active"), the status is recomputed for the new Turkey day, so a finished card
  returns to "Not started".
  The displayed streak is `currentStreak` only when `lastPlayedDate` is today or yesterday (Turkey
  day); otherwise 0. `DailyStats.currentStreak` is not reset until the next result, so showing it
  raw would claim a broken streak. The same `getDisplayedStreak` helper replaces the raw
  `stats.currentStreak` on the Stats screen. Countdown uses `getTimeUntilMidnight` from
  `@harfhane/shared`, `fontVariant: ['tabular-nums']`, updates each second only while visible,
  not a live region [AX3].
- **Length chips**: shown only when more than one length is playable; they set the length for
  both modes, so they sit between the cards, labelled "Kelime uzunluğu" for TalkBack.
  Selected: `brand` / `brandFg`; others `surface` / `text` with `surfaceBorder`.
- **Card copy**: "Günlük" / "Günün 5 harfli kelimesi", "Sınırsız" / "Dilediğin kadar oyna, her
  seferinde yeni kelime". Body text is `textMuted` on `surface` (7.29:1), fixing the 4.33:1
  white-on-green body text [C2].

### Pattern B (alternative) bottom row

```
   │  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
   │  │    ?     │ │    ▥     │ │    ⚙     │             │ 72  3 tiles 104 × 72, gap 8,
   │  │ Nasıl    │ │ İstatis- │ │ Ayarlar  │             │     surface, r12, depth 3,
   │  │ oynanır  │ │ tikler   │ │          │             │     icon 24 + caption 12
   │  └──────────┘ └──────────┘ └──────────┘             │
   │                    16 + gesture inset               │
```
"İstatistikler" at `caption` fits 104 dp on one line at scale 1.0 but wraps at 1.3; the tiles grow
in height rather than truncating.

## C. Game screen top bar

```
   ├────────────────────────────────────────────────────────┤
   │4│[←]48│        Günlük  [5 harf]          │ spacer 48 │4│ 64 dp
   ├────────────────────────────────────────────────────────┤
   │                         8                              │
   │                    board starts                        │
```

- Back: `IconButton` `ArrowLeft` 24 dp, label "Geri" [B2].
- Title "Günlük" or "Sınırsız" in Baloo 2 `titleSmall` 18 (was 20 extra-bold, left-aligned),
  centred over the full width [B3]. Chip "5 harf": `caption` 12 / 700, `textMuted` on `surface`,
  1 dp `surfaceBorder`, `RADIUS.full`, 24 dp tall, 8 dp horizontal padding, 8 dp after the title.
  Accessibility: the title row reads "Günlük, 5 harf" as one header.
- The title block is at least 16 dp from the back button's 48 dp target (owner: "too close").
  Space for title + chip at 360 dp: 360 − 2 × (4 + 48 + 16) = 224 dp.
- Trailing slot: 48 dp spacer for now. A `CircleQuestionMark` help action can go there later
  without moving the title.
- Board starts 8 dp below the bar. Today the header takes ~51 dp (12 padding + ~27 text +
  12 gap); the new one takes 72 dp (64 + 8), ~21 dp more. Plan 011 U2's responsive tile size must
  use the real header height (measure it, do not hard-code the old one).
- `GameOverCard` (#87) adopts `Button` (primary "Paylaş", secondary "Yeni kelime") and `Card`;
  its title uses `headline` 24; the highlighted bar's count moves outside the fill in `text`
  (today 12 dp `brandFg` on `correct`, a C1/C2 failure).

## D. Stats, How to play, Settings

All three get the standard `TopBar` and lose the bottom "Kapat" button [B6]. Hardware back and the
top bar back behave the same [B5].

```
   │4│[←]48│            İstatistikler          │ spacer 48 │4│ 64
   │16  ┌─────────────────┐ ┌─────────────────┐  16         │
   │    │       12        │ │       83        │   2 × 2 grid: cards 158 × 72,
   │    │      Oyun       │ │    Kazanma %    │   gap 12, padding 12,
   │    └─────────────────┘ └─────────────────┘   value Baloo title 20,
   │    ┌─────────────────┐ ┌─────────────────┐   label caption
   │    │        3        │ │        7        │
   │    │      Seri       │ │   En iyi seri   │
   │    └─────────────────┘ └─────────────────┘
   │    24                                                    │
   │    Tahmin dağılımı   (caption 700, textMuted)            │
   │    1 ▇▇            bars 16 dp, gap 4, highlight correct  │
```

- **İstatistikler**: title "İstatistikler" with a chip "5 harf" (daily) or "Sınırsız · 5 harf"
  (unlimited); "Sınırsız Mod İstatistikleri" (~250 dp at 18 sp) would not fit the 224 dp title
  space. Unlimited shows "Kazanılan" instead of the two streak cards. The 2 × 2 grid replaces four
  74 dp cards whose 42 dp inner width would break "Kazanma %" mid-word. The distribution's count
  sits outside the bar fill in `text` [C2]. Labels in sentence case: "Oyun", "Kazanma %", "Seri",
  "En iyi seri", "Tahmin dağılımı". Stat cards are static (no depth) [D3].
- **Nasıl oynanır**: title "Nasıl oynanır" (no "?"); copy in "sen" form: "Gizli kelimeyi 6
  denemede tahmin et." On first launch (Plan 011 U5) a primary "Oynamaya başla" button sits at the
  bottom instead of a close button; from the home icon it has none.
- **Ayarlar**: title "Ayarlar"; rows are 56 dp list items on one `surface` card with 1 dp
  `surfaceBorder` dividers: "Tema" (the existing segmented control), "Yüksek kontrast" with
  supporting line "Renk körlüğü dostu renkler" (was one long label), "Titreşim" (#88). Version
  text `caption` `textMuted` at the bottom of the scroll content.

## E. Components and constants U7 adds

| File | Contents |
| ---- | -------- |
| `apps/mobile/src/ui/layout.ts` | `FONT_SIZE.titleSmall`, `FONT_SIZE.headline`, `SPACING.xxxl`, `RADIUS.full`, `TOUCH_TARGET`, `TOP_BAR_HEIGHT`, `ICON_SIZE`, `DEPTH`, `SCREEN_PADDING` |
| `apps/mobile/src/ui/IconButton.tsx` | 48 dp round target, Lucide icon, required `accessibilityLabel` |
| `apps/mobile/src/ui/TopBar.tsx` | back / title / chip / trailing actions; home variant |
| `apps/mobile/src/ui/Button.tsx` | primary / secondary / tertiary with depth and pressed state |
| `apps/mobile/src/ui/Card.tsx` | surface with optional depth when pressable |
| `apps/mobile/src/home/today-status.ts` | pure `getTodayStatus` (streak, state, guesses) |
| `apps/mobile/src/components/LaunchIntro.tsx` | cold-start intro, reduce-motion aware |
| `apps/mobile/scripts/generate-brand-assets.mjs`, `apps/mobile/app.json` | 3D splash/launcher tile from tokens; `imageWidth` 288 |

No new dependency is needed (Lucide, Baloo 2 and haptics come with #88/#89). Nunito for body text
would be a new package (`@expo-google-fonts/nunito`) and needs the owner.

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

**Status: decided by the owner 2026-10-09 ("Konsept D", from a visual concept canvas), replacing
the brand-orange "H" tile, cream splash and ≤800 ms hero-morph intro below.** Implementation:
Plan 011 U7d.

Android 12+ fixes the splash shape: a solid window background and one centred icon, masked to a
192 dp circle inside a 288 dp canvas (no icon background) [Sources: Android splash screen]. We
cannot add text, layouts or a custom image size beyond that.

1. **Launcher / store icon ("A"): two 3D tiles.** Cream background (`bg` light, `#fff4dc`).
   Behind, a yellow `present` tile (fill `present-rgb`, depth `present-depth`) rotated +12°,
   offset up-right; in front, a larger green `correct` tile (fill `correct-rgb`, depth
   `correct-depth`) rotated -6°, with a white "H" (`correct-fg`) in Baloo 2 ExtraBold. Reference
   geometry on a 240 px icon: yellow tile 110 px square, radius 24, at left 96 top 44, depth
   12 px; green tile 128 px square, radius 28, at left 40 top 70, depth 14 px, "H" ~92 px. The
   dark-theme variant (dark `bg`, `present`/`present-depth`, `correct-depth`) is used for the
   splash icon, not the launcher icon.
   - All colours come from `packages/ui-tokens/tokens.json` via
     `apps/mobile/scripts/generate-brand-assets.mjs` (extended, no hand-coloured SVG). The light
     theme's `present-rgb`/`present-depth`/`correct-rgb`/`correct-depth`/`correct-fg` already
     equal the owner's hex values exactly, so no new tokens were needed.
   - The "H" is real Baloo 2 ExtraBold glyph outlines, not a drawn bar shape: extracted once from
     `@expo-google-fonts/baloo-2`'s `Baloo2_800ExtraBold.ttf` with `opentype.js` and baked into the
     generator as a path constant (documented at its definition; re-extraction steps are in the
     same comment). The generator itself has no font-rendering dependency.
   - Adaptive icon: foreground is the two-tile mark shrunk to fit Android's safe zone, background
     is cream, monochrome is the same silhouette in one colour (the "H" cut out of the tile shapes
     so it survives the system's single-colour tint).
2. **Native splash: dark background in both themes.** `backgroundColor` is the dark `bg` token
   (`#1c1611`) for both the light and dark `expo-splash-screen` config slots, so the window never
   flashes before the intro's own cross-fade to the current theme. Icon is the same two-tile mark
   in its dark-theme colours, shrunk further to sit comfortably inside the 192 dp mask. `app.json`
   `imageWidth` is 288 dp, matching the Android splash canvas, so the generator's margin
   calculation (mark bounding circle vs. mask radius) is against the real canvas size.
3. **Short JS intro after `hideAsync`** (`apps/mobile/src/components/LaunchIntro.tsx`, cold start
   only), on the same dark background so frame 0 matches the native splash:
   - The mark fades/shrinks away, then two rows of four tiles play a mini game with the existing
     tile-flip language (Plan 011 U2's `Tile`), but with intro-only timing instead of the game's
     `motion-flip`/`motion-stagger`: a 350 ms flip and a 50 ms stagger. Row 1 "FARK" (F present,
     A correct, R correct, K absent) flips in; row 2 "HARF" (all correct) continues the same sweep,
     then jumps like the win bounce (30 ms stagger).
   - Then the wordmark "harfhane" gathers in (Baloo 2 ExtraBold, "harf" in the dark theme's
     `brand`, "hane" in the dark theme's cream `text`) with the subtitle "Her gün yeni bir kelime" in dark
     `text-muted`. No glow or radial light.
   - The wordmark holds fully visible for 600 ms, then the background cross-fades to the current
     theme's `bg` and the home screen fades in.
   - Total ≈ 2.3 s (owner, 2026-10-09: shortened from ≈ 3.1 s; pinned by a test); a tap skips to home immediately; reduce motion (`useReduceMotion`) skips the
     intro entirely [M2, M4]; never shown when returning from background. Input is never blocked
     beyond the intro.
   - Accessibility: decorative, one accessible label "Harfhane"; skippable and short so TalkBack
     users are never trapped.
   - The splash hold from #89 stays: the intro starts only after fonts, theme and stored state are
     ready, so there is no blank frame.
4. Verify on a release build, not Expo Go (Plan 011 KTD4): Expo Go shows its own splash, so the
   native icon/splash sizing is not visible there.

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

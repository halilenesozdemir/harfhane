# Mobile UI standard (Android app)

Status: proposed, 2026-10-07 · Applies to `apps/mobile` · Builds on
`docs/decisions/2026-10-04-visual-direction-playful-3d.md` (playful soft 3D) and Plan 011.
Redesign spec that applies it: `docs/design/mobile-redesign-spec.md`. Implementation: Plan 011 U7.

Every rule has an id and a check type:
**[L]** can become a lint rule or grep check, **[T]** can become a unit/component test,
**[R]** checked in review (screenshot on a device or emulator, light and dark).

Baseline device: 360 × 800 dp portrait (smallest common Android width). Layouts must also work at
412 dp and with system font scale 1.3.

## 1. Tokens and where values come from

| Kind | Source | Notes |
| ---- | ------ | ----- |
| Colours | `useTheme().colors` (generated from `packages/ui-tokens/tokens.json`) | Never raw hex/rgb in components (Invariant 5). |
| Radii for tiles and keys | `base.radiusTile` (14), `base.radiusKey` (10) via `parsePx` | Shared with web. |
| Durations, easing | `base.motionFast` (100 ms), `base.motionBase` (220 ms), `base.easePop`; Plan 011 KTD2 adds `motion-flip`, `motion-stagger` | Shared with web. |
| Spacing, font sizes, other radii, sizes | `apps/mobile/src/ui/layout.ts` (`SPACING`, `FONT_SIZE`, `RADIUS`, plus the new constants below) | Mobile-only layout scale. |

- **S1 [L]** No hex, `rgb(`, or named colour literals in `apps/mobile/src/**/*.tsx` (tests and
  `theme.ts` excepted).
- **S2 [L]** No numeric literal for `fontSize`, `padding*`, `margin*`, `gap`, `borderRadius` in a
  `StyleSheet`; use a `layout.ts` constant or a named constant derived from one.
- **S3 [T]** The splash `backgroundColor` values in `app.json` equal `themes.light.bg` and
  `themes.dark.bg` (a test reads both files).

New constants U7 adds to `layout.ts` (names are part of this standard):

```ts
FONT_SIZE  += { titleSmall: 18, headline: 24 }        // top bar title, in-content headline
SPACING    += { xxxl: 32 }
RADIUS     += { full: 999 }                            // chips, pills
TOUCH_TARGET = 48                                      // dp, minimum hit area
TOP_BAR_HEIGHT = 64                                    // dp, M3 small top app bar
ICON_SIZE  = { sm: 16, md: 20, lg: 24, xl: 28 }
DEPTH      = { sm: 3, md: 4, lg: 6 }                  // bottom depth edge, dp
SCREEN_PADDING = SPACING.lg                            // 16 dp horizontal
```

## 2. Typography

Display font: Baloo 2 ExtraBold (`FONT_FAMILY_DISPLAY = 'Baloo2_800ExtraBold'`, loaded in
`App.tsx` by PR #89). Body font: the system font (Roboto) until the owner decides on Nunito
(open decision, see the spec). Only one Baloo weight ships; do not add weights without a reason.

| Role | Size (sp) | Font | Weight | Line height | Use |
| ---- | --------- | ---- | ------ | ----------- | --- |
| `display` | 32 | Baloo 2 | (800 via family) | 40 | Hero wordmark, tile letters on the hero |
| `headline` | 24 | Baloo 2 | — | 30 | Game-over title, empty-state headline |
| `title` | 20 | Baloo 2 | — | 26 | Card titles, section headlines |
| `titleSmall` | 18 | Baloo 2 | — | 24 | Top bar title only |
| `bodyLarge` | 16 | body | 400 / 700 | 22 | Primary body, button labels |
| `body` | 14 | body | 400 / 700 | 20 | Secondary body, list rows |
| `caption` | 12 | body | 700 | 16 | Chips, labels, stat captions; never smaller than 12 |

- **T1 [L]** A style with `fontFamily: FONT_FAMILY_DISPLAY` sets no `fontWeight` (Android picks a
  fallback face when a weight is combined with a single-weight custom family).
- **T2 [L]** No `textTransform: 'uppercase'` and no `.toUpperCase()` / `.toLowerCase()` on
  Turkish text; write the literal string in the case you need (sentence case per TR2) or use `normalizeWord()`.
- **T3 [R]** Text scales with the system font size. Only letters inside fixed-size game controls
  (tiles, keys, hero tiles) may cap scaling, with `maxFontSizeMultiplier={1.2}`. The top bar
  title uses `maxFontSizeMultiplier={1.3}` and `numberOfLines={1}`.
- **T4 [R]** At most two type sizes inside one card, plus `caption`.
- **T5 [R]** Baloo 2 has tall metrics; set `lineHeight` from the table and check on a device that
  "İ", "Ş", "Ğ" are not clipped.

## 3. Spacing and layout

Scale: 4 · 8 · 12 · 16 · 20 · 24 · 32 (`SPACING.xs` … `SPACING.xxxl`).

- **L1 [R]** Screen horizontal padding is `SCREEN_PADDING` (16 dp) on every screen. The game board
  and keyboard may use 8 dp to win width, nothing else.
- **L2 [R]** Gap between sections 24 dp; between related items in a section 8–12 dp; inside cards
  16 dp padding (`SPACING.lg`), 20 dp for the hero mode card.
- **L3 [R]** Content column max width `CONTENT_MAX_WIDTH` (400 dp), centred.
- **L4 [T]** Screens respect safe-area insets (top and bottom); no content under the status or
  gesture bar.
- **L5 [R]** Content is top-aligned under the top bar; no screen centres its whole content
  vertically (the old home screen did, which left a large empty top half).

## 4. Colour roles

| Role | Token(s) | Use |
| ---- | -------- | --- |
| Ground | `bg` | Screen background, splash background |
| Surface | `surface`, `surfaceBorder`, `surfaceDepth` | Cards, chips, top bar icon-button pressed state |
| Text | `text`, `textMuted` | Primary and secondary text, icons |
| Brand / primary action | `brand`, `brandFg`, `brandDepth` | Primary button, selected chip, hero accents |
| Game states | `correct*`, `present*`, `absent*` | Tiles, keys, result highlights, hero tiles |
| Coloured text on surface | `correctText`, `presentText` | Answer text, positive status |

- **C1 [T]** A foreground always comes from the matching `*Fg` of its fill: `presentFg` on
  `present`, never `correctFg` on `present`. (PR #89's hero row uses `correctFg` on every tile:
  white on `present` is 1.9:1 and fails; fix in #89 or in U7.)
- **C2 [T]** Contrast, measured from tokens by a test over all four variants `getThemeColors`
  returns (light, dark, each with and without high contrast):
  normal text ≥ 4.5:1, large text (≥ 18.66 dp bold or ≥ 24 dp) and icons ≥ 3:1 (WCAG 2.1
  1.4.3, 1.4.11). Measured 2026-10-07: `correctFg` on `correct` is 4.33:1 and `absentFg` on
  `absent` (light) is 4.29:1, so text on those fills must be large (tile letters, card titles),
  never 14 dp body text. Current violations: the home daily card's 14 dp white body text on
  `correct`; the 12 dp count inside the highlighted `correct` bar in `StatsScreen.tsx` (`correctFg`)
  and in #87's `GameOverCard` (`brandFg`, also a C1 mismatch; 4.13:1 in dark). Fix: counts sit
  outside the bar fill in `text`, or the fill uses a token with enough contrast.
- **C3 [R]** Brand orange is for the one primary action per screen and for selection; game-state
  green is for game meaning, not for generic buttons (Stats/How-to "Kapat" buttons use `correct`
  today; they go away with the top bar).
- **C4 [R]** `surfaceDepth` on `bg` is 1.07:1 in dark mode, so in dark mode cards also draw a 1 dp
  `surfaceBorder` edge. Do not rely on depth alone to show a card's boundary.

## 5. Shape and 3D depth

From the ADR: tiles and buttons read as pressable through a bottom depth edge.

| Element | Radius | Depth (bottom edge) | Depth colour |
| ------- | ------ | ------------------- | ------------ |
| Game tile | `radiusTile` 14 | none on board; 1/8 of the face on brand tiles (`DEPTH.lg` 6 at 48 dp hero, 15 dp at the 120 dp splash tile) | `*Depth` of the fill |
| Key | `radiusKey` 10 | `DEPTH.sm` 3 (pressed 1, translateY 2) | `keyDepth` / state depth |
| Button (primary, secondary) | `RADIUS.md` 12 | `DEPTH.md` 4 (pressed 1, translateY 3) | `brandDepth` / `surfaceDepth` |
| Card | `RADIUS.lg` 16 | `DEPTH.md` 4 when pressable, 0 when static | `surfaceDepth` |
| Chip | `RADIUS.full` | none | — |
| Icon button | `RADIUS.full` | none (flat; pressed fills `surface`) | — |

- **D1 [L]** No `elevation`, `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` in
  mobile styles. Depth is a solid bottom edge in a token colour (Android elevation shadows are
  not tokens and break paid themes).
- **D2 [T]** Pressed state lowers the element: depth shrinks to 1 dp and the face moves down by
  the difference, so total height stays constant (no layout shift).
- **D3 [R]** Static, non-interactive content has no depth. Depth means "you can press this".

## 6. Icons

Lucide via `lucide-react-native` (PR #88). Emoji never appear in the app's own UI (the share grid
squares are the only exception, Plan 011 owner decision).

- **I1 [L]** No emoji or symbol glyphs used as icons in `apps/mobile/src/**/*.tsx` string
  literals. The regex must cover more than `\p{Extended_Pictographic}`, which misses "‹"
  (U+2039) and "⌫" (U+232B): `[\p{Extended_Pictographic}\u2039\u203A\u2190-\u21FF\u2300-\u23FF\u2700-\u27BF]`.
  The share text comes from `@harfhane/shared` and is exempt.
- **I2 [R]** Sizes: `ICON_SIZE.lg` 24 in top bars and icon buttons, `md` 20 inside buttons and
  status rows, `sm` 16 inside chips. Keyboard keys keep #88's `KEY_ICON_SIZE` 18 (bounded by key
  width). Default stroke width 2; never mix stroke widths on one screen.
- **I3 [T]** Icon colour comes from a token (`text`, `textMuted`, or the `*Fg` of its fill).
- **I4 [T]** Icon-only controls carry `accessibilityLabel`; decorative icons next to text are
  hidden from TalkBack (`accessibilityElementsImportant="no"` / `importantForAccessibility="no"`).
- Canonical icons: back `ArrowLeft` (Android convention, not a chevron), how to play
  `CircleQuestionMark` (`CircleHelp` is only a deprecated alias in lucide-react-native 1.52),
  stats `ChartColumn`, settings `Settings`, daily `CalendarDays`, unlimited
  `Infinity`, streak `Flame`, solved `CircleCheck`, not solved `CircleX`, share `Share2`,
  next word `Clock`, Enter `CornerDownLeft`, delete `Delete`.

## 7. Touch targets

- **A1 [T]** Every pressable has a hit area ≥ `TOUCH_TARGET` (48 × 48 dp): either its own size or
  size plus `hitSlop`. Keys are exempt: the 11-key Turkish row on a 360 dp screen bounds key
  width to ~27 dp; keys keep 46 dp height and ≥ 4 dp gaps.
- **A2 [R]** Adjacent targets do not overlap their hit areas; at least 8 dp between icon buttons'
  visible bounds.
- **A3 [R]** Length chips may be 40 dp tall visually with `hitSlop` 4 to reach 48 dp.

## 8. Top bar (every screen except Home's custom bar)

One component, `apps/mobile/src/ui/TopBar.tsx`. Pattern: M3 small center-aligned top app bar.

```
|<4>[ ← 48 ]<-------- title (centered) -------->[ action 48 | spacer 48 ]<4>|   height 64 dp
```

- **B1 [T]** Height `TOP_BAR_HEIGHT` 64 dp below the status-bar inset; background `bg` (no
  colour band, no border, no depth).
- **B2 [T]** Leading: back `IconButton` with `ArrowLeft` 24 dp, `accessibilityLabel="Geri"`,
  `accessibilityRole="button"`, 48 dp target, 4 dp from the screen edge (icon optically 16 dp).
- **B3 [T]** Title is centred over the full bar width, `FONT_SIZE.titleSmall` (18) Baloo 2,
  colour `text`, one line, `accessibilityRole="header"`. A qualifier ("5 harf") is a separate
  chip after the title, never concatenated into the title string.
- **B4 [R]** Trailing: up to two `IconButton`s; when empty, a 48 dp spacer keeps the title
  centred. Minimum 16 dp between the title's bounds and any button.
- **B5 [T]** The hardware back button and the top bar back do the same thing
  (`useHardwareBackHandler`).
- **B6 [L]** No screen renders a text "Geri" or "Kapat" button for navigation; closing a screen
  is the top bar back or the system back.

## 9. Buttons

`apps/mobile/src/ui/Button.tsx` with `variant: 'primary' | 'secondary' | 'tertiary'`.

| Variant | Fill | Label | Depth | Height | Use |
| ------- | ---- | ----- | ----- | ------ | --- |
| primary | `brand` | `brandFg`, `bodyLarge` 700 | `brandDepth` 4 dp | 52 dp | The one main action ("Oyna", "Paylaş") |
| secondary | `surface` + 1 dp `surfaceBorder` | `text`, `bodyLarge` 700 | `surfaceDepth` 4 dp | 52 dp | Alternative action ("Yeni kelime") |
| tertiary | none | `brand` text (4.74:1 on `bg`), `body` 700 | none | 48 dp | Low-emphasis ("Tümünü gör") |

- **K1 [R]** At most one primary button visible per screen state.
- **K2 [T]** Optional leading icon 20 dp, 8 dp gap; label sentence case.
- **K3 [T]** Disabled: opacity 0.5, `accessibilityState={{ disabled: true }}`, no depth.

## 10. Cards

`apps/mobile/src/ui/Card.tsx` (`DepthSurface`).

- **CA1 [R]** Fill `surface`, radius 16, padding 16 (20 for the home mode cards), 1 dp
  `surfaceBorder`, depth 4 dp `surfaceDepth` only when the whole card is pressable.
- **CA2 [T]** A pressable card is one target with one action and one `accessibilityLabel` that
  includes its state ("Günlük oyun, 5 harf, bugün çözüldü"); nested pressables only for clearly
  separate actions (length chips). A button-styled CTA inside a pressable card ("Oyna") is part
  of the card's target, not its own `Pressable`; the whole card lowers when pressed (D2).
- **CA3 [R]** Card anatomy: optional leading icon tile (48 dp, radius 12, game-state or brand
  fill with depth 3), title (`title`), one supporting line (`body`, `textMuted`), optional status
  row (`caption` chips), optional trailing `ChevronRight` 20 dp in `textMuted`.

## 11. Motion

- **M1 [T]** Durations only from tokens: press feedback `motionFast` (100 ms); enter, exit and
  layout changes `motionBase` (220 ms); pops use `easePop`; flips use `motion-flip` and
  `motion-stagger` (Plan 011 U2).
- **M2 [T]** `AccessibilityInfo.isReduceMotionEnabled()` plus its change listener gates every
  non-essential animation: tile pop/flip/shake, launch intro, card entrances. With reduce motion
  on, state changes appear instantly (Plan 011 AE2).
- **M3 [R]** Animate only `transform` and `opacity` with `useNativeDriver: true` (Plan 011 KTD1).
- **M4 [R]** No animation blocks input for more than 300 ms, except the launch intro (≤ 800 ms,
  skippable by tap).

## 12. Accessibility

- **AX1 [T]** Every `Pressable` has `accessibilityRole` and either visible text or an
  `accessibilityLabel` in Turkish. Labels say the action: "İstatistikleri aç", "Nasıl oynanır sayfasını aç", not "Grafik".
- **AX2 [T]** Selected and disabled states use `accessibilityState`.
- **AX3 [T]** Live result text (`message`, countdown on completion) uses
  `accessibilityLiveRegion="polite"`; the per-second countdown itself is not live.
- **AX4 [R]** Brand wordmarks read naturally: the hero row's label is "Harfhane", not
  "HARFHANE" (TalkBack may spell an all-caps label letter by letter).
- **AX5 [R]** TalkBack focus order follows visual order; the top bar comes first.
- **AX6 [R]** Colour is never the only signal: tile states also carry an accessibility label
  ("A, doğru yerde"); status rows pair colour with an icon and text.

## 13. Turkish copy

- **TR1 [R]** Correct Turkish characters always (ç ş ğ ı ö ü İ Ş Ç Ğ Ö Ü); "İstatistikler"
  with dotted capital İ.
- **TR2 [R]** Sentence case for titles, buttons and labels: "Nasıl oynanır", "Sınırsız",
  "Yeni kelime". Not "Nasıl Oynanır", not "Günlük Oyun".
- **TR3 [R]** Address the player as "sen", short and warm, at most one exclamation mark per
  screen: "Bugünkü kelimeyi çözdün", "Yarın yeni kelime seni bekliyor".
- **TR4 [R]** Numbers before nouns without plural: "5 harf", "3 günlük seri", "2/6 tahmin".
- **TR5 [R]** No "Wordle" anywhere (Invariant 6); the tagline is "Türkçe kelime oyunu".

## 14. Do and don't

| Do | Don't |
| -- | ----- |
| Icon button with "Geri" label at top-left | Text "‹ Geri" link next to the title |
| "Günlük" title + "5 harf" chip | "Günlük · 5 harf" as one 20 sp heading |
| Icon actions in the top bar or labelled icon tiles | A row of bare text links ("web app" look) |
| One primary (brand) button per state | Several orange buttons competing |
| Bottom depth edge in a `*Depth` token | `elevation` / `shadow*` drop shadows |
| Text on `correct` only when large | 14 dp white text on green |
| Top-aligned content with a hero | Everything vertically centred in an empty screen |
| Lucide icons | Emoji or Unicode symbols (‹ ⌫ ✓) as icons |

## Sources

- Android splash screen (icon 288 dp in a 192 dp circle, 240/160 dp with icon background, animated
  icon ≤ 1000 ms): https://developer.android.com/develop/ui/views/launch/splash-screen (fetched
  2026-10-07).
- Material 3 top app bar (small bar 64 dp, 24 dp icons, center-aligned variant):
  https://m3.material.io/components/top-app-bar/specs. The page renders client-side and was not
  re-fetched this session; values are the published M3 spec.
- Material 3 icon buttons and 48 dp targets: https://m3.material.io/components/icon-buttons/specs
- Android touch target size 48 × 48 dp:
  https://support.google.com/accessibility/android/answer/7101858 and
  https://developer.android.com/guide/topics/ui/accessibility/apps
- Material 3 navigation bar (3–5 top-level destinations):
  https://m3.material.io/components/navigation-bar/guidelines
- WCAG 2.1 contrast 1.4.3 and non-text contrast 1.4.11: https://www.w3.org/TR/WCAG21/
- React Native `AccessibilityInfo.isReduceMotionEnabled`:
  https://reactnative.dev/docs/accessibilityinfo
- Expo splash screen config: https://docs.expo.dev/versions/latest/sdk/splash-screen/
- Lucide for React Native: https://lucide.dev/guide/packages/lucide-react-native

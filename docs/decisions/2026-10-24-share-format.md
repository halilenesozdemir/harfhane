# Share text: Harfhane's own format, no positional grid

Date: 2026-10-24 · Status: superseded by `2026-10-24-share-format-circles.md` (same day)

## Decision
`generateShareText` (`packages/shared/src/game/share.ts`) no longer copies Wordle's share format
(🟩🟨⬜ rows + "n/6"). It now produces:

```
Harfhane · 24 Ekim · 5 harf
3. tahminde buldum

▰▰▱▱▱ ✦1
▰▰▰▰▱ ✦2
▰▰▰▰▰

İpucusuz · Seri 4
harfhane.app
```

- One `▰`/`▱` bar per guess, length = word length; `▰` count = letters in the correct position
  only. A ` ✦N` suffix is appended only when `N > 0` letters are present but misplaced. The bar
  never maps to actual tile positions, so it cannot reveal which letters are placed where.
- Header: the daily date (day + Turkish month name) or `Sınırsız · <L> harf` for unlimited.
- Result line: `<n>. tahminde buldum` on a win, `Bulamadım (6 tahmin)` on a loss.
- Footer: `İpucusuz`/`İpucuyla`, plus ` · Seri <n>` only for a daily game with a streak > 0, then
  `harfhane.app` (or a caller-supplied deep link, e.g. web's per-length challenge URL).

## Reasons
- The emoji grid plus "n/6" is Wordle's own trade dress; copying it is a legal risk Harfhane does
  not need to take for a feature this easy to redesign.
- An original format is also a chance for the result to look like Harfhane's own product, not an
  unbranded clone.

## Consequences
- `generateShareText`'s signature changed (word length and a structured `ShareMode` — daily date
  or unlimited — replace the old `modeText` string); every caller (web `GameOverModal`, mobile
  `GameOverCard`) and their tests were updated in the same change.
- Web's `SharePreview` no longer renders a colored tile grid; it now previews the exact generated
  share text.
- The daily streak threading required new plumbing on mobile (`useResultRecorder`'s
  `justRecordedStreak`, `GameOverDistribution.tsx`'s `useDisplayStreak`) mirroring the existing
  distribution plumbing; web already had `stats.currentStreak` available.
- `GLOSSARY.md`'s "Game number" entry ("shown in the share text") is no longer accurate — the
  header now shows a date, not a running number — and was corrected in the same change.

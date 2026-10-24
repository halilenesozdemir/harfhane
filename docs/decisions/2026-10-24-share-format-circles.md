# Share text: positional colored-circle grid

Date: 2026-10-24 · Status: accepted · Supersedes `2026-10-24-share-format.md`

## Context
The progress-bar format adopted earlier the same day (`▰▱` bars counting correct letters, `✦N`
for misplaced ones) dropped position: a reader could not see how the game was solved, so the
shared text told nothing (owner, after testing it on a real share). The point of sharing a daily
word game is the row-by-row story. The trade-dress concern behind the earlier change (Wordle's
colored-square grid and "n/6" header) still stands.

## Decision
`generateShareText` (`packages/shared/src/game/share.ts`) produces a positional grid of circles:

```
Harfhane · 24 Ekim · 5 harf
3/6 · Seri 4

⚪🟡⚪⚪🟢
🟢🟢⚪🟡⚪
🟢🟢🟢🟢🟢

harfhane.app
```

- One row per guess, one circle per tile: 🟢 correct position, 🟡 present elsewhere, ⚪ absent.
  Never letters or the answer.
- Header: daily date (Turkey day) or "Sınırsız", plus the word length.
- Second line: `n/6`, or `Bulamadım · 6/6`; ` · Seri n` for daily streaks > 0; ` · İpucuyla` when a
  hint was used (no marker otherwise — Plan 011 AE6).
- Last line is always `harfhane.app`. The web's per-game "challenge" link is removed: it pointed
  unlimited shares at `/daily/<n>`.

Trade-dress mitigation: circles instead of squares, a branded header with date and length
instead of "Wordle N", no "Wordle" anywhere (Invariant 6).

## Consequences
- The emoji circles are a narrow, explicit exception to the "no emojis in user-facing text" rule in
  `CLAUDE.md`: only the share text, nowhere else in the UI.
- Web `GameOverModal`/`SharePreview`, mobile `GameOverCard` and the e2e share journeys assert this
  format.

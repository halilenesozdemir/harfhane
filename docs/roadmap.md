# Roadmap

Goal: first Play Store sales (Track A) while daily content never runs out (Track B). See `docs/decisions/2026-10-04-parallel-tracks.md`.

This page orders the plans. Status of each unit lives in git and PRs, not here.

Owner decisions made 2026-10-05:
- Purchase does not need an account (`docs/decisions/2026-10-05-purchase-without-account.md`); the first sale no longer waits on Plan 007.
- MVP has no accounts at all — no Google sign-in, JWT, push or reminder mail, no XP/badges/freeze/leaderboard (`docs/decisions/2026-10-05-mvp-scope-cut.md`). Plan 007 drops to the static privacy page only; its other units are postponed past MVP. This also removed lists, tournaments and duels from the product entirely, on web and mobile (not web-only).
- Visibility is per word length, 5 letters first (Plan 001 R7, Plan 006 R5); the one-time `DB` binding switch (Plan 001 U4) runs once, the first time a length (5 letters) reaches 90 days — see `docs/decisions/2026-10-06-length-visibility.md` for the "scheduled" vs. "active/playable" split.
- Launch sequencing (`docs/decisions/2026-10-05-launch-sequencing.md`): the Expo/Play owner steps stay last, on the owner's own timing; the content import + database cutover session runs after the web-cleanup pass, not before it.

Owner phase order, 2026-10-06 (replaces the previous single ordered list):

## Order

### Phase 1 — finish development code
- Close the open docs PRs (#45, #47, #51).
- Plan 008 U1–U7, U9–U10: playable lengths, word pools, the 3-year repeat cooldown, the 180-day restock runway, and the letter hint (`docs/plans/2026-10-06-008-feat-playable-lengths-word-pools-plan.md`).
- Shared/docs leftovers cleanup (`docs/backlog.md`).
- `0002` drop migration file: writing it is agent work; applying it to the remote database needs the owner (Invariant 4).
- Privacy page draft for the no-accounts product (007 U5), left unlinked until the owner approves the text (007 U6).
- Rewrite Plan 005 for the account-free model (KTD2/KTD3, open questions — done in this pass).

### Phase 2 — fill the new DB with clean words (import, 90 days, cutover)
- 006 U4: land the word-review files (owner work, lands in PR #55).
- 006 U5: label-generation script.
- 001 U3 + 006 U6: import the 346 reviewed 5-letter words and auto-fill 90+ days (owner, remote D1, Invariant 4).
- 001 U4: the one-time cutover (`DB` → `harfhane`), triggered once when 5 letters reaches 90 days.
- 006 U7: label, review, import and schedule the 4- and 6-letter pools in parallel; each becomes visible automatically at 90+ days, no second cutover.
- 008 U8: *owner* applies `0002_word_pools.sql` to `harfhane` before the import (Invariant 4).

### Phase 3 — owner tests on Android emulator
- Emulator test via `docs/guides/mobile-run.md`, against the production API.

### Phase 4 — accounts (Expo, Play, RevenueCat), purchase wiring, closed test, first sale
- 004 U9–U10: Expo account, `eas init`, first build; Play developer account, identity check, closed test.
- 005 U2, U4, U5: RevenueCat webhook, mobile purchase/restore dev build, Supporter v1 unlock — U4/U5 need the 004 U9 dev build and a Play Console product.
- 005 U6–U7: payments profile/tax info/listing privacy URL; first end-to-end purchase with a license tester.
- Closed test, first sale.

Plan 002 U6 (shadcn on web) and U9 (Tailwind 4) run after release, not in this order.

Plan 007's U1–U4, U7–U8 (sign-in, push, play counter) and Plan 005 U8 (the RevenueCat `logIn`
alias, cancelled) have no place in this order — they resume only if a later plan reintroduces
accounts, which is not currently planned (`docs/backlog.md`).

## Waiting on the owner

Agents cannot do these; each one unblocks the units listed.

| Decision or account | Unblocks |
|---------------------|----------|
| Supporter price in TRY, included themes, free unlimited limit (if any) | 005 status → approved |
| RevenueCat project | 005 U4 |
| Privacy and KVKK text approval | 007 U6, 005 U6, Play listing |
| Expo account, `eas init` | 004 U9 — Phase 4, owner's own timing |
| Play developer account, identity check, 12 testers × 14 days | 004 U10, first sale — Phase 4 |
| Land the word-review files from `feat/word-review`; commit review CSVs or not | 006 U4 |
| Remote D1 imports and scheduling (Invariant 4) | 006 U6–U8, 001 U3 — Phase 2 |
| 001 U4 binding switch (once, for 5 letters at 90 days) | Phase 2 |
| Android emulator set up and owner test session | Phase 3, `docs/guides/mobile-run.md` |
| `0002` drop migration applied to the remote database (Invariant 4) | Phase 1 cleanup, `docs/backlog.md` |

## Research

`docs/research/` holds the evidence behind plans 004–007, dated 2026-10-05. External facts (SDK versions, Play rules, prices) age quickly; re-check before acting on them.

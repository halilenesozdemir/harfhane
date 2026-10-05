# Roadmap

Goal: first Play Store sales (Track A) while daily content never runs out (Track B). See `docs/decisions/2026-10-04-parallel-tracks.md`.

This page orders the plans. Status of each unit lives in git and PRs, not here.

Owner decisions made 2026-10-05:
- Purchase does not need an account (`docs/decisions/2026-10-05-purchase-without-account.md`); the first sale no longer waits on Plan 007.
- MVP has no accounts at all — no Google sign-in, JWT, push or reminder mail, no XP/badges/freeze/leaderboard (`docs/decisions/2026-10-05-mvp-scope-cut.md`). Plan 007 drops to the static privacy page only; its other units are postponed past MVP.
- Cutover is per word length, 5 letters first (Plan 001 R7, Plan 006 R5).
- Launch sequencing (`docs/decisions/2026-10-05-launch-sequencing.md`): the Expo/Play owner steps stay last, on the owner's own timing; the content import + database cutover session runs after the web-cleanup pass, not before it.

## Order

| # | Plan | Track | Depends on |
|---|------|-------|------------|
| 1 | 003 Lint TypeScript (`docs/plans/2026-10-05-003-…`) | Foundation | — |
| 2 | 006 Content continuity U1–U3, U3a–U3b | B | — |
| 3 | 004 Android MVP U1–U8 | A | 003 |
| 4 | 007 Privacy page only (U5–U6); U1–U4, U7–U8 postponed past MVP | A | — (independent, no account work to gate it) |
| 5 | 005 Supporter purchase U4–U7 (U1–U3 post-launch, U8 postponed with 007) | A | 004 |
| 6 | Web cleanup before the shared engine (`docs/backlog.md`) | Foundation | — |
| 7 | 001 Clean database: content import, per-length cutover, retire | B | 006, and run after 6 (web cleanup) |
| 8 | 004 U9–U10: Expo/Play owner steps, closed test | A | owner's own timing — stays last |
| 9 | 002 U6 shadcn on web, U9 Tailwind 4 | Polish | after release |

Plan 007's U1–U4, U7–U8 (sign-in, push, play counter) and Plan 005 U8 (the RevenueCat `logIn`
alias) have no place in this order — they resume only if a later plan reintroduces accounts.

## Waiting on the owner

Agents cannot do these; each one unblocks the units listed.

| Decision or account | Unblocks |
|---------------------|----------|
| Supporter price in TRY, included themes, free unlimited limit (if any) | 005 status → approved |
| RevenueCat project | 005 U4 |
| Privacy and KVKK text approval | 007 U6, 005 U6, Play listing |
| Expo account, `eas init` | 004 U9 — stays last (owner's own timing) |
| Play developer account, identity check, 12 testers × 14 days | 004 U10, first sale — stays last |
| Land the word-review files from `feat/word-review`; commit review CSVs or not | 006 U4 |
| Remote D1 imports and scheduling (Invariant 4), per length | 006 U6–U8, 001 per-length cutover — after web cleanup |

## Research

`docs/research/` holds the evidence behind plans 004–007, dated 2026-10-05. External facts (SDK versions, Play rules, prices) age quickly; re-check before acting on them.

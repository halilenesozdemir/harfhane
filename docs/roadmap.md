# Roadmap

Goal: first Play Store sales (Track A) while daily content never runs out (Track B). See `docs/decisions/2026-10-04-parallel-tracks.md`.

This page orders the plans. Status of each unit lives in git and PRs, not here.

## Order

| # | Plan | Track | Depends on |
|---|------|-------|------------|
| 1 | 003 Lint TypeScript (`docs/plans/2026-10-05-003-…`) | Foundation | — |
| 2 | 006 Content continuity U1–U3 | B | — |
| 3 | 004 Android MVP U1–U8 | A | 003 |
| 4 | 007 Sign-in, push, privacy, play counts U1–U5 | A | 004 U6 for mobile screens |
| 5 | 005 Supporter purchase U1, U3, U5 | A | 007 sign-in (KTD3) |
| 6 | 001 Clean database: content import, cutover, retire | B | 006 |
| 7 | 004 U9–U10, 005 U4–U7: store release and first sale | A | owner accounts |
| 8 | 002 U6 shadcn on web, U9 Tailwind 4 | Polish | after release |

## Waiting on the owner

Agents cannot do these; each one unblocks the units listed.

| Decision or account | Unblocks |
|---------------------|----------|
| Mobile styling: verify NativeWind v4 on a device/emulator, or choose StyleSheet + tokens (`docs/research/2026-10-05-nativewind-spike.md`) | 004 U2, U5–U7 |
| Supporter price in TRY, included themes, free unlimited limit (if any) | 005 status → approved |
| RevenueCat project and webhook secret | 005 U2, U4 |
| Google Cloud Android OAuth client (package name + SHA-1) | 007 U3 in production, U7 |
| Privacy and KVKK text approval | 007 U6, 005 U6, Play listing |
| Expo account, `eas init` | 004 U9 |
| Play developer account, identity check, 12 testers × 14 days | 004 U10, first sale |
| Land the word-review files from `feat/word-review`; commit review CSVs or not | 006 U4 |
| Remote D1 imports and scheduling (Invariant 4) | 006 U6–U8, 001 cutover |

## Research

`docs/research/` holds the evidence behind plans 004–007, dated 2026-10-05. External facts (SDK versions, Play rules, prices) age quickly; re-check before acting on them.

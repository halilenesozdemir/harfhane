# Roadmap

Goal: first Play Store release (Track A) while daily content never runs out (Track B). See `docs/decisions/2026-10-04-parallel-tracks.md` — Track A's original "first sale" framing is read as "first release" from `docs/decisions/2026-10-06-free-launch.md` onward; monetization is Phase 5, not part of reaching Track A's goal.

This page orders the plans. Status of each unit lives in git and PRs, not here.

**Owner decision, 2026-10-24: in-app feedback replaces WhatsApp**
MVP scope now includes in-app feedback: testers and players send feedback and word reports from
inside the app instead of WhatsApp; messages are stored in D1 and emailed to the owner
(`docs/plans/2026-10-24-013-feat-in-app-feedback-plan.md`). No accounts are added for this — the
2026-10-05 scope cut still stands.

Owner decisions made 2026-10-05:
- MVP has no accounts at all — no Google sign-in, JWT, push or reminder mail, no XP/badges/freeze/leaderboard (`docs/decisions/2026-10-05-mvp-scope-cut.md`). Plan 007 drops to the static privacy page only; its other units are postponed past MVP. This also removed lists, tournaments and duels from the product entirely, on web and mobile (not web-only).
- Visibility is per word length, 5 letters first (Plan 001 R7, Plan 006 R5); the one-time `DB` binding switch (Plan 001 U4) runs once, the first time a length (5 letters) reaches 90 days. Opening a length (including 4 and 6 later) is a reviewed, one-line `PLAYABLE_WORD_LENGTHS` deploy (Plan 008 KTD1), not automatic — see `docs/decisions/2026-10-06-length-visibility.md` for the "scheduled" vs. "active/playable" split.
- Launch sequencing (`docs/decisions/2026-10-05-launch-sequencing.md`): the Expo/Play owner steps stay last, on the owner's own timing; the content import + database cutover session runs after the "Web cleanup before the shared engine" backlog item, not before it.

**Owner decision, 2026-10-24: original share text format, no Wordle-style grid**
(`docs/decisions/2026-10-24-share-format.md`). The share text's emoji grid + "n/6" copied
Wordle's trade dress; it is replaced with Harfhane's own progress-bar format (▰/▱ bars, a daily
date or "Sınırsız" header, no positional reveal). Done in the same session: `packages/shared`'s
`generateShareText`, web's `GameOverModal`/`SharePreview`, mobile's `GameOverCard` and the legacy
`apps/backend/migrations/` folder removal (unrelated cleanup, same PR set).

**Owner decision, 2026-10-06 (later): free launch, no monetization yet**
(`docs/decisions/2026-10-06-free-launch.md`, supersedes the 2026-10-05 purchase-without-account
decision as a launch commitment, though that decision's design still stands for whenever a
purchase ships). The first release is free, with no purchase and no accounts at all. Plan 005
(Supporter purchase) is **deferred** to a new Phase 5, not executed at launch; the only
monetization prep done now is a reversible `useEntitlements()` abstraction and named-constant
free/premium allowances, so a model can be picked from real usage data later without rework.

Owner phase order, 2026-10-06 (replaces the previous single ordered list):

## Order

### Phase 1 — finish development code
- **Deadline:** production's legacy schedule ends around 2026-11-09 for 5 letters (4: ~2026-12-11, 6: ~2026-12-01; probed through the public API on 2026-10-06), and the legacy DB's schedule-health alert has been failing silently (it queries columns the legacy schema lacks). Phase 2's cutover must land before 2026-11-09, or the owner tops up the legacy schedule. Resolved: the cutover ran on 2026-10-06 (`docs/guides/db-cutover-runbook.md`).
- Fix: `/api/words/daily?date=` returns future answers to anyone; restrict public lookups to today and past days (backend, after Plan 008 U1 merges).
- Close the remaining open docs PR (#51; #45 and #47 are merged).
- Plan 008 U1–U7, U9–U10: playable lengths, word pools, the 3-year repeat cooldown, the 180-day restock runway, and the letter hint (`docs/plans/2026-10-06-008-feat-playable-lengths-word-pools-plan.md`).
- Plan 009 U1–U7, then U8 as the Phase 1 exit gate: AE traceability, Playwright journeys + axe, real-backend Playwright, Maestro on Android, property and mutation tests, knip and dependency-cruiser (`docs/plans/2026-10-06-009-test-e2e-quality-gates-plan.md`).
- Plan 010: type strictness, branded types, ts-reset and the label eval gate (U5–U6 must land before any model-labelled unlimited batch is imported) (`docs/plans/2026-10-06-010-quality-types-label-evals-plan.md`).
- Plan 011 U1–U5: mobile polish before the closed test — game-over card, tile animations, haptics and Baloo 2, splash hold, first-launch how-to-play (`docs/plans/2026-10-06-011-feat-mobile-polish-plan.md`, owner decisions 2026-10-06).
- "Web cleanup before the shared engine" (`docs/backlog.md`) — the launch-sequencing ADR requires this done before Phase 2's content import.
- Other shared/docs leftovers cleanup (`docs/backlog.md`).
- The drop migration file (removed-feature tables, numbered after Plan 008's `0002_word_pools.sql` — not `0002` itself): writing it is agent work, done in this phase; applying it to the remote database needs the owner (Invariant 4) and does not block this phase.
- Privacy page draft for the no-accounts product (007 U5), left unlinked until the owner approves the text (007 U6).
- Rewrite Plan 005 for the account-free model (KTD2/KTD3, open questions) — kept as a Phase 5 option, not executed now.

Phase 1 exit (2026-10-11): `docs/research/2026-10-11-phase-1-exit.md` — all gates pass locally;
Plan 010 U3 and the `evaluate.ts`/`keyboard.ts` mutation scores are deferred past launch (owner).

### Phase 2 — fill the new DB with clean words (import, 90 days, cutover)
- 008 U8: *owner* applies `0002_word_pools.sql` to `harfhane` (Invariant 4), before the import below. Done 2026-10-06.
- 006 U4: word-review files landed (#55).
- 006 U5: label-generation script.
- 001 U3 + 006 U6: import the 346 reviewed 5-letter words and auto-fill 90+ days (owner, remote D1, Invariant 4).
- 001 U4: the one-time cutover (`DB` → `harfhane`), triggered once when 5 letters reaches 90 days.
- 006 U7: label, review, import and schedule the 4- and 6-letter pools in parallel; each then needs its own reviewed `PLAYABLE_WORD_LENGTHS` deploy (Plan 008 KTD1) once it reaches 90+ days — no second DB cutover.

### Phase 3 — owner tests on Android emulator
- Emulator test via `docs/guides/mobile-run.md`, against the production API.

### Phase 4 — Expo/EAS, Play account, closed test, free release
- 004 U9: Expo account, `eas init`, first build.
- 004 U10: Play developer account, identity check, closed test, production access — ships free, no purchase, no accounts.

### Phase 5 — monetization (post-launch)
- Choose the model from real post-launch usage data: one-time Supporter purchase (Plan 005, kept as the leading option), a subscription, or opt-in rewarded ads (Invariant 8) — then re-plan before building it.
- If picked, Plan 005 runs largely as drafted: U4–U5 (mobile purchase/restore, Supporter v1 unlock — themes + hint allowance) need a 004 U9 dev build and a Play Console product; U1–U3 (entitlements table, webhook, `/me`) stay post-launch backend work, not gating; U6–U7 (payments profile, first license-tester purchase) follow.
- Accounts return only if the chosen model needs one (e.g. a subscription or cross-device sync) — not for a one-time Play-restored purchase.

### Web track — public web link (Plan 012)
- Runs alongside Phases 3-4 (owner, 2026-10-14): web matches the mobile visual language, the guess list keeps suffix-like headwords (KOYUN, BOYUN), then the web link goes into the owner's profile (`docs/plans/2026-10-14-012-feat-web-polish-plan.md`).
- Production deploys run again from 2026-10-14; they had stopped on 2026-10-10 because of GitHub Actions billing on the then-private repository, which is now public.

Plan 002 U6 (shadcn on web) and U9 (Tailwind 4) run after release, not in this order.

Plan 007's U1–U4, U7–U8 (sign-in, push, play counter) and Plan 005 U8 (the RevenueCat `logIn`
alias, cancelled) have no place in this order — they resume only if a later plan reintroduces
accounts, which is not currently planned (`docs/backlog.md`).

## Waiting on the owner

Agents cannot do these; each one unblocks the units listed.

| Decision or account | Unblocks |
|---------------------|----------|
| Expo account, `eas init` | 004 U9 — Phase 4, owner's own timing |
| Play developer account, identity check, 12 testers × 14 days | 004 U10, free release — Phase 4 |
| Remote D1 imports and scheduling (Invariant 4) | 006 U6–U8, 001 U3 — Phase 2 |
| 001 U4 binding switch (once, for 5 letters at 90 days) | Phase 2 |
| Open 4 and 6 letters via a reviewed `PLAYABLE_WORD_LENGTHS` deploy once each reaches 90 days (Plan 008 KTD1) | Phase 2 |
| Android emulator set up and owner test session | Phase 3, `docs/guides/mobile-run.md` |
| Drop migration applied to the remote database (Invariant 4) | Phase 1 writes the file; applying it remotely is owner-paced and blocks nothing in Phase 1 (`docs/backlog.md`) |
| Choose the Phase 5 monetization model; Supporter price in TRY if Plan 005 is picked | Phase 5 |
| RevenueCat project, if Plan 005 is picked | Phase 5, 005 U4 |
| Privacy and KVKK text approval | 007 U6, Play listing — Plan 005's own privacy text (U6) waits for Phase 5 |

## Research

`docs/research/` holds the evidence behind plans 004–008, dated 2026-10-05/06. External facts (SDK versions, Play rules, prices) age quickly; re-check before acting on them.

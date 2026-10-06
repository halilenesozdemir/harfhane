---
title: Clean database and open-license word pipeline
type: infra
date: 2026-10-04
status: approved
---

# Clean database and open-license word pipeline

## Goal
Replace the legacy database, its 26-migration history and its TDK-scraped word data with:
- a clean `harfhane` D1 database built from one baseline migration;
- a word pool whose source and license are recorded per row.

Players get a daily puzzle that never runs out, and every word in it is approved and family-safe.

## Requirements
- R1. The schema comes from a single migration, `apps/backend/db/migrations/0001_baseline.sql`. Tests apply the same file.
- R2. Every word records `source` and `license`.
- R3. A curated word is active only when it is approved and family-safe; the database enforces this.
- R4. Only approved, family-safe, active words can be scheduled as daily words; a trigger enforces this.
- R5. ~~User-submitted list words keep working, but they can never become daily words.~~ **Removed, 2026-10-05: lists (`word_lists`, `word_list_words`, `list_likes`, `list_comments`) were cut from the product entirely (#37, #42); there is no user-submitted list content left to carry forward.**
- R6. Answer words and the guess list come from open-license sources. No TDK data is used.
- R7. **Owner decision, 2026-10-05: cutover is per word length, not all-or-nothing.** A length is *active/playable* once it has 90+ days of approved, family-safe schedule; 5 letters goes first. Lengths without 90+ days stay hidden in clients until stocked. Opening a length is **not automatic**: it is a reviewed, one-line deploy of the `PLAYABLE_WORD_LENGTHS` Worker var (Plan 008 KTD1) once that length reaches 90 days, replacing the fixed `ACTIVE_WORD_LENGTHS`/`VALID_LENGTHS` lists — implemented by Plan 008 R1 (U1–U3), not in this plan. This is distinct from *scheduled* lengths (always 4, 5 and 6; Plan 006 R2), which the cron keeps stocked whether or not they are open yet (`docs/decisions/2026-10-06-length-visibility.md`).
- R8. **Owner decision, 2026-10-06: repeat policy.** An approved answer may repeat within its own word length only after 3 years since it was last scheduled for that length — implemented by Plan 008 R3/KTD3, not in this plan (`docs/decisions/2026-10-06-word-supply.md`).

## Acceptance examples
- AE1 (R3). Given a draft word, when `is_active` is set to 1 without approval, then the insert or update fails.
- AE2 (R4). Given word id 999 that does not exist or is not approved, when it is inserted into `daily_words`, then it is rejected with "daily word must be an approved, family-safe, active word". Verified on the new remote database on 2026-10-04.
- AE3 (R1). `pnpm test` in `apps/backend` passes against the baseline migration: 95/95 on 2026-10-04.

## Key technical decisions
- KTD1. **Parallel database, no in-place reset.** The live app stays on `harfhane-db` until cutover. Rollback is a one-line binding change.
- KTD2. **Admin actions count as human approval.** Creating or activating a word from the admin panel sets `status = 'approved'` and `family_safe = 1`.
- KTD3. `tdk_words` is renamed to `valid_words` and carries `source` and `license`.
- KTD4. **Backup.** A full export of the legacy database lives outside the repo, in the owner's `~/Backups/harfhane/`. It contains personal data, so it is never committed.

## Status (2026-10-04)
- Done:
  - Backup taken.
  - `harfhane` created (id `58cbee2e-…`), bound as `DB_NEXT`.
  - Baseline applied, 11 badges seeded.
  - Repositories and tests updated.
- Live: still on `harfhane-db`.

## Units
- U1. Baseline migration, badge seed, repository and test changes. Done on branch `chore/harfhane-rename`.
- U2. Word pipeline, as a script under `scripts/words/`:
  1. Candidates come from `hunspell-tr` and a frequency threshold (`wordfreq`, plus CC BY frequency lists) — see `docs/decisions/2026-10-06-word-supply.md` for the allowed-sources list (no Zemberek, no MIT/ISC lists).
  2. A family-safety blocklist and classifier filter them.
  3. ~~Definitions are original and written by a model, then cross-checked.~~ **Superseded, 2026-10-06: words carry no meaning or context at all in either pool** (Plan 008 R5/R6, `docs/decisions/2026-10-06-word-supply.md`); no definition step runs.
  4. Admin approval follows.
- U3. Seed `valid_words` and approved answer words into `harfhane`, then schedule 90+ days per length, starting with 5 letters.
- U4. **Cutover — a single DB binding switch, done once (R7).** Point binding `DB` at `harfhane`, set `migrations_dir`, remove `DB_NEXT`, deploy once (triggered when 5 letters first reaches 90 days), then verify `/api/words/daily` for each length that has 90+ stocked days. This does not repeat per length: opening 4 and 6 letters later only needs a reviewed `PLAYABLE_WORD_LENGTHS` deploy (Plan 008 KTD1/U1), not another binding switch.
- U5. ~~Migrate the 12 legacy users only if wanted.~~ **Cancelled, 2026-10-05: no accounts at all for MVP** (`docs/decisions/2026-10-05-mvp-scope-cut.md`); legacy user rows are not migrated.
- U6. **Retire `harfhane-db`.** Delete it after one stable week, with explicit owner approval. Deletion is irreversible.
- U7. ~~Client length visibility.~~ **Superseded by Plan 008 U1–U3** (R1: backend-reported playable lengths, web and mobile stop hard-coding `[4, 5, 6]`).
- U8. ~~Repeat-policy guard.~~ **Superseded by Plan 008 U6** (R3/KTD3: auto-fill cooldown query against `daily_words`).

## Scope boundaries
Out of scope: Connections content and payments (`entitlements` table). Both get their own plans.

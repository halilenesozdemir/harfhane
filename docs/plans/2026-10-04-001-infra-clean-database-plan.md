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
- R5. User-submitted list words keep working, but they can never become daily words.
- R6. Answer words and the guess list come from open-license sources. No TDK data is used.
- R7. **Owner decision, 2026-10-05: cutover is per word length, not all-or-nothing.** A length cuts over once it has 90+ days of approved, family-safe schedule; 5 letters goes first. Lengths without 90+ days stay hidden in clients until stocked. Active lengths become data-driven (a config endpoint is tracked in `docs/backlog.md`), replacing the fixed `ACTIVE_WORD_LENGTHS` list.

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
  1. Candidates come from open-license lists (Zemberek roots, MIT/ISC lists) and a frequency threshold (wordfreq).
  2. A family-safety blocklist and classifier filter them.
  3. Definitions are original and written by a model, then cross-checked.
  4. Admin approval follows.
- U3. Seed `valid_words` and approved answer words into `harfhane`, then schedule 90+ days per length, starting with 5 letters.
- U4. **Cutover, per length (R7).** Point binding `DB` at `harfhane`, set `migrations_dir`, remove `DB_NEXT`, deploy, then verify `/api/words/daily` for each length that has 90+ stocked days; lengths without stock stay hidden in clients until Plan 006's cron tops them up.
- U5. Migrate the 12 legacy users only if wanted. The owner decides; no active users since 2026-07-01.
- U6. **Retire `harfhane-db`.** Delete it after one stable week, with explicit owner approval. Deletion is irreversible.

## Scope boundaries
Out of scope: Connections content and payments (`entitlements` table). Both get their own plans.

---
title: Content continuity
type: feat
date: 2026-10-05
status: approved
---

# Content continuity

## Goal
Track B of `docs/decisions/2026-10-04-parallel-tracks.md`: daily content never runs out and never depends on someone remembering (Invariant 10). Continues Plan 001 U2–U4.

Research: `docs/research/2026-10-05-content-continuity.md`.

## Requirements
- R1. Admin bulk import works against the baseline schema and records `source` and `license` (Invariant 3).
- R2. One-click auto-fill schedules every active length (`ACTIVE_WORD_LENGTHS`), not only length 5.
- R3. The schedule-health warning runs on the cron, not only when the admin dashboard is opened.
- R4. The word review pipeline (pool → model labels → deterministic validation → review CSV) lives in the repo and is reproducible.
- R5. At least 90 approved days per active length before the Plan 001 cutover.

## Acceptance examples
- AE1 (R1). Given an admin import of two words, then both rows have non-null `source` and `license`, `status = 'approved'` and `family_safe = 1`.
- AE2 (R2). Given empty schedules for lengths 4, 5 and 6, when auto-fill runs for N days, then each length has N scheduled days.
- AE3 (R3). Given a schedule with fewer days than the warning threshold, when the cron runs, then the alert function is called once.

## Key technical decisions
- KTD1. Admin import is admin approval (Plan 001 KTD2): imported words get `status = 'approved'`, `family_safe = 1`, and `source`/`license` from the request, defaulting to `admin` / `owner-curated`.
- KTD2. *(assumption)* Schedule health runs inside the existing 17:00 UTC cron, so no new trigger is needed.
- KTD3. Review files (`data/words/review/`) are owner work in progress in a separate worktree. This plan does not move them; U4 waits for the owner.

## Units
- U1. Fix `/admin/import` per KTD1, with repository and route tests. (R1)
- U2. Auto-fill for all active lengths, with a test per length. (R2)
- U3. Call schedule health from `scheduled()`; tests with a mocked alert. (R3)
- U4. *Owner first:* land `answer_pool.py`, `validate_labels.py` and their tests from the `feat/word-review` worktree; decide what in `data/words/review/` is committed. (R4)
- U5. Label-generation script feeding `validate_labels.py`. (R4)
- U6. *Owner:* import 346 reviewed 5-letter words and auto-fill 90+ days on the new database (remote D1, Invariant 4). (R5)
- U7. Label and review 4- and 6-letter pools; *owner* imports and schedules them. (R5)
- U8. *Owner:* confirm 90+ days per length, then run the Plan 001 U4 cutover. (R5)

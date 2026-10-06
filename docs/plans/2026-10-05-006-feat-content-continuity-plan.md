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
- R2. One-click auto-fill schedules every *scheduled* length (4, 5 and 6, fixed), not only length 5. Scheduled is distinct from *active/playable* (Plan 001 R7, `docs/decisions/2026-10-06-length-visibility.md`): a hidden length still gets scheduled and stocked so it is already at 90 days the moment it becomes visible.
- R3. The schedule-health warning runs on the cron, not only when the admin dashboard is opened.
- R4. The word review pipeline (pool → model labels → deterministic validation → review CSV) lives in the repo and is reproducible.
- R5. At least 90 approved days per active length before the Plan 001 cutover for that length (owner decision, 2026-10-05: cutover is per length, 5 letters first; see Plan 001 R7).
- R6. A daily cron tops the schedule up to 90 days from approved, family-safe stock for each *scheduled* length (4, 5, 6 — including lengths still hidden from players; see R2). (owner decision, 2026-10-05)
- R7. Low-stock alerts fire on remaining approved stock dropping below a threshold, not only on projected runway. (owner decision, 2026-10-05)

## Acceptance examples
- AE1 (R1). Given an admin import of two words, then both rows have non-null `source` and `license`, `status = 'approved'` and `family_safe = 1`.
- AE2 (R2). Given empty schedules for lengths 4, 5 and 6, when auto-fill runs for N days, then each length has N scheduled days.
- AE3 (R3). Given a schedule with fewer days than the warning threshold, when the cron runs, then the alert function is called once.
- AE4 (R6). Given a length with 60 scheduled days and 90+ eligible approved words, when the top-up cron runs, then it schedules 30 more days for that length.
- AE5 (R7). Given a length whose remaining *approved, unscheduled* stock drops below the low-stock threshold, when the cron runs, then the alert function is called, independent of scheduled runway.

## Key technical decisions
- KTD1. Admin import is admin approval (Plan 001 KTD2): imported words get `status = 'approved'`, `family_safe = 1`, and `source`/`license` from the request, defaulting to `admin` / `owner-curated`.
- KTD2. *(assumption)* Schedule health runs inside the existing 17:00 UTC cron, so no new trigger is needed. The top-up (R6) and low-stock alert (R7) run in the same cron tick.
- KTD3. Review files (`data/words/review/`) are owner work in progress in a separate worktree. This plan does not move them; U4 waits for the owner.

## Units
- U1. Fix `/admin/import` per KTD1, with repository and route tests. (R1)
- U2. Auto-fill for all scheduled lengths, with a test per length. (R2)
- U3. Call schedule health from `scheduled()`; tests with a mocked alert. (R3)
- U3a. Daily cron top-up: schedule approved, family-safe stock up to 90 days per scheduled length; test per length. (R6)
- U3b. Low-stock alert on remaining approved stock below threshold, independent of U3's runway check; tests with a mocked alert. (R7)
- U4. *Owner first:* land `answer_pool.py`, `validate_labels.py` and their tests from the `feat/word-review` worktree; decide what in `data/words/review/` is committed. (R4)
- U5. Label-generation script feeding `validate_labels.py`. (R4)
- U6. *Owner:* import 346 reviewed 5-letter words and auto-fill 90+ days on the new database (remote D1, Invariant 4), then run the one-time Plan 001 U4 binding switch (`DB` → `harfhane`), triggered once, by 5 letters reaching 90 days. (R5)
- U7. Label and review 4- and 6-letter pools in parallel; *owner* imports and schedules them (remote D1, Invariant 4). Plan 001 U4 already ran in U6 and does not run again — once a length reaches 90+ days it becomes visible/playable automatically (Plan 001 R7, the client length-visibility unit). (R5)
- U8. *Owner:* confirm each length's 90+ day stock. This only flips that length's visibility flag (Plan 001 R7) — no further Plan 001 U4 binding switch, which already happened once in U6. (R5)

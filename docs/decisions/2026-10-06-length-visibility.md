# Length visibility: "active" means playable, not scheduled

Date: 2026-10-06 · Status: accepted

## Decision
Invariant 10 ("at least 90 days of approved daily words per active length") means *active* =
a length players can currently see and play (Plan 001 R7), not the fixed set the cron fills.
Opening a length is **not automatic**: it is a reviewed, one-line deploy of the
`PLAYABLE_WORD_LENGTHS` Worker var (Plan 008 KTD1) once that length reaches 90 days. That fixed
set the cron fills, the *scheduled* lengths, stays 4, 5 and 6 (Plan 006 R2): the cron tops every
scheduled length up to 90 days whether or not it is open yet, so a hidden length is already
stocked and ready to open the moment it crosses the 90-day threshold.

## Reasons
- Plan 006's auto-fill and top-up cron need to run on hidden lengths before launch, or 4 and 6
  would start from zero stock instead of quietly reaching 90 days in the background while only
  5 letters is visible.
- Plan 001 R7 made opening a length a per-length, reviewed decision, replacing the old fixed
  `ACTIVE_WORD_LENGTHS`/`VALID_LENGTHS` lists. Without this split, Invariant 10 would read as
  requiring 90 days for lengths nobody can play yet, which was never the intent.

## Consequences
- `docs/plans/2026-10-05-006-feat-content-continuity-plan.md` R2 and
  `docs/plans/2026-10-04-001-infra-clean-database-plan.md` R7 both use this split
  ("scheduled" vs. "active/playable") instead of conflicting language.
- Implementation lives in `docs/plans/2026-10-06-008-feat-playable-lengths-word-pools-plan.md`
  R1 (U1–U3): the backend-reported `PLAYABLE_WORD_LENGTHS` and the `SCHEDULED_WORD_LENGTHS`
  rename carry out this split in code; Plan 001/006 only record the decision.
- If AGENTS.md Invariant 10's own wording should be amended to spell this out explicitly, that
  edit needs the owner — AGENTS.md is binding and not edited here; flagged in the PR #51 body.

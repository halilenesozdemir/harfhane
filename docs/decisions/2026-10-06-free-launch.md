# Free launch: no monetization, purchase or accounts until Phase 5

Date: 2026-10-06 · Status: accepted

## Decision
The first Play Store release ships **free, with no purchase and no accounts at all** — this
supersedes the earlier 2026-10-06 reading of "first sale" as part of the MVP (`docs/decisions/
2026-10-04-parallel-tracks.md`'s Track A goal is read as "first release," not "first sale," from
this point on). Plan 005 (Supporter purchase) is **deferred**, not cancelled: its content stays
as the leading option for Phase 5, picked and re-planned from post-launch data rather than
executed now.

The only monetization prep done before launch is industry-standard, reversible groundwork:
- Any feature that could become a paid perk (themes, hint allowance, …) reads through a single
  `useEntitlements()` abstraction (web and mobile) that always returns "non-premium" until a
  monetization plan actually ships. Call sites never hardcode free-tier behavior directly.
- Free/premium allowances are named constants, not literals, so a later plan can raise them for
  a paid tier without touching call sites (Plan 008 R7's `HINTS_PER_DAILY_GAME` already does
  this).

Accounts return only if the Phase 5 model the owner picks actually needs one (e.g. a
subscription or cross-device sync); a one-time purchase restored through Play does not.

## Reasons
- Shipping free removes RevenueCat, Play Console product setup, pricing and purchase QA from
  the critical path to the first release — the fastest way to get the app in front of players
  and start collecting the usage data a monetization choice should be based on.
- Committing to one-time Supporter purchase before any usage data exists is a guess; deferring
  the choice (one-time purchase vs. subscription vs. opt-in rewarded ads, Invariant 8) to
  post-launch data is cheaper than building the wrong one now and re-doing it.
- The entitlement abstraction and named-constant allowances cost little now and avoid a larger
  refactor later: every "is this free or paid" check already goes through one seam.

## Consequences
- `docs/roadmap.md`: Phase 4 is Expo/EAS and the Play closed test/free release only (004 U9–U10).
  A new Phase 5 (monetization) holds Plan 005, picked and re-planned after real usage data exists.
- Plan 005: `status: deferred`. Its requirements/units are unchanged as a design option; none of
  them run until Phase 5 starts.
- `docs/decisions/2026-10-05-purchase-without-account.md` and
  `docs/decisions/2026-10-06-word-supply.md`/`2026-10-06-length-visibility.md` are unaffected in
  substance — they recorded design decisions, not a launch commitment, and still apply whenever
  their plans run.
- Accounts stay out of scope (`docs/decisions/2026-10-05-mvp-scope-cut.md`) unless the Phase 5
  monetization choice itself requires one.

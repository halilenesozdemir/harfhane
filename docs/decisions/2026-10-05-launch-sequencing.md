# Launch sequencing: owner steps last, cleanup before content cutover

Date: 2026-10-05 · Status: accepted

## Decision
- The Expo/Play owner steps (Expo account and `eas init`, Play developer account and
  verification, the closed test with 12 testers for 14 days) stay last in the plan order.
  They are the owner's call on timing and are not pulled earlier to unblock other work.
- The content import and database cutover session (Plan 006 word import/scheduling, Plan 001
  per-length cutover) runs after the web cleanup pass (`docs/backlog.md` "Web cleanup before
  the shared engine"), not before or in parallel with it.

## Reasons
- The Play/Expo owner steps (account creation, identity verification, a 14-day test window)
  are calendar-bound and owner-only; sequencing other work around them would just add waiting,
  not speed anything up.
- Cleaning up dead web code and routes first means the content import and cutover session
  works against a smaller, settled surface instead of auditing live data against code that is
  about to be deleted.

## Consequences
- `docs/roadmap.md`: the owner-only Expo/Play rows stay at the end of the order; the content
  import + cutover row is placed after the web-cleanup backlog item, not before it.
- No plan unit numbering changes; this only affects the order units are picked up in, which
  `docs/roadmap.md` already tracks separately from plan files.

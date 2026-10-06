# Purchase does not require an account

Date: 2026-10-05 · Status: accepted

**Scope note, 2026-10-06:** Plan 005 itself is deferred to Phase 5 (`docs/decisions/2026-10-06-free-launch.md`) — launch ships with no purchase and no accounts at all. This ADR still records the design for whichever monetization model Phase 5 picks if it keeps a purchase at all.

## Decision
The Supporter purchase (Plan 005) does not require signing in. RevenueCat identifies the
buyer by an anonymous app user id and restores the purchase through the Google Play account on
the device — Play's own purchase-restore flow, not an app sign-in. The client reads entitlement
state directly from the RevenueCat SDK; the backend `entitlements` table and webhook (Plan 005
U1–U3) move to post-launch, needed only once a server-side entitlement check is wanted.
Accounts are not planned to return; Plan 005 U8 (a RevenueCat `logIn` alias for a future
account) is cancelled, not deferred.

## Reasons
- The first sale (Plan 005) no longer needs to wait on Plan 007 sign-in; it can ship as soon
  as the Android MVP (Plan 004) is in testers' hands.
- RevenueCat already handles anonymous-id purchase and restore; building a second,
  account-gated restore path duplicates that for no benefit before accounts exist.
- Supporter v1 is a plain unlock (no theme gating required), so there is nothing an account is
  needed to scope per-user beyond what RevenueCat already tracks.

## Consequences
- Plan 005: KTD3 changes from "buying requires an account" to "anonymous app user id,
  Play-account purchase restore." U1–U3 (entitlements table, webhook, `/me` endpoint) move to
  post-launch. U8 (a RevenueCat `logIn` alias for a future account) is cancelled — accounts are
  not planned to return (`docs/backlog.md`); re-plan from scratch if that changes.
- Plan 005 no longer depends on Plan 007; `docs/roadmap.md` reorders accordingly.
- A player who switches Play accounts restores through Play's own purchase-restore flow on the
  new account, the same as any other Play purchase — no app-level account or sign-in, now or
  later.

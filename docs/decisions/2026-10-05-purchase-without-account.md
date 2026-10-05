# Purchase does not require an account

Date: 2026-10-05 · Status: accepted

## Decision
The Supporter purchase (Plan 005) does not require signing in. RevenueCat identifies the
buyer by an anonymous app user id and restores the purchase through the Google Play account
on the device, with no app-level account needed. The client reads entitlement state directly
from the RevenueCat SDK; the backend `entitlements` table and webhook (Plan 005 U1–U3) move to
post-launch, needed only once a server-side entitlement check is wanted. When accounts (Plan
007) ship, a RevenueCat `logIn` alias on sign-in links the anonymous purchase to the account id.

## Reasons
- The first sale (Plan 005) no longer needs to wait on Plan 007 sign-in; it can ship as soon
  as the Android MVP (Plan 004) is in testers' hands.
- RevenueCat already handles anonymous-id purchase and restore; building a second,
  account-gated restore path duplicates that for no benefit before accounts exist.
- Supporter v1 is a plain unlock (no theme gating required), so there is nothing an account is
  needed to scope per-user beyond what RevenueCat already tracks.

## Consequences
- Plan 005: KTD3 changes from "buying requires an account" to "anonymous app user id,
  Play-account restore, `logIn` alias later." U1–U3 (entitlements table, webhook, `/me`
  endpoint) move to post-launch; U8 (the `logIn` alias) is added for when Plan 007 ships.
- Plan 005 no longer depends on Plan 007; `docs/roadmap.md` reorders accordingly.
- A player who reinstalls on a different Play account, or switches Play accounts, cannot
  restore until they sign in and the `logIn` alias runs (Plan 005 U8) — accepted for MVP.

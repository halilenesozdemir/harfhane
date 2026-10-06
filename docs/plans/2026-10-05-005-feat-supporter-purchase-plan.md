---
title: Supporter purchase
type: feat
date: 2026-10-05
status: deferred
---

# Supporter purchase

## Goal
**Deferred, 2026-10-06** (`docs/decisions/2026-10-06-free-launch.md`): the launch ships free, with
no purchase and no accounts at all. This plan is kept as the leading *option* for Phase 5
(monetization, picked from post-launch data) rather than being executed now — a one-time,
optional Supporter pack in the Android app (`docs/decisions/2026-10-04-monetization-no-ads-at-launch.md`).
The game stays fully playable for free either way.

Research: `docs/research/2026-10-05-supporter-purchase.md`. The post-launch backend units
(U1–U3) stay post-launch regardless of which Phase 5 model is picked and do not depend on the
open questions below.

Owner decision, 2026-10-05: purchase does not require an account (`docs/decisions/2026-10-05-purchase-without-account.md`). This changes KTD3 and the dependency on Plan 007 below. (Moot while
this plan is deferred, but kept for whichever model Phase 5 picks.)

## Requirements
- R1. One non-consumable product, bought through Google Play Billing via RevenueCat.
- R2. The client reads the entitlement from the RevenueCat SDK; the backend `entitlements` path (U1–U3) is post-launch, not on the first-sale path.
- R3. A purchase restores through the Play account, with no app sign-in required.
- R4. Revoked or refunded purchases stop granting the pack.
- R5. Supporter v1 is a flat, one-time unlock: all starter themes plus a larger daily hint allowance (Plan 008 R7's `HINTS_PER_DAILY_GAME` constant gets a supporter-tier value); no further theme gating (Invariant 5, Plan 002 U8) is required.

## Acceptance examples
- AE1 (R3). Given a reinstall on the same Play account, when the app starts, then RevenueCat's anonymous-user restore grants `supporter` without sign-in.
- AE2 (R4). Given a refunded purchase, when RevenueCat re-syncs entitlements, then the SDK no longer reports `supporter` active.

## Key technical decisions
- KTD1. RevenueCat webhooks, not direct Play Developer API calls — no service-account JWT flow to build (ADR: free under $2.5k monthly revenue). Kept for the post-launch backend path (U1–U3), not required for the first sale.
- KTD2. `entitlements` table in a later numbered migration (after Plan 008's `0002_word_pools.sql` — not `0002` itself), never by editing `0001_baseline.sql`, which is already applied to the new database (Invariant 2): `revenuecat_app_user_id` (RevenueCat's anonymous app user id — there are no Harfhane accounts, so this is not a `users.id` foreign key), `product`, `source`, unique `transaction_id` for idempotency, `granted_at`, nullable `revoked_at` (never deleted). Post-launch: simplified scope, see Units.
- KTD3. **Owner decision, 2026-10-05 — supersedes the 2026-10-05 draft assumption.** Purchase does not require an account. RevenueCat identifies the buyer by an anonymous app user id and restores through the Google Play account; no sign-in flow is on the purchase path. Accounts are not planned to return (`docs/backlog.md`); if they ever do, linking the anonymous purchase to an account id needs its own design from scratch, not a `logIn` alias bolted onto this plan.

## Open questions for the owner
1. Price in TRY ("one tier below the usual remove-ads tier"), *if and when this plan is picked up for Phase 5*. v1 is a flat unlock that includes all starter themes and the larger hint allowance — no separate theme-selection decision is needed.
2. "Full unlimited mode" in the ADR implies free unlimited is limited on mobile. What is the free limit, if any?
3. Does a RevenueCat project exist?
4. Privacy policy and KVKK text covering purchase data (shared with Plan 007 U6).

## Units
- U1. *(post-launch)* `entitlements` migration, repository and tests — only needed once server-side entitlement checks (admin, cross-device sync without RevenueCat) are wanted. (R2)
- U2. *(post-launch)* RevenueCat webhook route with shared-secret check, idempotent upsert, refund handling; tests with recorded payloads. *Owner:* webhook secret. (R2, R4)
- U3. *(post-launch)* `GET /api/entitlements/me`, kept as a fallback once U1/U2 exist. (R2)
- U4. Mobile: dev build with `react-native-purchases`, purchase and restore buttons, entitlement read from the SDK directly (no backend call on the purchase path). *Owner:* Play Console product, license testers, RevenueCat Android app. (R1, R3, R4)
- U5. Supporter v1 unlock (flat: themes + larger hint allowance, Plan 008 R7) read from the RevenueCat SDK through the `useEntitlements()` abstraction (`docs/decisions/2026-10-06-free-launch.md`). Theme registry and locked-theme UI (Plan 002 U8) are optional follow-up, not required for first sale. (R5)
- U6. *Owner:* payments profile, tax info, privacy policy URL in the listing.
- U7. *Owner:* end-to-end purchase with a license tester before the first real sale.
- U8. ~~RevenueCat `logIn` alias on sign-in, linking the anonymous app user id to the account id.~~ **Cancelled, 2026-10-05: no accounts are planned** (`docs/backlog.md` — if accounts return, re-plan this from scratch). (KTD3)

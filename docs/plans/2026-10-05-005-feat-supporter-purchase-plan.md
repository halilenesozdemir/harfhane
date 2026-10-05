---
title: Supporter purchase
type: feat
date: 2026-10-05
status: draft
---

# Supporter purchase

## Goal
The first sale: a one-time, optional Supporter pack in the Android app (`docs/decisions/2026-10-04-monetization-no-ads-at-launch.md`). The game stays fully playable for free.

Research: `docs/research/2026-10-05-supporter-purchase.md`. Status is `draft` until the owner answers the open questions; backend units U1 and U3 do not depend on them.

## Requirements
- R1. One non-consumable product, bought through Google Play Billing via RevenueCat.
- R2. The backend is the source of truth for what a player owns; clients ask `GET /api/entitlements/me`.
- R3. A purchase can be restored on a new device.
- R4. Revoked or refunded purchases stop granting the pack.
- R5. Themes unlock by swapping token sets only (Invariant 5, Plan 002 U8).

## Acceptance examples
- AE1 (R2, R4). Given a RevenueCat `CANCELLATION`/refund event for a user, when the webhook is processed, then `GET /api/entitlements/me` no longer lists `supporter`.
- AE2 (R2). Given the same webhook event delivered twice, then one entitlement row exists.

## Key technical decisions
- KTD1. RevenueCat webhooks, not direct Play Developer API calls — no service-account JWT flow to build (ADR: free under $2.5k monthly revenue).
- KTD2. `entitlements` table in the baseline migration (Invariant 2): `user_id`, `product`, `source`, unique `transaction_id` for idempotency, `granted_at`, nullable `revoked_at` (never deleted).
- KTD3. *(assumption)* Buying requires an account (Plan 007 sign-in), so restore works through the account. Guest purchases with later merge are not built.

## Open questions for the owner
1. Price in TRY ("one tier below the usual remove-ads tier") and which starter themes are included.
2. "Full unlimited mode" in the ADR implies free unlimited is limited on mobile. What is the free limit, if any?
3. Does a RevenueCat project exist?
4. Privacy policy and KVKK text covering purchase data (shared with Plan 007 U8).

## Units
- U1. `entitlements` migration, repository and tests. (R2, R4)
- U2. RevenueCat webhook route with shared-secret check, idempotent upsert, refund handling; tests with recorded payloads. *Owner:* webhook secret. (R1, R4)
- U3. `GET /api/entitlements/me`. (R2)
- U4. Mobile: dev build with `react-native-purchases`, purchase and restore buttons. *Owner:* Play Console product, license testers, RevenueCat Android app. (R1, R3)
- U5. Theme registry and locked-theme UI reading entitlements (Plan 002 U8). (R5)
- U6. *Owner:* payments profile, tax info, privacy policy URL in the listing.
- U7. *Owner:* end-to-end purchase with a license tester before the first real sale.

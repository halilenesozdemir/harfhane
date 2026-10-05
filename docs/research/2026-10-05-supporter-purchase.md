---
title: Supporter purchase — research
type: research
date: 2026-10-05
status: draft
---

# Supporter purchase: Expo Android first sale

Scope: `docs/decisions/2026-10-04-monetization-no-ads-at-launch.md`, `2026-10-04-parallel-tracks.md`
(first 5-10 Play Store sales, track A). Backend: Hono on Cloudflare Workers + D1, `apps/backend`.

## 1. Product shape: one-time vs subscription

`docs/decisions/2026-10-04-monetization-no-ads-at-launch.md` already decided this: one-time,
optional purchases only, explicitly **"Not doing: subscriptions"**. The decision lists the
Supporter pack as: ad-free, full unlimited mode, past-day archive, detailed stats, supporter
badge, starter themes — plus separate SKUs later for visual themes and themed puzzle packs.
That doc also already picked billing: "through RevenueCat on top of Google Play Billing. It is
free under $2.5k monthly revenue" and pricing "one tier below the market's usual remove-ads
tier, set in Play Console."

**Recommendation:** keep the existing decision as-is — one-time non-consumable "Supporter"
product, no subscription. It composes cleanly with `docs/plans/2026-10-04-002-feat-design-tokens-plan.md`
U8 (paid theme registry): Supporter unlocks a bundle of "starter themes" from that registry;
additional themes become their own one-time SKUs later, gated by the same entitlement check.
**Owner decision needed:** exact starter-theme set and price point (decision doc says "one tier
below market remove-ads tier" but doesn't name a TRY figure).

## 2. Google Play Billing from Expo

- RevenueCat free tier: Pro plan is free below $2,500 monthly tracked revenue (MTR, pre-Google-cut
  revenue), then 1% of that month's full MTR, not just the excess. Matches the decision doc's
  figure. [RevenueCat pricing](https://checkthat.ai/brands/revenuecat/pricing) / [costbench.com](https://costbench.com/software/subscription-billing/revenuecat/), checked 2026-10-05.
- `react-native-purchases` supports Google Play Billing one-time (non-consumable) products, not
  just subscriptions, and ships webhooks for server-side purchase events. Confirms option 3 below
  is viable via RevenueCat instead of raw Play Developer API.
- **Requires a development build, not Expo Go** — Expo Go has no native in-app-purchase module;
  RevenueCat needs EAS Build or an Expo Dev Client. [Expo + RevenueCat tutorial](https://expo.dev/blog/expo-revenuecat-in-app-purchase-tutorial), [RevenueCat Expo support](https://deepwiki.com/RevenueCat/react-native-purchases/7.1-expo-support), checked 2026-10-05.
- Alternatives — `expo-iap` and `react-native-iap`: both are maintained, now consolidated under
  the OpenIAP project (hyodotdev/openiap monorepo); npm package names unchanged.
  `react-native-iap` moved to a Nitro-Modules implementation; `expo-iap` is an Expo Module with
  tighter Expo-ecosystem fit — recommended if going this route instead of RevenueCat. Both still
  need a dev build (same native-module constraint as RevenueCat). [react-native-iap discussion #2985](https://github.com/hyochan/react-native-iap/discussions/2985), checked 2026-10-05.
- **Recommendation:** RevenueCat, matching the existing decision — it is free at this volume,
  gives webhooks for free (avoids hand-rolled Play Developer API auth), and the dev-build
  requirement is unavoidable either way.

## 3. Server-side verification

Two options exist; the decision doc implies RevenueCat but doesn't rule on verification method:

- **RevenueCat webhooks**: RevenueCat validates the purchase against Play Billing itself and
  posts a signed event to a backend URL on purchase/renewal/refund. A Worker route verifies the
  signature and writes the entitlement. No Google service-account JWT signing needed.
- **Direct Google Play Developer API**: `purchases.products.get` (one-time product status) and
  `purchases.voidedpurchases.list` (refund/chargeback tracking) both exist under scope
  `https://www.googleapis.com/auth/androidpublisher`, with service-account auth.
  [Voided Purchases API](https://developers.google.com/android-publisher/voided-purchases),
  [purchases.voidedpurchases.list](https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.voidedpurchases/list),
  checked 2026-10-05. This is technically reachable from Workers: a service-account OAuth2 token
  needs an RS256-signed JWT assertion, and WebCrypto's `crypto.subtle.sign('RSASSA-PKCS1-v1_5', …)`
  covers RS256 — `apps/backend/src/utils/auth.ts` already does the HMAC/PBKDF2 equivalent
  pattern with WebCrypto only, so the approach fits the codebase's existing no-Node-crypto style.
  **Unverified:** I did not find or test a working minimal WebCrypto-only Workers snippet for the
  full Google OAuth2 service-account flow; it is standard but not confirmed end-to-end here.

**Recommendation:** use RevenueCat webhooks, not direct Play Developer API calls. It reuses the
already-decided RevenueCat dependency, needs no service-account key stored as a Worker secret,
and removes a whole JWT-signing code path. Keep `purchases.voidedpurchases.list` as a fallback
only if RevenueCat's refund webhook proves unreliable in practice.

## 4. Data model

No `entitlements` table exists yet — `docs/plans/2026-10-04-001-infra-clean-database-plan.md`
explicitly lists "payments (`entitlements` table)" under **Scope boundaries: out of scope**, and
`apps/backend/db/migrations/0001_baseline.sql` has no matching table (checked via grep for
entitlement/purchase/theme — no hits). The `users` table (`0001_baseline.sql:50-60`) has
`id INTEGER PRIMARY KEY AUTOINCREMENT`, `google_id TEXT` nullable with a partial unique index —
auth is local JWT (HS256, `apps/backend/src/utils/auth.ts`) plus optional Google OAuth
(`apps/backend/src/routes/auth.ts`, `upsertGoogleUser`). No anonymous/device-id user concept
exists in the schema today — every row needs a `users.id`.

Proposed table, following the baseline's conventions (snake_case, `datetime('now')` defaults,
FK + index per existing tables like `user_badges`):

```sql
CREATE TABLE entitlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  store TEXT NOT NULL DEFAULT 'google_play',
  transaction_id TEXT NOT NULL UNIQUE,
  granted_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);
CREATE INDEX idx_entitlements_user ON entitlements (user_id);
```

- `transaction_id UNIQUE` makes webhook replay idempotent (same purchase token/order id twice is
  a no-op insert failure, caught and ignored).
- `revoked_at` nullable, set on a RevenueCat refund/void event instead of deleting the row —
  consistent with the project's word lifecycle convention (soft-deactivate, never delete).
- **Anonymous purchases / restore flow:** since there is no device-anonymous user row today, a
  purchase on a logged-out player either (a) forces account creation/login before purchase (new
  requirement, blocks guest play from buying), or (b) requires a lightweight device-bound
  "anonymous user" row the client can later merge into a real account on login. (a) is simpler
  and fits the current schema with zero changes; (b) needs a new column or table and a merge
  path. **Owner decision needed:** which restore model to support at launch. RevenueCat's own
  "restore purchases" button re-associates a store receipt to whatever RevenueCat app-user-id is
  active, so the harder part is mapping that id to a Harfhane `users.id`, not the store side.

## 5. Turkey specifics

- Google is merchant of record for Türkiye and handles VAT calculation/remittance on all paid
  app and in-app purchases there — no separate VAT handling needed in-app.
  [Tax rates and VAT - Play Console Help](https://support.google.com/googleplay/android-developer/answer/138000?hl=en-GB), checked 2026-10-05.
- Play Console auto-converts a base price into buyer-local currencies (including TRY) using
  exchange rates and locally relevant pricing patterns at the time the price is set; price can be
  manually refreshed to a newer rate. [Set up your app's prices](https://support.google.com/googleplay/android-developer/answer/6334373?hl=en), checked 2026-10-05. **Owner-only:** reviewing/approving the
  TRY price Google auto-generates, or setting it manually.
- Payout requires a Payments profile with tax information entered in Play Console → Payments
  Settings; this is required for "timely" payouts regardless of buyer country.
  [Enter merchant tax information](https://support.google.com/googleplay/android-developer/answer/7163598?hl=en), checked 2026-10-05.
- **Owner-only steps, none can be done by an agent:** Play Console merchant/Payments profile
  setup, tax info entry, creating the in-app product SKU and price in Play Console, adding
  license testers, and publishing a privacy policy URL (Play Console requires one for any app
  handling user data/accounts — Harfhane already has accounts, so this may already exist; not
  checked here). **Unverified:** whether a KVKK-specific disclosure is legally required beyond a
  standard privacy policy — this is a legal question, not something resolvable from Play Console
  docs; flag for the owner or counsel.

## Proposed plan units

- U1. `entitlements` migration + repository (`src/repositories/entitlement-repository.ts`) +
  tests. Testable locally with `pnpm --filter @harfhane/backend test`. No owner input needed.
- U2. `POST /api/entitlements/revenuecat-webhook` route: verify RevenueCat webhook signature
  (shared secret as a Worker secret), upsert into `entitlements`. Testable locally with a
  recorded sample payload. **Needs owner:** RevenueCat project + webhook secret.
- U3. `GET /api/entitlements/me` route returning the caller's active entitlements, used by the
  frontend/mobile client to gate ad-free/themes/unlimited-mode UI. Testable locally.
- U4. Expo dev client setup + `react-native-purchases` wiring (purchase flow, restore-purchases
  button calling U3). **Needs owner:** Play Console in-app product SKU, license testers, a
  RevenueCat Android app entry with the Play Billing API key.
- U5. Theme registry gating (plan 002 U8) reads `GET /api/entitlements/me` to unlock starter
  themes. Testable locally once U3 exists.
- U6. Store listing prerequisites: Payments profile, tax info, privacy policy link.
  **Owner-only, no agent action possible.**
- U7. First manual end-to-end purchase test against a Play Console license tester account
  before the first real sale. **Needs owner** (device + tester account).

## Open questions for the owner

1. Exact Supporter price in TRY, and which starter themes it bundles.
2. Restore-purchase model for guests: force login before buying, or support a later-merged
   anonymous purchase?
3. RevenueCat account/project — does one exist already, or does it need creating?
4. Is a KVKK-specific disclosure needed beyond the existing privacy policy (legal question)?
5. Confirm current privacy policy URL is live and covers purchase data before submitting the
   in-app product for review.

## Unverified

- A working minimal WebCrypto-only Cloudflare Workers snippet for the full Google service-account
  OAuth2 JWT-assertion flow (relevant only if direct Play Developer API is chosen over RevenueCat
  webhooks — not recommended here, but noted since the task asked about it).
- Whether Harfhane's existing privacy policy (if any) already covers in-app purchase data; not
  located in this repo scan.
- KVKK legal requirement specifics — outside what Play Console/RevenueCat docs can answer.

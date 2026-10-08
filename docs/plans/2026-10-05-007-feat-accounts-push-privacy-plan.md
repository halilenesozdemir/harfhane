---
title: Mobile sign-in, push, privacy page and play counts
type: feat
date: 2026-10-05
status: draft
---

# Mobile sign-in, push, privacy page and play counts

## Goal
Publish the privacy page that Play and purchases (Plan 005) require. Everything else this
plan originally covered — Google sign-in, JWT, profile, push and reminder mail — is removed
from the MVP, not deferred inside this plan; see the owner decision below.

Research: `docs/research/2026-10-05-mobile-auth-push-analytics.md`.

**Owner decision, 2026-10-05 — supersedes the draft above** (`docs/decisions/2026-10-05-mvp-scope-cut.md`):
the MVP has no accounts at all. Google sign-in, JWT, profile, push notifications and reminder
mail (R1, R2, R4 and their units below) are postponed past the MVP, not merely Google-only or
deferred. This plan's only live scope is the static privacy page (R3); its privacy content
shrinks to match — no accounts, local-only stats, nothing per-player stored server-side beyond
what the admin's own data pipeline holds.

## Requirements
- R1. ~~Google sign-in on Android creates or reuses the same `users` row and JWT as the web.~~ **Postponed past MVP** — no accounts.
- R2. ~~The daily reminder reaches Android players through Expo push, alongside web push.~~ **Postponed past MVP** — no push, no accounts to target.
- R3. A privacy page exists at a public URL and is linked from Settings; the Play listing and purchases (Plan 005) point to it. Content reflects no-accounts MVP: local-only stats on device, no per-player data on Harfhane's own servers, only the admin's own content/schedule data lives in D1. This does not mean no purchase-related processing happens at all: RevenueCat (anonymous app user id) and Google Play (the buyer's Play account) process purchase data as third parties, and the privacy text must disclose that even though Harfhane stores nothing per-player itself. **Free-launch update (`docs/decisions/2026-10-06-free-launch.md`):** the first release ships free, with no purchase and no accounts at all; Plan 005 (and its RevenueCat/Google Play purchase-data disclosure) is deferred to Phase 5, not live at launch. The draft privacy text (U5) reflects the at-launch state — no purchase processing to disclose yet — and gets the purchase-disclosure paragraph added only once Plan 005 actually ships.
- R4. ~~Anonymous completed games are counted with no identifiers, cookies or IP storage.~~ **Postponed past MVP.**

## Acceptance examples
- AE1 (R3). Given the published privacy page, then it states plainly that the MVP has no
  accounts, stats stay on-device, no play-level data is collected on Harfhane's own servers,
  and purchase data (RevenueCat anonymous app user id, Google Play account) is processed by
  those third parties. **Free-launch update:** at the first (free) release there is no purchase
  to disclose (`docs/decisions/2026-10-06-free-launch.md`); the draft (U5) proves the
  no-accounts/on-device/no-server-side-play-data half of this example now, and the
  purchase-disclosure half applies only once Plan 005 ships in Phase 5.

## Key technical decisions
- KTD1. ~~ID tokens verified on the Worker with `jose`...~~ **Postponed with R1.**
- KTD2. ~~Expo push service...~~ **Postponed with R2.**
- KTD3. ~~Play counter...~~ **Postponed with R4.**
- KTD4. *(assumption)* The privacy page is a static route on the web app; the text is drafted by an agent and approved by the owner before it is linked. Unaffected by the scope cut — this is now the plan's only live unit.

## Units
- U1. *Postponed past MVP (R2).* `expo_push_tokens` table, subscribe/unsubscribe routes, tests.
- U2. *Postponed past MVP (R2).* Expo push sender in the cron with batching and receipt pruning; mocked `fetch` tests.
- U3. *Postponed past MVP (R1).* `POST /api/auth/google/mobile` with `jose`; tests with a local JWKS. *Owner:* Android OAuth client ID secret.
- U4. *Postponed past MVP (R4).* Play counter table, endpoint and admin read.
- U5. Privacy page route with draft Turkish text (no-accounts content), not linked until approved. (R3)
- U6. *Owner:* approve privacy text; then link it from Settings and the store listing. (R3)
- U7. *Postponed past MVP (R1, R2).* Mobile sign-in screen and push permission flow. *Owner:* Google Cloud client, EAS dev build.
- U8. *Postponed past MVP (R4).* *Owner:* enable Cloudflare Web Analytics on the zone if wanted.

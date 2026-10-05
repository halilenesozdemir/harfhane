---
title: Mobile sign-in, push, privacy page and play counts
type: feat
date: 2026-10-05
status: draft
---

# Mobile sign-in, push, privacy page and play counts

## Goal
Bring the web's account and reminder features to the Android app, publish the privacy policy that Play and purchases require, and count anonymous plays without tracking anyone.

Research: `docs/research/2026-10-05-mobile-auth-push-analytics.md`. Status is `draft` until the owner approves the privacy text and Google client setup; U1, U2, U4 and U5 can start before that.

## Requirements
- R1. Google sign-in on Android creates or reuses the same `users` row and JWT as the web.
- R2. The daily reminder reaches Android players through Expo push, alongside web push.
- R3. A privacy page exists at a public URL and is linked from Settings; the Play listing and purchases (Plan 005) point to it.
- R4. Anonymous completed games are counted with no identifiers, cookies or IP storage.

## Acceptance examples
- AE1 (R1). Given an ID token signed by a key in the mocked JWKS with the Android client ID as `aud`, then the endpoint returns a JWT for the matching user; with a wrong `aud` it returns 401.
- AE2 (R2). Given an Expo push receipt `DeviceNotRegistered`, then that token is removed.
- AE3 (R4). Given three completed anonymous games today, then the aggregate count for today is 3 and no per-request data is stored.

## Key technical decisions
- KTD1. ID tokens verified on the Worker with `jose` against Google's JWKS; `iss`, `aud`, `exp` checked. No Node-only Google libraries.
- KTD2. Expo push service rather than direct FCM at this scale; tokens in an `expo_push_tokens` table added by a new numbered migration; `0001_baseline.sql` is already applied and is never edited.
- KTD3. Play counter: a daily aggregate row per mode and length, incremented by an unauthenticated endpoint. Cloudflare Web Analytics for page views is an owner toggle.
- KTD4. *(assumption)* The privacy page is a static route on the web app; the text is drafted by an agent and approved by the owner before it is linked.

## Units
- U1. `expo_push_tokens` table, subscribe/unsubscribe routes, tests. (R2)
- U2. Expo push sender in the cron with batching and receipt pruning; mocked `fetch` tests. (R2)
- U3. `POST /api/auth/google/mobile` with `jose`; tests with a local JWKS. *Owner:* Android OAuth client ID secret before it can work in production. (R1)
- U4. Play counter table, endpoint and admin read. (R4)
- U5. Privacy page route with draft Turkish text, not linked until approved. (R3)
- U6. *Owner:* approve privacy text; then link it from Settings and the store listing. (R3)
- U7. Mobile sign-in screen and push permission flow (after Plan 004 U6). *Owner:* Google Cloud client, EAS dev build. (R1, R2)
- U8. *Owner:* enable Cloudflare Web Analytics on the zone if wanted.

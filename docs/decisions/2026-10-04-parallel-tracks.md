# Parallel tracks: mobile first sale does not wait for the content factory

Date: 2026-10-04 · Status: accepted

## Decision
Work runs in two parallel tracks:
- **A, Mobile:** Expo Android app with the existing daily and unlimited modes, visual polish, and the Supporter purchase.
- **B, Continuity:** content queue, admin approval panel, dictionary validation, and at least 90 days of approved content in stock.

The first store release ships from track A alone. New modes (Connections first) come from track B after release.

## Reasons
- The first 5–10 Play Store sales need no new content; the existing word mode is enough.
- Building the factory first would delay the first sale by months.
- The game must stay continuous: content must never run out or depend on manual work. Track B guarantees that.
- AI-assisted development makes running both tracks in parallel practical.

## Consequences
- Game logic moves from `apps/frontend/src/utils/gameLogic.ts` into `packages/shared` first, so web and mobile share one engine and nothing is written twice.
- Replaces the earlier order (factory → mobile → store → video → ads).
- Business plan: kept outside the repo, in the owner's notes.

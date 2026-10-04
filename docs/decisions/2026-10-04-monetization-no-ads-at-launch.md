# Monetization: no ads at launch, optional purchases only

Date: 2026-10-04 · Status: accepted

## Decision
- The game is fully playable for free.
- **Ads:** none at launch. After launch, **rewarded ads only**, shown only when the player chooses to watch one.
- **Purchases (one-time, optional):**
  - Supporter pack: ad-free, full unlimited mode, past-day archive, detailed stats, supporter badge, starter themes.
  - Visual themes.
  - Themed puzzle packs.
- **Not doing:** subscriptions, paid-entry prize tournaments, hints in the daily mode.

## Reasons
- Ad density is the most common complaint in Turkish word-game reviews.
- Ad revenue in Turkey is small.
- The purpose is that people learn and enjoy themselves. Inappropriate ads conflict with family-friendly values.

## Consequences
- **When rewarded ads are added:**
  - AdMob max content rating G.
  - Sensitive categories blocked: dating, gambling, alcohol, sexual content, politics, religion.
  - Ad review center used to block individual ads.
  - Everything sits behind a remote feature flag. If ads cannot be kept clean, they are removed.
- **Billing:** through RevenueCat on top of Google Play Billing. It is free under $2.5k monthly revenue, so there is no custom receipt validation to build.
- **Price:** one tier below the market's usual remove-ads tier, set in Play Console.

# Research: Supporter Pack Pricing for Turkey

Date checked: 2026-10-05. Context: `docs/decisions/2026-10-04-monetization-no-ads-at-launch.md`
(one-time Supporter pack; price "one tier below the market's usual remove-ads tier"; game fully
playable for free). Feeds open questions 1–2 in
`docs/plans/2026-10-05-005-feat-supporter-purchase-plan.md`.

## 1. Turkish word games / Wordle-likes — remove-ads / premium prices (TRY)

No current, verifiable TRY price point for a Turkish word-game remove-ads purchase was found
through search; Play Store IAP prices render per-viewer locale and are not indexed as text, and
the game itself must be opened from a Turkish account to read the live number — out of scope for
this read-only research pass.

- **Kelimelik** (`com.he2apps.kelimelik`) sells a "PRO" membership (ads off, auto-scoring, more
  concurrent games). A 2014-era forum thread cites a price cut from 6.49 TL to 4.29 TL; a separate
  source cites 6.49 TL. Both are roughly a decade old and not usable as a current reference.
  [Kelimelik Play listing](https://play.google.com/store/apps/details?id=com.he2apps.kelimelik) —
  no current price text returned. **Unverified** as a 2026 price.
- **Bul Bakalım**, **Kelimatör**, **Kelime Bul**, **Bi Kelime** — all confirmed to carry ads and/or
  a paid "support" tier via search snippets, but no TRY figure surfaced. **Unverified**.
- **Wordscapes** (global, PeopleFun) — remove-ads IAP reported by English-language sources as
  roughly $5.99–$9.99 (fluctuates per source/region); no TRY figure found. **Unverified for TRY**.
- No Turkish-market source stating a specific current TRY remove-ads price was confirmed. This
  item is the weakest-evidence part of this research; the owner should check 2–3 apps live on a
  Turkish Play account before finalizing a number.

## 2. Google Play TRY pricing mechanics

- **Service fee**: standard tier is 15% on a developer's first $1M of annual Play-billing revenue
  per year, 30% above that; auto-renewing subscriptions are billed a flat 15% regardless of
  revenue tier. Source: [TechCrunch, Google Play drops commissions to
  15%](https://techcrunch.com/2021/03/16/google-play-drops-commissions-to-15-from-30-following-apples-move-last-year/);
  [Play Console Help, Service fees](https://support.google.com/googleplay/android-developer/answer/112622?hl=en).
  A 2026-dated regional-tier update (new installs 10%+5% billing fee under $1M, rolling out by
  mid/late 2026 in some regions) was surfaced but is scoped to AU/EEA/JP/UK/US, not confirmed to
  include Turkey — treat 15% as the applicable figure for TR. **Confidence: medium.**
- **Pricing templates**: Google removed the old fixed price-tier/template system from Play Console
  around October 27, 2025; developers now enter arbitrary local-currency prices per country, with
  the console snapping only to that currency's decimal convention. Source:
  [pricepush.app, Google Play Pricing Templates
  Removed](https://pricepush.app/blog/google-play-pricing-templates-removed). This means there is
  no fixed TRY "minimum price" or tier ladder to target in 2026 — the developer sets the TRY price
  directly in Play Console. **Unverified**: exact TRY rounding convention (one source mentioned a
  `.09/.49/.89` ending-digit convention for TRY; not confirmed against an official Google source).
- **VAT**: for Turkish Play Store purchases, Turkish buyers pay 20% KDV (VAT) included in the
  listed price; this is collected and remitted as part of the marketplace facilitator flow, so the
  developer does not issue a separate VAT invoice for domestic Turkish sales (invoiced as a
  VAT-exempt service export to Google for the developer's own books). Source:
  [Paraşüt, Mobil Uygulama Satışlarının Vergilendirilmesi](https://www.parasut.com/blog/mobil-uygulama-satislarinin-vergilendirilmesi).
  **Confidence: medium** — Turkish tax-blog sources, not an official Google/GİB page.
- **Auto-conversion**: Play Console can auto-convert a base price to all currencies including TRY;
  developers can override the auto-converted TRY price manually. This is consistent across sources
  but no official Google page was fetched confirming the exact conversion cadence.

## 3. Indie "supporter"/premium packs and free-unlimited-play norms

- One-time remove-ads IAPs in mobile games commonly range **$2.50–$10 USD** when sold alone;
  bundling extra perks (cosmetics, extra lives, stat tracking) alongside ad removal is the norm
  rather than the exception. Source: aggregated from
  [PocketGamer.biz, interstitial ads and IAP in top-100
  games](https://www.pocketgamer.biz/the-key-to-success-how-top-100-downloaded-games-implement-interstitial-ads-and-related-in-app-purchases/)
  and general search synthesis. **Confidence: low-medium**, no single primary breakdown table found.
- Steam-style "Supporter Pack" DLC (PC, different storefront/economics) typically prices at
  $3–$10 and is explicitly framed as funding the developer with light bonus content, not as
  removing a paywall — directionally consistent with Harfhane's ADR framing but not a mobile
  comparable. **Unverified** as directly transferable to Google Play TRY pricing.
- No example was found of an indie word/puzzle game that caps its *free* unlimited mode once a paid
  tier exists; the more common pattern is free-with-ads-and-caps vs. paid-ad-free-and-uncapped,
  which is a different shape from Harfhane's ADR (free is fully playable, ad-free, uncapped is the
  stated baseline). **Unverified** generalization — not enough comparable examples surfaced.

## 4. Recommendation

Given no confirmed current TRY remove-ads price for a direct Turkish-market comparable, this
recommendation leans on the Wordscapes-style global anchor (~$6–$9, i.e., roughly 200–350 TRY at
typical PPP-adjusted Play pricing for Turkey, which commonly runs 40–60% of US-tier pricing) and
the ADR instruction to land **one tier below** that:

- **Option A — 99 TRY.** One tier below a ~150–180 TRY "remove-ads" anchor. After Google's 15%
  fee, net ≈ 84 TRY per sale; 20% KDV is included in the 99 TRY sticker (VAT paid by buyer, not
  added on top).
- **Option B — 129 TRY.** If the comparable remove-ads tier turns out closer to 180–220 TRY (more
  consistent with a 6-feature bundle, not just ad removal), one tier below lands near 129 TRY. Net
  after 15% fee ≈ 110 TRY per sale.

**Recommended: Option A (99 TRY)** as the safer "one tier below" read, since the ADR's bundle
(ad-free + unlimited + archive + stats + badge + themes) is explicitly positioned as a *supporter*
pack, not a premium unlock — pricing low keeps the "support the game" framing credible. This is a
directional recommendation, not a confirmed market price; **the owner should verify 2–3 live
Turkish Play Store remove-ads prices before locking the number**, since no primary TRY source was
found in this pass.

**Should free unlimited mode be limited?** The ADR already commits to the game being fully
playable for free, including implicitly unlimited mode — revisiting that is a scope change to the
ADR, not a pricing question. Trade-off for the owner: keeping unlimited mode fully free maximizes
goodwill and matches the "no ads at launch" trust-building strategy, but it removes the single
biggest lever (usage caps) that comparable apps use to drive conversions, meaning the Supporter
pack's conversion rate will depend entirely on the archive/stats/badge/themes bundle's appeal
rather than on relieving a pain point. No comparable found that keeps unlimited free *and*
sells ad removal separately at a sustainable rate — this is a genuine open design risk, not
something resolvable from market research alone. **This decision is left to the owner.**

## Unverified

- Any current (2026) TRY price for Kelimelik PRO, Bul Bakalım's paid tier, or any other named
  Turkish word-game app's remove-ads/premium purchase.
- Wordscapes' TRY price specifically (only USD figures found).
- Whether Google's 2026 regional fee-tier changes (10%+5% new-install structure) apply to Turkey.
- The exact TRY price-ending rounding convention Google Play Console applies today.
- Any indie mobile game that keeps unlimited free play while selling ad removal as a separate
  supporter pack, as a working precedent.

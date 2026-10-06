# Hint economy for Harfhane — research note

Status: draft. Feeds Plan 008 R7 (letter hint).

Date: 2026-10-06

## Question

How do comparable word games structure hints (types, currency, cost, earn/spend loops) and
fairness treatment (streak/share-card marking)? What fits Harfhane: no accounts (MVP), no ads at
launch (rewarded-only later, opt-in, remote flag), one-time Supporter IAP, words with no meanings,
hint = reveal one letter (possibly a Supporter perk)?

## Findings

### 1. Words of Wonders (Fugo Games, Turkish studio)

- Confirmed: Fugo Games (Istanbul) publishes Words of Wonders / WOW Crossword — Turkish-origin,
  globally distributed. [Confidence: high — App Store listing confirms publisher "FUGO BILISIM
  TEKNOLOJILERI VE YAZILIM TICARET A.S."] Source: https://apps.apple.com/app/id1369521645
- Hints reveal a letter in the grid; coins are the spend currency; coins and hints are both earned
  from level completion and found/bonus words. [Confidence: medium — consistent across multiple
  strategy-guide sources but none is Fugo's own documentation.]
  Source: https://apps.apple.com/us/app/id1326685839 (third-party "Hints for WoW" companion app,
  implies hint scarcity is a core design point)
- Could not verify specific named booster types ("fireworks", "shuffle", "target-a-cell") or exact
  coin-pack TRY prices from Google Play Turkey in this pass — search results returned only generic
  strategy-blog content and non-Turkish App Store price tiers (e.g. $0.99/$4.99/$9.99/$19.99 coin
  packs on iOS US store). **Unverified**: Turkish Google Play pricing, exact booster taxonomy.
  Source (iOS tier reference only, not TR/Android): https://apps.apple.com/app/id1369521645
- Recommendation: treat WoW's model directionally (coins earned by play + spent on hints, plus
  optional paid coin packs) rather than copying exact numbers — the exact figures need a direct
  Play Store check from a TR account, which this pass could not do.

### 2. Wordle-likes

- **NYT Wordle**: no hints, no coins. Only variant is official "Hard Mode" (must reuse revealed
  clues), marked with an asterisk in the share text, e.g. "Wordle 1,651 5/6*". [Confidence:
  high — asterisk convention is widely and consistently reported.]
  Source: https://arxiv.org/pdf/2309.02110 (academic analysis of 730M Wordle games, discusses hard
  mode and share-text conventions)
- **WordleBot**: NYT's own post-game analysis tool (not a hint — it's an after-the-fact skill/luck
  rating), separate from third-party hint sites. [Confidence: medium — general knowledge, not
  independently re-verified this pass.]
- **Mashable's Wordle hints**: a third-party editorial daily hint column (not built into the game),
  giving a graduated "staircase" of clues — letter count/position hints, vowel count, thematic
  "vibe" hint, then the answer — fully opt-in, purely informational, no in-game mechanic.
  [Confidence: medium — consistent across several SEO-ish sources describing the same format,
  but no single authoritative citation.] Source: https://techradar.com/news/5-wordle-solver-tools-to-help-you-keep-your-streak
  Implication for Harfhane: external hint sites exist for *any* popular daily word game regardless
  of whether the game itself offers hints — building in-game hints doesn't prevent this, but a fair
  in-game hint reduces the incentive to leave the app.
- **Kelimelik / Kelime Gezmece** (Turkish word games): hints obtained by watching rewarded video ads
  or by in-app purchase/coins; exact UI unverified. [Confidence: low — one weak source, no
  first-party documentation found.] Source: https://apps.appfollow.io/ios/kelime-gezmece/1352903262?country=it
- **Wordscapes**: coins are the universal currency for hints; earned via bonus words, daily puzzle
  completion, and rewarded video ads (~10–50 coins per ~15–30s ad). [Confidence: medium — multiple
  independent gameplay-guide sources agree.] Source: https://www.gamezebo.com/walkthroughs/how-to-earn-coins-in-wordscapes/
- **Word Cookies**: hints bought with coins or unlocked via rewarded video ads. [Confidence:
  low-medium, single source.] Source: https://aws-citrix.ungerboeck.com/answer-key-to-word-cookies
- **CodyCross**: named helper hints cost tokens (e.g. "reveal one letter" for 1 token, "reveal random
  letters" for 2 tokens); tokens earned via gameplay, daily chest, or ads, or bought with coins.
  [Confidence: medium — detail is specific and consistent, but source is a fan wiki, not official.]
  Source: https://www.puzzles.wiki/wiki/Hint_Currency — note the clear price gradient: cheapest hint
  reveals exactly one letter, pricier hints reveal more. This maps directly onto Harfhane's
  "hint reveals one letter" design as the cheapest/simplest tier.
- No source found (in this pass) describing whether any of these games mark hint usage on a
  per-puzzle share card the way Wordle marks Hard Mode with an asterisk. **Unverified / likely gap**:
  mainstream word games with coin-bought hints generally do NOT appear to flag hint usage in shared
  results — the asterisk convention seems specific to Wordle's own optional Hard Mode, not to hint
  consumption elsewhere. This is inferred from absence of evidence, not a confirmed claim.

### 3. Fairness / streak conventions

- Wordle's only shown "integrity marker" is the Hard Mode asterisk — an opt-in harder ruleset, not a
  hint-usage flag. [Confidence: high, per source above.]
- No evidence that any surveyed game marks "used a hint" in share text or stats; coin-hint games
  generally treat hints as a normal, unflagged part of play. [Confidence: low — negative finding,
  not exhaustively confirmed.]
- Daily-puzzle convention across genres: streak = consecutive days played/solved, independent of
  hint use; hint use typically does not break or asterisk a streak in word games other than Wordle's
  Hard Mode case. [Confidence: low-medium — inferred from the absence of any "hint breaks streak"
  documentation except an unrelated indie game (Wordrings) found in one minor source: https://tossengames.itch.io/wordrings]

### 4. Google Play policy points

- **Consumable vs non-consumable IAP**: a consumable (e.g. a coin pack, a single hint) is dispensed
  and then "consumed" via `consumePurchase()`, after which it can be bought again; a non-consumable
  (e.g. Harfhane's one-time Supporter unlock) is permanent per Google account via
  `acknowledgePurchase()`. Google Play's billing API does not itself track which type a SKU is —
  that's determined by how the app finalizes the purchase. [Confidence: high — official Google
  support documentation.] Source: https://support.google.com/googleplay/android-developer/answer/14590082
- **Refunds**: consumables are generally not refundable once delivered/consumed, except for fraud,
  technical failure (item not delivered), or where local consumer law requires it; this is standard
  store-level refund handling, not something Harfhane configures per-SKU.
  [Confidence: medium — general refund-policy pattern, not a Harfhane-specific citation.]
- **Loot boxes**: Google requires disclosed odds for randomized reward mechanics ("loot boxes").
  [Confidence: medium — widely reported policy change.] Source: https://www.slashgear.com/google-now-requires-play-store-games-to-include-loot-box-odds-30578492
  Not directly relevant to Harfhane: a deterministic "reveal one letter" hint is not a randomized
  reward and triggers no loot-box disclosure, regardless of whether it's bought with coins or
  unlocked by Supporter status. Keep hints deterministic to avoid this policy surface entirely.
- **Families / child-directed policy**: if Harfhane is positioned as child-directed (it's described
  as "family-safe", which is broader than "designed for children"), Google requires disclosure of
  any change to ads/IAP posture and restricts monetization patterns that could cause inadvertent
  child clicks (e.g. deceptive "free" buttons next to paid ones). [Confidence: medium — official
  Google Play Developer Policy language, but general-purpose, not Harfhane-specific.]
  Source: https://support.google.com/googleplay/android-developer/answer/9893335
  Action item: confirm Harfhane's actual Play Console target-audience declaration before adding any
  IAP or rewarded-ad surface aimed at hints — if it is NOT declared "made for children," the stricter
  families rules don't apply, but "family-safe" marketing language should still avoid dark patterns
  around a paid hint button.

## Options table

| Option | Free daily hints | Unlimited mode hints | Supporter perk effect | Currency | Fits no-accounts/no-ads MVP? |
|---|---|---|---|---|---|
| A. No hints at all (NYT Wordle model) | 0 | 0 | n/a | none | Yes, simplest; but owner already decided hints exist |
| B. Flat free allowance, no currency | e.g. 1 hint/day free | same allowance, resets per puzzle | Supporter gets +N hints/day or unlimited | none | Yes — simplest to build without accounts (store allowance client-side per device/day) |
| C. Coin economy (WoW/Wordscapes/CodyCross model) | earn coins by playing, spend on hints | same coins pool | Supporter gets bonus coins or discount | coins | Poor fit — needs persistent server-tracked balance; harder without accounts, and pointless with no ads to fund free coin earning |
| D. Hints gated entirely behind Supporter | 0 free | 0 free | Supporter unlocks hints (e.g. 1/day or unlimited) | none | Yes — cleanest monetization story, but may feel punitive for a family-safe free game |
| E. Rewarded-ad-unlocked hints (post-launch, flagged) | small free allowance + "watch ad for 1 more" | optional | Supporter gets the ad-equivalent hint free | none (ad-gated, not currency) | Fits later, once rewarded ads are flagged on; not for launch (ads are post-launch only) |

## Recommendation

- **MVP (no accounts, no ads)**: use **Option B** — a small flat free hint allowance per daily
  puzzle (e.g. 1 free hint per daily game, stored client-side per device/day; no server balance, no
  currency, no accounts needed). Unlimited mode: either no hints, or the same 1-per-puzzle allowance,
  reset per puzzle rather than per day — unlimited mode has no "daily" cadence to protect, so hints
  there are lower-stakes and can be more generous without hurting daily-puzzle fairness.
- **Supporter perk**: have Supporter increase the daily-puzzle hint allowance (e.g. 1 → 2 or 3) and/or
  unlock hints in unlimited mode if the no-Supporter default there is zero. This is consistent with
  the existing Supporter-as-unlock-perk design (themes etc.) and needs no new purchase SKU — it's a
  flag check (`isSupporter`), not a consumable.
- **Do not build a coin economy.** A coin economy (Option C) is the dominant pattern in Wordscapes/
  CodyCross/WoW, but it exists there to drive rewarded-ad engagement and daily-return loops at scale.
  Harfhane has no ads at launch and no accounts, so there's no mechanism to let free players "earn"
  coins meaningfully, and building a balance system (even local-only) adds state-sync complexity for
  a feature that a flat allowance solves more simply. Revisit only if/when rewarded ads ship — at
  that point Option E (ad-gated extra hint) is the natural incremental addition on top of the Option
  B allowance, not a full currency.
- **Share text / stats**: do not flag hint usage in the share card or stats by default. No surveyed
  game other than Wordle's own opt-in Hard Mode marks anything in the share text, and Wordle's marker
  is for a harder ruleset, not hint usage. Marking "used a hint" would be a Harfhane-specific choice
  with no precedent found; if the owner wants integrity signaling, the lower-friction option is a
  private per-user stat ("X of Y solves used a hint") rather than a public share-card asterisk, since
  Harfhane's daily puzzle is already shared competitively (duels) and marking hint use on a shared
  card could feel punitive for a family-safe, low-pressure game. Revisit if duels/competitive
  comparison becomes a bigger feature.
- **Policy**: keep the hint strictly deterministic (always reveals one specific correct letter, no
  randomness) to stay outside Google's loot-box disclosure requirement. If hints are ever sold
  standalone (not just via the one-time Supporter unlock), they would be a consumable IAP
  (`consumePurchase()`), separate in kind from the existing non-consumable Supporter purchase
  (`acknowledgePurchase()`) — but Option B/D above avoid needing any new SKU at all.

## Open questions for the owner

1. Daily-puzzle free hint allowance: 0 or 1? (This note recommends 1; owner may prefer 0 free + hints
   as a pure Supporter perk, i.e. Option D, which is simpler to ship and message.)
2. Unlimited mode: does it get hints at all for non-Supporters, and if so, same per-puzzle cap as
   daily, or more generous since there's no "one true answer per day" fairness concern?
3. Should Supporter hint boost be "more hints" (quantity) or "unlimited hints," and does that read as
   proportionate for a ~99 TRY one-time purchase alongside themes?
4. Confirm Play Console target-audience declaration for Harfhane (full "designed for children" vs.
   general audience with family-safe marketing) — this changes which Google Play policy section
   actually binds any future monetization UI around hints.
5. This pass could not verify Words of Wonders' exact Google Play Turkey coin-pack prices or its full
   named-booster list; if WoW's specific numbers matter for benchmarking, a follow-up check directly
   against the Play Store (TR account) is needed.

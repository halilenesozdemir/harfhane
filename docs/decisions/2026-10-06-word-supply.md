# Word supply: repeat policy, allowed sources and restocking KPI

Date: 2026-10-06 · Status: accepted

## Decision
- **Repeat policy.** An approved answer may repeat within its own word length only after 3
  years have passed since it was last scheduled for that length.
- **Unlimited pool.** Unlimited mode draws from its own, larger answer pool with a lower zipf
  floor than the daily pool (exact floor TBD by the implementing unit). The daily pool keeps
  zipf≥3.0 and owner review unchanged.
- **Allowed sources.** Pool sources stay `hunspell-tr` (MPL-2.0) and `wordfreq`/CC BY frequency
  lists (e.g. Leipzig Corpora's CC BY-4.0 tiers) used as a frequency signal only. Wiktionary and
  other CC BY-SA sources are not used. TDK and TS Corpus stay excluded (Invariant 3; no
  confirmed commercial-use grant for TS Corpus).
- **Restocking KPI.** Track "approved unscheduled stock" per length; start a new review batch
  once it drops below 180 days, well above the 90-day Invariant 10 floor.

Research: `docs/research/2026-10-06-word-supply-standards.md`.

## Reasons
- Industry precedent (NYT Wordle): a "never repeats" rule is not sustainable at a fixed list
  size; the practical fix is a repeat-after-N-years rule adopted ahead of time, not walked back
  under pressure once a length nears exhaustion.
- Unlimited mode is lower-stakes than the daily puzzle and can tolerate more obscure words, so
  it can use a larger, separately-floored pool without lowering the daily answer's quality bar.
- CC BY-SA sources (Wiktionary) are share-alike: any Harfhane dataset derived from them would
  itself have to be released under CC BY-SA. That is a bigger licensing decision than one plan
  unit, so these sources are excluded until the owner wants to revisit it. TDK and TS Corpus
  have no confirmed commercial grant (same reasoning already applied to TDK, Invariant 3).
- 180 days gives enough lead time for a review batch (days, not hours, per the research note)
  to land before the 90-day Invariant 10 floor is ever at risk.

## Consequences
- `docs/plans/2026-10-04-001-infra-clean-database-plan.md`: new R8 (repeat policy) and U8
  (repeat-policy guard on scheduling).
- `docs/plans/2026-10-05-006-feat-content-continuity-plan.md`: new R8–R10 (unlimited pool,
  allowed sources, restocking KPI) and matching units.
- This is distinct from the existing low-stock alert (Plan 006 R7/U3b), which is a shorter,
  remaining-stock trigger independent of runway; the 180-day KPI here is about starting the
  next *review batch* in good time, not alerting that stock is already low.

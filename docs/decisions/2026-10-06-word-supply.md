# Word supply: repeat policy, allowed sources and restocking KPI

Date: 2026-10-06 · Status: accepted

## Decision
- **Repeat policy.** An approved answer may repeat within its own word length only after 3
  years have passed since it was last scheduled for that length.
- **Unlimited pool.** Unlimited mode draws from its own, larger answer pool with a lower zipf
  floor than the daily pool (exact floor set by the implementing unit — `UNLIMITED_ZIPF_FLOOR`,
  starting at 2.5, per Plan 008 KTD5). The daily pool keeps zipf≥3.0 and owner review unchanged.
- **Allowed sources.** Pool sources stay `hunspell-tr` (MPL-2.0) and `wordfreq`/CC BY frequency
  lists (e.g. Leipzig Corpora's CC BY-4.0 tiers) used as a frequency signal only. Wiktionary and
  other CC BY-SA sources are not used. TDK and TS Corpus stay excluded (Invariant 3; no
  confirmed commercial-use grant for TS Corpus).
- **Restocking KPI.** Track "approved unscheduled stock" per length; start a new review batch
  once it drops below 180 days, well above the 90-day Invariant 10 floor.
- **Owner decision, 2026-10-06 (later the same day): no meaning or context at all.** Words
  carry no meaning or context in either pool — not even for the daily, owner-reviewed pool. The
  daily hint instead reveals one letter of the answer; how many hints a player gets is a single
  constant (`HINTS_PER_DAILY_GAME`), which may become a supporter perk later (Plan 005). This
  supersedes any earlier plan text that had daily answers keep a model-written definition.

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
- Meanings/definitions add review burden and a second content-quality surface (correctness,
  tone, family-safety) for no gameplay payoff; a letter hint is simpler to build, to review and
  to make a supporter perk, and needs no model-written text at all.

## Consequences
- Implementation lives in `docs/plans/2026-10-06-008-feat-playable-lengths-word-pools-plan.md`:
  repeat policy → R3/KTD3, U6; unlimited pool → R2/KTD5, U7; allowed sources → Goal/KTD5; no
  meaning/context → R5/R6, U4; the letter hint → R7, U9 (web), U10 (mobile). Plan 001/006 only
  record the decisions (R8 and R8–R10 respectively, both marked superseded), not the code.
- This restocking KPI is distinct from the existing low-stock alert (Plan 006 R7/U3b), which is
  a shorter, remaining-stock trigger independent of runway; the 180-day KPI here is about
  starting the next *review batch* in good time, not alerting that stock is already low.
- Plan 001 U2's step 3 ("definitions are original and written by a model") is superseded by the
  no-meaning decision; no definition-writing step exists anywhere in the pipeline.

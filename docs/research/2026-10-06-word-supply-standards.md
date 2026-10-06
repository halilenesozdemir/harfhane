---
title: Word-length and word-supply standards (external research)
type: research
date: 2026-10-06
status: draft
---

# Main loop corrections (2026-10-06)

- The NYT "repeats allowed since 2026-02" claim has no primary NYT source here; treat it as
  medium confidence. The recommendation (write an explicit repeat policy) does not depend on it.
- Schedule health on the cron is already merged (Plan 006 U3); this note's process section is
  updated accordingly.
- After the validator fix in PR #55 (context must use the answer), length 5 still has 346
  accepted words; seven labels were corrected.

# Question

For Harfhane (Turkish Wordle-like, lengths 4/5/6 live, 7 reserved, family-safe, open-license
content with per-row `source`/`license`), what do established word games do for word-length
variety and answer supply, which open Turkish lexical sources are legally reusable, and what
supply model/KPIs keep every active length ≥90 days of approved stock (Invariant 10)?

# Findings

## 1. Established games

- **NYT Wordle**: shipped with 2,315 curated answers (dated order) and a much larger ~12,972-word
  valid-guess list; the guess list is deliberately *not* curated for difficulty/obscenity, only
  the answer list is. [confidence: medium — numbers match the well-known 2022 leak, not an NYT
  primary source] After NYT bought the game (Jan 2022), it assigned a dedicated editor (Tracy
  Bennett) and removed/swapped a handful of words for sensitivity, replacing creator Josh
  Wardle's original hand-picked list. [confidence: medium, multiple 2022 news reports]
  Sources: [PhoneArena](https://www.phonearena.com/news/rule-changes-for-wordle_id143594),
  [Tom's Guide](https://www.tomsguide.com/news/wordle-just-announced-rule-changes-what-you-need-to-know),
  [WordsOHard: Wordle changes since NYT](https://wordsohard.com/guides/wordle-changes-since-nyt).
- **No-repeat policy**: Wordle ran with a strict "no answer repeats" rule for ~4 years; at one
  puzzle/day the original 2,315-word list meant the game would exhaust unique answers around
  **2027-10-20**. NYT changed this policy in **2026-02** to allow repeats and avoid running out.
  [confidence: medium — consistent across sources but not directly NYT-sourced in the snippets
  retrieved] This is the single most directly relevant precedent for Harfhane: a hard-coded
  "never repeat" rule is not sustainable at a fixed answer-list size, and the eventual fix was to
  allow repeats after a long horizon (~5-6 years at daily cadence), not to keep expanding the
  list indefinitely.
  Sources: [WordsOHard: Wordle never repeats](https://wordsohard.com/guides/wordle-never-repeats),
  [Daily Hive: Wordle ends, five years, every answer stored](https://dailyhive.com/edmonton/wordle-ends-five-years-every-answer-stored).
  The original list's construction method (Wardle and partner manually walked the dictionary,
  keeping only words both recognized, skewed common, excluded plurals/past-tense/archaic/obscure
  words) is a useful editorial analogue to Harfhane's zipf-threshold + human-review approach.
- **Lingo (US/UK TV format)**: uses **multiple lengths in the same episode** — a 4-letter word to
  win half the prize, then 5-letter, then 6-letter to double it — i.e., length is a difficulty/
  stakes ladder within one session, not independent daily puzzles per length.
  [confidence: medium] Source: [Lingo (British game show) — Wikipedia](https://en.wikipedia.org/wiki/Lingo_(British_game_show)).
- **Octordle/Quordle**: both are 5-letter-only variants that increase *simultaneous* puzzle count
  (4 or 8 words at once), not word length. I could not confirm any standard multi-length Octordle
  mode from search results beyond one ambiguous mention of "4 to 6 letters" that I could not
  verify against a primary source. [confidence: low, unverified] Could not confirm details for
  **Waffle** or **Spelling Bee's answer-pool size as a stable constant** — Spelling Bee's daily
  total varies (one sampled puzzle had ~60 answers across 4–8+ letter lengths) and uses a
  single dedicated editor (Sam Ezersky) who manually curates allowed vocabulary (excludes
  proper nouns, words judged "too esoteric," <4 letters), i.e. an editorial accept/reject
  process structurally similar to Harfhane's validator + owner review step. Sources:
  [Axios: Spelling Bee's evolving word list](https://www.axios.com/2023/06/05/spelling-bee-evolving-word-list),
  [NYT Help Center: Spelling Bee](https://thenewyorktimeshelpcenter.helpjuice.com/23675493312404-Spelling-Bee).
- **Turkish Wordle clones**: "Wordle TR" / `wordle-tr` by Fatih Kadir Akın was built by
  reverse-engineering the original game's compiled JS and crawling Turkish word sites; one
  account says the word source leaned on TDK-derived word lists (~4-5 thousand 5-letter words),
  **not a licensed, redistributable dataset** — this is exactly the kind of source Harfhane's
  own docs already flag as unusable (TDK is explicitly excluded in `data/words/README.md:9-11`).
  [confidence: low-medium, secondary Turkish press, not the repo itself] I could not find the
  actual GitHub repo's license file or confirm "Kelimelik" or "Kelime Avı" word-list provenance/
  license at all — both are **unverified**. No evidence found of any Turkish clone offering
  multiple lengths per day or a documented no-repeat/repeat-after-N-years policy.
  Sources: [Diken: Türkçe Wordle'da kelimeler nasıl seçiliyor?](https://www.diken.com.tr/?p=1080610),
  [Teknoseyir](https://teknoseyir.com/durum/1507236).

## 2. Open, license-compatible Turkish lexical sources

| Source | License | Can redistribute in commercial app w/ `source`/`license`? |
|---|---|---|
| hunspell-tr (`tdd-ai/hunspell-tr`) | MPL-2.0 (already pinned in repo) | Yes — already in use; MPL-2.0 permits commercial redistribution with source disclosure for *modified MPL-licensed files*, which matches the repo's existing choice. [confidence: high, repo already verified this per `data/words/README.md:8-9`] |
| `wordfreq` (frequency signal) | Apache-2.0 for code; underlying data files CC BY-SA 4.0 | Usable as an internal ranking/filter signal (as today) since no frequency values are stored/redistributed; if actual frequency numbers were ever stored per-word, CC BY-SA's share-alike/attribution would attach. [confidence: medium] Source: search result citing `wordfreq` NOTICE/PyPI pages. |
| TDK Güncel Türkçe Sözlük | No clear open license found; TDK is a state body, terms not confirmed as open/reusable | **Do not use** — matches repo's existing exclusion. Could not find explicit TDK copyright/API terms in search results; treat as closed by default. [confidence: low/unverified — recommend legal confirmation if ever revisited] |
| Zemberek | Not evaluated here (excluded in repo already) | Already excluded per repo policy; not re-researched. |
| Wiktionary (incl. Turkish Wiktionary) / Kaikki.org "wiktextract" dumps | CC BY-SA 4.0 (or GFDL) | **Yes, with conditions**: commercial use allowed, but every derivative must (a) attribute and (b) be released under the *same* CC BY-SA terms — meaning any Harfhane dataset or definitions derived from Wiktionary would itself need to be CC BY-SA, which may conflict with wanting fully proprietary content. Usable for `source="wiktionary", license="CC BY-SA 4.0"` rows if Harfhane is willing to make that specific data re-shareable under CC BY-SA; not usable if the product wants all content closed. [confidence: medium] Source: [Wikimedia Meta on CC BY-SA licensing](https://meta.wikimedia.org/wiki/Free_knowledge_based_on_Creative_Commons_licenses/sk), general CC BY-SA terms search result. |
| TS Corpus (tscorpus.com) | States "open... for academic study and research," no explicit commercial grant found | **Likely not usable commercially as-is** — framed as academic/research use; no commercial license language found. Treat as closed/academic-only unless the project owners are contacted for a separate grant. [confidence: low/unverified] Source: [tscorpus.com](https://tscorpus.com/), [TS Corpus Project paper](https://revistia.com/ejls/article/view/887). |
| OpenSubtitles-derived frequency lists / Leipzig Corpora Collection | Leipzig Corpora: CC BY-4.0 for 10K-1M word lists; OpenSubtitles-based 50K+ lists specifically CC BY-SA-4.0 | **Yes for frequency signal** (CC BY-4.0 is less restrictive — attribution only, no share-alike), could even replace/supplement `wordfreq` as a frequency source for Turkish if Leipzig has a `tur` (Turkish) corpus — not directly confirmed in this search; would need a follow-up check of leipzig corpora's Turkish coverage. [confidence: medium for license terms, unverified for Turkish-language coverage] Source: search result quoting Leipzig/OpenSubtitles license split. |
| GitHub Turkish word lists (various, incl. `wordle-tr`) | Unknown / unverified per-repo | **Do not reuse without checking each repo's actual LICENSE file** — none of the ones surfaced in this research (wordle-tr, "sozluk" pub.dev package, "gartic-wordlist") had a confirmed open license in the search results. Treat each as closed until verified directly in its repo. [confidence: unverified for all] |

## 3. Supply model

Current pipeline counts (`data/words/summary.json`, `docs/research/2026-10-05-content-continuity.md:62-68`)
and the one completed review batch (length 5: 600-word pool → 346 accepted, **57.7% accept rate**)
are the only real throughput data point. Extrapolating that rate to the other lengths is an
**assumption**, not measured — length 5's pool was the top-600 *most frequent* candidates; accept
rate likely declines for lower-frequency words further down each candidate list, so these
"at 58%" figures are optimistic upper bounds for the full candidate pool, not a guarantee.

| Length | Valid guesses | Zipf≥3.0 candidates | Currently approved | Est. acceptable at full candidate list (58% of candidates, upper-bound) | Days of stock at 1/day from *currently approved* | Days of stock at 1/day from *estimated full* pool | Rough years to exhaustion (full pool, no repeats) |
|---|---|---|---|---|---|---|---|
| 4 | 5,828 | 1,695 | 0 | ~983 | 0 days — **below 90-day bar today** | ~983 days | ~2.7 years |
| 5 | 9,862 | 3,027 | 346 | ~1,756 | 346 days — **above 90-day bar** | ~1,756 days | ~4.8 years |
| 6 | 12,185 | 2,726 | 0 | ~1,581 | 0 days — **below 90-day bar today** | ~1,581 days | ~4.3 years |
| 7 | 11,694 | 2,623 | 0 | ~1,521 (not live) | n/a (out of scope) | ~1,521 if activated | ~4.2 years if activated |

Notes:
- "Currently approved" reflects only what's reviewed in the `feat-word-review` worktree
  (`data/words/review/review-5.csv`), not DB rows — none of this is imported yet per the
  content-continuity research note.
- Industry precedent (Wordle) shows a *curated* answer list of a few thousand words lasted
  ~5-6 years at one/day before repeats became necessary — Harfhane's per-length estimates
  (2.7-4.8 years) are in the same order of magnitude, which is a useful sanity check that the
  zipf≥3.0 + review funnel is roughly the right scale, not undersized by orders of magnitude.
- Repeat policy: Wordle's own transition (strict no-repeat for ~4 years, then allowing repeats
  once exhaustion became imminent) suggests a practical rule for Harfhane: **don't repeat an
  answer within its length's list for at least 3-5 years of runway**, then allow repeats with a
  minimum cooldown (e.g., reuse only after ≥1,000 other answers of that length have been shown,
  or ≥3 years), rather than promising "never repeats" as a permanent invariant.
- Difficulty/obscurity ranking: zipf bands already exist as a natural proxy (zipf≥3.0 is the
  entry bar; within that, higher zipf = more common/easier). A simple 3-tier banding
  (e.g., zipf≥4.5 "easy", 3.5-4.5 "medium", 3.0-3.5 "hard/obscure") would let a scheduler mix
  difficulty across the week the way Spelling Bee's editor varies obscurity, without needing new
  data collection — this is an internal recommendation, not sourced externally.

## 4. Recommendation

1. **Launch state**: keep lengths 4, 5, 6 as the active set (matches `ACTIVE_WORD_LENGTHS`);
   length 5 is the only one with real approved stock (346 days) and already clears Invariant 10's
   90-day bar — ship it first (Plan 006 U6). Lengths 4 and 6 need their review batches run
   (Plan 006 U7) and imported before they count toward Plan 006 U8 before they can go live; both have large enough candidate pools
   (1,695 and 2,726) that even a conservative accept rate (30-40%) clears several months of
   stock from a single 600-word review pass. Length 7 should stay reserved/off until 4-6 are
   stable and reviewed with the same process.
2. **Raising accept rate / candidate volume** for the long run: (a) a separate, slightly lower
   zipf floor (e.g. 2.7-2.8) **only for unlimited mode**, which is lower-stakes than the daily
   answer and more tolerant of obscure words, would materially grow the usable pool without
   touching the daily-answer quality bar; (b) keep daily-mode zipf≥3.0 as the quality floor; (c)
   if accept rate on the long tail (ranks 601+ per length) turns out much lower than 58%, that's
   a signal to review in smaller, more frequent batches (e.g. 200-300 words) rather than 600, so
   owner review throughput and quality tracking stay tight.
3. **Process** (concrete, repeatable, matches Invariant 10): run `answer_pool.py` →
   model-labeling → `validate_labels.py` → owner review in batches sized to keep ≥90 days of
   *approved* stock per active length at all times. The cron already runs schedule health
   (Plan 006 U3, merged); its 14-day warning is too late to start a review batch, so add a
   separate "approved unscheduled stock" metric per length and start a batch when it drops
   below 180 days (one batch takes days, and the 90-day floor must never be crossed).
4. **Repeats**: adopt a documented repeat policy now (even if repeats are years away) —
   "no repeat within N days/count per length," reviewed yearly — rather than an implicit "never"
   that someone has to walk back under pressure later, as NYT had to.

## Open questions for the owner

- Is a CC BY-SA-licensed subset of content (e.g. Wiktionary-derived definitions) acceptable if
  Harfhane would then have to release that subset's data under CC BY-SA too, or must all content
  stay fully proprietary?
- What repeat-after-N-years policy (if any) should be written into the schema/Invariants now,
  before any length gets close to exhaustion?
- Should the unlimited-mode zipf floor be lowered independently of the daily-mode floor (separate
  candidate pools), or is a single shared pool with an unlimited-only relaxed filter preferred?
- Is there appetite to contact TS Corpus or Leipzig Corpora maintainers for an explicit commercial
  license grant, given their public terms read as academic-only / attribution-only respectively?

## Unverified (could not confirm from available sources)

- NYT Wordle's exact current (2026) answer-list size and whether more words were added after the
  Feb 2026 repeat-policy change — only the original 2,315 figure and the 2022 edits were found.
- Octordle/Quordle/Waffle multi-length modes — found only ambiguous, unsourced mentions.
- "Kelimelik" and "Kelime Avı" word-list provenance and license — no primary source found.
- The actual LICENSE file contents of `wordle-tr` or any other GitHub Turkish word-list repo.
- Whether Leipzig Corpora Collection has Turkish-language frequency lists and at what license tier.
- TDK's actual API/content terms of use (no primary legal text found in search results).

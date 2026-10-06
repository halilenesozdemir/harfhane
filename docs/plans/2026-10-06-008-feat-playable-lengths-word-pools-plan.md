---
title: Playable lengths, word pools and repeat policy
type: feat
date: 2026-10-06
status: approved
---

# Playable lengths, word pools and repeat policy

## Goal
Phase 1 of `docs/roadmap.md`: finish the code that the clean-database cutover (Plan 001 U4) and the
per-length rollout depend on, so word supply is measurable and never runs out (Invariant 10).

Research: `docs/research/2026-10-06-word-supply-standards.md`. Owner decisions of 2026-10-06:
5 letters launch first, 4 and 6 open once stocked; an answer may repeat within its length only
after 3 years; unlimited mode gets its own larger pool without meanings; daily answers keep a
short meaning but no longer need a context sentence; no Wiktionary or other CC BY-SA sources.

## Requirements
- R1. The backend decides which lengths are playable; web and mobile stop hard-coding `[4, 5, 6]`.
  Scheduled lengths (cron auto-fill, schedule health) stay 4, 5 and 6 so hidden lengths keep filling.
- R2. A word belongs to one pool: `daily` (owner-reviewed, has a meaning) or `unlimited`
  (model-labelled, deterministic checks, meaning optional). Daily scheduling uses only the daily
  pool; unlimited mode draws from both pools.
- R3. Auto-fill never schedules a word that was a daily answer of the same length in the last
  3 years, and never repeats a word inside one fill. When stock runs out it stops and schedule
  health reports it, instead of cycling.
- R4. Schedule health reports, per scheduled length, the approved daily-pool words that can still
  be scheduled under R3 ("restock runway"), and warns when that runway is under 180 days.
- R5. Empty `meaning` or `context` never renders as an empty block or an empty quote.
- R6. The label validator no longer requires a context sentence (if one is given it must use the
  answer), and supports an unlimited-pool mode that needs only a decision and reason.

## Acceptance examples
- AE1 (R1). Given `PLAYABLE_WORD_LENGTHS = "5"`, `GET /api/words/lengths` returns `[5]`; the web home
  page and the mobile home screen offer only 5 letters, and `/daily/6` redirects to `/daily/5`.
- AE2 (R1). Given the lengths request fails, clients fall back to `[5]` and still start a game.
- AE3 (R2). Given 10 approved unlimited-pool words and no daily-pool words of length 6, auto-fill
  schedules nothing for 6 and `/api/words/random?length=6` still returns a word.
- AE4 (R3). Given word A was the 5-letter answer on a date 2 years ago and word B 4 years ago, a
  fill only picks B (and other never-used words); with two eligible words and five empty dates it
  schedules two dates and leaves three empty.
- AE5 (R4). Given 120 eligible 5-letter daily words, schedule health marks 5 as `restock` with
  runway 120.
- AE6 (R5). Given a solution with empty meaning, the game-over modal shows the word without a
  meaning block.

## Key technical decisions
- KTD1. Playable lengths are a Worker var `PLAYABLE_WORD_LENGTHS` (comma-separated, validated against
  the scheduled lengths, default `"5"`). Opening a length is a reviewed, one-line deploy; no table
  and no remote D1 write is needed.
- KTD2. `words.pool TEXT NOT NULL DEFAULT 'daily' CHECK (pool IN ('daily', 'unlimited'))` via
  migration `0002_word_pools.sql`. Invariant 1 is unchanged: unlimited words still need
  `status = 'approved'` and `family_safe = 1` to reach players. The migration replaces
  `daily_words_require_active_word` with a stricter version that also rejects `pool = 'unlimited'`
  words, in one transaction; every condition of the old trigger stays.
- KTD3. Repeat cooldown is a named constant `ANSWER_REPEAT_COOLDOWN_DAYS = 1095` in
  `constants/schedule.ts`; restock threshold `RESTOCK_WARNING_DAYS = 180`.
- KTD4. Constants: rename `ACTIVE_WORD_LENGTHS` to `SCHEDULED_WORD_LENGTHS` (4, 5, 6). "Active" in
  Invariant 10 means playable; the ADR from PR #51 records that reading.
- KTD5. Unlimited-pool candidates come from the existing hunspell-tr + wordfreq pipeline with a lower
  zipf floor (`UNLIMITED_ZIPF_FLOOR`, starting at 2.5), minus daily-pool words, through the same
  blocklist and inflection filters. Model labels are decision + reason only; the validator enforces
  them. No meanings are written for this pool.

## Units
Parallel implementers never edit the same file. Group A, B and C run in parallel; units inside a
group run in order.

- U1 (A). Backend: `PLAYABLE_WORD_LENGTHS` var, `GET /api/words/lengths`, rename to
  `SCHEDULED_WORD_LENGTHS`; tests for parsing, defaults and invalid values. (R1)
- U2 (A). Web: fetch playable lengths once (shared hook), use it in `App.tsx` (`VALID_LENGTHS`),
  `HomePage.tsx`, `DesktopShell.tsx`; redirect non-playable lengths; hide the length picker when only
  one length is playable. Admin `WordsManager.tsx` keeps all scheduled lengths. (R1, AE1, AE2)
- U3 (A). Mobile: same for `HomeScreen.tsx` and stats; cache the last list in AsyncStorage. (R1)
- U4 (B). Web: `GameOverModal.tsx` hides empty meaning and context; label validator makes context
  optional and adds `--pool unlimited` (decision + reason only, writes `unlimited-N.csv` with
  `word` only). Python tests first. (R5, R6, AE6)
- U5 (C). Backend: migration `0002_word_pools.sql` (column + trigger update), repositories: random
  draws both pools, auto-fill and admin scheduling use only `pool = 'daily'`; admin import accepts
  `pool` (default `daily`) and allows empty meaning only for `unlimited`. (R2, AE3)
- U6 (C). Backend: auto-fill per R3 (cooldown query against `daily_words`, no cycling) and schedule
  health per R4 (restock runway and status), cron alert includes restock. (R3, R4, AE4, AE5)
- U7 (after U4). Script: `scripts/words/unlimited_pool.py` builds candidates per KTD5 and the pool
  file for labelling; README section. (R2)
- U8 *(owner)*. Remote: apply `0002_word_pools.sql` to `harfhane` before importing (Invariant 4).

## Not in this plan
Dropping removed-feature tables (separate owner-approved migration), the content import itself
(Plan 006 U6), and opening lengths 4 and 6 (a one-line var change once each has 90 days).

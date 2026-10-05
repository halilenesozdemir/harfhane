---
title: Content continuity research (Track B)
type: research
date: 2026-10-05
status: draft
---

# Content continuity research (Track B)

Scope: evidence for a "Content continuity" plan under Track B
(`docs/decisions/2026-10-04-parallel-tracks.md`) and plan 001's U2/U3
(`docs/plans/2026-10-04-001-infra-clean-database-plan.md`). Repo:
`/Users/halilenesozdemir/harfhane` (main, clean). Worktree read:
`/Users/halilenesozdemir/harfhane-wt/feat-word-review` (uncommitted, not
modified).

## 1. Pipeline state

`scripts/words/build_word_lists.py` (125 lines) orchestrates:
`hunspell_source.py` (pinned-commit fetch of `tdd-ai/hunspell-tr` v1.1.1,
MPL-2.0, commit `7302eca5`), `turkish.py` (Turkish-aware casing), `inflection.py`
(strips possessive/case/plural forms), `candidates.py` (zipf≥3.0 via
`wordfreq`, mastar exclusion, `blocklist.txt` prefix match, `needs_review`
heuristic). Output: `data/words/valid-{4,5,6,7}.txt` (full guess lists) and
`candidates-{4,5,6,7}.csv` (`word,length,needs_review,reason`) plus
`summary.json`. Source/license are recorded at the file level
(`data/words/README.md`), not yet as per-row `source`/`license` in the
`words`/`valid_words` tables (Invariant 3 compliance is documented but not DB-verified
pre-import). TDK and Zemberek explicitly excluded
(`data/words/README.md:9-11`). Tests: `scripts/words/test_build_word_lists.py`
(81 lines, unittest, run via `python3 -m unittest`) — covers the known pipeline
only, not the worktree additions.

Uncommitted in `feat-word-review` (`git status --short`: `?? data/words/review/`,
`?? scripts/words/answer_pool.py`, `?? scripts/words/validate_labels.py`,
`?? scripts/words/test_validate_labels.py`):
- `answer_pool.py` (48 lines): ranks a length's `candidates-N.csv` by zipf
  frequency, writes the top `--size` (default 600) to `data/words/review/pool-N.txt`.
  This is the "which 600 words get a model-written definition" selector.
- `validate_labels.py` (130 lines): deterministic gate over model output. Reads
  `pool-N.txt` + `labels-N.jsonl` (`{word, decision: accept|reject|unsure, ...}`).
  For `accept`, requires `category` in `{isim, sıfat}`, meaning/context length and
  character-set bounds, context ends in `.!?`, and — notably — rejects a
  definition that leaks the answer (`mentions_answer`, stems the word and checks
  token prefixes). For `reject`, requires a reason from a closed enum
  (`inflected, verb_form, proper_noun, foreign, abbreviation, function_word,
  sensitive, obscure, other`). Writes accepted rows to `review-N.csv`
  (`word,category,meaning,context`) and prints a JSON summary
  (counts, rejection reasons, unsure words, missing words, per-word errors).
  This is the "model proposes, code enforces" gate for word metadata
  (AGENTS.md Invariant 1), separate from the DB trigger that gates daily scheduling.
- `test_validate_labels.py` (86 lines): exercises `label_errors`/`validate`
  directly; looks complete for the current rule set.

Completeness: this is a real, working review pipeline for *one length* so far
(see §2). It has no step yet that calls a model to produce `labels-N.jsonl`,
and no step that imports `review-N.csv` into the `words` table — both are gaps.

## 2. Counts (read-only, counted locally)

`data/words/summary.json` / `wc -l`:

| length | valid | candidates (zipf≥3.0) |
|---|---|---|
| 4 | 5828 | 1696 (1695 non-header) |
| 5 | 9862 | 3028 (3027) |
| 6 | 12185 | 2727 (2726) |
| 7 | 11694 | 2624 (2623, unused by live gameplay — `data/words/README.md:29-31`) |

Review stage (worktree only, not in `main`):
- `pool-4.txt`: 600 words, no labels yet.
- `pool-5.txt`: 600 words; `labels-5.jsonl`: 600 labeled; `review-5.csv`:
  347 lines = **346 accepted** words with meaning/category/context.
- `pool-6.txt`: 600 words, no labels yet.

None of this is in the `words` table yet — these are flat files, not DB rows,
and `status`/`family_safe` only exist as DB columns (`0001_baseline.sql:12-13`).
At "one word per length per day," 346 accepted length-5 words alone would
cover ~346 days once imported and approved — well past the 90-day bar (R7).
Lengths 4 and 6 currently have 0 reviewed/acceptable words; length 7 has none
started and is explicitly out of live scope. Whether any rows already exist
in the live `harfhane`/`harfhane-db` `words` table could not be checked
(no DB/wrangler access in this task — see Unverified).

## 3. Admin approval surfaces

Backend: `apps/backend/src/routes/admin.ts` exposes `/words` CRUD,
`/words/:id` PATCH (activate/deactivate), `/import`, `/daily` GET/POST/DELETE,
`/daily/auto-fill`, `/schedule-health`, all behind `adminAuth`
(`admin.ts:36`). Frontend: `apps/frontend/src/components/admin/{WordsManager,
ImportWords,DailyScheduler,Dashboard,WordStats}.tsx` + `lib/admin-api.ts`.

KTD2 ("admin action = approval") holds for the two single-word paths:
`adminCreateWord` inserts with `source='admin', license='original',
status='approved', family_safe=1, is_active=1`
(`apps/backend/src/repositories/admin-repository.ts:99-101`), and
`adminSetWordActive` sets `status='approved'`/`family_safe=1` when activating
(`admin-repository.ts:142-146`).

Two real gaps:
- **Bulk import is broken for the new schema.** `adminBulkInsertWords`
  (`admin-repository.ts:280-297`, backing `/admin/import` and
  `ImportWords.tsx`) inserts only `(word, meaning, context, category)` —
  `source` and `license` are `NOT NULL` with no default
  (`0001_baseline.sql:2-19`), so every row insert should fail the NOT NULL
  constraint. No test exercises `adminBulkInsertWords` or `/admin/import`
  (`grep` for it in `apps/backend/tests` returned nothing) — this path looks
  unverified/unused since the baseline migration landed, and is the natural
  home for importing `review-N.csv` once the worktree pipeline lands.
- **Auto-fill only schedules length 5.** `adminAutoFillSchedule`
  (`admin-repository.ts:348-379`) hardcodes `length = 5` in both the
  "existing schedule" query and the insert (`admin-repository.ts:354,372`),
  even though `ACTIVE_WORD_LENGTHS = [4, 5, 6]`
  (`apps/backend/src/constants/schedule.ts:1`) and `schedule-health`
  already reports runway per length. One-click 90-day fill does not work for
  lengths 4 and 6 today.

## 4. Automation / schedule health

`apps/backend/wrangler.toml`: one cron, `[triggers] crons = ["0 17 * * *"]`,
bound to `scheduled()` in `apps/backend/src/index.ts:94`. That handler sends
push/email daily-word reminders (`index.ts:94-110`) — it does **not** call
`checkScheduleHealthAndAlert` or any auto-fill; there is no cron-driven
schedule-health check or auto-scheduling today, only the admin-triggered
`/admin/schedule-health` GET and `/admin/daily/auto-fill` POST.

`schedule-health-service.ts` computes, per `ACTIVE_WORD_LENGTHS` length, a
consecutive-day runway from today and severity: `critical` (≤
`SCHEDULE_CRITICAL_DAYS=3`), `warning` (≤ `SCHEDULE_WARNING_DAYS=14`), else
`ok` (`schedule-health-service.ts:11-15`, `constants/schedule.ts:5-7`).
`checkScheduleHealthAndAlert` emails `adminAlertEmail` via
`sendScheduleAlertEmail` (Resend) only when called, and only if
`adminAlertEmail` is set — but nothing in `index.ts` or `wrangler.toml` calls
it on a schedule, so the "warn before the schedule runs out" feature
(commit `9296175`, AGENTS.md Invariant 10) currently only warns when someone
opens the admin dashboard, not proactively via cron.

## 5. Definitions/meanings

Plan 001 U2.3 calls for "original, model-written, cross-checked" definitions.
What exists: `answer_pool.py` picks candidates, a human/model produces
`labels-N.jsonl` (format: `decision`, plus `category`/`meaning`/`context` on
accept) out-of-band — no generator script is in the repo — and
`validate_labels.py` is the deterministic cross-check (format, length,
answer-leak, reject-reason enum). No TDK text is read or copied anywhere in
this pipeline; `blocklist.txt` and `candidates.py`'s family-safety filter are
the only content-safety layer before human/model labeling. Risk: there is no
automated check (yet) that a "accept"-labeled meaning doesn't contain a proper
noun or an unsafe term beyond the blocklist prefix match and
`needs_review` heuristic — `data/words/README.md:33-36` already flags this as
a known limitation requiring manual spot-checks.

## 6. Proposed plan units (Content continuity)

1. **U1 — Land the review pipeline.** Commit `answer_pool.py`,
   `validate_labels.py`, `test_validate_labels.py` from `feat-word-review`
   into `scripts/words/`; add `data/words/review/.gitignore` or decide what of
   `review/*.jsonl|csv` is committed vs. generated. Local, testable
   (`python3 -m unittest`).
2. **U2 — Add a label-generation step.** A script that turns `pool-N.txt`
   into `labels-N.jsonl` drafts via a model call, so `validate_labels.py` has
   an automated upstream producer instead of an ad hoc process. Local/offline
   except the model call itself.
3. **U3 — Fix `/admin/import`.** Extend `adminBulkInsertWords` /
   `importWordsSchema` to accept `source`/`license` (or default them per
   KTD2's "admin action = approval" rule, matching `adminCreateWord`) and add
   a repository test. Local, TDD.
4. **U4 — Fix auto-fill for all active lengths.** Parametrize
   `adminAutoFillSchedule` by `ACTIVE_WORD_LENGTHS` instead of hardcoding 5;
   add a test per length. Local, TDD.
5. **U5 — Wire schedule-health into the cron.** Call
   `checkScheduleHealthAndAlert` from `index.ts`'s `scheduled()` handler (or a
   second cron entry) so the warning is proactive, not dashboard-pull-only.
   Local for the handler change; needs an owner-approved `ADMIN_ALERT_EMAIL`
   secret for the email to actually send.
6. **U6 — Review and import length 5 (346 words).** Run the (now-fixed)
   import against `review-5.csv`, then `auto-fill` 90+ days for length 5.
   **Owner-only**: any write to a remote D1 database needs explicit approval
   each session (Invariant 4).
7. **U7 — Repeat labeling + review for lengths 4 and 6.** Generate and
   validate `labels-4.jsonl`/`labels-6.jsonl` from the existing
   `pool-4.txt`/`pool-6.txt`. Local/model-assisted, no DB writes.
8. **U8 — Import and schedule lengths 4 and 6.** Same as U6 for the other
   two active lengths, closing out plan 001's R7. **Owner-only** (remote D1
   writes).
9. **U9 — Cutover readiness check.** Re-run `/admin/schedule-health` against
   `harfhane` (DB_NEXT) for all three lengths and confirm ≥90-day runway
   before plan 001's U4 cutover proceeds. **Owner-only** (reads/writes
   against the target D1 instance currently require wrangler/owner access).

## Open questions for the owner

- Is there an existing, out-of-repo process that produced `labels-5.jsonl`
  (model + human review), or should U2 fully automate it?
- Should `review/*.jsonl` and `review/*.csv` be committed to the repo (they
  contain the actual answer words) or treated as a local/CI artifact only?
- Does the cron-driven schedule alert (U5) need a second `crons` entry, or
  should it run as part of the existing 17:00 UTC job?
- Are there already rows in the `harfhane` (`DB_NEXT`) `words`/`daily_words`
  tables from earlier work, or is the pipeline starting from zero?

## Unverified

- Actual row counts in the `harfhane`/`harfhane-db` `words`, `valid_words`,
  and `daily_words` tables — no DB or wrangler access in this task.
- Whether `adminBulkInsertWords`'s missing `source`/`license` genuinely
  causes a runtime failure (inferred from the `NOT NULL` schema and the
  absence of any covering test; not executed here).
- Whether a label-generation process already exists outside this repo for
  `labels-5.jsonl`, or was produced manually for this one worktree file.
- Current content on the `Live` (`harfhane-db`) binding vs. `DB_NEXT`
  (`harfhane`) — plan 001's "Status" section says live is still on
  `harfhane-db` as of 2026-10-04; not re-verified here.

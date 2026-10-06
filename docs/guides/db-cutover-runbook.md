# Database cutover runbook (Phase 2, 5 letters)

Owner-run only (Invariant 4: production needs the owner). Every step below writes to a
remote resource, deploys, or merges — none of it is something an agent runs. This is the
sequence rehearsed locally by `scripts/db/rehearse-cutover.sh`; run that script first and
confirm it passes before starting here.

Covers Plan 001 U3/U4, Plan 006 U6, Plan 008 U8. Scope: opening **5 letters only**
(`PLAYABLE_WORD_LENGTHS="5"`, already the default). 4 and 6 letters stay hidden — they are
*scheduled* (the cron keeps stocking them) but not *playable* until each independently
reaches 90 days and gets its own one-line `PLAYABLE_WORD_LENGTHS` deploy (Plan 001 R7, Plan
008 KTD1). That is a separate, later runbook; do not fold it into this one.

**Executed 2026-10-06.** Steps 1–7 ran against remote `harfhane`: migration 0002 applied,
27,875 `valid_words` and 346 daily 5-letter words imported, 90-day schedule
2026-10-06..2027-01-03 applied from `data/words/seed/schedule_5.sql` (start 2026-10-06),
#74 merged as `709fd08` and deployed. Smoke test passed: today's answer resolved, playable
lengths `[5]`, future dates return 404. Rollback anchors (bookmarks, prior Worker version,
exports) are in the owner's local backup note, not in the repo. Steps 8–9 are ongoing.

Deviations from the steps as written:
- The schedule started **today** (2026-10-06), not tomorrow, so the step-4 and step-5
  checks that count from tomorrow return 89, not 90; counted from 2026-10-06 they return 90.
- The `daily_words_5.sql` applied remotely was the version generated from the older
  `review-5.csv` with categories (commit `7fb8d0b`). The committed file is now generated
  from the word-only CSV and writes `category` as NULL; same 346 words, and re-applying
  it remotely is a no-op (`INSERT OR IGNORE` on the unique word).
- "Before you start" below is kept as executed: #74, #59 and #63 are merged, so `main`
  now carries `0002_word_pools.sql` and the `DB` → `harfhane` binding. Run future
  steps from `main`.

## Before you start

- **Checkout the `infra/db-binding-switch` branch (PR #74) locally**, not `main`:
  `git fetch origin infra/db-binding-switch && git checkout infra/db-binding-switch`.
  Steps 1-5 below run `wrangler` from this checkout, for two reasons: (a) its
  `apps/backend/db/migrations/` already contains `0002_word_pools.sql` (PR #74 already
  has #59 and #63 merged into it — `main` does not, until step 6), and (b) its
  `apps/backend/wrangler.toml` already has the `DB` binding (not `DB_NEXT`) pointing at
  `harfhane` with `migrations_dir` set, so `wrangler d1 migrations apply harfhane
  --remote` resolves to the right database and tracks the migration correctly. None of
  this deploys anything — `wrangler d1 ...` from a local checkout only touches the
  database, not the Worker.
- **Merge order (PR #74 already reflects this):** #74 is based on `main` but its branch
  history contains #59's and #63's commits (feat/word-pools → feat/schedule-cooldown-restock
  → this PR). Merge **only #74**, with an ordinary merge commit (not squash, not rebase) —
  squashing would create new commit SHAs that don't match #59/#63's commits, so GitHub
  would not recognize them as merged and they'd stay open forever pointing at dead code.
  An ordinary merge preserves the original commits, so merging #74 to `main` is the one
  deploy this cutover needs; #59 and #63 close automatically as merged, with no separate
  deploy for either. (The previous version of this runbook said merge #59 → #63 → the
  binding-switch PR separately — that would have been three deploys, each running code
  that assumes the `pool` column exists against whichever binding is still live at that
  point. Fixed.)
- **#62 (web playable lengths) should be merged before or together with #74.** Without it,
  the live web app still hard-codes `[4, 5, 6]` and will request `/api/words/daily?length=4`
  and `?length=6` against the new `harfhane` database right after the switch, where no
  4-/6-letter daily word is scheduled yet (empty result, not a crash, but a visibly broken
  length picker). The app is not published on the Play Store yet, so there is no installed
  Android base requesting unplayable lengths from outside a browser tab — #64 (mobile) is
  not blocking this cutover for that reason, but merge it too when convenient.
- Regenerate the seed files if `data/words/valid-{4,5,6}.txt` or
  `data/words/review/review-5.csv` changed since they were last committed, and **always
  regenerate `schedule_5.sql` with the real start date right before step 4** (see that
  step) — `python3 -m unittest discover -s scripts/words -p 'test_*.py'` (the drift tests
  in `test_export_seed_sql.py` fail if the committed `data/words/seed/*.sql` no longer
  match the sources they were generated from).
- Verified counts (2026-10-06) that step 5 re-checks on the real database:
  `valid_words` — 4 letters 5,828; 5 letters 9,862; 6 letters 12,185; total 27,875.
  `words` — 346 approved daily-pool 5-letter rows from `review-5.csv`.
- Have `wrangler` authenticated against the Cloudflare account that owns both `harfhane-db`
  (id `1fad4aa7-baa4-41ce-a0f4-976904b8d29b`) and `harfhane` (id
  `58cbee2e-aa45-4b66-90c7-f5daa798f5e5`).

## 1. Back up both databases and record rollback anchors

```sh
mkdir -p ~/Backups/harfhane
npx wrangler d1 export harfhane-db --remote --output ~/Backups/harfhane/harfhane-db-$(date +%F).sql
npx wrangler d1 export harfhane --remote --output ~/Backups/harfhane/harfhane-$(date +%F).sql

npx wrangler d1 time-travel info harfhane-db --remote
npx wrangler d1 time-travel info harfhane --remote

npx wrangler deployments status
```

What it changes: nothing — every one of these is read-only. Record the two time-travel
bookmarks and the current active Worker version id (from `deployments status`) somewhere
you'll have them during a rollback — not in the repo (Invariant 4: no personal data in
version control; the bookmarks themselves are not personal data, but keep them with the
backups in `~/Backups/harfhane/`, e.g. in a `cutover-<date>.txt` note).

Verify: both `.sql` files exist and are non-empty (`ls -la ~/Backups/harfhane/`);
`harfhane`'s export should currently be schema-only (0 rows, per the 2026-10-06 wrangler
read). Both `time-travel info` calls print a bookmark string; `deployments status` prints
a version id matching what's currently live.

Rollback — two layers, pick based on what already happened:
- **Nothing written yet, or only this step ran:** nothing to roll back.
- **After steps 2-5 (schema/data written to `harfhane`, `main` not yet touched):**
  `npx wrangler d1 time-travel restore harfhane --remote --bookmark <bookmark from this
  step>`. This is destructive (overwrites `harfhane` in place) but exact, and well inside
  the 30-day Paid-plan Time Travel window. A `d1 export`-based restore only works into a
  *new, empty* database (`wrangler d1 export` produces a dump, not a point-in-time
  snapshot you can replay over existing rows) — use it only if Time Travel is unavailable
  (e.g. outside its window) and you are rebuilding `harfhane` from scratch.
- **After step 6 (merged to `main`, deployed):** `npx wrangler rollback <version id
  recorded above>` immediately restores the previous Worker version (back on
  `harfhane-db`, since that's what it was bound to), then revert the merge commit on
  `main` so the next deploy doesn't undo the rollback. Treat this as an incident — see
  step 6.

## 2. Apply migration 0002 to remote `harfhane`

From the `infra/db-binding-switch` checkout (see "Before you start"):

```sh
npx wrangler d1 migrations list harfhane --remote
npx wrangler d1 migrations apply harfhane --remote
```

What it changes: adds `words.pool` (default `'daily'`) and replaces
`daily_words_require_active_word` with the pool-aware trigger — and, unlike a raw
`d1 execute --file`, records the migration in D1's own `d1_migrations` tracking table, so
a later `migrations list` (or another `migrations apply`) correctly reports it as already
applied instead of silently depending on `INSERT OR IGNORE`-style idempotency that this
migration's `ALTER TABLE`/`DROP TRIGGER` statements don't have. Verify:

```sh
npx wrangler d1 migrations list harfhane --remote
npx wrangler d1 execute harfhane --remote --command "SELECT sql FROM sqlite_master WHERE name = 'daily_words_require_active_word';"
```

— the first command lists `0002_word_pools.sql` as applied; the second's trigger text
should mention `pool = 'daily'`. Rollback: see step 1 (Time Travel restore to the
bookmark taken before this step; `harfhane` has 0 rows at this point so there is no data
to lose, only schema).

## 3. Import the word seed files

```sh
npx wrangler d1 execute harfhane --remote --file data/words/seed/valid_words.sql
npx wrangler d1 execute harfhane --remote --file data/words/seed/daily_words_5.sql
```

What it changes: 27,875 `valid_words` rows (guess list, source `hunspell-tr`, license
`MPL-2.0`) and 346 `words` rows (5-letter daily-pool answers, `status = 'approved'`,
`family_safe = 1`, `is_active = 1`, source `admin`, license `owner-curated`, no meaning or
context). Both files use `INSERT OR IGNORE`; re-running either is safe. Verify:

```sh
npx wrangler d1 execute harfhane --remote --command "SELECT length, COUNT(*) AS n FROM valid_words GROUP BY length;"
npx wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) AS n FROM words WHERE pool = 'daily' AND length = 5 AND status = 'approved' AND family_safe = 1 AND is_active = 1;"
```

— expect 4→5,828, 5→9,862, 6→12,185 (27,875 total) and 346. Rollback: see step 1. Once
step 4 has also run, a plain `DELETE` here is not safe (daily words reference these rows by
foreign key) — prefer the Time Travel restore.

## 4. Apply the 90-day schedule

**Never call the live admin auto-fill endpoint (`POST /api/admin/daily/auto-fill`) for
this.** Before step 6 merges, the deployed Worker is still bound to the legacy
`harfhane-db` — calling that endpoint now would auto-fill the *legacy* database, not
`harfhane`, silently scheduling words nobody will ever see and leaving `harfhane`
unscheduled. The schedule is a committed, reviewable SQL file instead, applied the same
way as the other seed files.

Regenerate it right before running this step, with tomorrow's real Turkey date (the
committed file's `SCHEDULE_START_DATE` is a fixed placeholder, not computed at import
time — see `scripts/words/export_seed_sql.py`):

```sh
TOMORROW=$(python3 -c "import datetime; print((datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=3, days=1)).date().isoformat())")
python3 scripts/words/export_seed_sql.py --start-date "$TOMORROW"
git diff --stat data/words/seed/schedule_5.sql   # review before applying
npx wrangler d1 execute harfhane --remote --file data/words/seed/schedule_5.sql
```

What it changes: schedules exactly 90 `daily_words` rows for length 5, one per date from
tomorrow (Turkey day) through +89, each naming its word so the mapping is visible in the
regenerated file's diff before you run it. Only 5 letters have eligible stock right now —
4 and 6 get nothing from this file (they wait for their own review files, Plan 006 U7/U8).
Commit the regenerated file (with its real start date) as part of this runbook's paper
trail, or discard it — either way `git diff` before applying is the actual review.

Verify:

```sh
npx wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) AS n FROM daily_words WHERE length = 5 AND date >= date('now', '+3 hours', '+1 day');"
npx wrangler d1 execute harfhane --remote --command "SELECT word_id, COUNT(*) AS n FROM daily_words WHERE length = 5 GROUP BY word_id HAVING COUNT(*) > 1;"
```

— expect the first to return 90 and the second to return no rows (no repeated word).
Rollback: see step 1; once dates have actually been shown to a player, prefer leaving them
and letting schedule health report a shorter runway rather than deleting played history.

## 5. Verify counts before the switch

```sh
npx wrangler d1 execute harfhane --remote --command "SELECT length, COUNT(*) AS n FROM daily_words GROUP BY length;"
```

Confirm length 5 has exactly 90 rows (steps 3+4 together), dated from tomorrow onward, no
duplicate `word_id` (checked in step 4). Do not proceed to step 6 until this holds — this
is the gate Plan 001 R7 calls "90+ days of approved, family-safe schedule."

## 6. Merge #74 to `main` — one merge commit, timed for the Turkey midnight rollover

Merge #74 (`infra/db-binding-switch`) into `main` with an **ordinary merge commit**
(GitHub's "Create a merge commit" option, not "Squash and merge" or "Rebase and merge" —
squashing or rebasing would break the "#59/#63 close automatically" property described
above). This is the only merge this cutover needs.

**Timing — avoid a mid-day switch.** The switch changes which database answers
`/api/words/daily`; if it lands while players mid-game have a cached date-keyed save, a
later request for that same date against the new database can return a *different* word
than the one they started, since `harfhane` and `harfhane-db` schedule independently.
Land the deploy right after **21:00 UTC (00:00 Turkey)** — the moment the daily word
rolls over for everyone anyway, so there is no "mid-day" to be caught mid-game — and well
away from the 17:00 UTC cron (`[triggers] crons` in `wrangler.toml`), so the switch and
the next auto-fill/schedule-health tick don't race each other.

`.github/workflows/deploy-backend.yml` waits for CI on the merge commit before deploying:
up to 8 minutes to find the CI run plus up to 15 minutes watching it, inside a 30-minute
job timeout that also covers install/build/deploy/smoke steps — budget **up to ~25
minutes** between merging and the deploy actually landing. **Merge at approximately
20:35 UTC**, not 21:00 UTC, so the deploy lands at or shortly after the rollover instead of
before it.

What it changes: `apps/backend/wrangler.toml` — `DB` now points at `harfhane`
(`58cbee2e-aa45-4b66-90c7-f5daa798f5e5`) with `migrations_dir`, and the `DB_NEXT` binding
is gone. The live app now reads and writes `harfhane`, not `harfhane-db`, for every
request — plus everything #59 and #63 add (word pools, repeat cooldown, restock runway,
cron top-up) and the `gameNumber` fix (computed from the shared Turkey-day clock, so game
numbers keep advancing instead of resetting to a small count on the fresh database).

Rollback: see step 1's third case — `wrangler rollback <version id>` immediately, then
revert the merge commit on `main` so the next push doesn't redeploy the broken version.
Treat a post-merge rollback as an incident: investigate why before merging again, don't
just retry.

## 7. Smoke-test production

The deploy workflow's own smoke test only polls `/api/health` until its `version` field
matches the deployed commit SHA — it does not touch any word-serving endpoint. Run this
manual smoke test yourself immediately after the deploy reports success:

```sh
curl -s https://api.harfhane.app/api/health
curl -s "https://api.harfhane.app/api/words/daily?length=5"
curl -s "https://api.harfhane.app/api/words/random?length=5"
curl -s -X POST https://api.harfhane.app/api/words/validate -H 'Content-Type: application/json' -d '{"word":"ADRES"}'
curl -s "https://api.harfhane.app/api/words/lengths"
```

Expect: a healthy `/api/health`; a real 5-letter word for today's Turkey date from
`/api/words/daily` (not an error, not empty); a word from `/api/words/random`; `{"isValid":
true}` from `/api/words/validate` for a word that is actually in `valid_words.sql` (`ADRES`
is one of the 346 daily-pool words, which are also valid guesses); and `/api/words/lengths`
returning `[5]` (or whatever `PLAYABLE_WORD_LENGTHS` is currently set to). That last one is
what web (#62) and mobile (#64) use to decide which lengths to offer and request — once
those are merged, clients never request a non-playable length (see their e2e/unit tests:
the home screen hides 4/6, `/daily/6` redirects to `/daily/5`). Until #62 merges, the live
web app can still request `/api/words/daily?length=4` or `?length=6` and get an empty
result (no error) — see "Before you start" for why #62 should land with or before this.

## 8. Legacy 4- and 6-letter schedules on `harfhane-db`

`harfhane-db`'s 5-letter schedule ends 2026-11-09 (4-letter: 2026-12-11; 6-letter:
2026-12-01, per the 2026-10-06 wrangler reading). After step 6, the live binding no longer
points at `harfhane-db` at all, so:

- Players who already loaded a daily puzzle from `harfhane-db` before the cutover keep
  playing that in-memory game normally; it does not reach the server again until they
  refresh or start a new one — which is exactly why step 6 times the switch to the Turkey
  midnight rollover, when every client is about to ask for a new day's word anyway.
- Any client that still requests `harfhane-db`'s data after the cutover gets nothing — the
  binding switch means no code path reads `harfhane-db` anymore, regardless of what that
  database's own schedule still contains. Its remaining 4-/5-/6-letter rows past the
  cutover date are simply never read again.
- **No legacy data is copied into `harfhane`.** `harfhane`'s words come only from
  `hunspell-tr` (guess list) and the owner-reviewed `review-5.csv` (answers) — never from
  `harfhane-db`. Its rows predate Invariant 3 (`source`/`license` per row) and Plan 001's
  clean-pipeline requirement; carrying them forward would reintroduce exactly what this
  cutover exists to leave behind.
- `harfhane-db` itself is untouched and keeps existing until Plan 001 U6 (retire, after one
  stable week, explicit owner approval, irreversible) — this runbook does not delete it.

## 9. Watch the first cron tick

The cron runs daily at 17:00 UTC (`[triggers] crons` in `wrangler.toml`) — four hours
before the 21:00 UTC switch window, so the first tick after cutover is the *next* day's,
not the same night's. Watch it (`wrangler tail` or the Workers dashboard):

- it should call `autoFillDailySchedule` (from #63) and `checkScheduleHealthAndAlert`
  against `harfhane`, not `harfhane-db`;
- confirm no alert email fires for length 5 (it has ~89 days of runway left after one day
  passes) and that 4/6 either alert as expected (no daily-pool stock yet) or stay quiet if
  you have since imported more.

If the cron errors against the new binding, the fallback is the one-line binding revert
from step 6's rollback — do that before debugging further, since the cron runs unattended.

## Reference: D1 and Workers limits/behavior this runbook relies on

- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) (read 2026-10-06):
  maximum SQL statement length 100,000 bytes; maximum file import (`wrangler d1 execute
  --file`) size 5 GB; maximum bound parameters per query 100.
  `scripts/words/export_seed_sql.py` chunks every generated `INSERT OR IGNORE` statement
  at 500 rows, which keeps every statement well under 100 KB (the largest of the 57
  statements in `valid_words.sql` is ~21.5 KB) — comfortably inside both limits.
- [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) (read
  2026-10-06): `wrangler d1 time-travel info <db> --remote` prints a bookmark;
  `wrangler d1 time-travel restore <db> --remote --bookmark <bookmark>` destructively
  restores in place. 30-day recovery window on a Paid plan, 7 days on Free; requires
  Wrangler ≥ 3.4.0; only `version: production` databases support it.
- [Workers rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
  (read 2026-10-06): `wrangler rollback [<VERSION_ID>]` immediately creates a new
  deployment at the given (or second-most-recent, if omitted) version across all routes;
  `wrangler deployments status` prints the currently active version id. Cannot roll back
  across a binding deletion/change that's incompatible with the target version's code —
  not a concern here since the rollback target (pre-#74) still declares `harfhane-db`.
- `.github/workflows/deploy-backend.yml` (read in this checkout): waits up to 8 minutes to
  find the CI run for the merge commit, then up to 15 minutes for it to finish, inside a
  30-minute job timeout; its own smoke test only polls `/api/health`'s `version` field.

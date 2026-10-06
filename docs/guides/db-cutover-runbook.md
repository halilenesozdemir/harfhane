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

## Before you start

- Confirm PR #59 (`feat/word-pools`, migration `0002_word_pools.sql`) and PR #63
  (`feat/schedule-cooldown-restock`, cooldown auto-fill + cron top-up) are reviewed and
  ready. This runbook applies #59's migration directly to remote `harfhane` in step 2,
  ahead of merging it — that is intentional (KTD1: parallel database, no in-place reset;
  the migration only touches `harfhane`, never the live `harfhane-db`). Step 7 then merges
  both PRs plus the binding-switch PR in one deploy.
- Regenerate the seed files if `data/words/valid-{4,5,6}.txt` or
  `data/words/review/review-5.csv` changed since they were last committed:
  `python3 scripts/words/export_seed_sql.py`, then `python3 -m unittest discover -s
  scripts/words -p 'test_*.py'` (the drift tests in `test_export_seed_sql.py` fail if the
  committed `data/words/seed/*.sql` no longer match).
- Have `wrangler` authenticated against the Cloudflare account that owns both `harfhane-db`
  (id `1fad4aa7-baa4-41ce-a0f4-976904b8d29b`) and `harfhane` (id
  `58cbee2e-aa45-4b66-90c7-f5daa798f5e5`).

## 1. Back up both databases

```sh
mkdir -p ~/Backups/harfhane
npx wrangler d1 export harfhane-db --remote --output ~/Backups/harfhane/harfhane-db-$(date +%F).sql
npx wrangler d1 export harfhane --remote --output ~/Backups/harfhane/harfhane-$(date +%F).sql
```

What it changes: nothing — read-only export. Verify: both files exist and are non-empty
(`ls -la ~/Backups/harfhane/`); `harfhane`'s export should currently be schema-only (0
rows, per the 2026-10-06 wrangler read). Never commit these files (Invariant 4: backups
contain personal data and stay outside the repo, only in `~/Backups/harfhane/`).
Rollback: nothing to roll back; re-run the export any time.

## 2. Apply migration 0002 to remote `harfhane`

```sh
npx wrangler d1 execute harfhane --remote --file apps/backend/db/migrations/0002_word_pools.sql
```

(Take this file from the `feat/word-pools` branch, PR #59, if it is not yet in your working
tree: `git show origin/feat/word-pools:apps/backend/db/migrations/0002_word_pools.sql`.)

What it changes: adds `words.pool` (default `'daily'`) and replaces
`daily_words_require_active_word` with the pool-aware trigger. Verify:

```sh
npx wrangler d1 execute harfhane --remote --command "SELECT sql FROM sqlite_master WHERE name = 'daily_words_require_active_word';"
```

— the trigger text should mention `pool = 'daily'`. Rollback: `harfhane` has 0 rows at this
point (2026-10-06 reading), so the safe rollback is to restore the step-1 backup
(`wrangler d1 execute harfhane --remote --file ~/Backups/harfhane/harfhane-<date>.sql` after
first dropping the added column, or simply recreate the database from the baseline
migration — there is no data to lose yet).

## 3. Import the word seed files

```sh
npx wrangler d1 execute harfhane --remote --file data/words/seed/valid_words.sql
npx wrangler d1 execute harfhane --remote --file data/words/seed/daily_words_5.sql
```

What it changes: ~27,875 `valid_words` rows (guess list, source `hunspell-tr`, license
`MPL-2.0`) and 346 `words` rows (5-letter daily-pool answers, `status = 'approved'`,
`family_safe = 1`, `is_active = 1`, source `admin`, license `owner-curated`, no meaning or
context). Both files use `INSERT OR IGNORE`; re-running either is safe. Verify:

```sh
npx wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) AS n FROM valid_words WHERE length = 5;"
npx wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) AS n FROM words WHERE pool = 'daily' AND length = 5 AND status = 'approved' AND family_safe = 1 AND is_active = 1;"
```

— expect 9,862 and 346. Rollback: `DELETE FROM words WHERE source = 'admin' AND license =
'owner-curated' AND pool = 'daily'; DELETE FROM valid_words WHERE source = 'hunspell-tr';`
(irreversible once daily words have been scheduled and shown to players — prefer rolling
forward).

## 4. Auto-fill the 5-letter schedule to 90 days

Via the admin API (`ADMIN_SECRET` from the production secret store):

```sh
curl -X POST https://api.harfhane.app/api/admin/daily/auto-fill \
  -H "X-Admin-Secret: $ADMIN_SECRET" -H "Content-Type: application/json" \
  -d '{"days": 90}'
```

What it changes: schedules `daily_words` rows for every unscheduled date from today through
today+90, for every scheduled length (4, 5, 6 — Plan 006 R2), drawing only from
`pool = 'daily'` words. Only length 5 has eligible stock right now, so 4 and 6 schedule
nothing (`scheduled: 0`) — expected until their own review files land (Plan 006 U7/U8).
Verify:

```sh
npx wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) AS n FROM daily_words WHERE length = 5 AND date >= date('now', '+3 hours', '+1 day');"
```

— expect ≥ 90 (Turkey day: `date('now', '+3 hours')` matches the fixed +3h offset in
`packages/shared/game/time.ts`). Rollback: `DELETE FROM daily_words WHERE length = 5 AND
date >= '<today>';` before any of those dates have been shown to a player; once a date has
been played, do not delete it — schedule health will just report a shorter runway.

## 5. Verify counts before cutover

```sh
npx wrangler d1 execute harfhane --remote --command "SELECT length, COUNT(*) AS n FROM daily_words GROUP BY length;"
```

Confirm length 5 has ≥ 90 rows with `date` from today onward and no duplicate `word_id`
(`SELECT word_id, COUNT(*) FROM daily_words WHERE length = 5 GROUP BY word_id HAVING
COUNT(*) > 1;` must return nothing). Do not proceed to step 6 until this holds — this is
the gate Plan 001 R7 calls "90+ days of approved, family-safe schedule."

## 6. Merge #59 → #63 → the binding-switch PR, one deploy

Merge in this order (each depends on the last): `feat/word-pools` (#59), then
`feat/schedule-cooldown-restock` (#63), then the binding-switch PR prepared alongside this
runbook (stacked on #63, labelled `parked` — unparks it: change its base to `main` and
re-review before merging). Merging the last one deploys
`.github/workflows/deploy-backend.yml` (paths `apps/backend/**`, `packages/shared/**`).

What it changes: `apps/backend/wrangler.toml` — `DB` now points at `harfhane`
(`58cbee2e-aa45-4b66-90c7-f5daa798f5e5`) with `migrations_dir`, and the `DB_NEXT` binding is
gone. The live app now reads and writes `harfhane`, not `harfhane-db`, for every request.
Rollback: revert the binding-switch commit and redeploy (`DB` → `harfhane-db` again); this
is the one-line rollback promised by Plan 001 KTD1. Data written to `harfhane` while the
switch was live is not automatically carried back to `harfhane-db` — treat a rollback as an
incident, not a routine toggle.

## 7. Smoke-test production

```sh
curl -s https://api.harfhane.app/api/health
curl -s "https://api.harfhane.app/api/words/daily?length=5"
```

Expect a healthy response and a real 5-letter word for today's Turkey date (not an error,
not a 4- or 6-letter fallback). Also check `GET /api/words/lengths` returns `[5]` (or
whatever `PLAYABLE_WORD_LENGTHS` is currently set to) — this is what web (#62) and mobile
(#64) use to decide which lengths to offer and request; once those two PRs are merged,
clients never request a non-playable length (see their e2e/unit tests: the home screen
hides 4/6, and `/daily/6` redirects to `/daily/5`). Until #62/#64 merge, a client still
hard-coding `[4, 5, 6]` could request `/api/words/daily?length=4` or `?length=6` against the
new `harfhane` database and get a 404/empty result (no 4- or 6-letter daily word scheduled
yet) — merge #62/#64 before or together with this cutover to avoid that gap.

## 8. Legacy 4- and 6-letter schedules on `harfhane-db`

`harfhane-db`'s 5-letter schedule ends 2026-11-09 (4-letter: 2026-12-11; 6-letter:
2026-12-01, per the 2026-10-06 wrangler reading). After step 6, the live binding no longer
points at `harfhane-db` at all, so:

- Players who already loaded a daily puzzle from `harfhane-db` before the cutover keep
  playing that in-memory game normally; it does not reach the server again until they
  refresh or start a new one.
- Any client that still requests `harfhane-db`'s data after the cutover gets nothing — the
  binding switch means no code path reads `harfhane-db` anymore, regardless of what that
  database's own schedule still contains. Its remaining 4-/5-/6-letter rows past the
  cutover date are simply never read again.
- `harfhane-db` itself is untouched and keeps existing until Plan 001 U6 (retire, after one
  stable week, explicit owner approval, irreversible) — this runbook does not delete it.

## 9. Watch the first cron tick

The cron runs daily at 17:00 UTC (`[triggers] crons` in `wrangler.toml`). Watch the first
tick after cutover (`wrangler tail` or the Workers dashboard):

- it should call `autoFillDailySchedule` (once #63 is merged) and `checkScheduleHealthAndAlert`
  against `harfhane`, not `harfhane-db`;
- confirm no alert email fires for length 5 (it has 90 days of runway) and that 4/6 either
  alert as expected (no daily-pool stock yet) or stay quiet if you have since imported more.

If the cron errors against the new binding, the fallback is the one-line binding revert
from step 6's rollback — do that before debugging further, since the cron runs unattended.

## Reference: D1 limits this runbook relies on

[D1 limits](https://developers.cloudflare.com/d1/platform/limits/) (read 2026-10-06):
maximum SQL statement length 100,000 bytes; maximum file import (`wrangler d1 execute
--file`) size 5 GB; maximum bound parameters per query 100. `scripts/words/export_seed_sql.py`
chunks every generated `INSERT OR IGNORE` statement at 500 rows, which keeps every
statement well under 100 KB (the largest of the 57 statements in `valid_words.sql` is
~21.5 KB) — comfortably inside both limits, with no need to approach the 5 GB file-import
ceiling.

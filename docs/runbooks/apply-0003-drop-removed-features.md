# Runbook: apply `0003_drop_removed_features.sql` to the remote `harfhane` database

**Prerequisite:** #118, #119 and #120 merged and the backend deployed; only then
does the owner apply 0003.

Owner-only. Drops 14 tables left over from removed features (`docs/backlog.md`
"Drop migration: every table left over from removed features") and rebuilds
`words` with a tighter CHECK. Invariant 4 (`AGENTS.md`) requires the owner to run
every step below; no agent runs any `--remote` command.

Do not run this within an hour of the daily cron (`crons = ["0 17 * * *"]` in
`apps/backend/wrangler.toml`, 17:00 UTC) — a migration mid-cron-run risks the
schedule-fill job hitting a half-migrated schema.

## 1. Back up and bookmark

```sh
cd apps/backend
mkdir -p ~/Backups/harfhane
npx wrangler d1 export harfhane --remote --output ~/Backups/harfhane/harfhane-$(date +%Y%m%d%H%M%S).sql
npx wrangler d1 time-travel info harfhane
```
Record the bookmark id printed by `time-travel info` — it is the rollback target in step 5.
Backups never go into the repo (Invariant 4).

## 2. Read-only pre-checks (remote)

Run each of these against the live database before touching anything:

```sh
npx wrangler d1 execute harfhane --remote --command "SELECT name FROM d1_migrations ORDER BY id;"
npx wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) FROM words WHERE is_active = 1 AND NOT (status = 'approved' AND family_safe = 1);"
npx wrangler d1 execute harfhane --remote --command "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('list_comments','list_likes','word_list_words','word_lists','user_badges','badges','user_xp','push_subscriptions','streak_freezes','password_reset_tokens','game_results','tournament_results','duels','users');"
npx wrangler d1 execute harfhane --remote --command "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name IN ('words','daily_words');"
npx wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) FROM users;"
npx wrangler d1 execute harfhane --remote --command "SELECT seq FROM sqlite_sequence WHERE name='words';"
npx wrangler d1 execute harfhane --remote --command "SELECT MAX(id) FROM words;"
npx wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) FROM words;"
```
Expect, respectively: only `0001_baseline.sql`/`0002_word_pools.sql` listed (0003 not
yet applied); `0` (an active word already violating the tightened CHECK — fix it first,
or the migration fails); all 14 table names present; only `daily_words_require_active_word`
(0003 adds three more); the `users` row count — **those rows and all personal data in
them are deleted permanently by this migration except for what the step 1 backup
holds**; `seq`/`MAX(id)`/row count for `words`, all recorded so step 4 can confirm the
rebuild changed none of them (a `seq` drift would let a future insert reuse an id a
stale `/api/words/challenge/:wordId` link already points at).

## 3. Rehearse on a local copy of the production export

```sh
cd apps/backend
mkdir -p ~/Backups/harfhane/rehearsal-0003
npx wrangler d1 execute harfhane --local --persist-to ~/Backups/harfhane/rehearsal-0003 --file ~/Backups/harfhane/<the export from step 1>.sql
npx wrangler d1 migrations apply harfhane --local --persist-to ~/Backups/harfhane/rehearsal-0003
```
Then the same smoke queries as step 4 below, but with `--local --persist-to
~/Backups/harfhane/rehearsal-0003` instead of `--remote`. All must pass before
continuing. Delete `~/Backups/harfhane/rehearsal-0003` afterwards — it holds a full
copy of production data including `users`, so it must never go into the repo
(Invariant 4) or sit anywhere under the checkout.

## 4. Apply remotely and smoke-test

```sh
npx wrangler d1 migrations apply harfhane --remote
npx wrangler d1 execute harfhane --remote --command "PRAGMA foreign_key_check;"
npx wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) FROM words;"
npx wrangler d1 execute harfhane --remote --command "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name IN ('words','daily_words');"
npx wrangler d1 execute harfhane --remote --command "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'words';"
npx wrangler d1 execute harfhane --remote --command "SELECT w.word FROM daily_words d JOIN words w ON w.id = d.word_id WHERE d.date = date('now', '+3 hours');"
npx wrangler d1 execute harfhane --remote --command "SELECT seq FROM sqlite_sequence WHERE name='words';"
npx wrangler d1 execute harfhane --remote --command "SELECT MAX(id) FROM words;"
```
Expect: `PRAGMA foreign_key_check` empty; the `words` count unchanged from step 2;
**four** triggers (`daily_words_require_active_word`,
`daily_words_require_active_word_on_update`, `words_block_deactivate_scheduled_future`,
`words_block_activate_rejected` — verified against a local rehearsal; not five, since
0001/0002 declared only the one trigger on `daily_words`); both `idx_words_length_active`
and `idx_words_status`; a row from the daily join (Turkey-day shift, matching
`getTodayString()`, not bare `date('now')`); and the same `seq`/`MAX(id)` recorded in
step 2 — if `seq` changed, a future word could be assigned an id a stale link already
points at. Then hit the live API: `curl https://api.harfhane.app/api/words/daily?date=<today>`
and confirm it still returns a word.

## 5. Rollback if anything above fails

```sh
npx wrangler d1 time-travel restore harfhane --remote --bookmark <bookmark id from step 1>
```
Time Travel restores the database to the bookmarked point; it does not undo a bad
deploy of the Worker itself (that is `wrangler rollback`, separate from this).

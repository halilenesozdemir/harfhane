# Runbook: apply `0003_drop_removed_features.sql` to the remote `harfhane` database

Owner-only. This migration drops 14 tables left over from removed features
(`docs/backlog.md` "Drop migration: every table left over from removed features")
and rebuilds `words` with a tighter CHECK. Invariant 4 (`AGENTS.md`) requires the
owner to run every step below; no agent runs any `--remote` command.

Do not run this within an hour of the daily cron (`crons = ["0 17 * * *"]` in
`apps/backend/wrangler.toml`, 17:00 UTC) — a migration mid-cron-run risks the
schedule-fill job hitting a half-migrated schema.

## 1. Back up and bookmark

```sh
cd apps/backend
mkdir -p ~/Backups/harfhane
wrangler d1 export harfhane --remote --output ~/Backups/harfhane/harfhane-$(date +%Y%m%d%H%M%S).sql
wrangler d1 time-travel info harfhane
```
Record the bookmark id printed by `time-travel info` — it is the rollback target in step 5.
Backups never go into the repo (Invariant 4).

## 2. Read-only pre-checks (remote)

Run each of these against the live database before touching anything:

```sh
wrangler d1 execute harfhane --remote --command "SELECT name FROM d1_migrations ORDER BY id;"
wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) FROM words WHERE is_active = 1 AND NOT (status = 'approved' AND family_safe = 1);"
wrangler d1 execute harfhane --remote --command "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('list_comments','list_likes','word_list_words','word_lists','user_badges','badges','user_xp','push_subscriptions','streak_freezes','password_reset_tokens','game_results','tournament_results','duels','users');"
wrangler d1 execute harfhane --remote --command "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name IN ('words','daily_words');"
wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) FROM users;"
```
Expect, respectively: only `0001_baseline.sql` and `0002_word_pools.sql` listed (0003 not
yet applied); `0` (no active word already violates the tightened CHECK — if this is
not `0`, stop and fix those rows first, the migration will otherwise fail); all 14
table names present; only `daily_words_require_active_word` (0001/0002's trigger —
0003 adds three more only once applied, so this is the pre-migration state); and the
`users` row count, recorded here for the record — **those rows, and all personal
data in them, are deleted permanently by this migration except for what the step 1
backup holds.**

## 3. Rehearse on a local copy of the production export

```sh
cd apps/backend
mkdir -p .wrangler-rehearsal
wrangler d1 execute harfhane --local --persist-to .wrangler-rehearsal --file ~/Backups/harfhane/<the export from step 1>.sql
wrangler d1 migrations apply harfhane --local --persist-to .wrangler-rehearsal
```
Then the same smoke queries as step 4 below, but with `--local --persist-to .wrangler-rehearsal`
instead of `--remote`. All must pass before continuing. Delete `.wrangler-rehearsal`
afterwards (it holds a full copy of production data, including `users`).

## 4. Apply remotely and smoke-test

```sh
wrangler d1 migrations apply harfhane --remote
wrangler d1 execute harfhane --remote --command "PRAGMA foreign_key_check;"
wrangler d1 execute harfhane --remote --command "SELECT COUNT(*) FROM words;"
wrangler d1 execute harfhane --remote --command "SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name IN ('words','daily_words');"
wrangler d1 execute harfhane --remote --command "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'words';"
wrangler d1 execute harfhane --remote --command "SELECT w.word FROM daily_words d JOIN words w ON w.id = d.word_id WHERE d.date = date('now');"
```
Expect: `PRAGMA foreign_key_check` empty; the `words` count unchanged from the
step 2 pre-check; five triggers (`daily_words_require_active_word`,
`daily_words_require_active_word_on_update`, `words_block_deactivate_scheduled_future`,
`words_block_activate_rejected`, plus whatever 0001 already had on `daily_words`);
both `idx_words_length_active` and `idx_words_status`; and a row from the daily join.
Then hit the live API: `curl https://api.harfhane.app/api/words/daily?date=<today>` and
confirm it still returns a word.

## 5. Rollback if anything above fails

```sh
wrangler d1 time-travel restore harfhane --bookmark <bookmark id from step 1>
```
Time Travel restores the database to the bookmarked point; it does not undo a bad
deploy of the Worker itself (that is `wrangler rollback`, separate from this).

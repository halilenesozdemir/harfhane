#!/usr/bin/env bash
# Rehearses the Phase 2 clean-database cutover (Plan 001 U3/U4, Plan 006 U6, Plan 008 U5/U8)
# entirely against a LOCAL D1 database. Never touches remote D1 — every wrangler call below
# uses `--local`; this script must never gain a `--remote` flag. See
# docs/guides/db-cutover-runbook.md for the real, owner-run remote sequence this rehearses.
#
# What it does, in order:
#   1. Copies migration 0002_word_pools.sql from the open feat/word-pools PR (read-only;
#      see WORD_POOLS_REF below) next to this branch's own 0001_baseline.sql, in a scratch
#      migrations dir. Nothing from that branch is merged into this one.
#   2. Applies both migrations to a throwaway local D1 database (fresh persist dir each run).
#   3. Imports data/words/seed/valid_words.sql and data/words/seed/daily_words_5.sql
#      (idempotent: INSERT OR IGNORE).
#   4. Regenerates the 90-day schedule with `export_seed_sql.render_schedule_sql`, using
#      tomorrow's real Turkey date as the start date (the committed
#      data/words/seed/schedule_5.sql is never touched — this writes to a scratch copy),
#      then imports that file exactly the way the runbook applies it for real:
#      `wrangler d1 execute --file`, never by calling the live admin auto-fill endpoint
#      (which would run against whatever database the deployed Worker is bound to —
#      the legacy harfhane-db, before the binding-switch PR merges).
#   5. Prints per-length counts and asserts the Phase 2 acceptance checks below. Exits
#      non-zero on the first failed assertion.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/apps/backend"
SEED_DIR="$REPO_ROOT/data/words/seed"

WORD_POOLS_REF="${WORD_POOLS_REF:-origin/feat/word-pools}"
TARGET_LENGTH=5
TOPUP_DAYS=90
# Matches the `harfhane` database_name declared in apps/backend/wrangler.toml — the
# post-switch DB binding (pre-switch, the same database_name was bound as DB_NEXT).
DB_NAME="harfhane"

SCRATCH_DIR="${REHEARSAL_SCRATCH_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/harfhane-cutover-rehearsal.XXXXXX")}"
PERSIST_DIR="$SCRATCH_DIR/d1-local"
MIGRATIONS_DIR="$SCRATCH_DIR/migrations"

log() { printf '[rehearse] %s\n' "$1"; }
fail() { printf '[rehearse] FAIL: %s\n' "$1" >&2; exit 1; }

log "scratch dir: $SCRATCH_DIR (not deleted automatically; inspect or rm -rf it yourself)"
mkdir -p "$PERSIST_DIR" "$MIGRATIONS_DIR"

cd "$BACKEND_DIR"

run_d1_file() {
  npx wrangler d1 execute "$DB_NAME" --local --persist-to "$PERSIST_DIR" --file "$1" >/dev/null
}

run_d1_command() {
  npx wrangler d1 execute "$DB_NAME" --local --persist-to "$PERSIST_DIR" --command "$1" >/dev/null
}

# Returns the JSON `results` array of a single-statement query as text (no pretty wrapper).
run_d1_json() {
  npx wrangler d1 execute "$DB_NAME" --local --persist-to "$PERSIST_DIR" --json --command "$1"
}

log "staging migrations: 0001 from this branch, 0002 read-only from $WORD_POOLS_REF"
cp "$BACKEND_DIR/db/migrations/0001_baseline.sql" "$MIGRATIONS_DIR/0001_baseline.sql"
if ! git -C "$REPO_ROOT" show "$WORD_POOLS_REF:apps/backend/db/migrations/0002_word_pools.sql" \
  > "$MIGRATIONS_DIR/0002_word_pools.sql" 2>/dev/null; then
  fail "could not read 0002_word_pools.sql from $WORD_POOLS_REF — fetch it (git fetch origin feat/word-pools) or pass WORD_POOLS_REF=<ref>"
fi

table_exists() {
  local table="$1"
  local result
  result="$(run_d1_json "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = '$table';" 2>/dev/null || echo '')"
  [ -n "$result" ] && [ "$(python3 -c "import json,sys; print(json.loads(sys.argv[1])[0]['results'][0]['n'])" "$result" 2>/dev/null || echo 0)" != "0" ]
}

# Re-running against an already-migrated persist dir (REHEARSAL_SCRATCH_DIR reused) must
# not fail on "table already exists" — skip a migration whose effect is already present.
if table_exists "words"; then
  log "skipping 0001_baseline.sql (words table already exists in this persist dir)"
else
  log "applying 0001_baseline.sql"
  run_d1_file "$MIGRATIONS_DIR/0001_baseline.sql"
fi

if run_d1_json "SELECT pool FROM words LIMIT 0;" >/dev/null 2>&1; then
  log "skipping 0002_word_pools.sql (pool column already exists in this persist dir)"
else
  log "applying 0002_word_pools.sql"
  run_d1_file "$MIGRATIONS_DIR/0002_word_pools.sql"
fi

log "importing data/words/seed/valid_words.sql"
run_d1_file "$SEED_DIR/valid_words.sql"
log "importing data/words/seed/daily_words_5.sql"
run_d1_file "$SEED_DIR/daily_words_5.sql"

TODAY_TURKEY="$(python3 -c '
import datetime
now = datetime.datetime.now(datetime.timezone.utc)
turkey_now = now + datetime.timedelta(hours=3)
print(turkey_now.date().isoformat())
')"
TOMORROW_TURKEY="$(python3 -c "
import datetime
print((datetime.date.fromisoformat('$TODAY_TURKEY') + datetime.timedelta(days=1)).isoformat())
")"
log "regenerating a $TOPUP_DAYS-day schedule starting tomorrow ($TOMORROW_TURKEY) into the scratch dir"
SCHEDULE_SCRATCH_SQL="$SCRATCH_DIR/schedule_5.sql"
python3 -c "
import sys
sys.path.insert(0, '$REPO_ROOT/scripts/words')
import export_seed_sql as seed

content = seed.render_schedule_sql(start_date='$TOMORROW_TURKEY', days=$TOPUP_DAYS)
with open('$SCHEDULE_SCRATCH_SQL', 'w', encoding='utf-8') as handle:
    handle.write(content)
"
log "importing the regenerated schedule (committed data/words/seed/schedule_5.sql is untouched)"
run_d1_file "$SCHEDULE_SCRATCH_SQL"

json_field() {
  # Extracts one field from `[{"results":[{"<key>":...}], ...}]`.
  python3 -c "
import json, sys
data = json.loads(sys.argv[1])
print(data[0]['results'][0][sys.argv[2]])
" "$1" "$2"
}

log "per-length counts"
for length in 4 5 6; do
  counts_json="$(run_d1_json "SELECT
      (SELECT COUNT(*) FROM words WHERE length = $length AND pool = 'daily' AND status = 'approved' AND family_safe = 1 AND is_active = 1) AS approved_daily,
      (SELECT COUNT(*) FROM daily_words WHERE length = $length) AS scheduled;")"
  approved="$(json_field "$counts_json" approved_daily)"
  scheduled="$(json_field "$counts_json" scheduled)"
  log "length $length: approved daily-pool words = $approved, scheduled days = $scheduled"
done

assert_eq() {
  local description="$1" expected="$2" actual="$3"
  if [ "$expected" != "$actual" ]; then
    fail "$description — expected $expected, got $actual"
  fi
  log "ok: $description ($actual)"
}

assert_ge() {
  local description="$1" minimum="$2" actual="$3"
  if [ "$actual" -lt "$minimum" ]; then
    fail "$description — expected >= $minimum, got $actual"
  fi
  log "ok: $description ($actual)"
}

APPROVED_DAILY_5_JSON="$(run_d1_json "SELECT COUNT(*) AS n FROM words WHERE length = $TARGET_LENGTH AND pool = 'daily' AND status = 'approved' AND family_safe = 1 AND is_active = 1;")"
assert_eq "346 approved daily-pool 5-letter words" "346" "$(json_field "$APPROVED_DAILY_5_JSON" n)"

SCHEDULED_FROM_TOMORROW_JSON="$(run_d1_json "SELECT COUNT(*) AS n FROM daily_words WHERE length = $TARGET_LENGTH AND date >= '$TOMORROW_TURKEY';")"
assert_ge "scheduled 5-letter days from tomorrow ($TOMORROW_TURKEY)" "90" "$(json_field "$SCHEDULED_FROM_TOMORROW_JSON" n)"

DUPLICATE_WORDS_JSON="$(run_d1_json "SELECT COUNT(*) AS n FROM (SELECT word_id FROM daily_words WHERE length = $TARGET_LENGTH GROUP BY word_id HAVING COUNT(*) > 1);")"
assert_eq "no 5-letter word repeated across the schedule" "0" "$(json_field "$DUPLICATE_WORDS_JSON" n)"

log "checking the trigger rejects an unlimited-pool word scheduled as daily"
run_d1_command "INSERT OR IGNORE INTO words (word, length, meaning, context, category, source, license, status, family_safe, approved_at, is_active, pool)
  VALUES ('REHZX', 5, '', '', 'isim', 'rehearsal', 'rehearsal', 'approved', 1, datetime('now'), 1, 'unlimited');"
TRIGGER_ERR_LOG="$SCRATCH_DIR/trigger-rejection.err"
if run_d1_command "INSERT INTO daily_words (word_id, date, length) SELECT id, '2099-12-31', 5 FROM words WHERE word = 'REHZX';" 2>"$TRIGGER_ERR_LOG"; then
  fail "trigger did not reject scheduling an unlimited-pool word"
fi
grep -q "daily word must be an approved, family-safe, active, daily-pool word" "$TRIGGER_ERR_LOG" \
  || fail "insert failed for an unexpected reason: $(cat "$TRIGGER_ERR_LOG")"
log "ok: trigger rejects an unlimited-pool word"

log "all assertions passed"

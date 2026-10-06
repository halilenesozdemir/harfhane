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
#   4. Runs the admin auto-fill for 90 days as a SQL equivalent of
#      `adminAutoFillSchedule` (apps/backend/src/repositories/admin-repository.ts): same
#      date range (today..today+90, Turkey day), same "approved, family-safe, active,
#      daily-pool, length 5" eligibility, picked in random order with no repeats in the
#      fill. This is a SQL stand-in, not the real TS code path (PR #63's cooldown/no-cycle
#      logic is not exercised here — see "Not verified" in the PR body).
#   5. Prints per-length counts and asserts the Phase 2 acceptance checks below. Exits
#      non-zero on the first failed assertion.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/apps/backend"
SEED_DIR="$REPO_ROOT/data/words/seed"

WORD_POOLS_REF="${WORD_POOLS_REF:-origin/feat/word-pools}"
TARGET_LENGTH=5
TOPUP_DAYS=90
DB_NAME="harfhane" # matches the DB_NEXT binding's database_name in apps/backend/wrangler.toml

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
log "Turkey today: $TODAY_TURKEY, auto-filling $TARGET_LENGTH-letter days through today+$TOPUP_DAYS"

run_d1_command "
WITH RECURSIVE fill_dates(n, d) AS (
  SELECT 0, date('$TODAY_TURKEY')
  UNION ALL
  SELECT n + 1, date(d, '+1 day') FROM fill_dates WHERE n < $TOPUP_DAYS
),
unscheduled_dates AS (
  SELECT d FROM fill_dates
  WHERE d NOT IN (SELECT date FROM daily_words WHERE length = $TARGET_LENGTH)
),
eligible_words AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY RANDOM()) - 1 AS rn
  FROM words
  WHERE is_active = 1 AND status = 'approved' AND family_safe = 1
    AND pool = 'daily' AND length = $TARGET_LENGTH
    AND id NOT IN (SELECT word_id FROM daily_words WHERE length = $TARGET_LENGTH)
),
ranked_dates AS (
  SELECT d, ROW_NUMBER() OVER (ORDER BY d) - 1 AS rn FROM unscheduled_dates
)
INSERT OR IGNORE INTO daily_words (word_id, date, length)
SELECT eligible_words.id, ranked_dates.d, $TARGET_LENGTH
FROM ranked_dates JOIN eligible_words ON eligible_words.rn = ranked_dates.rn;
"

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

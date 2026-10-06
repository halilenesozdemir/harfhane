"""Generate deterministic SQL seed files for the clean `harfhane` database.

Writes:
- `data/words/seed/valid_words.sql`   — the guess-validation list (hunspell-tr, MPL-2.0).
- `data/words/seed/daily_words_5.sql` — the 346 owner-reviewed 5-letter answer words
  from `data/words/review/review-5.csv`, as approved, family-safe, active, daily-pool
  `words` rows.
- `data/words/seed/schedule_5.sql`    — 90 daily_words rows, one per date from
  `SCHEDULE_START_DATE`, each naming its word (joined by word text, since no row ids
  exist until `daily_words_5.sql` has been imported). Applied directly with
  `wrangler d1 execute --remote --file`, never by calling the live admin auto-fill
  endpoint — that endpoint runs against whatever database the deployed Worker is
  currently bound to, which before the cutover is still the legacy `harfhane-db`.
  `SCHEDULE_START_DATE` is the fixed start date of the schedule applied at the
  2026-10-06 cutover, so the committed file is deterministic and matches production.

All three files use `INSERT OR IGNORE`, so re-running an already-applied file is a no-op,
and chunk statements to stay well under D1's per-statement limit (100 KiB; see
`docs/guides/db-cutover-runbook.md` for the source). Run directly to (re)write the files:

    python3 scripts/words/export_seed_sql.py

Turkish case conversion goes through `turkish.py` only; `str.upper()`/`str.lower()` on
Turkish text mishandle `i`/`İ` and `ı`/`I` (see `AGENTS.md`).
"""

import argparse
import csv
import datetime
import os

from turkish import tr_upper

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
WORDS_DIR = os.path.join(REPO_ROOT, "data", "words")
SEED_DIR = os.path.join(WORDS_DIR, "seed")
REVIEW_DIR = os.path.join(WORDS_DIR, "review")

VALID_WORDS_SQL_PATH = os.path.join(SEED_DIR, "valid_words.sql")
DAILY_WORDS_5_SQL_PATH = os.path.join(SEED_DIR, "daily_words_5.sql")
SCHEDULE_5_SQL_PATH = os.path.join(SEED_DIR, "schedule_5.sql")
REVIEW_5_CSV_PATH = os.path.join(REVIEW_DIR, "review-5.csv")

VALID_LENGTHS = (4, 5, 6)
REVIEW_LENGTH = 5
SCHEDULE_TOPUP_DAYS = 90

# The start date of the schedule actually applied to remote `harfhane` on 2026-10-06
# (docs/guides/db-cutover-runbook.md, "Executed"). Fixed so the committed file matches
# what production holds. There is deliberately no `--start-date` flag: every run takes
# the same first 90 words, so another date would repeat them inside the 3-year cooldown.
# Later top-ups come from the cron auto-fill (PR #63), not from this script.
SCHEDULE_START_DATE = "2026-10-06"

# https://developers.cloudflare.com/d1/platform/limits/ — "Maximum SQL statement
# length": 100,000 bytes. Chunk well under that so one row's worth of slack never
# tips a statement over.
D1_MAX_STATEMENT_BYTES = 100_000
CHUNK_SIZE = 500

VALID_WORDS_SOURCE = "hunspell-tr"
VALID_WORDS_LICENSE = "MPL-2.0"  # data/words/README.md: tdd-ai/hunspell-tr, MPL-2.0.

# Owner-reviewed answer words: same source/license convention as the admin bulk-import
# default (apps/backend/src/repositories/admin-repository.ts DEFAULT_IMPORT_SOURCE /
# DEFAULT_IMPORT_LICENSE) — approval, not raw dictionary origin, is what these record.
DAILY_WORD_SOURCE = "admin"
DAILY_WORD_LICENSE = "owner-curated"
DAILY_WORD_POOL = "daily"


def sql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_quote_or_null(value) -> str:
    return "NULL" if value is None else sql_quote(value)


def valid_words_path(length: int) -> str:
    return os.path.join(WORDS_DIR, f"valid-{length}.txt")


def read_valid_words_rows(length: int, words: list) -> list:
    """Normalize a raw word list into (word, length) rows. `words` are already Turkish
    uppercase in the committed files, but normalization goes through `tr_upper` here too
    (never `str.upper()`), so the generator stays correct if an input ever isn't."""
    return [(tr_upper(word.strip()), length) for word in words if word.strip()]


def load_valid_words(length: int) -> list:
    with open(valid_words_path(length), encoding="utf-8") as handle:
        return read_valid_words_rows(length, handle.readlines())


def chunk_valid_words_statements(rows: list, chunk_size: int = CHUNK_SIZE) -> list:
    statements = []
    for start in range(0, len(rows), chunk_size):
        chunk = rows[start : start + chunk_size]
        values = ",\n".join(
            f"({sql_quote(word)}, {length}, {sql_quote(VALID_WORDS_SOURCE)}, {sql_quote(VALID_WORDS_LICENSE)})"
            for word, length in chunk
        )
        statements.append(f"INSERT OR IGNORE INTO valid_words (word, length, source, license) VALUES\n{values};")
    return statements


def read_daily_review_rows(csv_path: str, expected_length: int = REVIEW_LENGTH) -> list:
    """Read `review-N.csv` into (word, length, category) rows, dropping meaning/context
    per Plan 008 R5/R6 (no meaning or context anywhere). The CSV may be the word-only
    shape (header `word`, Plan 008 U4/PR #58) or the older `word,category,meaning,context`
    shape. A missing or empty `category` reads as None and is written as NULL: the
    baseline CHECK allows only NULL or isim/sıfat/fiil, and `INSERT OR IGNORE` would
    silently drop a row with `''`."""
    rows = []
    seen_words = set()
    with open(csv_path, encoding="utf-8") as handle:
        for raw in csv.DictReader(handle):
            word = tr_upper(raw["word"].strip())
            if len(word) != expected_length:
                raise ValueError(f"{word!r} has length {len(word)}, expected {expected_length}")
            if word in seen_words:
                raise ValueError(f"duplicate word in {csv_path}: {word!r}")
            seen_words.add(word)
            category = (raw.get("category") or "").strip() or None
            rows.append((word, expected_length, category))
    return rows


def chunk_daily_words_statements(rows: list, chunk_size: int = CHUNK_SIZE) -> list:
    statements = []
    for start in range(0, len(rows), chunk_size):
        chunk = rows[start : start + chunk_size]
        values = ",\n".join(
            "({}, {}, '', '', {}, {}, {}, 'approved', 1, 1, {})".format(
                sql_quote(word),
                length,
                sql_quote_or_null(category),
                sql_quote(DAILY_WORD_SOURCE),
                sql_quote(DAILY_WORD_LICENSE),
                sql_quote(DAILY_WORD_POOL),
            )
            for word, length, category in chunk
        )
        columns = "word, length, meaning, context, category, source, license, status, family_safe, is_active, pool"
        statements.append(f"INSERT OR IGNORE INTO words ({columns}) VALUES\n{values};")
    return statements


def build_daily_schedule(words: list, start_date: str, days: int = SCHEDULE_TOPUP_DAYS) -> list:
    """Assign the first `days` words (in their given, deterministic order) to `days`
    consecutive dates starting at `start_date`. Each word is used at most once, so the
    result never repeats a word — raises if fewer than `days` distinct words exist."""
    if len(words) < days:
        raise ValueError(f"need at least {days} words to schedule {days} days, got {len(words)}")
    cursor = datetime.date.fromisoformat(start_date)
    return [
        (words[i], (cursor + datetime.timedelta(days=i)).isoformat())
        for i in range(days)
    ]


def chunk_schedule_statements(pairs: list, length: int = REVIEW_LENGTH, chunk_size: int = CHUNK_SIZE) -> list:
    """Each statement joins a (word, date) VALUES table to `words` by word text — no row
    id is assumed to exist yet when this file is written, only once `daily_words_5.sql`
    has actually been imported. The pool/approval/length filter must live in WHERE, not
    ANDed onto the JOIN's ON clause: confirmed by hand that D1-local silently inserts 0
    rows for the equivalent INSERT...SELECT when those conditions sit in ON, even though
    the same conditions in a plain SELECT (or in WHERE here) return the matching rows."""
    statements = []
    for start in range(0, len(pairs), chunk_size):
        chunk = pairs[start : start + chunk_size]
        values = ",\n".join(f"({sql_quote(word)}, {sql_quote(date)})" for word, date in chunk)
        statements.append(
            "INSERT OR IGNORE INTO daily_words (word_id, date, length)\n"
            "SELECT w.id, v.column2, {length}\n"
            "FROM (VALUES\n{values}\n) AS v\n"
            "JOIN words w ON w.word = v.column1\n"
            "WHERE w.pool = 'daily' AND w.status = 'approved' AND w.family_safe = 1"
            " AND w.is_active = 1 AND w.length = {length};".format(length=length, values=values)
        )
    return statements


def render_seed_content(header: str, statements: list) -> str:
    return header + "\n\n" + "\n\n".join(statements) + "\n"


def write_seed_file(path: str, header: str, statements: list) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(render_seed_content(header, statements))


def _valid_words_header() -> str:
    return (
        "-- Generated by scripts/words/export_seed_sql.py. Do not hand-edit; regenerate instead.\n"
        f"-- Guess-validation list: source '{VALID_WORDS_SOURCE}', license '{VALID_WORDS_LICENSE}'\n"
        "-- (data/words/README.md). Safe to re-run: INSERT OR IGNORE."
    )


def _daily_words_header(row_count: int) -> str:
    return (
        "-- Generated by scripts/words/export_seed_sql.py. Do not hand-edit; regenerate instead.\n"
        f"-- {row_count} owner-reviewed 5-letter daily-pool answer words from\n"
        "-- data/words/review/review-5.csv (Plan 006 U6). status 'approved', family_safe 1,\n"
        "-- is_active 1, pool 'daily'; no meaning or context (Plan 008 R5/R6). Safe to\n"
        "-- re-run: INSERT OR IGNORE. Requires migration 0002_word_pools.sql (the `pool`\n"
        "-- column) to already be applied."
    )


def _schedule_header(start_date: str, days: int) -> str:
    return (
        "-- Generated by scripts/words/export_seed_sql.py (start date {start_date}).\n"
        "-- Do not hand-edit; regenerate instead.\n"
        f"-- {days} daily_words rows, one per date from {{start_date}}, for the 5-letter\n"
        "-- schedule (Plan 001 U3/U4, Plan 006 U6). Apply with `wrangler d1 execute\n"
        "-- harfhane --remote --file` directly — never by calling the live admin\n"
        "-- auto-fill endpoint, which runs against whatever database the deployed Worker\n"
        "-- is bound to (still harfhane-db before the binding-switch PR merges). Each\n"
        "-- statement joins by word text (no row id exists until daily_words_5.sql has\n"
        "-- been imported) and only matches an approved, family-safe, active, daily-pool\n"
        "-- 5-letter row, so it is safe to re-run: INSERT OR IGNORE."
    ).format(start_date=start_date)


def render_schedule_sql(start_date: str = SCHEDULE_START_DATE, days: int = SCHEDULE_TOPUP_DAYS) -> str:
    review_rows = read_daily_review_rows(REVIEW_5_CSV_PATH)
    words = [word for word, _length, _category in review_rows]
    pairs = build_daily_schedule(words, start_date, days)
    return render_seed_content(_schedule_header(start_date, days), chunk_schedule_statements(pairs))


def render_valid_words_sql() -> str:
    rows = []
    for length in VALID_LENGTHS:
        rows.extend(load_valid_words(length))
    return render_seed_content(_valid_words_header(), chunk_valid_words_statements(rows))


def render_daily_words_sql() -> str:
    rows = read_daily_review_rows(REVIEW_5_CSV_PATH)
    return render_seed_content(_daily_words_header(len(rows)), chunk_daily_words_statements(rows))


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    return parser.parse_args(argv)


def main() -> None:
    parse_args()

    rows = []
    for length in VALID_LENGTHS:
        rows.extend(load_valid_words(length))
    write_seed_file(VALID_WORDS_SQL_PATH, _valid_words_header(), chunk_valid_words_statements(rows))

    daily_rows = read_daily_review_rows(REVIEW_5_CSV_PATH)
    write_seed_file(
        DAILY_WORDS_5_SQL_PATH, _daily_words_header(len(daily_rows)), chunk_daily_words_statements(daily_rows)
    )

    words = [word for word, _length, _category in daily_rows]
    pairs = build_daily_schedule(words, SCHEDULE_START_DATE, SCHEDULE_TOPUP_DAYS)
    write_seed_file(
        SCHEDULE_5_SQL_PATH,
        _schedule_header(SCHEDULE_START_DATE, SCHEDULE_TOPUP_DAYS),
        chunk_schedule_statements(pairs),
    )

    print(f"wrote {VALID_WORDS_SQL_PATH}")
    print(f"wrote {DAILY_WORDS_5_SQL_PATH}")
    print(f"wrote {SCHEDULE_5_SQL_PATH} (start date {SCHEDULE_START_DATE})")


if __name__ == "__main__":
    main()

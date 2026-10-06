"""Generate deterministic SQL seed files for the clean `harfhane` database.

Writes:
- `data/words/seed/valid_words.sql`   — the guess-validation list (hunspell-tr, MPL-2.0).
- `data/words/seed/daily_words_5.sql` — the 346 owner-reviewed 5-letter answer words
  from `data/words/review/review-5.csv`, as approved, family-safe, active, daily-pool
  `words` rows.

Both files use `INSERT OR IGNORE`, so re-running an already-applied file is a no-op, and
chunk statements to stay well under D1's per-statement limit (100 KiB; see
`docs/guides/db-cutover-runbook.md` for the source). Run directly to (re)write the files:

    python3 scripts/words/export_seed_sql.py

Turkish case conversion goes through `turkish.py` only; `str.upper()`/`str.lower()` on
Turkish text mishandle `i`/`İ` and `ı`/`I` (see `AGENTS.md`).
"""

import csv
import os

from turkish import tr_upper

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
WORDS_DIR = os.path.join(REPO_ROOT, "data", "words")
SEED_DIR = os.path.join(WORDS_DIR, "seed")
REVIEW_DIR = os.path.join(WORDS_DIR, "review")

VALID_WORDS_SQL_PATH = os.path.join(SEED_DIR, "valid_words.sql")
DAILY_WORDS_5_SQL_PATH = os.path.join(SEED_DIR, "daily_words_5.sql")
REVIEW_5_CSV_PATH = os.path.join(REVIEW_DIR, "review-5.csv")

VALID_LENGTHS = (4, 5, 6)
REVIEW_LENGTH = 5

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
    """Read `review-N.csv` (`word,category,meaning,context`) into (word, length, category)
    rows, dropping meaning/context per Plan 008 R5/R6 (no meaning or context anywhere)."""
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
            rows.append((word, expected_length, raw["category"].strip()))
    return rows


def chunk_daily_words_statements(rows: list, chunk_size: int = CHUNK_SIZE) -> list:
    statements = []
    for start in range(0, len(rows), chunk_size):
        chunk = rows[start : start + chunk_size]
        values = ",\n".join(
            "({}, {}, '', '', {}, {}, {}, 'approved', 1, 1, {})".format(
                sql_quote(word),
                length,
                sql_quote(category),
                sql_quote(DAILY_WORD_SOURCE),
                sql_quote(DAILY_WORD_LICENSE),
                sql_quote(DAILY_WORD_POOL),
            )
            for word, length, category in chunk
        )
        columns = "word, length, meaning, context, category, source, license, status, family_safe, is_active, pool"
        statements.append(f"INSERT OR IGNORE INTO words ({columns}) VALUES\n{values};")
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


def render_valid_words_sql() -> str:
    rows = []
    for length in VALID_LENGTHS:
        rows.extend(load_valid_words(length))
    return render_seed_content(_valid_words_header(), chunk_valid_words_statements(rows))


def render_daily_words_sql() -> str:
    rows = read_daily_review_rows(REVIEW_5_CSV_PATH)
    return render_seed_content(_daily_words_header(len(rows)), chunk_daily_words_statements(rows))


def main() -> None:
    rows = []
    for length in VALID_LENGTHS:
        rows.extend(load_valid_words(length))
    write_seed_file(VALID_WORDS_SQL_PATH, _valid_words_header(), chunk_valid_words_statements(rows))

    daily_rows = read_daily_review_rows(REVIEW_5_CSV_PATH)
    write_seed_file(
        DAILY_WORDS_5_SQL_PATH, _daily_words_header(len(daily_rows)), chunk_daily_words_statements(daily_rows)
    )
    print(f"wrote {VALID_WORDS_SQL_PATH}")
    print(f"wrote {DAILY_WORDS_5_SQL_PATH}")


if __name__ == "__main__":
    main()

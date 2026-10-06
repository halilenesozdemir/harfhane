import csv
import json
import os

from wordfreq import zipf_frequency

from candidates import (
    is_blocked,
    is_likely_english,
    is_mastar,
    load_allowlist,
    load_blocklist,
)
from hunspell_source import fetch_dic_path, parse_dic_file
from inflection import is_inflected_form
from turkish import is_turkish_alphabet, tr_lower, tr_upper

# Lower than the daily pool's ZIPF_THRESHOLD (candidates.py, 3.0): the unlimited
# pool trades some frequency for size, since it skips owner review (KTD5).
UNLIMITED_ZIPF_FLOOR = 2.5

LENGTHS = (4, 5, 6)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
WORDS_DIR = os.path.join(REPO_ROOT, "data", "words")
REVIEW_DIR = os.path.join(WORDS_DIR, "review")
BLOCKLIST_PATH = os.path.join(SCRIPT_DIR, "blocklist.txt")
ALLOWLIST_PATH = os.path.join(SCRIPT_DIR, "turkish_allowlist.txt")


def unlimited_pool_path(length: int) -> str:
    return os.path.join(REVIEW_DIR, f"unlimited-pool-{length}.txt")


def daily_pool_path(length: int) -> str:
    return os.path.join(REVIEW_DIR, f"pool-{length}.txt")


def daily_review_path(length: int) -> str:
    return os.path.join(REVIEW_DIR, f"review-{length}.csv")


def load_raw_words() -> dict:
    return parse_dic_file(fetch_dic_path())


def filter_by_length_and_alphabet(raw_words: dict, length: int) -> dict:
    result = {}
    for word, flags in raw_words.items():
        lowered = tr_lower(word)
        if len(lowered) != length or not is_turkish_alphabet(lowered):
            continue
        result[lowered] = flags
    return result


def load_excluded_words(pool_path: str, review_path: str) -> set:
    excluded = set()
    if os.path.exists(pool_path):
        with open(pool_path, encoding="utf-8") as handle:
            excluded |= {line.strip() for line in handle if line.strip()}
    if os.path.exists(review_path):
        with open(review_path, encoding="utf-8") as handle:
            excluded |= {row["word"] for row in csv.DictReader(handle)}
    return excluded


def build_unlimited_pool(
    length: int,
    raw_words: dict,
    known_words: set,
    blocklist: set,
    excluded: set,
    allowlist: frozenset = frozenset(),
) -> list:
    length_words = filter_by_length_and_alphabet(raw_words, length)
    valid_words = {
        word for word in length_words if not is_inflected_form(word, known_words)
    }

    pool = []
    for word in sorted(valid_words):
        if is_mastar(word) or is_blocked(word, blocklist):
            continue
        if is_likely_english(word, allowlist):
            continue
        upper = tr_upper(word)
        if upper in excluded:
            continue
        if zipf_frequency(word, "tr") < UNLIMITED_ZIPF_FLOOR:
            continue
        pool.append(upper)
    return pool


def write_pool(path: str, words: list) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        for word in words:
            handle.write(word + "\n")


def main():
    raw_words = load_raw_words()
    known_words = {tr_lower(word) for word in raw_words}
    blocklist = load_blocklist(BLOCKLIST_PATH)
    allowlist = load_allowlist(ALLOWLIST_PATH)

    counts = {}
    for length in LENGTHS:
        excluded = load_excluded_words(daily_pool_path(length), daily_review_path(length))
        pool = build_unlimited_pool(
            length, raw_words, known_words, blocklist, excluded, allowlist
        )
        write_pool(unlimited_pool_path(length), pool)
        counts[str(length)] = len(pool)

    print(json.dumps(counts, ensure_ascii=False, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

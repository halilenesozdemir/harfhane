import csv
import json
import os

from turkish import tr_lower, tr_upper, is_turkish_alphabet
from hunspell_source import fetch_dic_path, parse_dic_file, PINNED_COMMIT
from inflection import is_inflected_form
from candidates import (
    is_mastar,
    passes_frequency,
    is_blocked,
    needs_review,
    review_reason,
    load_blocklist,
)

LENGTHS = (4, 5, 6, 7)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
OUTPUT_DIR = os.path.join(REPO_ROOT, "data", "words")
BLOCKLIST_PATH = os.path.join(SCRIPT_DIR, "blocklist.txt")


def load_raw_words():
    dic_path = fetch_dic_path()
    return parse_dic_file(dic_path)


def filter_by_length_and_alphabet(raw_words, length):
    result = {}
    for word, flags in raw_words.items():
        lowered = tr_lower(word)
        if len(lowered) != length:
            continue
        if not is_turkish_alphabet(lowered):
            continue
        result[lowered] = flags
    return result


def build_valid_set(length_words, known_words):
    valid = {}
    for word, flags in length_words.items():
        if is_inflected_form(word, known_words):
            continue
        valid[word] = flags
    return valid


def build_candidate_rows(valid_words, blocklist):
    rows = []
    for word in sorted(valid_words):
        flags = valid_words[word]
        if is_mastar(word):
            continue
        if is_blocked(word, blocklist):
            continue
        if not passes_frequency(word):
            continue
        rows.append(
            {
                "word": tr_upper(word),
                "length": len(word),
                "needs_review": int(needs_review(flags)),
                "reason": review_reason(flags),
            }
        )
    return rows


def write_valid_file(path, words):
    with open(path, "w", encoding="utf-8") as handle:
        for word in sorted(tr_upper(w) for w in words):
            handle.write(word + "\n")


def write_candidates_file(path, rows):
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["word", "length", "needs_review", "reason"])
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_summary(path, summary):
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(summary, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    raw_words = load_raw_words()
    known_words = set(tr_lower(w) for w in raw_words)
    blocklist = load_blocklist(BLOCKLIST_PATH)

    summary = {"source_commit": PINNED_COMMIT, "lengths": {}}

    for length in LENGTHS:
        length_words = filter_by_length_and_alphabet(raw_words, length)
        valid_words = build_valid_set(length_words, known_words)
        candidate_rows = build_candidate_rows(valid_words, blocklist)

        write_valid_file(os.path.join(OUTPUT_DIR, f"valid-{length}.txt"), valid_words.keys())
        write_candidates_file(
            os.path.join(OUTPUT_DIR, f"candidates-{length}.csv"), candidate_rows
        )

        blocked_count = sum(
            1
            for w in valid_words
            if is_blocked(w, blocklist) and not is_mastar(w) and passes_frequency(w)
        )
        summary["lengths"][str(length)] = {
            "valid_count": len(valid_words),
            "candidate_count": len(candidate_rows),
            "blocked_count": blocked_count,
        }

    write_summary(os.path.join(OUTPUT_DIR, "summary.json"), summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

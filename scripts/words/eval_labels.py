"""Score a model-written labels batch against the owner-reviewed golden set before any
model-labelled unlimited batch is imported (Plan 010 R4/R5, Invariant 1: model proposes,
code enforces).

The golden set (`data/words/review/labels-5.jsonl`, 600 owner-reviewed 5-letter
decisions) is split deterministically in file order: even lines calibrate prompts, odd
lines are the held-out eval set (Plan 010 KTD1). A "candidate" is a model's attempt at
labelling those same held-out words; this script never calls a model itself (KTD2), so
it runs in CI without API keys.

The report never includes the golden word text for a missed reject, only the golden
entry's line-order id ("G<n>") — a miss may be a slur or other sensitive word, and that
must never land in a report, a CI log or a PR body.

    python3 scripts/words/eval_labels.py --golden PATH --candidate PATH

Exits 1 when the report does not pass the thresholds below.
"""

import argparse
import json
import sys

# Plan 010 R5. Only these two gate the import; proper_noun/foreign recall is reported
# (R4) but does not block, since golden coverage there is currently small.
LABEL_ACCEPT_PRECISION_MIN = 0.95
LABEL_SENSITIVE_RECALL_MIN = 0.98

# Reject reasons that protect families; recall is reported for all three (R4).
FAMILY_REASONS = ("sensitive", "proper_noun", "foreign")


def load_candidate(path: str) -> list:
    """A candidate batch is the model's real output: no ids are added, since these
    words are the ones about to be imported, not golden-set entries that must stay
    out of reports."""
    with open(path, encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def load_golden(path: str) -> list:
    """Each golden entry gets a stable id from its position in the committed file, so
    a report can name which entry was missed without ever printing the word itself."""
    golden = []
    with open(path, encoding="utf-8") as handle:
        lines = [line.strip() for line in handle if line.strip()]
    for index, line in enumerate(lines):
        entry = json.loads(line)
        entry["id"] = f"G{index}"
        golden.append(entry)
    return golden


def split_golden(golden: list) -> tuple:
    """Deterministic split by file order (Plan 010 KTD1): even-indexed entries
    calibrate prompts, odd-indexed entries are the held-out eval set. File order is
    fixed once the golden set is committed, so this is stable across runs."""
    return golden[0::2], golden[1::2]


def _index_by_word(labels: list) -> dict:
    return {label["word"]: label for label in labels}


def _was_accepted(candidate_by_word: dict, word: str) -> bool:
    candidate = candidate_by_word.get(word)
    return candidate is not None and candidate.get("decision") == "accept"


def score_accept(held_out: list, candidate_by_word: dict) -> dict:
    true_positive = false_positive = false_negative = 0
    for entry in held_out:
        predicted_accept = _was_accepted(candidate_by_word, entry["word"])
        gold_accept = entry.get("decision") == "accept"
        if predicted_accept and gold_accept:
            true_positive += 1
        elif predicted_accept and not gold_accept:
            false_positive += 1
        elif gold_accept and not predicted_accept:
            false_negative += 1
    # An empty denominator means nothing in the held-out set could prove this metric
    # wrong, so it reads as a vacuous pass rather than a 0/0 error.
    predicted_total = true_positive + false_positive
    actual_total = true_positive + false_negative
    precision = true_positive / predicted_total if predicted_total else 1.0
    recall = true_positive / actual_total if actual_total else 1.0
    return {"precision": precision, "recall": recall}


def score_reason_recall(held_out: list, candidate_by_word: dict, reason: str) -> dict:
    total = 0
    caught = 0
    misses = []
    for entry in held_out:
        if entry.get("decision") != "reject" or entry.get("reason") != reason:
            continue
        total += 1
        # Family protection only cares that the word was not approved, not that the
        # candidate guessed the same reject reason the golden set used.
        if _was_accepted(candidate_by_word, entry["word"]):
            misses.append(entry["id"])
        else:
            caught += 1
    recall = caught / total if total else 1.0
    return {"recall": recall, "total": total, "misses": misses}


def _with_ids(golden: list) -> list:
    """Assign the same "G<line-index>" id `load_golden` assigns, so `evaluate` works
    the same whether its caller went through `load_golden` or built entries directly
    (as the tests do) — the id always reflects position in the given list."""
    return [{**entry, "id": entry.get("id", f"G{index}")} for index, entry in enumerate(golden)]


def evaluate(golden: list, candidate: list) -> dict:
    golden = _with_ids(golden)
    _, held_out = split_golden(golden)
    candidate_by_word = _index_by_word(candidate)
    accept = score_accept(held_out, candidate_by_word)
    reject_reason_recall = {
        reason: score_reason_recall(held_out, candidate_by_word, reason) for reason in FAMILY_REASONS
    }
    passes = (
        accept["precision"] >= LABEL_ACCEPT_PRECISION_MIN
        and reject_reason_recall["sensitive"]["recall"] >= LABEL_SENSITIVE_RECALL_MIN
    )
    return {
        "held_out_count": len(held_out),
        "accept": accept,
        "reject_reason_recall": reject_reason_recall,
        "thresholds": {
            "accept_precision_min": LABEL_ACCEPT_PRECISION_MIN,
            "sensitive_recall_min": LABEL_SENSITIVE_RECALL_MIN,
        },
        "passes": passes,
    }


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--golden", required=True, help="Path to the owner-reviewed golden labels jsonl.")
    parser.add_argument("--candidate", required=True, help="Path to the model's labels jsonl to score.")
    return parser.parse_args()


def main():
    args = parse_args()
    golden = load_golden(args.golden)
    candidate = load_candidate(args.candidate)
    report = evaluate(golden, candidate)
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    if not report["passes"]:
        sys.exit(1)


if __name__ == "__main__":
    main()

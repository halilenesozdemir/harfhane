"""Score a model-written labels batch against the owner-reviewed golden set before any
model-labelled unlimited batch is imported (Plan 010 R4/R5, Invariant 1: model proposes,
code enforces).

The golden set (`data/words/review/labels-5.jsonl`) is split by a hash of each entry's
normalized word (KTD1): half calibrate prompts, the other half is held out and scored
against a "candidate" model attempt at labelling those same words. Hashing the word (not
file position) keeps the split stable as the golden file changes elsewhere. Never calls a
model itself (KTD2), so it runs in CI without API keys.

Fail-closed, not fail-open (see `passes_thresholds`): refuses to pass on anything that
would prove nothing -- a held-out word missing/duplicated in the candidate, an empty
held-out set, no `sensitive` rejects to measure recall against, or zero predicted
"accept" decisions. A miss is reported by the golden entry's id ("G<n>"), never the word.

    python3 scripts/words/eval_labels.py --golden PATH --candidate PATH
"""

import argparse
import hashlib
import json
import sys
import unicodedata
from collections import Counter

from turkish import tr_upper

# Plan 010 R5. Only these two gate the import; proper_noun/foreign recall is reported
# (R4) but does not block, since golden coverage there is currently small.
LABEL_ACCEPT_PRECISION_MIN = 0.95
LABEL_SENSITIVE_RECALL_MIN = 0.98

# Reject reasons that protect families; recall is reported for all three (R4).
FAMILY_REASONS = ("sensitive", "proper_noun", "foreign")


def normalize_word(word: str) -> str:
    """Case/whitespace/NFC-normalized match key: `tr_upper` fixes İ/I, ı/I unlike
    `str.upper()` (AGENTS.md), so case alone never causes a false "missing"."""
    return tr_upper(unicodedata.normalize("NFC", word.strip()))


def _check_row_shape(entry, index: int) -> None:
    # A row that isn't a JSON object, or whose "word" isn't a string, used to crash
    # with an unhandled TypeError/AttributeError deep in normalize_word() and leave a
    # stale review CSV behind (validate_labels.py). Fail closed here instead, with a
    # ValueError the caller's except clause already handles.
    if not isinstance(entry, dict):
        raise ValueError(f"label row {index} is not a JSON object: {entry!r}")
    word = entry.get("word")
    if not isinstance(word, str):
        raise ValueError(f"label row {index} has a non-string 'word': {word!r}")


def load_candidate(path: str) -> list:
    # No ids: these words are about to be imported, not golden-set entries.
    with open(path, encoding="utf-8") as handle:
        labels = [json.loads(line) for line in handle if line.strip()]
    for index, label in enumerate(labels):
        _check_row_shape(label, index)
    return [{**label, "word": normalize_word(label["word"])} for label in labels]


def _prepare_golden(golden: list) -> list:
    # Normalize each word and assign a stable id from its position; a duplicate
    # normalized word is a data error in the owner-curated golden set, not
    # something to score around silently (Plan 010 N1).
    prepared = []
    seen = set()
    for index, entry in enumerate(golden):
        _check_row_shape(entry, index)
        word = normalize_word(entry["word"])
        if word in seen:
            raise ValueError(f"duplicate golden word at entry {index} (normalized: {word!r})")
        seen.add(word)
        prepared.append({**entry, "word": word, "id": entry.get("id", f"G{index}")})
    return prepared


def load_golden(path: str) -> list:
    with open(path, encoding="utf-8") as handle:
        raw = [json.loads(line) for line in handle if line.strip()]
    return _prepare_golden(raw)


def _bucket(word: str) -> int:
    digest = hashlib.sha256(word.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) % 2


def split_golden(golden: list) -> tuple:
    # Depends only on the word, not its file position (Plan 010 KTD1): one bucket
    # calibrates prompts, the other is the held-out eval set, and a given word
    # always lands in the same half regardless of file order.
    calibration = [entry for entry in golden if _bucket(entry["word"]) == 0]
    held_out = [entry for entry in golden if _bucket(entry["word"]) == 1]
    return calibration, held_out


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
    predicted_total = true_positive + false_positive
    actual_total = true_positive + false_negative
    # Fail-closed: a run that never predicts "accept" proves nothing about accept
    # quality (an all-reject candidate must not read as perfect precision).
    precision = true_positive / predicted_total if predicted_total else 0.0
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


def passes_thresholds(
    *,
    accept_precision: float,
    sensitive_recall: float,
    sensitive_total: int,
    held_out_count: int,
    missing: list,
    duplicate: list,
) -> bool:
    # The single place that decides pass/fail, kept pure and keyword-only so the
    # `>=` boundary and the threshold constants can be pinned with plain numbers in
    # tests. Fails closed: any integrity gap, or nothing to measure, is a fail.
    if missing or duplicate:
        return False
    if held_out_count == 0 or sensitive_total == 0:
        return False
    return accept_precision >= LABEL_ACCEPT_PRECISION_MIN and sensitive_recall >= LABEL_SENSITIVE_RECALL_MIN


def evaluate(golden: list, candidate: list) -> dict:
    golden = _prepare_golden(golden)
    _, held_out = split_golden(golden)
    candidate = [{**label, "word": normalize_word(label["word"])} for label in candidate]
    candidate_counts = Counter(label["word"] for label in candidate)
    candidate_by_word = {label["word"]: label for label in candidate}

    held_out_words = {entry["word"] for entry in held_out}
    missing = [entry["id"] for entry in held_out if candidate_counts[entry["word"]] == 0]
    duplicate = [entry["id"] for entry in held_out if candidate_counts[entry["word"]] > 1]
    extra_candidate_words = sum(1 for word in candidate_counts if word not in held_out_words)

    accept = score_accept(held_out, candidate_by_word)
    reject_reason_recall = {
        reason: score_reason_recall(held_out, candidate_by_word, reason) for reason in FAMILY_REASONS
    }

    passes = passes_thresholds(
        accept_precision=accept["precision"],
        sensitive_recall=reject_reason_recall["sensitive"]["recall"],
        sensitive_total=reject_reason_recall["sensitive"]["total"],
        held_out_count=len(held_out),
        missing=missing,
        duplicate=duplicate,
    )

    return {
        "held_out_count": len(held_out),
        "accept": accept,
        "reject_reason_recall": reject_reason_recall,
        "integrity": {
            "missing": missing,
            "duplicate": duplicate,
            "extra_candidate_words": extra_candidate_words,
        },
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

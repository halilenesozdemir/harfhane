"""Score a model-written labels batch against the owner-reviewed golden set before any
model-labelled unlimited batch is imported (Plan 010 R4/R5, Invariant 1: model proposes,
code enforces).

The golden set (`data/words/review/labels-5.jsonl`, 600 owner-reviewed 5-letter
decisions) is split deterministically by a hash of each entry's normalized word (Plan
010 KTD1): half calibrate prompts, the other half is the held-out eval set. Hashing the
word (not the entry's position in the file) means the split never shifts just because
the golden file gained, lost or reordered unrelated entries. A "candidate" is a model's
attempt at labelling those same held-out words; this script never calls a model itself
(KTD2), so it runs in CI without API keys.

The gate is fail-closed, not fail-open: it refuses to pass (not vacuously pass) whenever
it cannot actually prove the batch is trustworthy — a held-out word missing from the
candidate, a held-out word labelled more than once, an empty held-out set, a held-out
set with no `sensitive` rejects to measure recall against, or zero predicted "accept"
decisions (which proves nothing about accept precision). See `passes_thresholds`.

The report never includes the golden word text for a missed reject, only the golden
entry's line-order id ("G<n>") — a miss may be a slur or other sensitive word, and that
must never land in a report, a CI log or a PR body.

    python3 scripts/words/eval_labels.py --golden PATH --candidate PATH

Exits 1 when the report does not pass the thresholds below.
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
    """The form used to match a golden entry to a candidate label. Case alone must
    never cause a false "missing" (and therefore a false pass): `tr_upper` fixes
    İ/I, ı/I unlike `str.upper()` (AGENTS.md). NFC folds composed/decomposed Turkish
    diacritics to the same code points."""
    return tr_upper(unicodedata.normalize("NFC", word.strip()))


def load_candidate(path: str) -> list:
    """A candidate batch is the model's real output: no ids are added, since these
    words are the ones about to be imported, not golden-set entries that must stay
    out of reports."""
    with open(path, encoding="utf-8") as handle:
        labels = [json.loads(line) for line in handle if line.strip()]
    return [{**label, "word": normalize_word(label["word"])} for label in labels]


def _prepare_golden(golden: list) -> list:
    """Normalize each entry's word and assign it a stable id from its position in the
    given list, rejecting a duplicate normalized word outright (Plan 010 N1): the
    golden set is owner-curated, committed data, so two entries for the same word is a
    data error, not something to score around silently."""
    prepared = []
    seen = set()
    for index, entry in enumerate(golden):
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
    """Deterministic split by a hash of each entry's normalized word (Plan 010 KTD1):
    one bucket calibrates prompts, the other is the held-out eval set. Depending only
    on the word (not its position) means the split is the same regardless of file
    order, and a given word always lands in the same half."""
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
    """The single place that decides pass/fail, kept pure and keyword-only so a
    boundary (`>=` vs `>`, the threshold constants) can be pinned with plain numbers
    in tests, independent of the golden-set split. Fails closed: any integrity
    problem, or nothing to measure a gating metric against, is a fail — never a
    vacuous pass."""
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

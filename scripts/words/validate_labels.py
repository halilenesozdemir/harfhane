import argparse
import csv
import json
import os
import sys
from collections import Counter

import eval_labels

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REVIEW_DIR = os.path.join(os.path.dirname(os.path.dirname(SCRIPT_DIR)), "data", "words", "review")

DECISIONS = {"accept", "reject", "unsure"}
REJECT_REASONS = {
    "inflected", "verb_form", "proper_noun", "foreign", "abbreviation",
    "function_word", "sensitive", "obscure", "other",
}
DECISION_BUCKETS = {"accept": "accepted", "reject": "rejected", "unsure": "unsure"}

# Pool-specific file names: daily labels an owner-reviewed CSV import, unlimited
# labels a larger, meaning-free pool (see docs/plans 2026-10-06-008 KTD5).
POOL_FILES = {"daily": "pool-{length}.txt", "unlimited": "unlimited-pool-{length}.txt"}
LABEL_FILES = {"daily": "labels-{length}.jsonl", "unlimited": "labels-unlimited-{length}.jsonl"}
REVIEW_FILES = {"daily": "review-{length}.csv", "unlimited": "unlimited-{length}.csv"}


def unsure_errors(label: dict) -> list:
    reason = label.get("reason")
    if isinstance(reason, str) and reason.strip():
        return []
    return ["reason"]


def label_errors(label: dict, pool: set) -> list:
    if label.get("word") not in pool:
        return ["word_not_in_pool"]
    decision = label.get("decision")
    if decision not in DECISIONS:
        return ["decision"]
    if decision == "accept":
        return []
    if decision == "unsure":
        return unsure_errors(label)
    if label.get("reason") not in REJECT_REASONS:
        return ["reason"]
    return []


def validate(labels: list, pool_words: list) -> dict:
    pool = set(pool_words)
    counts = Counter(str(label.get("word")) for label in labels)
    report = {"accepted": [], "rejected": [], "unsure": [], "errors": {}}
    for label in labels:
        word = str(label.get("word"))
        if counts[word] > 1:
            report["errors"][word] = ["duplicate"]
            continue
        errors = label_errors(label, pool)
        if errors:
            report["errors"][str(word)] = errors
            continue
        report[DECISION_BUCKETS[label["decision"]]].append(label)
    report["missing"] = [word for word in pool_words if word not in counts]
    return report


def load_lines(path: str) -> list:
    with open(path, encoding="utf-8") as handle:
        return [line.strip() for line in handle if line.strip()]


def load_labels(path: str) -> list:
    return [json.loads(line) for line in load_lines(path)]


def write_review_csv(path: str, accepted: list) -> None:
    with open(path, "w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["word"])
        for label in sorted(accepted, key=lambda entry: entry["word"]):
            writer.writerow([label["word"]])


def has_blocking_errors(report: dict) -> bool:
    # A label set is only "clean" when every pool word got a valid label. A non-empty
    # `missing` list means the label file was truncated (or the model skipped words), and
    # importing a partial review CSV from that would silently drop pool words.
    return bool(report["errors"]) or bool(report["missing"])


def summarize(report: dict) -> dict:
    reasons = {}
    for label in report["rejected"]:
        reasons[label["reason"]] = reasons.get(label["reason"], 0) + 1
    return {
        "accepted": len(report["accepted"]),
        "rejected": len(report["rejected"]),
        "rejected_by_reason": dict(sorted(reasons.items())),
        "unsure": [label["word"] for label in report["unsure"]],
        "missing": report["missing"],
        "errors": report["errors"],
    }


def parse_args():
    parser = argparse.ArgumentParser(description="Validate model-written answer labels.")
    parser.add_argument("--length", type=int, required=True)
    parser.add_argument("--pool", choices=["daily", "unlimited"], default="daily")
    # Plan 010 R5: the unlimited pool has no owner review, so a model-labelled batch
    # must first be measured against the golden set. --eval-candidate is the model's
    # labels for the golden set's held-out half (scripts/words/eval_labels.py); the
    # daily pool ignores both flags, since owner review is its quality gate.
    parser.add_argument("--golden", default=None)
    parser.add_argument("--eval-candidate", default=None)
    return parser.parse_args()


def unlimited_label_eval_passes(length: int, golden_path: str, eval_candidate_path: str) -> tuple:
    """Plan 010 R5 (AE4): importing a model-labelled unlimited batch is blocked
    unless its labelling run also scored above threshold on the golden set. No
    `--eval-candidate` means no measured run yet, so this fails closed rather than
    trusting an unmeasured batch."""
    if not eval_candidate_path:
        return False, None
    golden_path = golden_path or os.path.join(REVIEW_DIR, LABEL_FILES["daily"].format(length=length))
    if not os.path.exists(golden_path) or not os.path.exists(eval_candidate_path):
        return False, None
    golden = eval_labels.load_golden(golden_path)
    candidate = eval_labels.load_candidate(eval_candidate_path)
    report = eval_labels.evaluate(golden, candidate)
    return report["passes"], report


def _remove_stale_review_csv(review_path: str) -> None:
    # A failed run must never leave a review CSV behind: it would be either a
    # partial write from this run or, worse, a stale file from an earlier
    # successful run for a now-rejected batch (Plan 010 N6).
    if os.path.exists(review_path):
        os.remove(review_path)


def main():
    args = parse_args()
    pool_path = os.path.join(REVIEW_DIR, POOL_FILES[args.pool].format(length=args.length))
    labels_path = os.path.join(REVIEW_DIR, LABEL_FILES[args.pool].format(length=args.length))
    review_path = os.path.join(REVIEW_DIR, REVIEW_FILES[args.pool].format(length=args.length))
    pool_words = load_lines(pool_path)
    labels = load_labels(labels_path)
    report = validate(labels, pool_words)
    print(json.dumps(summarize(report), ensure_ascii=False, indent=2))
    # A review CSV is only written from a clean, complete label set, so import never sees
    # partial data.
    if has_blocking_errors(report):
        _remove_stale_review_csv(review_path)
        sys.exit(1)
    if args.pool == "unlimited":
        passed, eval_report = unlimited_label_eval_passes(args.length, args.golden, args.eval_candidate)
        print(json.dumps({"label_eval": eval_report}, ensure_ascii=False, indent=2))
        if not passed:
            _remove_stale_review_csv(review_path)
            sys.exit(1)
    write_review_csv(review_path, report["accepted"])


if __name__ == "__main__":
    main()

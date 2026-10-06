import argparse
import csv
import json
import os
import re
import sys
from collections import Counter

from turkish import tr_lower

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REVIEW_DIR = os.path.join(os.path.dirname(os.path.dirname(SCRIPT_DIR)), "data", "words", "review")

DECISIONS = {"accept", "reject", "unsure"}
REJECT_REASONS = {
    "inflected", "verb_form", "proper_noun", "foreign", "abbreviation",
    "function_word", "sensitive", "obscure", "other",
}
CATEGORIES = {"isim", "sıfat"}
MEANING_LENGTH = (8, 140)
CONTEXT_LENGTH = (10, 160)
SHORT_WORD_LENGTH = 4
CONTEXT_STEM_LENGTH = 3
SENTENCE_ENDINGS = (".", "!", "?")
ALLOWED_TEXT = re.compile(r"^[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû0-9 .,;:!?'\"()\-–]+$")
TOKEN_SPLIT = re.compile(r"[^a-zçğıöşüâîû]+")
DECISION_BUCKETS = {"accept": "accepted", "reject": "rejected", "unsure": "unsure"}


def answer_stem(word: str) -> str:
    lowered = tr_lower(word)
    if len(lowered) <= SHORT_WORD_LENGTH:
        return lowered
    return lowered[:-1]


def mentions_answer(text: str, word: str) -> bool:
    stem = answer_stem(word)
    tokens = TOKEN_SPLIT.split(tr_lower(text))
    return any(token.startswith(stem) for token in tokens)


# Context sentences inflect the answer, which can drop a vowel or soften the final
# consonant (VAKİT -> vakti, KAYIT -> kaydı), so only the first letters must match.
def context_mentions_answer(text: str, word: str) -> bool:
    lowered = tr_lower(word)
    stem = lowered if len(lowered) <= SHORT_WORD_LENGTH else lowered[:CONTEXT_STEM_LENGTH]
    tokens = TOKEN_SPLIT.split(tr_lower(text))
    return any(token.startswith(stem) for token in tokens)


def text_errors(field: str, text, bounds: tuple) -> list:
    if not isinstance(text, str):
        return [f"{field}_missing"]
    errors = []
    if not bounds[0] <= len(text) <= bounds[1]:
        errors.append(f"{field}_length")
    if not ALLOWED_TEXT.match(text):
        errors.append(f"{field}_characters")
    return errors


def accepted_errors(label: dict) -> list:
    errors = []
    if label.get("category") not in CATEGORIES:
        errors.append("category")
    errors += text_errors("meaning", label.get("meaning"), MEANING_LENGTH)
    errors += text_errors("context", label.get("context"), CONTEXT_LENGTH)
    if isinstance(label.get("meaning"), str) and mentions_answer(label["meaning"], label["word"]):
        errors.append("meaning_mentions_answer")
    if isinstance(label.get("context"), str) and not label["context"].endswith(SENTENCE_ENDINGS):
        errors.append("context_not_sentence")
    if isinstance(label.get("context"), str) and not context_mentions_answer(label["context"], label["word"]):
        errors.append("context_missing_answer")
    return errors


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
        return accepted_errors(label)
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
        writer = csv.DictWriter(handle, fieldnames=["word", "category", "meaning", "context"])
        writer.writeheader()
        for label in sorted(accepted, key=lambda entry: entry["word"]):
            writer.writerow({key: label[key] for key in writer.fieldnames})


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
    return parser.parse_args()


def main():
    args = parse_args()
    pool_words = load_lines(os.path.join(REVIEW_DIR, f"pool-{args.length}.txt"))
    labels = load_labels(os.path.join(REVIEW_DIR, f"labels-{args.length}.jsonl"))
    report = validate(labels, pool_words)
    print(json.dumps(summarize(report), ensure_ascii=False, indent=2))
    # A review CSV is only written from a clean label set, so import never sees partial data.
    if report["errors"]:
        sys.exit(1)
    write_review_csv(os.path.join(REVIEW_DIR, f"review-{args.length}.csv"), report["accepted"])


if __name__ == "__main__":
    main()

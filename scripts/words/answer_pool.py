import argparse
import csv
import os

from wordfreq import zipf_frequency

from turkish import tr_lower

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))
WORDS_DIR = os.path.join(REPO_ROOT, "data", "words")
REVIEW_DIR = os.path.join(WORDS_DIR, "review")
DEFAULT_POOL_SIZE = 600


def candidates_path(length: int) -> str:
    return os.path.join(WORDS_DIR, f"candidates-{length}.csv")


def pool_path(length: int) -> str:
    return os.path.join(REVIEW_DIR, f"pool-{length}.txt")


def load_candidate_words(length: int) -> list:
    with open(candidates_path(length), encoding="utf-8") as handle:
        return [row["word"] for row in csv.DictReader(handle)]


def rank_by_frequency(words: list) -> list:
    return sorted(words, key=lambda word: (-zipf_frequency(tr_lower(word), "tr"), word))


def write_pool(length: int, words: list) -> None:
    os.makedirs(REVIEW_DIR, exist_ok=True)
    with open(pool_path(length), "w", encoding="utf-8") as handle:
        for word in words:
            handle.write(word + "\n")


def parse_args():
    parser = argparse.ArgumentParser(description="Select the most frequent answer candidates.")
    parser.add_argument("--length", type=int, required=True)
    parser.add_argument("--size", type=int, default=DEFAULT_POOL_SIZE)
    return parser.parse_args()


def main():
    args = parse_args()
    ranked = rank_by_frequency(load_candidate_words(args.length))
    write_pool(args.length, ranked[: args.size])
    print(f"pool-{args.length}.txt: {min(args.size, len(ranked))} words")


if __name__ == "__main__":
    main()

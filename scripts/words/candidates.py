from wordfreq import zipf_frequency

ZIPF_THRESHOLD = 3.0
FLAG_COUNT_REVIEW_THRESHOLD = 3
MASTAR_SUFFIXES = ("mak", "mek")


def is_mastar(word_lower: str) -> bool:
    return word_lower.endswith(MASTAR_SUFFIXES)


def passes_frequency(word_lower: str) -> bool:
    return zipf_frequency(word_lower, "tr") >= ZIPF_THRESHOLD


def is_blocked(word_lower: str, blocklist: set) -> bool:
    for root in blocklist:
        if word_lower.startswith(root):
            return True
    return False


def needs_review(flags: tuple) -> bool:
    return len(flags) <= FLAG_COUNT_REVIEW_THRESHOLD


def review_reason(flags: tuple) -> str:
    if needs_review(flags):
        return "low_inflection_support"
    return ""


def load_blocklist(path: str) -> set:
    roots = set()
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip().lower()
            if line and not line.startswith("#"):
                roots.add(line)
    return roots

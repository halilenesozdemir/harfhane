from wordfreq import zipf_frequency

from turkish import tr_lower

ZIPF_THRESHOLD = 3.0
FLAG_COUNT_REVIEW_THRESHOLD = 3
MASTAR_SUFFIXES = ("mak", "mek")
# How much more common a word must be in English than in Turkish (wordfreq zipf
# scale) before it's treated as an un-adapted English loanword rather than a word
# Turkish actually uses. Assimilated loanwords (e.g. "banka") score far higher in
# Turkish than this margin allows, so they are kept.
ENGLISH_ZIPF_MARGIN = 1.5


def is_mastar(word_lower: str) -> bool:
    return word_lower.endswith(MASTAR_SUFFIXES)


def is_likely_english(word_lower: str, allowlist: frozenset = frozenset()) -> bool:
    # Exact-match override: a word confirmed to be real, commonly used Turkish
    # (turkish_allowlist.txt) always survives, regardless of the English/Turkish
    # zipf margin below.
    if word_lower in allowlist:
        return False
    en_freq = zipf_frequency(word_lower, "en")
    tr_freq = zipf_frequency(word_lower, "tr")
    return en_freq - tr_freq >= ENGLISH_ZIPF_MARGIN


def passes_frequency(word_lower: str) -> bool:
    return zipf_frequency(word_lower, "tr") >= ZIPF_THRESHOLD


EXACT_MATCH_PREFIX = "="


def is_blocked(word_lower: str, blocklist: set) -> bool:
    for root in blocklist:
        # An entry prefixed with "=" blocks only that exact word, not every word
        # starting with it (e.g. "=kaşar" blocks the slang word "kaşar" itself but
        # not the unrelated food word "kaşarlı").
        if root.startswith(EXACT_MATCH_PREFIX):
            if word_lower == root[len(EXACT_MATCH_PREFIX):]:
                return True
            continue
        if word_lower.startswith(root):
            return True
    return False


def needs_review(flags: tuple) -> bool:
    return len(flags) <= FLAG_COUNT_REVIEW_THRESHOLD


def review_reason(flags: tuple) -> str:
    if needs_review(flags):
        return "low_inflection_support"
    return ""


def _load_word_list(path: str) -> set:
    words = set()
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            word = tr_lower(line.strip())
            if word and not word.startswith("#"):
                words.add(word)
    return words


def load_blocklist(path: str) -> set:
    return _load_word_list(path)


def load_allowlist(path: str) -> set:
    return _load_word_list(path)

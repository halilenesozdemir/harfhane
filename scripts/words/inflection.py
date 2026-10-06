INFLECTIONAL_SUFFIXES = sorted(
    {
        "ından", "inden", "undan", "ünden",
        "ında", "inde", "unda", "ünde",
        "ının", "inin", "unun", "ünün",
        "ını", "ini", "unu", "ünü",
        "ına", "ine", "una", "üne",
        "ları", "leri",
        "larda", "lerde",
        "lardan", "lerden",
        "larının", "lerinin",
        "larına", "lerine",
        "ların", "lerin",
        "lara", "lere",
        "dan", "den", "tan", "ten",
        "da", "de", "ta", "te",
        "ın", "in", "un", "ün",
        "yın", "yin", "yun", "yün",
        "sı", "si", "su", "sü",
        "lar", "ler",
        "yı", "yi", "yu", "yü",
    },
    key=len,
    reverse=True,
)

MIN_ROOT_LENGTH = 2
MIN_ROOT_ZIPF = 1.0


def _default_zipf(word: str) -> float:
    from wordfreq import zipf_frequency

    return zipf_frequency(word, "tr")


def find_inflection_root(word_lower: str, known_words: set, zipf_lookup=_default_zipf):
    for suffix in INFLECTIONAL_SUFFIXES:
        if not word_lower.endswith(suffix):
            continue
        root = word_lower[: -len(suffix)]
        if len(root) < MIN_ROOT_LENGTH:
            continue
        if root not in known_words:
            continue
        if zipf_lookup(root) < MIN_ROOT_ZIPF:
            continue
        return root
    return None


def is_inflected_form(word_lower: str, known_words: set, zipf_lookup=_default_zipf) -> bool:
    return find_inflection_root(word_lower, known_words, zipf_lookup) is not None

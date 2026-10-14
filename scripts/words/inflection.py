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
        root_zipf = zipf_lookup(root)
        if root_zipf < MIN_ROOT_ZIPF:
            continue
        # The longest suffix with a known, frequent-enough root is the most
        # specific morphological split (suffixes are tried longest first);
        # decide here instead of trying shorter splits that could also
        # coincidentally match a known word (e.g. "boyun" also ends in "un"
        # with root "boy", after "yun" with root "bo" already settled it).
        #
        # A genuine inflected form is rarer than the root it is built from
        # (e.g. "evler" vs "ev"). When the candidate word is itself at least
        # as frequent as this root, the split is spurious and the word is a
        # headword in its own right (KOYUN, BOYUN), not a derived form.
        if root_zipf < zipf_lookup(word_lower):
            return None
        return root
    return None


def is_inflected_form(word_lower: str, known_words: set, zipf_lookup=_default_zipf) -> bool:
    return find_inflection_root(word_lower, known_words, zipf_lookup) is not None

NOMINAL_SUFFIXES = {
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
}

# Bare single-letter case/possessive suffixes ("-m"/"-n"/"-a"/"-e"/"-ı"/"-i"/"-u"/"-ü")
# were tried and dropped: on a short root they collide constantly with unrelated
# standalone words (e.g. "kalem" = "pen", not "kale" (castle) + "-m" (possessive)),
# even with the known-word + frequency guard. Consonant softening below only fires
# for the existing multi-letter vowel-initial suffixes ("-ına", "-ini", "-ından", ...),
# which are specific enough not to have that problem.

# Common verb conjugation endings: narrative past (-miş), future tense/participle
# (-ecek/-acak), and the "-dık"/"-dik" noun-forming participle.
#
# Deliberately NOT included: bare 2-letter forms ("-dı"/"-di"/..., "-sa"/"-se",
# "-an"/"-en"). Tried and dropped — on a short residual root they collide
# constantly with unrelated, often very common, standalone nouns (e.g. "zaman",
# "insan", "kazan", "düzen" all parse as a plausible root + "-an", even though
# none of them are a participle). The 1.0 known-word/zipf guard does not help
# here: the colliding roots ("zam", "ins", "kaz", "düz", ...) are themselves
# real, reasonably frequent dictionary entries, so it is not a frequency
# problem — the suffixes are just too short and common to disambiguate.
VERB_SUFFIXES = {
    "mış", "miş", "muş", "müş",
    "ecek", "acak",
    "dık", "dik", "duk", "dük", "tık", "tik", "tuk", "tük",
}

# Two suffix sets: NOMINAL_ONLY keeps the guess-validation dictionary (valid-N.txt)
# exactly as scoped before (plus the consonant-softening/possessive fixes below,
# which just correct gaps in that existing nominal check). ALL_SUFFIXES adds verb
# conjugations on top, for answer-candidate selection only (build_candidate_rows,
# unlimited_pool.py) — stripping "geldi"/"gelecek"/"gelen" from being proposed as
# puzzle answers must not also make them invalid as player guesses.
NOMINAL_ONLY_SUFFIXES = sorted(NOMINAL_SUFFIXES, key=len, reverse=True)
ALL_SUFFIXES = sorted(NOMINAL_SUFFIXES | VERB_SUFFIXES, key=len, reverse=True)

MIN_ROOT_LENGTH = 2
MIN_ROOT_ZIPF = 1.0

# Consonant softening (yumuşama): p/ç/t/k at the end of a root softens to b/c/d/ğ
# before a vowel-initial suffix (kitap+ına -> kitabına, ağaç+ına -> ağacına,
# kanat+ını -> kanadını, kapak+ının -> kapağının). Keyed by the softened
# (surface) letter so a root recovered from the inflected word can be
# "hardened" back for the dictionary lookup.
SOFTENED_TO_HARD = {"b": "p", "c": "ç", "d": "t", "ğ": "k"}

# Only these suffixes trigger softening — specifically the longer 3rd-person
# possessive+case combinations. The short, already-existing "-ın"/"-in"/"-un"/
# "-ün" (bare genitive) is deliberately excluded: trying the hardened root for
# every word ending in one of those four letters produced false positives
# (e.g. "düğün" -> "düğ" -> hardened "dük", which happens to be a known word,
# wrongly flagging "düğün" (wedding) as inflected).
SOFTENING_SUFFIXES = {
    "ından", "inden", "undan", "ünden",
    "ında", "inde", "unda", "ünde",
    "ının", "inin", "unun", "ünün",
    "ını", "ini", "unu", "ünü",
    "ına", "ine", "una", "üne",
}


def _default_zipf(word: str) -> float:
    from wordfreq import zipf_frequency

    return zipf_frequency(word, "tr")


def harden_root(root: str) -> str:
    if not root:
        return root
    last = root[-1]
    hard = SOFTENED_TO_HARD.get(last)
    return root[:-1] + hard if hard else root


def _root_candidates(root: str, suffix: str) -> list:
    candidates = [root]
    if suffix in SOFTENING_SUFFIXES:
        hardened = harden_root(root)
        if hardened != root:
            candidates.append(hardened)
    return candidates


def find_inflection_root(
    word_lower: str, known_words: set, zipf_lookup=_default_zipf, include_verbs: bool = True
):
    suffixes = ALL_SUFFIXES if include_verbs else NOMINAL_ONLY_SUFFIXES
    for suffix in suffixes:
        if not word_lower.endswith(suffix):
            continue
        root = word_lower[: -len(suffix)]
        if len(root) < MIN_ROOT_LENGTH:
            continue
        for candidate in _root_candidates(root, suffix):
            if candidate not in known_words:
                continue
            if zipf_lookup(candidate) < MIN_ROOT_ZIPF:
                continue
            return candidate
    return None


def is_inflected_form(
    word_lower: str, known_words: set, zipf_lookup=_default_zipf, include_verbs: bool = True
) -> bool:
    return find_inflection_root(word_lower, known_words, zipf_lookup, include_verbs) is not None

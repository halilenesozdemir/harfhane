import os
import unittest
from unittest.mock import patch

from turkish import tr_lower, tr_upper, is_turkish_alphabet
from inflection import is_inflected_form
from candidates import is_likely_english

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "words")

KNOWN_VALID = ("KALEM", "KİTAP", "BEYAZ", "MASA", "HAFTA", "YAPRAK")
KNOWN_INVALID = ("MASASI", "KÖYÜN", "ELİNDE")


class TurkishNormalizationTests(unittest.TestCase):
    def test_tr_upper_dotted_i(self):
        self.assertEqual(tr_upper("kitap"), "KİTAP")

    def test_tr_upper_dotless_i(self):
        self.assertEqual(tr_upper("kapı"), "KAPI")

    def test_tr_lower_round_trip(self):
        self.assertEqual(tr_lower(tr_upper("şişe")), "şişe")

    def test_alphabet_rejects_q_w_x(self):
        self.assertFalse(is_turkish_alphabet("waks"))
        self.assertFalse(is_turkish_alphabet("qalp"))
        self.assertFalse(is_turkish_alphabet("taxi"))

    def test_alphabet_accepts_turkish_letters(self):
        self.assertTrue(is_turkish_alphabet("çiğköfte"))


class InflectionHeuristicTests(unittest.TestCase):
    def setUp(self):
        self.known_words = {"masa", "köy", "el", "kapı", "kalem", "kitap", "beyaz", "hafta", "yaprak"}

    def test_strips_possessive_form(self):
        self.assertTrue(is_inflected_form("masası", self.known_words))

    def test_strips_genitive_form(self):
        self.assertTrue(is_inflected_form("köyün", self.known_words))

    def test_strips_combined_possessive_locative(self):
        self.assertTrue(is_inflected_form("elinde", self.known_words))

    def test_keeps_independent_root_ending_in_vowel(self):
        self.assertFalse(is_inflected_form("kapı", self.known_words))

    def test_keeps_plain_roots(self):
        for word in ("kalem", "kitap", "beyaz", "masa", "hafta", "yaprak"):
            self.assertFalse(is_inflected_form(word, self.known_words))


class VerbConjugationHeuristicTests(unittest.TestCase):
    def setUp(self):
        self.known_words = {"gel", "git", "al", "bak", "gör"}

    def test_strips_narrative_past(self):
        self.assertTrue(is_inflected_form("gitmiş", self.known_words))

    def test_strips_future_participle(self):
        self.assertTrue(is_inflected_form("alacak", self.known_words))

    def test_strips_dik_participle(self):
        self.assertTrue(is_inflected_form("gördük", self.known_words))

    def test_keeps_plain_verb_roots(self):
        for word in ("gel", "git", "al", "bak", "gör"):
            self.assertFalse(is_inflected_form(word, self.known_words))

    def test_does_not_strip_bare_past_tense_or_participle_endings(self):
        # "-dı"/"-se"/"-an"/"-en" were tried and dropped (see the note above
        # VERB_SUFFIXES): common nouns like "zaman" and "insan" parse just as
        # well as "root + -an", so these must NOT be treated as inflected.
        known = {"zam", "ins", "kaz", "düz"}
        for word in ("zaman", "insan", "kazan", "düzen"):
            self.assertFalse(is_inflected_form(word, known))


class IncludeVerbsScopeTests(unittest.TestCase):
    # valid-N.txt (the guess dictionary) must not lose verb-conjugated forms;
    # only candidate/unlimited-pool selection should treat them as inflected.
    def setUp(self):
        self.known_words = {"git", "kitap"}

    def test_verb_conjugations_are_not_inflected_when_verbs_are_excluded(self):
        self.assertFalse(is_inflected_form("gitmiş", self.known_words, include_verbs=False))

    def test_verb_conjugations_are_inflected_by_default(self):
        self.assertTrue(is_inflected_form("gitmiş", self.known_words))

    def test_nominal_consonant_softening_still_applies_with_verbs_excluded(self):
        self.assertTrue(is_inflected_form("kitabına", self.known_words, include_verbs=False))


class ConsonantSofteningHeuristicTests(unittest.TestCase):
    # These use the existing multi-letter vowel-initial suffixes ("-ına", "-ini",
    # "-ının", ...), not a bare single-letter case vowel (see the note above
    # NOMINAL_SUFFIXES: those were tried and dropped for colliding with unrelated
    # standalone words).
    def setUp(self):
        self.known_words = {"kitap", "ağaç", "kanat", "kapak"}

    def test_softens_p_to_b_before_the_dative_possessive(self):
        # kitabına = kitap + 3rd-person possessive dative "-ına"; p softens to b.
        self.assertTrue(is_inflected_form("kitabına", self.known_words))

    def test_softens_c_cedilla_to_c_before_the_dative_possessive(self):
        # ağacına = ağaç + "-ına"; ç softens to c before the vowel suffix.
        self.assertTrue(is_inflected_form("ağacına", self.known_words))

    def test_softens_t_to_d_before_the_accusative_possessive(self):
        # kanadını = kanat + 3rd-person possessive accusative "-ını"; t softens to d.
        self.assertTrue(is_inflected_form("kanadını", self.known_words))

    def test_softens_k_to_g_breve_before_the_genitive_possessive(self):
        # kapağının = kapak + 3rd-person possessive genitive "-ının"; k softens to ğ.
        self.assertTrue(is_inflected_form("kapağının", self.known_words))

    def test_does_not_soften_before_a_consonant_initial_suffix(self):
        # "kitaptan" (ablative "-tan") never softens; the root stays "kitap" as-is,
        # and this exercises the plain (non-softened) lookup still works.
        self.assertTrue(is_inflected_form("kitaptan", self.known_words))


class EnglishLoanwordHeuristicTests(unittest.TestCase):
    def _fake_zipf(self, en_tr_scores):
        def fake(word, lang):
            return en_tr_scores[word][lang]
        return fake

    def test_flags_a_word_far_more_common_in_english_than_turkish(self):
        scores = {"deal": {"en": 5.3, "tr": 0.0}}
        with patch("candidates.zipf_frequency", self._fake_zipf(scores)):
            self.assertTrue(is_likely_english("deal"))

    def test_keeps_an_assimilated_loanword_used_often_in_turkish(self):
        scores = {"banka": {"en": 0.0, "tr": 4.8}}
        with patch("candidates.zipf_frequency", self._fake_zipf(scores)):
            self.assertFalse(is_likely_english("banka"))

    def test_keeps_a_native_turkish_word(self):
        scores = {"gel": {"en": 3.8, "tr": 5.5}}
        with patch("candidates.zipf_frequency", self._fake_zipf(scores)):
            self.assertFalse(is_likely_english("gel"))

    def test_margin_is_inclusive(self):
        from candidates import ENGLISH_ZIPF_MARGIN

        scores = {"edge": {"en": 3.0 + ENGLISH_ZIPF_MARGIN, "tr": 3.0}}
        with patch("candidates.zipf_frequency", self._fake_zipf(scores)):
            self.assertTrue(is_likely_english("edge"))


class GeneratedOutputTests(unittest.TestCase):
    def _read_valid(self, length):
        path = os.path.join(DATA_DIR, f"valid-{length}.txt")
        if not os.path.exists(path):
            self.skipTest(f"{path} not generated yet; run build_word_lists.py first")
        with open(path, encoding="utf-8") as handle:
            return set(line.strip() for line in handle if line.strip())

    def test_known_valid_words_present(self):
        by_length = {}
        for word in KNOWN_VALID:
            by_length.setdefault(len(word), []).append(word)
        for length, words in by_length.items():
            valid = self._read_valid(length)
            for word in words:
                self.assertIn(word, valid)

    def test_known_inflected_forms_absent(self):
        by_length = {}
        for word in KNOWN_INVALID:
            by_length.setdefault(len(word), []).append(word)
        for length, words in by_length.items():
            valid = self._read_valid(length)
            for word in words:
                self.assertNotIn(word, valid)


if __name__ == "__main__":
    unittest.main()

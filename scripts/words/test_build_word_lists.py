import os
import unittest

from turkish import tr_lower, tr_upper, is_turkish_alphabet
from inflection import is_inflected_form

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

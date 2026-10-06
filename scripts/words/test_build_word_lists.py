import os
import unittest
from unittest.mock import patch

from turkish import tr_lower, tr_upper, is_turkish_alphabet
from inflection import is_inflected_form
from candidates import is_likely_english
import build_word_lists as bwl

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

    def test_does_not_strip_verb_conjugations_or_soften_consonants(self):
        # Verb-conjugation stripping and consonant softening were both tried and
        # removed (main-loop decision, Plan 008 follow-up): heuristics cannot make
        # the unlimited pool family-safe, and both caused real words to be wrongly
        # dropped from the guess dictionary / candidate pools (e.g. "geçmiş",
        # "altmış", "içecek", "gelecek", "koltuk", "mantık" as lexicalized nouns
        # colliding with the verb-conjugation rule; "düğünü", "tribünü", "yığına",
        # "kendini" colliding with consonant softening). Keep this locked down to
        # the plain nominal-only heuristic.
        known = {"git", "kitap", "ağaç", "kanat"}
        for word in ("gitmiş", "gidecek", "gittik", "kitabına", "ağacına", "kanadını"):
            self.assertFalse(is_inflected_form(word, known))


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


class BlocklistExactMatchTests(unittest.TestCase):
    def test_exact_match_entry_blocks_only_the_exact_word(self):
        from candidates import is_blocked

        self.assertTrue(is_blocked("kaşar", {"=kaşar"}))

    def test_exact_match_entry_does_not_block_a_longer_word_with_that_prefix(self):
        from candidates import is_blocked

        # "kaşarlı" (with kaşar cheese) is an unrelated, legitimate food word.
        self.assertFalse(is_blocked("kaşarlı", {"=kaşar"}))

    def test_plain_entry_still_blocks_by_prefix(self):
        from candidates import is_blocked

        self.assertTrue(is_blocked("sokaklı", {"sokak"}))


class BuildCandidateRowsEnglishFilterTests(unittest.TestCase):
    # Exercises build_word_lists.build_candidate_rows directly (not just
    # candidates.is_likely_english in isolation), so a mutant that drops the
    # is_likely_english check from the candidate pipeline itself is caught.
    def test_excludes_a_word_flagged_as_english(self):
        valid_words = {"masa": ()}
        with patch.object(bwl, "is_likely_english", lambda word: word == "masa"):
            rows = bwl.build_candidate_rows(valid_words, blocklist=set())
        self.assertEqual(rows, [])

    def test_keeps_a_word_not_flagged_as_english(self):
        valid_words = {"masa": ()}
        with patch.object(bwl, "is_likely_english", lambda word: False):
            rows = bwl.build_candidate_rows(valid_words, blocklist=set())
        self.assertEqual([row["word"] for row in rows], ["MASA"])


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

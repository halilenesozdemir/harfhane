import os
import tempfile
import unittest
from unittest.mock import patch

from turkish import tr_lower, tr_upper, is_turkish_alphabet
from inflection import is_inflected_form
from candidates import is_likely_english, is_blocked, load_blocklist, load_allowlist
import build_word_lists as bwl

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BLOCKLIST_PATH = os.path.join(SCRIPT_DIR, "blocklist.txt")
ALLOWLIST_PATH = os.path.join(SCRIPT_DIR, "turkish_allowlist.txt")

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

    def test_allowlist_overrides_a_word_that_would_otherwise_be_flagged(self):
        from candidates import ENGLISH_ZIPF_MARGIN

        scores = {"fire": {"en": 3.0 + ENGLISH_ZIPF_MARGIN, "tr": 3.0}}
        with patch("candidates.zipf_frequency", self._fake_zipf(scores)):
            self.assertTrue(is_likely_english("fire"))
            self.assertFalse(is_likely_english("fire", allowlist={"fire"}))


class TurkishWordsMisflaggedAsEnglishTests(unittest.TestCase):
    # Real wordfreq scores (no mocking): FİRE, STEP, SURE and MOMENT are real,
    # commonly used Turkish words that the English-loanword margin wrongly
    # flags on their own; the allowlist (turkish_allowlist.txt) must keep them.
    def setUp(self):
        self.allowlist = load_allowlist(ALLOWLIST_PATH)

    def test_allowlist_contains_the_known_misflagged_words(self):
        for word in ("fire", "step", "sure", "moment"):
            self.assertIn(word, self.allowlist)

    def test_each_known_word_survives_with_the_allowlist_applied(self):
        for word in ("fire", "step", "sure", "moment"):
            self.assertFalse(is_likely_english(word, self.allowlist))

    def test_each_known_word_would_be_flagged_without_the_allowlist(self):
        # Guards against the allowlist becoming a no-op if the margin changes:
        # these words must actually need the allowlist, not merely tolerate it.
        for word in ("fire", "step", "sure", "moment"):
            self.assertTrue(is_likely_english(word))


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


class LoadBlocklistFileTests(unittest.TestCase):
    # A mutant that drops the "=" exact-match handling in load_blocklist (e.g.
    # by stripping the prefix character without preserving its meaning) must
    # be caught: loading from a real file has to keep exact-match semantics,
    # not just the in-memory set construction tested above.
    def test_reads_exact_match_entries_from_a_file(self):
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", encoding="utf-8", delete=False
        ) as handle:
            handle.write("# comment\n=kaşar\nsokak\n")
            path = handle.name
        try:
            blocklist = load_blocklist(path)
        finally:
            os.remove(path)

        self.assertTrue(is_blocked("kaşar", blocklist))
        self.assertFalse(is_blocked("kaşarlı", blocklist))
        self.assertTrue(is_blocked("sokaklı", blocklist))

    def test_lowercases_file_entries_with_turkish_rules(self):
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", encoding="utf-8", delete=False
        ) as handle:
            handle.write("=RAKI\nİLAÇ\n")
            path = handle.name
        try:
            blocklist = load_blocklist(path)
        finally:
            os.remove(path)

        self.assertTrue(is_blocked("rakı", blocklist))
        self.assertTrue(is_blocked("ilaçlar", blocklist))


class BlocklistAdditionsTests(unittest.TestCase):
    # Real blocklist.txt file: exact-match entries added for words that
    # slipped through the family-safety and English-loanword filters.
    def setUp(self):
        self.blocklist = load_blocklist(BLOCKLIST_PATH)

    def test_blocks_sexual_and_slur_words_added_as_exact_entries(self):
        for word in ("sekse", "seviş", "homo"):
            self.assertTrue(is_blocked(word, self.blocklist))

    def test_does_not_block_unrelated_longer_words_sharing_that_prefix(self):
        # "seksen" (sixty) and "homojen" (homogeneous) are unrelated,
        # legitimate words; a prefix entry would wrongly block them too.
        self.assertFalse(is_blocked("seksen", self.blocklist))
        self.assertFalse(is_blocked("homojen", self.blocklist))

    def test_blocks_owner_rejected_words_as_exact_entries(self):
        # Owner decisions 2026-10-06: SEKS, ESKORT, RAKI, BİRA, VİSKİ, VOTKA,
        # STOP, START, TALK, ŞARAP, ALKOL, İÇKİ, SARHOŞ, LİKÖR, KADEH, KADEHİ
        # and DUBLE are not answers.
        for word in (
            "seks", "eskort", "rakı", "erotik", "bira", "viski", "votka",
            "stop", "start", "talk", "şarap", "alkol", "içki", "sarhoş",
            "likör", "kadeh", "kadehi", "duble",
        ):
            self.assertTrue(is_blocked(word, self.blocklist))

    def test_does_not_block_longer_words_sharing_an_owner_rejected_prefix(self):
        for word in (
            "seksen", "seksek", "rakım", "rakip", "birader", "talkım",
            "şarapçı", "alkolik", "dubleks", "içkin",
        ):
            self.assertFalse(is_blocked(word, self.blocklist))

    def test_blocks_english_loanwords_that_slipped_past_the_margin(self):
        for word in ("bird", "lamb"):
            self.assertTrue(is_blocked(word, self.blocklist))


class BuildCandidateRowsEnglishFilterTests(unittest.TestCase):
    # Exercises build_word_lists.build_candidate_rows directly (not just
    # candidates.is_likely_english in isolation), so a mutant that drops the
    # is_likely_english check from the candidate pipeline itself is caught.
    def test_excludes_a_word_flagged_as_english(self):
        valid_words = {"masa": ()}
        with patch.object(
            bwl, "is_likely_english", lambda word, allowlist=frozenset(): word == "masa"
        ):
            rows = bwl.build_candidate_rows(valid_words, blocklist=set())
        self.assertEqual(rows, [])

    def test_keeps_a_word_not_flagged_as_english(self):
        valid_words = {"masa": ()}
        with patch.object(bwl, "is_likely_english", lambda word, allowlist=frozenset(): False):
            rows = bwl.build_candidate_rows(valid_words, blocklist=set())
        self.assertEqual([row["word"] for row in rows], ["MASA"])

    def test_allowlist_is_passed_through_to_the_english_heuristic(self):
        valid_words = {"masa": ()}
        with patch.object(
            bwl,
            "is_likely_english",
            lambda word, allowlist=frozenset(): word in allowlist,
        ):
            rows = bwl.build_candidate_rows(valid_words, blocklist=set(), allowlist={"masa"})
        self.assertEqual(rows, [])


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

    def _read_lines(self, name):
        path = os.path.join(DATA_DIR, name)
        if not os.path.exists(path):
            self.skipTest(f"{path} not generated yet")
        with open(path, encoding="utf-8") as handle:
            return set(line.split(",")[0].strip() for line in handle if line.strip())

    def test_allowlisted_words_survive_in_generated_pools(self):
        # Proves main() wires the allowlist through, not just the helpers.
        for word, length in (("FİRE", 4), ("STEP", 4), ("SURE", 4), ("MOMENT", 6)):
            self.assertIn(word, self._read_lines(f"candidates-{length}.csv"))
            self.assertIn(word, self._read_lines(f"review/unlimited-pool-{length}.txt"))

    def test_blocked_words_absent_from_generated_pools(self):
        for word, length in (("SEKS", 4), ("RAKI", 4), ("ESKORT", 6), ("EROTİK", 6)):
            self.assertNotIn(word, self._read_lines(f"candidates-{length}.csv"))
            self.assertNotIn(word, self._read_lines(f"review/unlimited-pool-{length}.txt"))
            self.assertNotIn(word, self._read_lines(f"review/pool-{length}.txt"))

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

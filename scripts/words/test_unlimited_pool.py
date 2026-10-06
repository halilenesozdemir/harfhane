import os
import tempfile
import unittest
from unittest.mock import patch

import unlimited_pool as up

ZIPF_SCORES = {
    "kalem": 3.4,
    "kalemi": 3.0,
    "masal": 2.6,
    "sokak": 2.9,
    "yasak": 2.0,
    "sabah": up.UNLIMITED_ZIPF_FLOOR,
    "duvar": up.UNLIMITED_ZIPF_FLOOR - 0.1,
    "gitmek": 9.0,
}


def fake_zipf(word, _lang):
    return ZIPF_SCORES.get(word, 0.0)


class BuildUnlimitedPoolTests(unittest.TestCase):
    def setUp(self):
        patcher = patch.object(up, "zipf_frequency", fake_zipf)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_excludes_inflected_forms(self):
        # "masası" (possessive of "masa") is a known inflected form (see
        # test_build_word_lists.InflectionHeuristicTests); the real root check
        # runs unmocked, so this exercises the actual heuristic, not a fake.
        raw = {"masası": ()}
        known = {"masa", "masası"}
        pool = up.build_unlimited_pool(6, raw, known, blocklist=set(), excluded=set())
        self.assertEqual(pool, [])

    def test_excludes_blocklisted_roots(self):
        raw = {"sokak": ()}
        known = {"sokak"}
        pool = up.build_unlimited_pool(5, raw, known, blocklist={"sokak"}, excluded=set())
        self.assertEqual(pool, [])

    def test_excludes_words_already_in_daily_pool_or_review(self):
        raw = {"sokak": ()}
        known = {"sokak"}
        pool = up.build_unlimited_pool(5, raw, known, blocklist=set(), excluded={"SOKAK"})
        self.assertEqual(pool, [])

    def test_keeps_words_below_the_daily_floor_but_above_the_unlimited_floor(self):
        raw = {"masal": ()}
        known = {"masal"}
        pool = up.build_unlimited_pool(5, raw, known, blocklist=set(), excluded=set())
        self.assertEqual(pool, ["MASAL"])

    def test_drops_words_below_the_unlimited_floor(self):
        raw = {"yasak": ()}
        known = {"yasak"}
        pool = up.build_unlimited_pool(5, raw, known, blocklist=set(), excluded=set())
        self.assertEqual(pool, [])

    def test_floor_is_inclusive_like_the_daily_threshold(self):
        # A word scoring exactly UNLIMITED_ZIPF_FLOOR must be kept (>=, not >), the
        # same inclusive rule candidates.py uses for the daily ZIPF_THRESHOLD.
        raw = {"sabah": ()}
        known = {"sabah"}
        pool = up.build_unlimited_pool(5, raw, known, blocklist=set(), excluded=set())
        self.assertEqual(pool, ["SABAH"])

    def test_drops_a_word_just_below_the_floor(self):
        raw = {"duvar": ()}
        known = {"duvar"}
        pool = up.build_unlimited_pool(5, raw, known, blocklist=set(), excluded=set())
        self.assertEqual(pool, [])

    def test_excludes_words_flagged_as_english_loanwords(self):
        raw = {"sokak": ()}
        known = {"sokak"}
        with patch.object(
            up, "is_likely_english", lambda word, allowlist=frozenset(): word == "sokak"
        ):
            pool = up.build_unlimited_pool(5, raw, known, blocklist=set(), excluded=set())
        self.assertEqual(pool, [])

    def test_allowlist_keeps_a_word_the_english_heuristic_would_otherwise_drop(self):
        raw = {"sokak": ()}
        known = {"sokak"}
        with patch.object(
            up,
            "is_likely_english",
            lambda word, allowlist=frozenset(): word == "sokak" and word not in allowlist,
        ):
            pool = up.build_unlimited_pool(
                5, raw, known, blocklist=set(), excluded=set(), allowlist={"sokak"}
            )
        self.assertEqual(pool, ["SOKAK"])

    def test_excludes_mastar_verb_forms(self):
        # "gitmek" scores well above the floor, but the mastar (-mek/-mak) ending
        # must still exclude it, same as the daily pipeline.
        raw = {"gitmek": ()}
        known = {"gitmek"}
        pool = up.build_unlimited_pool(6, raw, known, blocklist=set(), excluded=set())
        self.assertEqual(pool, [])

    def test_only_keeps_the_requested_length(self):
        raw = {"sokak": (), "masal": ()}
        known = {"sokak", "masal"}
        pool = up.build_unlimited_pool(4, raw, known, blocklist=set(), excluded=set())
        self.assertEqual(pool, [])

    def test_output_is_sorted(self):
        raw = {"sokak": (), "masal": ()}
        known = {"sokak", "masal"}
        pool = up.build_unlimited_pool(5, raw, known, blocklist=set(), excluded=set())
        self.assertEqual(pool, sorted(pool))


class LoadExcludedWordsTests(unittest.TestCase):
    def test_reads_both_the_pool_file_and_the_review_csv(self):
        with tempfile.TemporaryDirectory() as tmp:
            pool_path = os.path.join(tmp, "pool-5.txt")
            review_path = os.path.join(tmp, "review-5.csv")
            with open(pool_path, "w", encoding="utf-8") as handle:
                handle.write("SOKAK\n")
            with open(review_path, "w", encoding="utf-8") as handle:
                handle.write("word\nMASAL\n")
            excluded = up.load_excluded_words(pool_path, review_path)
        self.assertEqual(excluded, {"SOKAK", "MASAL"})

    def test_returns_an_empty_set_when_files_are_missing(self):
        excluded = up.load_excluded_words("/no/such/pool.txt", "/no/such/review.csv")
        self.assertEqual(excluded, set())


class WritePoolTests(unittest.TestCase):
    def test_writes_one_word_per_line(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "unlimited-pool-5.txt")
            up.write_pool(path, ["MASAL", "SOKAK"])
            with open(path, encoding="utf-8") as handle:
                lines = [line.strip() for line in handle]
        self.assertEqual(lines, ["MASAL", "SOKAK"])


if __name__ == "__main__":
    unittest.main()

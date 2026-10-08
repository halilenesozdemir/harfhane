import unittest

import csv
import os
import sys
import tempfile
from unittest.mock import patch

import validate_labels as vl
from validate_labels import has_blocking_errors, validate, write_review_csv

POOL = ["KALEM", "GELDİ", "MASA", "DENİZ"]


def accepted(word, **overrides):
    label = {"word": word, "decision": "accept"}
    label.update(overrides)
    return label


def rejected(word, reason="verb_form"):
    return {"word": word, "decision": "reject", "reason": reason}


class ValidateTests(unittest.TestCase):
    def test_accepts_a_bare_decision_with_no_other_fields(self):
        report = validate([accepted("KALEM")], POOL)
        self.assertEqual(report["errors"], {})
        self.assertEqual([label["word"] for label in report["accepted"]], ["KALEM"])

    def test_ignores_legacy_meaning_and_context_fields(self):
        label = accepted(
            "KALEM",
            category="isim",
            meaning="Yazı yazmaya yarayan araç",
            context="not even a sentence",
        )
        report = validate([label], POOL)
        self.assertEqual(report["errors"], {})

    def test_drops_every_copy_when_a_word_is_duplicated(self):
        report = validate([accepted("KALEM"), accepted("KALEM")], POOL)
        self.assertEqual(report["accepted"], [])
        self.assertEqual(report["errors"], {"KALEM": ["duplicate"]})

    def test_buckets_valid_labels(self):
        report = validate([accepted("KALEM"), rejected("GELDİ")], POOL)
        self.assertEqual([label["word"] for label in report["accepted"]], ["KALEM"])
        self.assertEqual(len(report["rejected"]), 1)

    def test_reports_missing_pool_words(self):
        report = validate([accepted("KALEM")], POOL)
        self.assertEqual(report["missing"], ["GELDİ", "MASA", "DENİZ"])

    def test_rejects_word_outside_pool(self):
        report = validate([accepted("KİTAP")], POOL)
        self.assertEqual(report["errors"]["KİTAP"], ["word_not_in_pool"])

    def test_requires_known_reject_reason(self):
        report = validate([rejected("GELDİ", reason="boring")], POOL)
        self.assertEqual(report["errors"]["GELDİ"], ["reason"])

    def test_accepts_free_text_reason_for_unsure(self):
        report = validate([{"word": "MASA", "decision": "unsure", "reason": "could be inflected"}], POOL)
        self.assertEqual(len(report["unsure"]), 1)

    def test_requires_reason_for_unsure(self):
        report = validate([{"word": "MASA", "decision": "unsure"}], POOL)
        self.assertEqual(report["errors"]["MASA"], ["reason"])

    def test_flags_duplicates(self):
        report = validate([rejected("GELDİ"), rejected("GELDİ")], POOL)
        self.assertEqual(report["errors"]["GELDİ"], ["duplicate"])

    def test_requires_a_known_decision(self):
        report = validate([{"word": "KALEM", "decision": "maybe"}], POOL)
        self.assertEqual(report["errors"]["KALEM"], ["decision"])


class HasBlockingErrorsTests(unittest.TestCase):
    def test_treats_missing_pool_words_as_blocking(self):
        # A truncated labels file: KALEM is labeled but the other three pool words never
        # got a label. That must never produce a partial review CSV.
        report = validate([accepted("KALEM")], POOL)
        self.assertEqual(report["errors"], {})
        self.assertTrue(report["missing"])
        self.assertTrue(has_blocking_errors(report))

    def test_is_false_for_a_complete_clean_label_set(self):
        report = validate(
            [accepted("KALEM"), accepted("GELDİ"), accepted("MASA"), accepted("DENİZ")], POOL
        )
        self.assertEqual(report["errors"], {})
        self.assertEqual(report["missing"], [])
        self.assertFalse(has_blocking_errors(report))

    def test_is_true_when_there_are_label_errors_even_with_nothing_missing(self):
        report = validate(
            [
                accepted("KALEM"),
                accepted("GELDİ"),
                accepted("MASA"),
                {"word": "DENİZ", "decision": "maybe"},
            ],
            POOL,
        )
        self.assertEqual(report["missing"], [])
        self.assertTrue(report["errors"])
        self.assertTrue(has_blocking_errors(report))


class WriteReviewCsvTests(unittest.TestCase):
    def test_writes_a_word_only_header_and_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "review.csv")
            write_review_csv(path, [accepted("GELDİ"), accepted("KALEM")])
            with open(path, encoding="utf-8", newline="") as handle:
                rows = list(csv.reader(handle))
        self.assertEqual(rows, [["word"], ["GELDİ"], ["KALEM"]])

    def test_writes_the_csv_module_default_line_ending(self):
        # Python's csv module writes "\r\n" by default regardless of platform; pin
        # that exact byte format since downstream import tooling may depend on it.
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "review.csv")
            write_review_csv(path, [accepted("KALEM")])
            with open(path, "rb") as handle:
                raw = handle.read()
        self.assertEqual(raw, b"word\r\nKALEM\r\n")


class MainIntegrationTests(unittest.TestCase):
    def _write(self, tmp, name, content):
        with open(os.path.join(tmp, name), "w", encoding="utf-8") as handle:
            handle.write(content)

    def _run_main(self, tmp, argv):
        with patch.object(vl, "REVIEW_DIR", tmp), patch.object(sys, "argv", ["validate_labels.py"] + argv):
            vl.main()

    def test_truncated_labels_exit_nonzero_and_write_no_csv(self):
        # Only KALEM is labeled; GELDİ/MASA/DENİZ are missing. label_errors() alone
        # reports no per-label errors here, so this fails if main() checks
        # `report["errors"]` instead of has_blocking_errors(report).
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "pool-5.txt", "KALEM\nGELDİ\nMASA\nDENİZ\n")
            self._write(tmp, "labels-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            with self.assertRaises(SystemExit) as ctx:
                self._run_main(tmp, ["--length", "5"])
            self.assertEqual(ctx.exception.code, 1)
            self.assertFalse(os.path.exists(os.path.join(tmp, "review-5.csv")))

    def test_pool_daily_writes_review_csv_on_a_clean_complete_set(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            self._run_main(tmp, ["--length", "5"])
            self.assertTrue(os.path.exists(os.path.join(tmp, "review-5.csv")))

    def test_pool_unlimited_writes_unlimited_csv_never_review_csv(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            self._run_main(tmp, ["--length", "5", "--pool", "unlimited"])
            self.assertTrue(os.path.exists(os.path.join(tmp, "unlimited-5.csv")))
            self.assertFalse(os.path.exists(os.path.join(tmp, "review-5.csv")))


if __name__ == "__main__":
    unittest.main()


class CommittedLabelFilesTests(unittest.TestCase):
    def test_should_validate_cleanly_when_a_committed_label_file_is_checked_against_its_pool(self):
        for pool_kind, label_pattern in vl.LABEL_FILES.items():
            for length in (4, 5, 6):
                label_path = os.path.join(vl.REVIEW_DIR, label_pattern.format(length=length))
                if not os.path.exists(label_path):
                    continue
                pool_path = os.path.join(vl.REVIEW_DIR, vl.POOL_FILES[pool_kind].format(length=length))
                report = validate(vl.load_labels(label_path), vl.load_lines(pool_path))
                with self.subTest(label_file=os.path.basename(label_path)):
                    self.assertFalse(has_blocking_errors(report), (report["errors"], report["missing"]))

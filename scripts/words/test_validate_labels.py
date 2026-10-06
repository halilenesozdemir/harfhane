import unittest

import csv
import os
import tempfile

from validate_labels import validate, write_review_csv

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


class WriteReviewCsvTests(unittest.TestCase):
    def test_writes_a_word_only_header_and_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "review.csv")
            write_review_csv(path, [accepted("GELDİ"), accepted("KALEM")])
            with open(path, encoding="utf-8", newline="") as handle:
                rows = list(csv.reader(handle))
        self.assertEqual(rows, [["word"], ["GELDİ"], ["KALEM"]])


if __name__ == "__main__":
    unittest.main()

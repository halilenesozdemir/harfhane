import unittest

from validate_labels import mentions_answer, validate

POOL = ["KALEM", "GELDİ", "MASA", "DENİZ"]


def accepted(word, **overrides):
    label = {
        "word": word,
        "decision": "accept",
        "category": "isim",
        "meaning": "Yazı yazmaya yarayan ince ve uzun araç",
        "context": "Çantasından mavi bir kalem çıkardı.",
    }
    label.update(overrides)
    return label


def rejected(word, reason="verb_form"):
    return {"word": word, "decision": "reject", "reason": reason}


class MentionsAnswerTests(unittest.TestCase):
    def test_detects_inflected_answer(self):
        self.assertTrue(mentions_answer("Kalemler masada duruyor", "KALEM"))

    def test_detects_turkish_dotted_capital(self):
        self.assertTrue(mentions_answer("Denize girdik", "DENİZ"))

    def test_ignores_unrelated_text(self):
        self.assertFalse(mentions_answer("Yazı yazmaya yarayan araç", "KALEM"))

    def test_uses_full_word_for_short_answers(self):
        self.assertFalse(mentions_answer("Mastar biçimi", "MASA"))


class ValidateTests(unittest.TestCase):
    def test_flags_context_when_it_does_not_use_the_answer(self):
        label = accepted("KALEM", context="Çantasından mavi bir araç çıkardı.")
        report = validate([label], POOL)
        self.assertEqual(report["errors"], {"KALEM": ["context_missing_answer"]})

    def test_accepts_context_when_the_answer_drops_a_vowel(self):
        label = accepted("VAKİT", meaning="Bir işin yapılacağı zaman dilimi", context="Eve dönme vakti geldi.")
        self.assertEqual(validate([label], ["VAKİT"])["errors"], {})

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

    def test_rejects_meaning_that_mentions_answer(self):
        report = validate([accepted("KALEM", meaning="Kalemlik içinde duran araç")], POOL)
        self.assertIn("meaning_mentions_answer", report["errors"]["KALEM"])

    def test_rejects_category_outside_answer_standard(self):
        report = validate([accepted("KALEM", category="fiil")], POOL)
        self.assertIn("category", report["errors"]["KALEM"])

    def test_rejects_context_without_sentence_ending(self):
        report = validate([accepted("KALEM", context="Mavi bir kalem çıkardı")], POOL)
        self.assertIn("context_not_sentence", report["errors"]["KALEM"])

    def test_rejects_unknown_characters(self):
        report = validate([accepted("KALEM", meaning="Yazı aracı ✏ ince ve uzun")], POOL)
        self.assertIn("meaning_characters", report["errors"]["KALEM"])

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


if __name__ == "__main__":
    unittest.main()

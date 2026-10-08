import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

import eval_labels as el
from eval_labels import (
    LABEL_ACCEPT_PRECISION_MIN,
    LABEL_SENSITIVE_RECALL_MIN,
    evaluate,
    load_candidate,
    load_golden,
    normalize_word,
    passes_thresholds,
    score_accept,
    score_reason_recall,
    split_golden,
)


def golden_accept(word, **overrides):
    label = {"word": word, "decision": "accept"}
    label.update(overrides)
    return label


def golden_reject(word, reason):
    return {"word": word, "decision": "reject", "reason": reason}


def candidate_accept(word):
    return {"word": word, "decision": "accept"}


def candidate_reject(word, reason="other"):
    return {"word": word, "decision": "reject", "reason": reason}


def with_ids(golden):
    return [{**entry, "id": f"G{i}"} for i, entry in enumerate(golden)]


class NormalizeWordTests(unittest.TestCase):
    def test_uppercases_turkish_dotted_and_dotless_i_correctly(self):
        self.assertEqual(normalize_word("kalem"), "KALEM")
        self.assertEqual(normalize_word("izmir"), "İZMİR")

    def test_trims_surrounding_whitespace(self):
        self.assertEqual(normalize_word("  kalem \n"), "KALEM")

    def test_folds_nfd_to_the_same_form_as_nfc(self):
        import unicodedata

        nfc = unicodedata.normalize("NFC", "KALEMİ")
        nfd = unicodedata.normalize("NFD", "KALEMİ")
        self.assertNotEqual(nfc, nfd)  # sanity: the inputs really differ byte-wise
        self.assertEqual(normalize_word(nfc), normalize_word(nfd))


class SplitGoldenTests(unittest.TestCase):
    def test_every_word_lands_in_exactly_one_half(self):
        golden = with_ids([golden_accept(f"W{i}") for i in range(50)])
        calibration, held_out = split_golden(golden)
        calibration_words = {entry["word"] for entry in calibration}
        held_out_words = {entry["word"] for entry in held_out}
        self.assertEqual(calibration_words & held_out_words, set())
        self.assertEqual(calibration_words | held_out_words, {f"W{i}" for i in range(50)})

    def test_is_independent_of_the_golden_lists_order(self):
        golden = with_ids([golden_accept(f"W{i}") for i in range(30)])
        reversed_golden = list(reversed(golden))
        first_held_out = {entry["word"] for entry in split_golden(golden)[1]}
        second_held_out = {entry["word"] for entry in split_golden(reversed_golden)[1]}
        self.assertEqual(first_held_out, second_held_out)

    def test_a_words_half_does_not_change_when_unrelated_entries_are_added(self):
        base = with_ids([golden_accept(f"W{i}") for i in range(20)])
        base_held_out = {entry["word"] for entry in split_golden(base)[1]}
        extended = with_ids([golden_accept(f"W{i}") for i in range(20)] + [golden_accept("NEWWORD")])
        extended_held_out = {entry["word"] for entry in split_golden(extended)[1]} - {"NEWWORD"}
        self.assertEqual(base_held_out, extended_held_out)


class ScoreAcceptTests(unittest.TestCase):
    def test_reports_perfect_precision_and_recall_when_candidate_matches_golden(self):
        held_out = with_ids([golden_accept("A1"), golden_reject("A3", "verb_form")])
        candidate_by_word = {"A1": candidate_accept("A1"), "A3": candidate_reject("A3", "verb_form")}
        report = score_accept(held_out, candidate_by_word)
        self.assertEqual(report["precision"], 1.0)
        self.assertEqual(report["recall"], 1.0)

    def test_reports_reduced_precision_when_a_held_out_reject_is_accepted(self):
        held_out = with_ids([golden_accept("A1"), golden_reject("A3", "verb_form")])
        candidate_by_word = {"A1": candidate_accept("A1"), "A3": candidate_accept("A3")}
        report = score_accept(held_out, candidate_by_word)
        self.assertEqual(report["precision"], 0.5)

    def test_treats_a_missing_candidate_entry_as_not_accepted_for_recall(self):
        held_out = with_ids([golden_accept("A0"), golden_accept("A1")])
        report = score_accept(held_out, {})
        self.assertEqual(report["recall"], 0.0)

    def test_an_all_reject_candidate_scores_zero_precision_not_a_vacuous_pass(self):
        # Zero predicted accepts proves nothing about accept quality: it must not
        # read as perfect precision just because there were no wrong accepts either.
        held_out = with_ids([golden_accept("A0"), golden_accept("A1"), golden_reject("A2", "verb_form")])
        candidate_by_word = {
            "A0": candidate_reject("A0"),
            "A1": candidate_reject("A1"),
            "A2": candidate_reject("A2"),
        }
        report = score_accept(held_out, candidate_by_word)
        self.assertEqual(report["precision"], 0.0)

    def test_an_empty_candidate_scores_zero_precision(self):
        held_out = with_ids([golden_accept("A0"), golden_accept("A1")])
        report = score_accept(held_out, {})
        self.assertEqual(report["precision"], 0.0)


class SensitiveRecallTests(unittest.TestCase):
    def test_reports_recall_below_one_when_a_batch_accepts_a_golden_sensitive_reject_010_AE3(self):
        held_out = with_ids([golden_reject("A1", "sensitive"), golden_reject("A3", "sensitive")])
        candidate_by_word = {"A1": candidate_reject("A1", "sensitive"), "A3": candidate_accept("A3")}
        report = score_reason_recall(held_out, candidate_by_word, "sensitive")
        self.assertLess(report["recall"], 1.0)

    def test_names_the_golden_entrys_id_not_the_word_in_a_sensitive_miss_010_AE3(self):
        held_out = with_ids([golden_accept("A0"), golden_reject("YARRAK", "sensitive")])
        candidate_by_word = {"YARRAK": candidate_accept("YARRAK")}
        report = score_reason_recall(held_out, candidate_by_word, "sensitive")
        self.assertEqual(report["misses"], ["G1"])
        self.assertNotIn("YARRAK", json.dumps(report, ensure_ascii=False))

    def test_recall_is_perfect_when_every_sensitive_reject_is_caught(self):
        held_out = with_ids([golden_reject("A1", "sensitive"), golden_reject("A3", "sensitive")])
        candidate_by_word = {"A1": candidate_reject("A1"), "A3": candidate_reject("A3")}
        report = score_reason_recall(held_out, candidate_by_word, "sensitive")
        self.assertEqual(report["recall"], 1.0)

    def test_catching_a_sensitive_word_under_a_different_reason_still_counts(self):
        held_out = with_ids([golden_reject("A1", "sensitive")])
        candidate_by_word = {"A1": candidate_reject("A1", reason="other")}
        report = score_reason_recall(held_out, candidate_by_word, "sensitive")
        self.assertEqual(report["recall"], 1.0)

    def test_zero_total_is_reported_as_zero_not_an_error(self):
        held_out = with_ids([golden_accept("A0")])
        report = score_reason_recall(held_out, {}, "sensitive")
        self.assertEqual(report["total"], 0)


class ProperNounAndForeignRecallTests(unittest.TestCase):
    def test_also_reports_recall_for_proper_noun_and_foreign_reasons(self):
        held_out = with_ids(
            [
                golden_accept("A0"),
                golden_reject("A1", "proper_noun"),
                golden_accept("A2"),
                golden_reject("A3", "foreign"),
            ]
        )
        candidate_by_word = {
            "A1": candidate_accept("A1"),
            "A3": candidate_reject("A3"),
        }
        proper_noun = score_reason_recall(held_out, candidate_by_word, "proper_noun")
        foreign = score_reason_recall(held_out, candidate_by_word, "foreign")
        self.assertEqual(proper_noun["recall"], 0.0)
        self.assertEqual(foreign["recall"], 1.0)


class PassesThresholdsTests(unittest.TestCase):
    """Pure boundary tests: pin the exact comparison and constants so a mutant
    (`>=` -> `>`, 0.95 -> 0.90, 0.98 -> 0.80) is caught without depending on the
    golden-set hash split."""

    def _ok(self, **overrides):
        base = dict(
            accept_precision=1.0,
            sensitive_recall=1.0,
            sensitive_total=1,
            held_out_count=1,
            missing=[],
            duplicate=[],
        )
        base.update(overrides)
        return base

    def test_passes_at_exactly_the_accept_precision_minimum(self):
        self.assertTrue(passes_thresholds(**self._ok(accept_precision=LABEL_ACCEPT_PRECISION_MIN)))

    def test_fails_just_below_the_accept_precision_minimum(self):
        self.assertFalse(passes_thresholds(**self._ok(accept_precision=LABEL_ACCEPT_PRECISION_MIN - 0.001)))

    def test_fails_at_090_accept_precision(self):
        # The full "unlimited import script exits 1, writes no CSV" acceptance
        # example (Plan 010 AE4) is proven at the validate_labels.py CLI level
        # (U6); this pins the same precision boundary one layer down.
        self.assertFalse(passes_thresholds(**self._ok(accept_precision=0.90)))

    def test_passes_at_exactly_the_sensitive_recall_minimum(self):
        self.assertTrue(passes_thresholds(**self._ok(sensitive_recall=LABEL_SENSITIVE_RECALL_MIN)))

    def test_fails_just_below_the_sensitive_recall_minimum(self):
        self.assertFalse(passes_thresholds(**self._ok(sensitive_recall=LABEL_SENSITIVE_RECALL_MIN - 0.001)))

    def test_fails_at_49_of_50_sensitive_recall_when_min_is_098(self):
        self.assertAlmostEqual(49 / 50, 0.98)
        self.assertTrue(passes_thresholds(**self._ok(sensitive_recall=49 / 50)))
        self.assertFalse(passes_thresholds(**self._ok(sensitive_recall=48 / 50)))

    def test_fails_when_held_out_is_empty(self):
        self.assertFalse(passes_thresholds(**self._ok(held_out_count=0)))

    def test_fails_when_there_are_no_sensitive_rejects_to_measure(self):
        self.assertFalse(passes_thresholds(**self._ok(sensitive_total=0)))

    def test_fails_when_any_held_out_word_is_missing_from_the_candidate(self):
        self.assertFalse(passes_thresholds(**self._ok(missing=["G0"])))

    def test_fails_when_any_held_out_word_is_duplicated_in_the_candidate(self):
        self.assertFalse(passes_thresholds(**self._ok(duplicate=["G0"])))


class EvaluateIntegrationTests(unittest.TestCase):
    """End-to-end `evaluate()` tests. Golden/candidate are built directly as the
    held-out set by patching `split_golden`, so these pin exact behaviour without
    depending on which hash bucket a given test word falls into."""

    def _evaluate_with_held_out(self, held_out, candidate):
        with patch.object(el, "split_golden", return_value=([], with_ids(held_out))):
            return evaluate(held_out, candidate)

    def test_passes_when_candidate_matches_every_held_out_word(self):
        held_out = [golden_accept(f"A{i}") for i in range(18)] + [
            golden_reject(f"S{i}", "sensitive") for i in range(2)
        ]
        candidate = [candidate_accept(f"A{i}") for i in range(18)] + [
            candidate_reject(f"S{i}", "sensitive") for i in range(2)
        ]
        report = self._evaluate_with_held_out(held_out, candidate)
        self.assertTrue(report["passes"])

    def test_fails_on_an_empty_candidate_rather_than_passing_vacuously(self):
        held_out = [golden_accept(f"A{i}") for i in range(10)] + [golden_reject("S0", "sensitive")]
        report = self._evaluate_with_held_out(held_out, [])
        self.assertFalse(report["passes"])
        self.assertTrue(report["integrity"]["missing"])

    def test_fails_on_an_all_reject_candidate_rather_than_passing_vacuously(self):
        held_out = [golden_accept(f"A{i}") for i in range(10)] + [golden_reject("S0", "sensitive")]
        candidate = [candidate_reject(f"A{i}") for i in range(10)] + [candidate_reject("S0", "sensitive")]
        report = self._evaluate_with_held_out(held_out, candidate)
        self.assertFalse(report["passes"])
        self.assertEqual(report["accept"]["precision"], 0.0)

    def test_fails_on_an_all_accept_candidate_with_lowercase_words(self):
        # Before normalization, lowercase candidate words silently failed to match
        # the uppercase golden words and looked like "nothing was accepted" --
        # including the sensitive reject, which would have looked "caught".
        held_out = [golden_accept(f"A{i}") for i in range(10)] + [golden_reject("S0", "sensitive")]
        candidate = [candidate_accept(f"a{i}") for i in range(10)] + [candidate_accept("s0")]
        report = self._evaluate_with_held_out(held_out, candidate)
        self.assertFalse(report["integrity"]["missing"])
        self.assertFalse(report["passes"])
        self.assertEqual(report["reject_reason_recall"]["sensitive"]["misses"], ["G10"])

    def test_fails_when_a_held_out_word_is_missing_from_the_candidate(self):
        held_out = [golden_accept("A0"), golden_accept("A1"), golden_reject("S0", "sensitive")]
        candidate = [candidate_accept("A0"), candidate_reject("S0", "sensitive")]  # A1 missing
        report = self._evaluate_with_held_out(held_out, candidate)
        self.assertFalse(report["passes"])
        self.assertIn("G1", report["integrity"]["missing"])

    def test_fails_when_a_held_out_word_is_duplicated_in_the_candidate(self):
        held_out = [golden_accept("A0"), golden_reject("S0", "sensitive")]
        candidate = [candidate_accept("A0"), candidate_reject("A0"), candidate_reject("S0", "sensitive")]
        report = self._evaluate_with_held_out(held_out, candidate)
        self.assertFalse(report["passes"])
        self.assertIn("G0", report["integrity"]["duplicate"])

    def test_a_duplicate_with_accept_then_reject_still_fails_despite_last_entry_winning(self):
        # Regression for a "last write wins" bug: if the duplicate check only
        # inspected the final entry for a word, an accept-then-reject duplicate
        # would look like a clean single reject and silently pass.
        held_out = [golden_reject("S0", "sensitive")]
        candidate = [candidate_accept("S0"), candidate_reject("S0", "sensitive")]
        report = self._evaluate_with_held_out(held_out, candidate)
        self.assertFalse(report["passes"])
        self.assertIn("G0", report["integrity"]["duplicate"])

    def test_counts_candidate_words_outside_the_held_out_set_without_failing_on_them(self):
        held_out = [golden_accept("A0"), golden_reject("S0", "sensitive")]
        candidate = [
            candidate_accept("A0"),
            candidate_reject("S0", "sensitive"),
            candidate_accept("CALIBRATION_WORD"),
        ]
        report = self._evaluate_with_held_out(held_out, candidate)
        self.assertTrue(report["passes"])
        self.assertEqual(report["integrity"]["extra_candidate_words"], 1)

    def test_fails_when_the_held_out_set_has_no_sensitive_rejects(self):
        held_out = [golden_accept(f"A{i}") for i in range(10)]
        candidate = [candidate_accept(f"A{i}") for i in range(10)]
        report = self._evaluate_with_held_out(held_out, candidate)
        self.assertEqual(report["reject_reason_recall"]["sensitive"]["total"], 0)
        self.assertFalse(report["passes"])

    def test_evaluate_rejects_a_golden_set_with_a_duplicate_word(self):
        golden = [golden_accept("A0"), golden_accept("a0")]  # same word, different case
        with self.assertRaises(ValueError):
            evaluate(golden, [])


class LoadersTests(unittest.TestCase):
    def test_load_golden_assigns_a_stable_id_per_line_in_file_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "golden.jsonl")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write('{"word": "A0", "decision": "accept"}\n')
                handle.write('{"word": "A1", "decision": "accept"}\n')
            golden = load_golden(path)
            self.assertEqual([entry["id"] for entry in golden], ["G0", "G1"])

    def test_load_golden_raises_on_a_duplicate_normalized_word(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "golden.jsonl")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write('{"word": "KALEM", "decision": "accept"}\n')
                handle.write('{"word": "kalem", "decision": "reject", "reason": "other"}\n')
            with self.assertRaises(ValueError):
                load_golden(path)

    def test_load_candidate_normalizes_words(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "candidate.jsonl")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write('{"word": "kalem", "decision": "accept"}\n')
            candidate = load_candidate(path)
            self.assertEqual(candidate, [{"word": "KALEM", "decision": "accept"}])


class MainCliTests(unittest.TestCase):
    def _write_jsonl(self, path, labels):
        with open(path, "w", encoding="utf-8") as handle:
            for label in labels:
                handle.write(json.dumps(label, ensure_ascii=False) + "\n")

    def test_exits_nonzero_when_the_report_does_not_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            golden_path = os.path.join(tmp, "golden.jsonl")
            candidate_path = os.path.join(tmp, "candidate.jsonl")
            self._write_jsonl(golden_path, [golden_accept(f"A{i}") for i in range(50)])
            self._write_jsonl(candidate_path, [])
            argv = ["eval_labels.py", "--golden", golden_path, "--candidate", candidate_path]
            with patch.object(sys, "argv", argv):
                with self.assertRaises(SystemExit) as ctx:
                    el.main()
            self.assertEqual(ctx.exception.code, 1)

    def test_exits_zero_when_the_report_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            golden_path = os.path.join(tmp, "golden.jsonl")
            candidate_path = os.path.join(tmp, "candidate.jsonl")
            # A candidate that matches every golden word exactly covers whichever
            # half the real (unpatched) hash split puts into held-out.
            golden = [golden_accept(f"A{i}") for i in range(200)] + [
                golden_reject(f"S{i}", "sensitive") for i in range(20)
            ]
            candidate = [candidate_accept(f"A{i}") for i in range(200)] + [
                candidate_reject(f"S{i}", "sensitive") for i in range(20)
            ]
            self._write_jsonl(golden_path, golden)
            self._write_jsonl(candidate_path, candidate)
            argv = ["eval_labels.py", "--golden", golden_path, "--candidate", candidate_path]
            with patch.object(sys, "argv", argv):
                el.main()


if __name__ == "__main__":
    unittest.main()

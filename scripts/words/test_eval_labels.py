import json
import os
import sys
import tempfile
import unicodedata
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
    return {"word": word, "decision": "accept", **overrides}


def golden_reject(word, reason):
    return {"word": word, "decision": "reject", "reason": reason}


def candidate_accept(word):
    return {"word": word, "decision": "accept"}


def candidate_reject(word, reason="other"):
    return {"word": word, "decision": "reject", "reason": reason}


def with_ids(golden):
    return [{**entry, "id": f"G{i}"} for i, entry in enumerate(golden)]


class NormalizeWordTests(unittest.TestCase):
    def test_normalizes_case_whitespace_and_nfd_consistently(self):
        self.assertEqual(normalize_word("kalem"), "KALEM")
        self.assertEqual(normalize_word("izmir"), "İZMİR")  # Turkish dotless/dotted i
        self.assertEqual(normalize_word("  kalem \n"), "KALEM")
        nfc = unicodedata.normalize("NFC", "KALEMİ")
        nfd = unicodedata.normalize("NFD", "KALEMİ")
        self.assertNotEqual(nfc, nfd)  # sanity: the inputs really differ byte-wise
        self.assertEqual(normalize_word(nfc), normalize_word(nfd))


class SplitGoldenTests(unittest.TestCase):
    def test_every_word_lands_in_exactly_one_half_regardless_of_list_order(self):
        golden = with_ids([golden_accept(f"W{i}") for i in range(50)])
        calibration, held_out = split_golden(golden)
        calibration_words = {entry["word"] for entry in calibration}
        held_out_words = {entry["word"] for entry in held_out}
        self.assertEqual(calibration_words & held_out_words, set())
        self.assertEqual(calibration_words | held_out_words, {f"W{i}" for i in range(50)})
        reversed_held_out = {entry["word"] for entry in split_golden(list(reversed(golden)))[1]}
        self.assertEqual(held_out_words, reversed_held_out)


class ScoreAcceptTests(unittest.TestCase):
    def test_reports_perfect_precision_and_recall_when_candidate_matches_golden(self):
        held_out = with_ids([golden_accept("A1"), golden_reject("A3", "verb_form")])
        candidate_by_word = {"A1": candidate_accept("A1"), "A3": candidate_reject("A3", "verb_form")}
        report = score_accept(held_out, candidate_by_word)
        self.assertEqual(report["precision"], 1.0)
        self.assertEqual(report["recall"], 1.0)

    def test_reduced_precision_and_recall_from_a_wrong_accept_and_a_missing_entry(self):
        held_out = with_ids([golden_accept("A1"), golden_reject("A3", "verb_form")])
        # A1 missing (recall loss); A3 wrongly accepted (precision loss).
        report = score_accept(held_out, {"A3": candidate_accept("A3")})
        self.assertEqual(report["precision"], 0.0)
        self.assertEqual(report["recall"], 0.0)

    def test_an_all_reject_or_empty_candidate_scores_zero_precision_not_a_vacuous_pass(self):
        # Zero predicted accepts proves nothing; it must not read as perfect precision.
        held_out = with_ids([golden_accept("A0"), golden_reject("A2", "verb_form")])
        all_reject = {"A0": candidate_reject("A0"), "A2": candidate_reject("A2")}
        for label, candidate_by_word in [("all-reject", all_reject), ("empty", {})]:
            with self.subTest(candidate=label):
                self.assertEqual(score_accept(held_out, candidate_by_word)["precision"], 0.0)


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

    def test_recall_counts_a_catch_under_any_reason_and_reports_zero_total_when_absent(self):
        held_out = with_ids([golden_reject("A1", "sensitive")])
        # A catch counts under any reason, not just the golden set's exact one.
        caught_under_other_reason = {"A1": candidate_reject("A1", reason="other")}
        self.assertEqual(score_reason_recall(held_out, caught_under_other_reason, "sensitive")["recall"], 1.0)
        no_sensitive_entries = with_ids([golden_accept("A0")])
        self.assertEqual(score_reason_recall(no_sensitive_entries, {}, "sensitive")["total"], 0)


class ProperNounAndForeignRecallTests(unittest.TestCase):
    def test_also_reports_recall_for_proper_noun_and_foreign_reasons(self):
        held_out = with_ids([golden_reject("A1", "proper_noun"), golden_reject("A3", "foreign")])
        candidate_by_word = {"A1": candidate_accept("A1"), "A3": candidate_reject("A3")}
        self.assertEqual(score_reason_recall(held_out, candidate_by_word, "proper_noun")["recall"], 0.0)
        self.assertEqual(score_reason_recall(held_out, candidate_by_word, "foreign")["recall"], 1.0)


class PassesThresholdsTests(unittest.TestCase):
    # Pure boundary tests, independent of the golden-set hash split.
    def _ok(self, **overrides):
        base = dict(
            accept_precision=1.0, sensitive_recall=1.0, sensitive_total=1,
            held_out_count=1, missing=[], duplicate=[],
        )
        base.update(overrides)
        return base

    def test_thresholds_are_pinned_to_the_plan_010_r5_literal_values(self):
        # Independent of LABEL_ACCEPT_PRECISION_MIN/LABEL_SENSITIVE_RECALL_MIN's current
        # value, so a mutant that changes either constant still fails this test.
        self.assertEqual(LABEL_ACCEPT_PRECISION_MIN, 0.95)
        self.assertEqual(LABEL_SENSITIVE_RECALL_MIN, 0.98)
        self.assertTrue(passes_thresholds(**self._ok(accept_precision=0.95)))
        self.assertFalse(passes_thresholds(**self._ok(accept_precision=0.949)))
        self.assertTrue(passes_thresholds(**self._ok(sensitive_recall=0.98)))
        self.assertFalse(passes_thresholds(**self._ok(sensitive_recall=0.979)))

    def test_accept_precision_boundary_at_the_minimum_and_at_090(self):
        self.assertTrue(passes_thresholds(**self._ok(accept_precision=LABEL_ACCEPT_PRECISION_MIN)))
        self.assertFalse(passes_thresholds(**self._ok(accept_precision=LABEL_ACCEPT_PRECISION_MIN - 0.001)))
        # Plan 010 AE4 ("accept precision 0.90 -> import exits 1") is proven at the
        # validate_labels.py CLI level (U6); this pins the same boundary here too.
        self.assertFalse(passes_thresholds(**self._ok(accept_precision=0.90)))

    def test_sensitive_recall_boundary_at_the_minimum_and_at_49_of_50(self):
        self.assertTrue(passes_thresholds(**self._ok(sensitive_recall=LABEL_SENSITIVE_RECALL_MIN)))
        self.assertFalse(passes_thresholds(**self._ok(sensitive_recall=LABEL_SENSITIVE_RECALL_MIN - 0.001)))
        self.assertAlmostEqual(49 / 50, 0.98)
        self.assertTrue(passes_thresholds(**self._ok(sensitive_recall=49 / 50)))
        self.assertFalse(passes_thresholds(**self._ok(sensitive_recall=48 / 50)))

    def test_fails_on_any_integrity_or_coverage_gap(self):
        gaps = dict(
            held_out_count=0, sensitive_total=0, missing=["G0"], duplicate=["G0"],
        )
        for field, value in gaps.items():
            with self.subTest(field=field):
                self.assertFalse(passes_thresholds(**self._ok(**{field: value})))


class EvaluateIntegrationTests(unittest.TestCase):
    # End-to-end evaluate() tests; split_golden is patched so held_out is exactly
    # what each test builds, independent of which hash bucket a word falls into.
    def _evaluate_with_held_out(self, held_out, candidate):
        with patch.object(el, "split_golden", return_value=([], with_ids(held_out))):
            return evaluate(held_out, candidate)

    def test_passes_when_candidate_matches_every_held_out_word(self):
        held_out = [golden_accept(f"A{i}") for i in range(18)] + [
            golden_reject(f"S{i}", "sensitive") for i in range(2)
        ]
        # A reject reason differing from golden's ("obscure" vs "sensitive") still counts
        # as caught (score_reason_recall), and keeps this a genuine match rather than a
        # byte-identical copy of golden's decisions.
        candidate = [candidate_accept(f"A{i}") for i in range(18)] + [
            candidate_reject(f"S{i}", "obscure") for i in range(2)
        ]
        self.assertTrue(self._evaluate_with_held_out(held_out, candidate)["passes"])

    def test_fails_on_an_empty_or_all_reject_candidate_rather_than_passing_vacuously(self):
        held_out = [golden_accept(f"A{i}") for i in range(10)] + [golden_reject("S0", "sensitive")]
        empty_report = self._evaluate_with_held_out(held_out, [])
        self.assertFalse(empty_report["passes"])
        self.assertTrue(empty_report["integrity"]["missing"])

        all_reject = [candidate_reject(f"A{i}") for i in range(10)] + [candidate_reject("S0", "sensitive")]
        all_reject_report = self._evaluate_with_held_out(held_out, all_reject)
        self.assertFalse(all_reject_report["passes"])
        self.assertEqual(all_reject_report["accept"]["precision"], 0.0)

    def test_fails_on_an_all_accept_candidate_with_lowercase_words(self):
        # Before normalization, lowercase candidate words looked unmatched -- including
        # the sensitive reject, which would have looked "caught".
        held_out = [golden_accept(f"A{i}") for i in range(10)] + [golden_reject("S0", "sensitive")]
        candidate = [candidate_accept(f"a{i}") for i in range(10)] + [candidate_accept("s0")]
        report = self._evaluate_with_held_out(held_out, candidate)
        self.assertFalse(report["integrity"]["missing"])
        self.assertFalse(report["passes"])
        self.assertEqual(report["reject_reason_recall"]["sensitive"]["misses"], ["G10"])

    def test_fails_when_a_held_out_word_is_missing_or_duplicated_in_the_candidate(self):
        held_out = [golden_accept("A0"), golden_accept("A1"), golden_reject("S0", "sensitive")]
        missing_report = self._evaluate_with_held_out(
            held_out, [candidate_accept("A0"), candidate_reject("S0", "sensitive")]  # A1 missing
        )
        self.assertFalse(missing_report["passes"])
        self.assertIn("G1", missing_report["integrity"]["missing"])

        # Regression: a "last write wins" dict build let an accept-then-reject
        # duplicate look like a clean single reject.
        duplicate_held_out = [golden_reject("S0", "sensitive")]
        duplicate_report = self._evaluate_with_held_out(
            duplicate_held_out, [candidate_accept("S0"), candidate_reject("S0", "sensitive")]
        )
        self.assertFalse(duplicate_report["passes"])
        self.assertIn("G0", duplicate_report["integrity"]["duplicate"])


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
            self.assertEqual(load_candidate(path), [{"word": "KALEM", "decision": "accept"}])

    def test_load_golden_and_load_candidate_raise_value_error_on_a_malformed_row(self):
        # A non-object row, or a non-string "word", must raise ValueError instead of
        # crashing with an unhandled TypeError/AttributeError (see validate_labels.py).
        bad_rows = ['"just a string"', "[1, 2]", '{"word": null}', '{"word": 5}']
        for bad_row in bad_rows:
            with tempfile.TemporaryDirectory() as tmp:
                golden_path = os.path.join(tmp, "golden.jsonl")
                with open(golden_path, "w", encoding="utf-8") as handle:
                    handle.write('{"word": "A0", "decision": "accept"}\n' + bad_row + "\n")
                candidate_path = os.path.join(tmp, "candidate.jsonl")
                with open(candidate_path, "w", encoding="utf-8") as handle:
                    handle.write(bad_row + "\n")
                with self.subTest(loader="load_golden", bad_row=bad_row):
                    with self.assertRaises(ValueError):
                        load_golden(golden_path)
                with self.subTest(loader="load_candidate", bad_row=bad_row):
                    with self.assertRaises(ValueError):
                        load_candidate(candidate_path)


class MainCliTests(unittest.TestCase):
    def _write_jsonl(self, path, labels):
        with open(path, "w", encoding="utf-8") as handle:
            for label in labels:
                handle.write(json.dumps(label, ensure_ascii=False) + "\n")

    def _run(self, tmp, golden, candidate):
        golden_path, candidate_path = os.path.join(tmp, "golden.jsonl"), os.path.join(tmp, "candidate.jsonl")
        self._write_jsonl(golden_path, golden)
        self._write_jsonl(candidate_path, candidate)
        argv = ["eval_labels.py", "--golden", golden_path, "--candidate", candidate_path]
        with patch.object(sys, "argv", argv):
            el.main()

    def test_exits_nonzero_when_the_report_does_not_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(SystemExit) as ctx:
                self._run(tmp, [golden_accept(f"A{i}") for i in range(50)], [])
            self.assertEqual(ctx.exception.code, 1)

    def test_exits_zero_when_the_report_passes(self):
        # Covers whichever half the real (unpatched) hash split puts into held-out. The
        # reject reason ("obscure" vs golden's "sensitive") differs so this is a genuine
        # match, not a byte-identical copy of golden's decisions.
        golden = [golden_accept(f"A{i}") for i in range(200)] + [
            golden_reject(f"S{i}", "sensitive") for i in range(20)
        ]
        candidate = [candidate_accept(f"A{i}") for i in range(200)] + [
            candidate_reject(f"S{i}", "obscure") for i in range(20)
        ]
        with tempfile.TemporaryDirectory() as tmp:
            self._run(tmp, golden, candidate)


if __name__ == "__main__":
    unittest.main()

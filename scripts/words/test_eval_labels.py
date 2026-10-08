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
    split_golden,
)


def golden_accept(word):
    return {"word": word, "decision": "accept"}


def golden_reject(word, reason):
    return {"word": word, "decision": "reject", "reason": reason}


def candidate_accept(word):
    return {"word": word, "decision": "accept"}


def candidate_reject(word, reason="other"):
    return {"word": word, "decision": "reject", "reason": reason}


class SplitGoldenTests(unittest.TestCase):
    def test_splits_into_two_equal_deterministic_halves_by_file_order(self):
        golden = [golden_accept(f"W{i}") for i in range(6)]
        calibration, held_out = split_golden(golden)
        self.assertEqual([entry["word"] for entry in calibration], ["W0", "W2", "W4"])
        self.assertEqual([entry["word"] for entry in held_out], ["W1", "W3", "W5"])

    def test_is_stable_across_repeated_calls_on_the_same_input(self):
        golden = [golden_accept(f"W{i}") for i in range(5)]
        first = split_golden(golden)
        second = split_golden(golden)
        self.assertEqual(first, second)


class EvaluateAcceptMetricsTests(unittest.TestCase):
    def test_reports_perfect_precision_and_recall_when_candidate_matches_golden(self):
        golden = [golden_accept("KALEM"), golden_accept("MASA"), golden_reject("GELDİ", "verb_form")]
        # held-out half is index 1 only (MASA) under this 3-entry split; build a
        # held-out-only scenario by duplicating pairs so index 1/3 land on known words.
        golden = [
            golden_accept("A0"), golden_accept("A1"),
            golden_accept("A2"), golden_reject("A3", "verb_form"),
        ]
        candidate = [candidate_accept("A1"), candidate_reject("A3", "verb_form")]
        report = evaluate(golden, candidate)
        self.assertEqual(report["accept"]["precision"], 1.0)
        self.assertEqual(report["accept"]["recall"], 1.0)

    def test_reports_reduced_precision_when_a_held_out_reject_is_accepted(self):
        golden = [
            golden_accept("A0"), golden_accept("A1"),
            golden_reject("A2", "verb_form"), golden_reject("A3", "verb_form"),
        ]
        # held out = index 1, 3 -> A1 (accept), A3 (reject/verb_form)
        candidate = [candidate_accept("A1"), candidate_accept("A3")]
        report = evaluate(golden, candidate)
        self.assertEqual(report["accept"]["precision"], 0.5)

    def test_treats_a_missing_candidate_entry_as_not_accepted(self):
        golden = [golden_accept("A0"), golden_accept("A1")]
        report = evaluate(golden, [])
        self.assertEqual(report["accept"]["precision"], 1.0)
        self.assertEqual(report["accept"]["recall"], 0.0)

    def test_treats_zero_denominator_as_a_vacuous_pass(self):
        golden = [golden_reject("A0", "verb_form"), golden_reject("A1", "verb_form")]
        report = evaluate(golden, [candidate_reject("A1")])
        self.assertEqual(report["accept"]["precision"], 1.0)
        self.assertEqual(report["accept"]["recall"], 1.0)


class SensitiveRecallAcceptanceTests(unittest.TestCase):
    def test_reports_sensitive_recall_below_one_when_a_batch_accepts_a_golden_sensitive_reject_010_AE3(self):
        golden = [
            golden_accept("A0"), golden_reject("A1", "sensitive"),
            golden_accept("A2"), golden_reject("A3", "sensitive"),
        ]
        # held out = A1, A3 (both sensitive rejects); candidate wrongly accepts A3.
        candidate = [candidate_reject("A1", "sensitive"), candidate_accept("A3")]
        report = evaluate(golden, candidate)
        self.assertLess(report["reject_reason_recall"]["sensitive"]["recall"], 1.0)

    def test_names_the_golden_entrys_id_not_the_word_in_a_sensitive_miss_010_AE3(self):
        golden = [
            golden_accept("A0"), golden_reject("YARRAK", "sensitive"),
        ]
        candidate = [candidate_accept("YARRAK")]
        report = evaluate(golden, candidate)
        misses = report["reject_reason_recall"]["sensitive"]["misses"]
        self.assertEqual(misses, ["G1"])
        self.assertNotIn("YARRAK", json.dumps(report, ensure_ascii=False))

    def test_recall_is_perfect_when_every_sensitive_reject_is_caught(self):
        golden = [
            golden_accept("A0"), golden_reject("A1", "sensitive"),
            golden_accept("A2"), golden_reject("A3", "sensitive"),
        ]
        candidate = [candidate_reject("A1"), candidate_reject("A3")]
        report = evaluate(golden, candidate)
        self.assertEqual(report["reject_reason_recall"]["sensitive"]["recall"], 1.0)

    def test_catching_a_sensitive_word_under_a_different_reason_still_counts(self):
        # Family protection cares that the word was NOT approved, not that the
        # batch guessed the exact same reason the golden set used.
        golden = [golden_accept("A0"), golden_reject("A1", "sensitive")]
        candidate = [candidate_reject("A1", reason="other")]
        report = evaluate(golden, candidate)
        self.assertEqual(report["reject_reason_recall"]["sensitive"]["recall"], 1.0)


class ProperNounAndForeignRecallTests(unittest.TestCase):
    def test_also_reports_recall_for_proper_noun_and_foreign_reasons(self):
        golden = [
            golden_accept("A0"), golden_reject("A1", "proper_noun"),
            golden_accept("A2"), golden_reject("A3", "foreign"),
        ]
        candidate = [candidate_accept("A1"), candidate_reject("A3")]
        report = evaluate(golden, candidate)
        self.assertEqual(report["reject_reason_recall"]["proper_noun"]["recall"], 0.0)
        self.assertEqual(report["reject_reason_recall"]["foreign"]["recall"], 1.0)


class ThresholdGateTests(unittest.TestCase):
    def test_passes_when_accept_precision_and_sensitive_recall_meet_the_minimums(self):
        golden = [golden_accept(f"A{i}") for i in range(40)]
        candidate = [candidate_accept(f"A{i}") for i in range(1, 40, 2)]
        report = evaluate(golden, candidate)
        self.assertTrue(report["passes"])

    def test_fails_when_accept_precision_is_below_the_threshold(self):
        # 20 held-out entries, 10 are golden rejects wrongly accepted -> precision 0.5.
        golden = []
        for i in range(20):
            golden.append(golden_accept(f"C{i}"))
            golden.append(golden_reject(f"R{i}", "other"))
        candidate = [candidate_accept(f"C{i}") for i in range(20)] + [
            candidate_accept(f"R{i}") for i in range(20)
        ]
        report = evaluate(golden, candidate)
        self.assertLess(report["accept"]["precision"], LABEL_ACCEPT_PRECISION_MIN)
        self.assertFalse(report["passes"])

    def test_fails_when_sensitive_recall_is_below_the_threshold(self):
        golden = [golden_accept(f"A{i}") for i in range(10)]
        golden += [golden_reject(f"S{i}", "sensitive") for i in range(10)]
        # held out -> half of each; accept every held-out sensitive reject.
        _, held_out = split_golden(golden)
        candidate = [candidate_accept(entry["word"]) for entry in held_out]
        report = evaluate(golden, candidate)
        self.assertLess(report["reject_reason_recall"]["sensitive"]["recall"], LABEL_SENSITIVE_RECALL_MIN)
        self.assertFalse(report["passes"])


class LoadersTests(unittest.TestCase):
    def test_load_golden_assigns_a_stable_id_per_line_in_file_order(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "golden.jsonl")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write('{"word": "A0", "decision": "accept"}\n')
                handle.write('{"word": "A1", "decision": "accept"}\n')
            golden = load_golden(path)
            self.assertEqual([entry["id"] for entry in golden], ["G0", "G1"])

    def test_load_candidate_reads_plain_jsonl_without_ids(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "candidate.jsonl")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write('{"word": "A0", "decision": "accept"}\n')
            candidate = load_candidate(path)
            self.assertEqual(candidate, [{"word": "A0", "decision": "accept"}])


class MainCliTests(unittest.TestCase):
    def _write_jsonl(self, path, labels):
        with open(path, "w", encoding="utf-8") as handle:
            for label in labels:
                handle.write(json.dumps(label, ensure_ascii=False) + "\n")

    def test_exits_nonzero_when_the_report_does_not_pass(self):
        with tempfile.TemporaryDirectory() as tmp:
            golden_path = os.path.join(tmp, "golden.jsonl")
            candidate_path = os.path.join(tmp, "candidate.jsonl")
            golden = []
            for i in range(20):
                golden.append(golden_accept(f"C{i}"))
                golden.append(golden_reject(f"R{i}", "other"))
            self._write_jsonl(golden_path, golden)
            self._write_jsonl(
                candidate_path,
                [candidate_accept(f"C{i}") for i in range(20)]
                + [candidate_accept(f"R{i}") for i in range(20)],
            )
            argv = ["eval_labels.py", "--golden", golden_path, "--candidate", candidate_path]
            with patch.object(sys, "argv", argv):
                with self.assertRaises(SystemExit) as ctx:
                    el.main()
            self.assertEqual(ctx.exception.code, 1)

    def test_exits_zero_when_the_report_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            golden_path = os.path.join(tmp, "golden.jsonl")
            candidate_path = os.path.join(tmp, "candidate.jsonl")
            golden = [golden_accept(f"A{i}") for i in range(40)]
            self._write_jsonl(golden_path, golden)
            self._write_jsonl(candidate_path, [candidate_accept(f"A{i}") for i in range(1, 40, 2)])
            argv = ["eval_labels.py", "--golden", golden_path, "--candidate", candidate_path]
            with patch.object(sys, "argv", argv):
                el.main()


if __name__ == "__main__":
    unittest.main()

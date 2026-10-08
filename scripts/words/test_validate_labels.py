import unittest

import contextlib
import csv
import io
import json
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


class MainCliHelpers:
    def _write(self, tmp, name, content):
        with open(os.path.join(tmp, name), "w", encoding="utf-8") as handle:
            handle.write(content)

    def _run_main(self, tmp, argv):
        with patch.object(vl, "REVIEW_DIR", tmp), patch.object(sys, "argv", ["validate_labels.py"] + argv):
            vl.main()

    def _run_main_capturing_stderr(self, tmp, argv):
        stderr = io.StringIO()
        with self.assertRaises(SystemExit) as ctx:
            with contextlib.redirect_stderr(stderr):
                self._run_main(tmp, argv)
        return ctx.exception.code, stderr.getvalue()

    def _write_passing_eval(self, tmp):
        # The candidate matches every golden word's decision (accept + sensitive-reject
        # rows), so whichever half the real hash split puts into held-out, it is fully
        # covered and both accept precision and sensitive recall are 1.0. The reject
        # reason ("obscure" vs golden's "sensitive") differs so this is a genuine match,
        # not a byte-identical copy of golden's decisions.
        golden = [{"word": f"A{i}", "decision": "accept"} for i in range(60)]
        golden += [{"word": f"S{i}", "decision": "reject", "reason": "sensitive"} for i in range(10)]
        candidate = [{"word": f"A{i}", "decision": "accept"} for i in range(60)]
        candidate += [{"word": f"S{i}", "decision": "reject", "reason": "obscure"} for i in range(10)]
        self._write(tmp, "labels-5.jsonl", "\n".join(json.dumps(label) for label in golden) + "\n")
        self._write(tmp, "candidate.jsonl", "\n".join(json.dumps(label) for label in candidate) + "\n")


class MainIntegrationTests(MainCliHelpers, unittest.TestCase):
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
            self._write_passing_eval(tmp)
            self._run_main(
                tmp,
                ["--length", "5", "--pool", "unlimited", "--eval-candidate", os.path.join(tmp, "candidate.jsonl")],
            )
            self.assertTrue(os.path.exists(os.path.join(tmp, "unlimited-5.csv")))
            self.assertFalse(os.path.exists(os.path.join(tmp, "review-5.csv")))


class UnlimitedImportEvalGateTests(MainCliHelpers, unittest.TestCase):
    def test_blocks_when_no_eval_candidate_is_given(self):
        # The gate must land before any model-labelled unlimited batch is
        # imported: no eval supplied means no trust, so the import refuses.
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            with self.assertRaises(SystemExit) as ctx:
                self._run_main(tmp, ["--length", "5", "--pool", "unlimited"])
            self.assertEqual(ctx.exception.code, 1)
            self.assertFalse(os.path.exists(os.path.join(tmp, "unlimited-5.csv")))

    def test_exits_nonzero_and_writes_no_csv_below_accept_precision_010_AE4(self):
        # Held-out: 18 true accepts (candidate accepts all), 2 false accepts (golden
        # rejects, candidate wrongly accepts) -> accept precision 18/20 = 0.90, below
        # the 0.95 minimum. 5 sensitive rejects, all correctly caught (recall 1.0), so
        # the fail here is specifically the accept-precision threshold, not a vacuous
        # "no sensitive rejects to measure" short-circuit.
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            held_out = (
                [{"word": f"A{i}", "decision": "accept", "id": f"G{i}"} for i in range(18)]
                + [{"word": f"R{i}", "decision": "reject", "reason": "other", "id": f"G{18 + i}"} for i in range(2)]
                + [{"word": f"S{i}", "decision": "reject", "reason": "sensitive", "id": f"G{20 + i}"} for i in range(5)]
            )
            self._write(tmp, "labels-5.jsonl", "\n".join(json.dumps(entry) for entry in held_out) + "\n")
            candidate = (
                [json.dumps({"word": f"A{i}", "decision": "accept"}) for i in range(18)]
                + [json.dumps({"word": f"R{i}", "decision": "accept"}) for i in range(2)]
                + [json.dumps({"word": f"S{i}", "decision": "reject", "reason": "sensitive"}) for i in range(5)]
            )
            self._write(tmp, "candidate.jsonl", "\n".join(candidate) + "\n")
            with patch.object(vl.eval_labels, "split_golden", return_value=([], held_out)):
                with self.assertRaises(SystemExit) as ctx:
                    self._run_main(
                        tmp,
                        [
                            "--length", "5", "--pool", "unlimited",
                            "--eval-candidate", os.path.join(tmp, "candidate.jsonl"),
                        ],
                    )
            self.assertEqual(ctx.exception.code, 1)
            self.assertFalse(os.path.exists(os.path.join(tmp, "unlimited-5.csv")))

    def test_daily_pool_import_is_unaffected_by_the_eval_gate(self):
        # R5 only gates the unlimited pool; the daily pool keeps owner review as its
        # quality gate and must not require an eval candidate.
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            self._run_main(tmp, ["--length", "5"])
            self.assertTrue(os.path.exists(os.path.join(tmp, "review-5.csv")))

    def test_blocks_when_the_eval_candidate_path_does_not_exist(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            self._write_passing_eval(tmp)
            with self.assertRaises(SystemExit) as ctx:
                self._run_main(
                    tmp,
                    [
                        "--length", "5", "--pool", "unlimited",
                        "--eval-candidate", os.path.join(tmp, "does-not-exist.jsonl"),
                    ],
                )
            self.assertEqual(ctx.exception.code, 1)
            self.assertFalse(os.path.exists(os.path.join(tmp, "unlimited-5.csv")))

    def test_blocks_when_the_default_golden_file_is_missing_for_a_length_with_no_golden_set(self):
        # Length 4 has no committed golden set yet (Plan 010 KTD1), so the default
        # --golden path does not exist; the gate must fail closed, not skip itself.
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-4.txt", "KALE\n")
            self._write(tmp, "labels-unlimited-4.jsonl", '{"word": "KALE", "decision": "accept"}\n')
            self._write(tmp, "candidate.jsonl", '{"word": "A0", "decision": "accept"}\n')
            with self.assertRaises(SystemExit) as ctx:
                self._run_main(
                    tmp,
                    [
                        "--length", "4", "--pool", "unlimited",
                        "--eval-candidate", os.path.join(tmp, "candidate.jsonl"),
                    ],
                )
            self.assertEqual(ctx.exception.code, 1)
            self.assertFalse(os.path.exists(os.path.join(tmp, "unlimited-4.csv")))

    def test_deletes_a_stale_unlimited_csv_when_the_eval_gate_fails(self):
        # A previous passing run may have left unlimited-5.csv behind. A later,
        # failing run must not leave that stale file in place, since it reflects an
        # earlier (possibly unrelated) batch, not the one that just failed.
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            stale_path = os.path.join(tmp, "unlimited-5.csv")
            self._write(tmp, "unlimited-5.csv", "word\r\nSTALEWORD\r\n")
            with self.assertRaises(SystemExit):
                self._run_main(tmp, ["--length", "5", "--pool", "unlimited"])
            self.assertFalse(os.path.exists(stale_path))

    def test_deletes_a_stale_review_csv_when_blocking_label_errors_are_found(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "pool-5.txt", "KALEM\nGELDİ\n")
            self._write(tmp, "labels-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')  # GELDİ missing
            stale_path = os.path.join(tmp, "review-5.csv")
            self._write(tmp, "review-5.csv", "word\r\nSTALEWORD\r\n")
            with self.assertRaises(SystemExit):
                self._run_main(tmp, ["--length", "5"])
            self.assertFalse(os.path.exists(stale_path))

    def test_prints_a_specific_reason_for_each_way_the_gate_cannot_be_measured(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            self._write_passing_eval(tmp)

            code, stderr = self._run_main_capturing_stderr(tmp, ["--length", "5", "--pool", "unlimited"])
            self.assertEqual(code, 1)
            self.assertIn("--eval-candidate is required", stderr)

            missing_candidate = os.path.join(tmp, "does-not-exist.jsonl")
            code, stderr = self._run_main_capturing_stderr(
                tmp, ["--length", "5", "--pool", "unlimited", "--eval-candidate", missing_candidate]
            )
            self.assertEqual(code, 1)
            self.assertIn("eval candidate file not found", stderr)
            self.assertIn(missing_candidate, stderr)

            self._write(tmp, "unlimited-pool-9.txt", "KALEMLERİ\n")
            self._write(tmp, "labels-unlimited-9.jsonl", '{"word": "KALEMLERİ", "decision": "accept"}\n')
            missing_golden = os.path.join(tmp, "labels-9.jsonl")
            code, stderr = self._run_main_capturing_stderr(
                tmp,
                [
                    "--length", "9", "--pool", "unlimited",
                    "--golden", missing_golden,
                    "--eval-candidate", os.path.join(tmp, "candidate.jsonl"),
                ],
            )
            self.assertEqual(code, 1)
            self.assertIn("golden file not found", stderr)
            self.assertIn(missing_golden, stderr)

    def test_blocks_when_the_eval_candidate_is_the_golden_file_itself(self):
        # Passing the golden file as --eval-candidate (directly, or via --golden X
        # --eval-candidate X) must not score as a measured, trustworthy run.
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            self._write_passing_eval(tmp)
            golden_path = os.path.join(tmp, "labels-5.jsonl")

            code, stderr = self._run_main_capturing_stderr(
                tmp, ["--length", "5", "--pool", "unlimited", "--eval-candidate", golden_path]
            )
            self.assertEqual(code, 1)
            self.assertIn("must not be the golden file itself", stderr)
            self.assertFalse(os.path.exists(os.path.join(tmp, "unlimited-5.csv")))

            code, _ = self._run_main_capturing_stderr(
                tmp,
                [
                    "--length", "5", "--pool", "unlimited",
                    "--golden", golden_path, "--eval-candidate", golden_path,
                ],
            )
            self.assertEqual(code, 1)

    def test_prints_a_reason_and_removes_the_stale_csv_when_the_candidate_file_is_malformed(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            self._write_passing_eval(tmp)
            self._write(tmp, "candidate.jsonl", "{not valid json\n")
            stale_path = os.path.join(tmp, "unlimited-5.csv")
            self._write(tmp, "unlimited-5.csv", "word\r\nSTALEWORD\r\n")

            code, stderr = self._run_main_capturing_stderr(
                tmp,
                [
                    "--length", "5", "--pool", "unlimited",
                    "--eval-candidate", os.path.join(tmp, "candidate.jsonl"),
                ],
            )
            self.assertEqual(code, 1)
            self.assertIn("failed to score eval candidate", stderr)
            self.assertFalse(os.path.exists(stale_path))

    def test_prints_a_reason_and_removes_the_stale_csv_when_a_golden_row_has_no_word(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            self._write(tmp, "labels-5.jsonl", '{"decision": "accept"}\n')  # no "word" key
            self._write(tmp, "candidate.jsonl", '{"word": "A0", "decision": "accept"}\n')
            stale_path = os.path.join(tmp, "unlimited-5.csv")
            self._write(tmp, "unlimited-5.csv", "word\r\nSTALEWORD\r\n")

            code, stderr = self._run_main_capturing_stderr(
                tmp,
                [
                    "--length", "5", "--pool", "unlimited",
                    "--eval-candidate", os.path.join(tmp, "candidate.jsonl"),
                ],
            )
            self.assertEqual(code, 1)
            self.assertIn("failed to score eval candidate", stderr)
            self.assertFalse(os.path.exists(stale_path))

    def test_removes_the_stale_csv_and_prints_a_reason_for_each_malformed_candidate_row(self):
        # A malformed row used to crash with an unhandled TypeError/AttributeError.
        for bad_row in ['"just a string"', "[1, 2]", '{"word": null}', '{"word": 5}']:
            with self.subTest(bad_row=bad_row), tempfile.TemporaryDirectory() as tmp:
                self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
                self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
                self._write_passing_eval(tmp)
                self._write(tmp, "candidate.jsonl", bad_row + "\n")
                stale_path = os.path.join(tmp, "unlimited-5.csv")
                self._write(tmp, "unlimited-5.csv", "word\r\nSTALEWORD\r\n")
                argv = ["--length", "5", "--pool", "unlimited", "--eval-candidate", os.path.join(tmp, "candidate.jsonl")]
                code, stderr = self._run_main_capturing_stderr(tmp, argv)
                self.assertEqual(code, 1)
                self.assertIn("label eval gate:", stderr)
                self.assertFalse(os.path.exists(stale_path))

    def _gate_stderr(self, tmp, held_out, candidate):
        self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
        self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
        self._write(tmp, "labels-5.jsonl", "\n".join(json.dumps(entry) for entry in held_out) + "\n")
        self._write(tmp, "candidate.jsonl", "\n".join(json.dumps(label) for label in candidate) + "\n")
        with patch.object(vl.eval_labels, "split_golden", return_value=([], held_out)):
            return self._run_main_capturing_stderr(
                tmp,
                ["--length", "5", "--pool", "unlimited", "--eval-candidate", os.path.join(tmp, "candidate.jsonl")],
            )

    def test_prints_a_specific_reason_for_each_failing_threshold_check_010_AE4(self):
        # Three independent failing checks, each with its own stderr reason.
        scenarios = {
            # 18 true accepts, 2 false accepts (precision 18/20 = 0.90 < 0.95); 5
            # sensitive rejects all correctly caught (recall 1.0), isolating the
            # accept-precision reason.
            "accept precision": (
                [{"word": f"A{i}", "decision": "accept", "id": f"G{i}"} for i in range(18)]
                + [{"word": f"R{i}", "decision": "reject", "reason": "other", "id": f"G{18 + i}"} for i in range(2)]
                + [{"word": f"S{i}", "decision": "reject", "reason": "sensitive", "id": f"G{20 + i}"} for i in range(5)],
                [{"word": f"A{i}", "decision": "accept"} for i in range(18)]
                + [{"word": f"R{i}", "decision": "accept"} for i in range(2)]
                + [{"word": f"S{i}", "decision": "reject", "reason": "sensitive"} for i in range(5)],
                "label eval gate: accept precision 0.90 < 0.95",
            ),
            # 100 true accepts (precision stays high); 20 sensitive rejects, 16
            # caught, 4 missed -> sensitive recall 16/20 = 0.80 < 0.98.
            "sensitive recall": (
                [{"word": f"A{i}", "decision": "accept", "id": f"G{i}"} for i in range(100)]
                + [{"word": f"S{i}", "decision": "reject", "reason": "sensitive", "id": f"G{100 + i}"} for i in range(20)],
                [{"word": f"A{i}", "decision": "accept"} for i in range(100)]
                + [{"word": f"S{i}", "decision": "reject", "reason": "sensitive"} for i in range(16)]
                + [{"word": f"S{i}", "decision": "accept"} for i in range(16, 20)],
                "label eval gate: sensitive recall 0.80 < 0.98",
            ),
            # No sensitive rejects at all in held-out: nothing to measure recall
            # against, regardless of accept precision.
            "no sensitive rejects": (
                [{"word": f"A{i}", "decision": "accept", "id": f"G{i}"} for i in range(9)]
                + [{"word": "R0", "decision": "reject", "reason": "other", "id": "G9"}],
                [{"word": f"A{i}", "decision": "accept"} for i in range(9)]
                + [{"word": "R0", "decision": "reject", "reason": "obscure"}],
                "label eval gate: no sensitive rejects in held-out",
            ),
        }
        for name, (held_out, candidate, expected) in scenarios.items():
            with self.subTest(check=name):
                with tempfile.TemporaryDirectory() as tmp:
                    code, stderr = self._gate_stderr(tmp, held_out, candidate)
                    self.assertEqual(code, 1)
                    self.assertIn(expected, stderr)

    def test_prints_a_reason_and_removes_the_stale_csv_on_a_duplicate_golden_word(self):
        with tempfile.TemporaryDirectory() as tmp:
            self._write(tmp, "unlimited-pool-5.txt", "KALEM\n")
            self._write(tmp, "labels-unlimited-5.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            self._write(
                tmp,
                "labels-5.jsonl",
                '{"word": "KALEM", "decision": "accept"}\n{"word": "kalem", "decision": "accept"}\n',
            )
            self._write(tmp, "candidate.jsonl", '{"word": "KALEM", "decision": "accept"}\n')
            stale_path = os.path.join(tmp, "unlimited-5.csv")
            self._write(tmp, "unlimited-5.csv", "word\r\nSTALEWORD\r\n")

            code, stderr = self._run_main_capturing_stderr(
                tmp,
                [
                    "--length", "5", "--pool", "unlimited",
                    "--eval-candidate", os.path.join(tmp, "candidate.jsonl"),
                ],
            )
            self.assertEqual(code, 1)
            self.assertIn("failed to score eval candidate", stderr)
            self.assertFalse(os.path.exists(stale_path))


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

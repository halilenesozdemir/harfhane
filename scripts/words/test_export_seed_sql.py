import csv
import os
import tempfile
import unittest

import export_seed_sql as seed


class ValidWordsStatementsTests(unittest.TestCase):
    def test_builds_one_statement_for_a_small_input(self):
        rows = [("ELMA", 4), ("KALE", 4)]
        statements = seed.chunk_valid_words_statements(rows, chunk_size=500)
        self.assertEqual(len(statements), 1)
        self.assertIn("INSERT OR IGNORE INTO valid_words", statements[0])
        self.assertIn("('ELMA', 4, 'hunspell-tr', 'MPL-2.0')", statements[0])
        self.assertTrue(statements[0].rstrip().endswith(";"))

    def test_chunks_when_input_exceeds_chunk_size(self):
        rows = [(f"WORD{i:04d}", 5) for i in range(1201)]
        statements = seed.chunk_valid_words_statements(rows, chunk_size=500)
        self.assertEqual(len(statements), 3)
        self.assertEqual(statements[0].count("'hunspell-tr'"), 500)
        self.assertEqual(statements[1].count("'hunspell-tr'"), 500)
        self.assertEqual(statements[2].count("'hunspell-tr'"), 201)

    def test_each_statement_stays_under_the_d1_statement_length_limit(self):
        rows = [(f"WORD{i:04d}", 5) for i in range(2000)]
        statements = seed.chunk_valid_words_statements(rows, chunk_size=500)
        for statement in statements:
            self.assertLess(len(statement.encode("utf-8")), seed.D1_MAX_STATEMENT_BYTES)

    def test_uses_turkish_upper_for_normalization_not_builtin_upper(self):
        # "i" -> "İ" under Turkish casing; builtin str.upper() would give "I" instead.
        rows = seed.read_valid_words_rows(length=5, words=["kiraz"])
        self.assertEqual(rows, [("KİRAZ", 5)])


class DailyWordsStatementsTests(unittest.TestCase):
    def _write_review_csv(self, dir_path: str, rows: list) -> str:
        path = os.path.join(dir_path, "review-5.csv")
        with open(path, "w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(["word", "category", "meaning", "context"])
            for row in rows:
                writer.writerow(row)
        return path

    def test_builds_insert_with_empty_meaning_and_context(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_review_csv(tmp, [("ADRES", "isim", "bir açıklama", "bir bağlam")])
            daily_rows = seed.read_daily_review_rows(path)
            self.assertEqual(daily_rows, [("ADRES", 5, "isim")])
            statements = seed.chunk_daily_words_statements(daily_rows, chunk_size=500)
            self.assertEqual(len(statements), 1)
            statement = statements[0]
            self.assertIn("INSERT OR IGNORE INTO words", statement)
            self.assertIn(
                "('ADRES', 5, '', '', 'isim', 'admin', 'owner-curated', 'approved', 1, 1, 'daily')",
                statement,
            )

    def test_rejects_a_word_whose_length_does_not_match_the_target_length(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_review_csv(tmp, [("ADRESL", "isim", "x", "y")])
            with self.assertRaises(ValueError):
                seed.read_daily_review_rows(path, expected_length=5)

    def test_rejects_duplicate_words(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_review_csv(
                tmp, [("ADRES", "isim", "a", "b"), ("ADRES", "isim", "c", "d")]
            )
            with self.assertRaises(ValueError):
                seed.read_daily_review_rows(path)

    def test_normalizes_category_and_word_via_turkish_helpers(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_review_csv(tmp, [("kiraz", "isim", "x", "y")])
            rows = seed.read_daily_review_rows(path, expected_length=5)
            self.assertEqual(rows, [("KİRAZ", 5, "isim")])


class WriteSeedFileTests(unittest.TestCase):
    def test_write_file_joins_statements_with_blank_lines_and_a_header(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_path = os.path.join(tmp, "out.sql")
            seed.write_seed_file(out_path, "-- header\n", ["STATEMENT ONE;", "STATEMENT TWO;"])
            with open(out_path, encoding="utf-8") as handle:
                content = handle.read()
            self.assertTrue(content.startswith("-- header\n"))
            self.assertIn("STATEMENT ONE;", content)
            self.assertIn("STATEMENT TWO;", content)

    def test_regenerating_is_deterministic(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_path = os.path.join(tmp, "out.sql")
            seed.write_seed_file(out_path, "-- h\n", ["A;", "B;"])
            with open(out_path, encoding="utf-8") as handle:
                first = handle.read()
            seed.write_seed_file(out_path, "-- h\n", ["A;", "B;"])
            with open(out_path, encoding="utf-8") as handle:
                second = handle.read()
            self.assertEqual(first, second)


class CommittedSeedFilesDriftTests(unittest.TestCase):
    """Regenerating from the current data/words sources must reproduce the committed
    seed files byte for byte; a diff here means someone edited the .sql by hand or the
    source word lists changed without regenerating."""

    def test_valid_words_sql_matches_regeneration(self):
        expected = seed.render_valid_words_sql()
        with open(seed.VALID_WORDS_SQL_PATH, encoding="utf-8") as handle:
            actual = handle.read()
        self.assertEqual(actual, expected)

    def test_daily_words_5_sql_matches_regeneration(self):
        expected = seed.render_daily_words_sql()
        with open(seed.DAILY_WORDS_5_SQL_PATH, encoding="utf-8") as handle:
            actual = handle.read()
        self.assertEqual(actual, expected)


if __name__ == "__main__":
    unittest.main()

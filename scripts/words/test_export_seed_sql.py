import csv
import os
import re
import tempfile
import unittest

import export_seed_sql as seed


class ValidWordsStatementsTests(unittest.TestCase):
    def test_should_build_one_statement_when_input_fits_in_one_chunk(self):
        rows = [("ELMA", 4), ("KALE", 4)]
        statements = seed.chunk_valid_words_statements(rows, chunk_size=500)
        self.assertEqual(len(statements), 1)
        self.assertIn("INSERT OR IGNORE INTO valid_words", statements[0])
        self.assertIn("('ELMA', 4, 'hunspell-tr', 'MPL-2.0')", statements[0])
        self.assertTrue(statements[0].rstrip().endswith(";"))

    def test_should_split_into_multiple_statements_when_input_exceeds_chunk_size(self):
        rows = [(f"WORD{i:04d}", 5) for i in range(1201)]
        statements = seed.chunk_valid_words_statements(rows, chunk_size=500)
        self.assertEqual(len(statements), 3)
        self.assertEqual(statements[0].count("'hunspell-tr'"), 500)
        self.assertEqual(statements[1].count("'hunspell-tr'"), 500)
        self.assertEqual(statements[2].count("'hunspell-tr'"), 201)

    def test_should_stay_under_the_d1_statement_length_limit_when_chunking_many_rows(self):
        rows = [(f"WORD{i:04d}", 5) for i in range(2000)]
        statements = seed.chunk_valid_words_statements(rows, chunk_size=500)
        for statement in statements:
            self.assertLess(len(statement.encode("utf-8")), seed.D1_MAX_STATEMENT_BYTES)

    def test_should_use_turkish_upper_when_normalizing_a_lowercase_word(self):
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

    def test_should_build_insert_with_empty_meaning_and_context_when_reading_a_review_row(self):
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

    def test_should_raise_when_a_word_length_does_not_match_the_target_length(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_review_csv(tmp, [("ADRESL", "isim", "x", "y")])
            with self.assertRaises(ValueError):
                seed.read_daily_review_rows(path, expected_length=5)

    def test_should_raise_when_the_review_file_has_duplicate_words(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_review_csv(
                tmp, [("ADRES", "isim", "a", "b"), ("ADRES", "isim", "c", "d")]
            )
            with self.assertRaises(ValueError):
                seed.read_daily_review_rows(path)

    def test_should_normalize_word_via_turkish_upper_when_reading_a_lowercase_review_row(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_review_csv(tmp, [("kiraz", "isim", "x", "y")])
            rows = seed.read_daily_review_rows(path, expected_length=5)
            self.assertEqual(rows, [("KİRAZ", 5, "isim")])

    def _write_word_only_csv(self, dir_path: str, words: list) -> str:
        path = os.path.join(dir_path, "review-5.csv")
        with open(path, "w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(["word"])
            for word in words:
                writer.writerow([word])
        return path

    def test_should_default_category_to_empty_string_when_the_csv_is_word_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self._write_word_only_csv(tmp, ["ADRES"])
            rows = seed.read_daily_review_rows(path)
            self.assertEqual(rows, [("ADRES", 5, "")])


class ScheduleStatementsTests(unittest.TestCase):
    def test_should_assign_consecutive_dates_when_building_the_schedule(self):
        pairs = seed.build_daily_schedule(["AAAAA", "BBBBB", "CCCCC"], "2026-10-07", days=3)
        self.assertEqual(
            pairs, [("AAAAA", "2026-10-07"), ("BBBBB", "2026-10-08"), ("CCCCC", "2026-10-09")]
        )

    def test_should_raise_when_fewer_words_than_days_are_available(self):
        with self.assertRaises(ValueError):
            seed.build_daily_schedule(["AAAAA", "BBBBB"], "2026-10-07", days=3)

    def test_should_never_repeat_a_word_when_building_the_schedule(self):
        words = [f"W{i:04d}" for i in range(100)]
        pairs = seed.build_daily_schedule(words, "2026-10-07", days=90)
        scheduled_words = [word for word, _ in pairs]
        self.assertEqual(len(scheduled_words), len(set(scheduled_words)))

    def test_should_generate_one_values_join_statement_when_chunk_fits(self):
        pairs = [("ADRES", "2026-10-07"), ("AKTIF", "2026-10-08")]
        statements = seed.chunk_schedule_statements(pairs, length=5, chunk_size=500)
        self.assertEqual(len(statements), 1)
        statement = statements[0]
        self.assertIn("INSERT OR IGNORE INTO daily_words (word_id, date, length)", statement)
        self.assertIn("('ADRES', '2026-10-07')", statement)
        self.assertIn("('AKTIF', '2026-10-08')", statement)
        self.assertIn("WHERE w.pool = 'daily'", statement)
        self.assertIn("AND w.status = 'approved'", statement)
        self.assertIn("AND w.family_safe = 1", statement)
        self.assertIn("AND w.is_active = 1", statement)
        self.assertIn("AND w.length = 5", statement)
        # The extra conditions must sit in WHERE, not ANDed onto the JOIN's ON clause —
        # a D1-local quirk silently drops every row of an INSERT...SELECT when they are
        # (confirmed by hand against `wrangler d1 execute --local`; a plain SELECT with
        # the same ON clause returns rows correctly, only the INSERT...SELECT path does
        # not), even though the data matches.
        self.assertNotIn("v.column1 AND w.pool", statement)

    def test_should_split_into_multiple_statements_when_schedule_exceeds_chunk_size(self):
        pairs = [(f"W{i:04d}", f"2026-{(i // 28) + 1:02d}-{(i % 28) + 1:02d}") for i in range(120)]
        statements = seed.chunk_schedule_statements(pairs, length=5, chunk_size=90)
        self.assertEqual(len(statements), 2)


class WriteSeedFileTests(unittest.TestCase):
    def test_should_join_statements_with_blank_lines_and_a_header_when_writing(self):
        with tempfile.TemporaryDirectory() as tmp:
            out_path = os.path.join(tmp, "out.sql")
            seed.write_seed_file(out_path, "-- header\n", ["STATEMENT ONE;", "STATEMENT TWO;"])
            with open(out_path, encoding="utf-8") as handle:
                content = handle.read()
            self.assertTrue(content.startswith("-- header\n"))
            self.assertIn("STATEMENT ONE;", content)
            self.assertIn("STATEMENT TWO;", content)

    def test_should_produce_identical_output_when_regenerating_the_same_input(self):
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

    def test_should_match_regeneration_when_comparing_the_committed_valid_words_sql(self):
        expected = seed.render_valid_words_sql()
        with open(seed.VALID_WORDS_SQL_PATH, encoding="utf-8") as handle:
            actual = handle.read()
        self.assertEqual(actual, expected)

    def test_should_match_regeneration_when_comparing_the_committed_daily_words_5_sql(self):
        expected = seed.render_daily_words_sql()
        with open(seed.DAILY_WORDS_5_SQL_PATH, encoding="utf-8") as handle:
            actual = handle.read()
        self.assertEqual(actual, expected)

    def test_should_match_regeneration_when_comparing_the_committed_schedule_5_sql(self):
        # The committed file's own header records the --start-date it was generated
        # with, which may differ from the SCHEDULE_START_DATE placeholder constant
        # (e.g. after the real cutover regenerated it with the actual applied date).
        # Regenerating with that recorded date, not the constant, is what "no drift"
        # means here.
        with open(seed.SCHEDULE_5_SQL_PATH, encoding="utf-8") as handle:
            actual = handle.read()
        match = re.search(r"--start-date (\d{4}-\d{2}-\d{2})", actual)
        self.assertIsNotNone(match, "committed schedule_5.sql header is missing --start-date")
        committed_start_date = match.group(1)
        expected = seed.render_schedule_sql(start_date=committed_start_date)
        self.assertEqual(actual, expected)


if __name__ == "__main__":
    unittest.main()

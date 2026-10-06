# Word list pipeline

Builds open-license Turkish word lists for the word game from the Hunspell `hunspell-tr`
dictionary. See `../../data/words/README.md` for the output format and counts.

## Usage

```sh
pip install -r scripts/words/requirements.txt
python3 scripts/words/build_word_lists.py
```

Deterministic: the dictionary is fetched from a pinned commit, and the same input always
produces the same output files under `data/words/`.

## Modules

- `hunspell_source.py`: pinned-commit download/cache and `.dic` parsing.
- `turkish.py`: Turkish-aware case conversion and alphabet validation (no `Q`/`W`/`X`).
- `inflection.py`: heuristic to drop nominal inflected forms (possessive/case/plural) from
  the valid-word list when their root is itself an independent, reasonably frequent word.
- `candidates.py`: zipf-frequency filter, mastar (`-mak`/`-mek`) exclusion, family-safety
  blocklist, and the `needs_review` heuristic.
- `build_word_lists.py`: orchestrates the above and writes `data/words/`.
- `blocklist.txt`: short, hand-curated list of explicit/vulgar roots. Prefix-matched against
  candidates. Do not quote its contents in reports, PRs or commit messages.
- `test_build_word_lists.py`: unittest suite (run with `python3 -m unittest` from this
  directory).

## Answer review

- `answer_pool.py --length N`: ranks `data/words/candidates-N.csv` by frequency and writes the
  top 600 to `data/words/review/pool-N.txt`.
- `validate_labels.py --length N`: checks the model-written labels in
  `data/words/review/labels-N.jsonl` against the pool and prints accepted/rejected counts and
  errors as JSON. Accepted words with meaning and context go to `review-N.csv` for import.
- `test_validate_labels.py`: unittest suite for the validator.

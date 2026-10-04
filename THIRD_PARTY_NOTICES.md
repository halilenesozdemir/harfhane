# Third-party notices

## hunspell-tr

The Turkish word lists under `data/words/` are derived from the Hunspell Turkish dictionary
maintained by the Turkish Data Depository group:

- Project: https://github.com/tdd-ai/hunspell-tr
- Pinned commit: `7302eca5f3652fe7ae3d3ec06c44697c97342b4e` (tag `v1.1.1`)
- License: Mozilla Public License 2.0 (MPL-2.0)

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a
copy of the MPL was not distributed with this file, You can obtain one at
https://mozilla.org/MPL/2.0/.

## wordfreq

Word frequency data from the [`wordfreq`](https://github.com/rspeer/wordfreq) Python package
is used only as an internal filtering and ranking signal when building the candidate word
lists (`scripts/words/build_word_lists.py`). No raw frequency values are stored or
distributed in this repository's output files.

- Project: https://github.com/rspeer/wordfreq
- License: Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)

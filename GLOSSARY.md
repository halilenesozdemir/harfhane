# Harfhane

A Turkish daily word game on web and Android. Terms below are what the plans, tests and code mean.

## Game

**Daily answer**:
The one word all players solve for a given length on a given Turkey day.
_Avoid_: word of the day, daily word (in specs)

**Turkey day**:
The calendar day in Turkey time (UTC+3), which starts at 21:00 UTC; every "today" means this day.
_Avoid_: today (unqualified), UTC day

**Valid guess**:
A word the game accepts as a guess; the guess list is much larger than the answer pools.
_Avoid_: dictionary word

**Hint**:
Reveals one letter of the answer at a position the player has not solved; the allowance is counted
per game.
_Avoid_: clue, meaning

**Game number**:
The running number of a daily answer for a length. Not shown in the share text (owner decision
2026-10-24, `docs/decisions/2026-10-24-share-format.md`), which shows the daily date instead.

## Lengths

**Scheduled length**:
A word length the cron keeps filling with daily answers, whether or not players can see it (4, 5, 6).
_Avoid_: active length

**Playable length**:
A scheduled length players can choose, set by `PLAYABLE_WORD_LENGTHS`; opening one is a reviewed deploy.
_Avoid_: active length, enabled length

## Words and supply

**Daily pool**:
Owner-reviewed words that may become daily answers.

**Unlimited pool**:
Model-labelled words used only in unlimited mode; never scheduled as daily answers.
_Avoid_: free pool, extra words

**Approved word**:
A word with `status = 'approved'` and `family_safe = 1`; only these reach players (Invariant 1).

**Repeat cooldown**:
The 3 years a daily answer must wait before it can be a daily answer of the same length again.

**Runway**:
Days from today that already have a scheduled daily answer for a length.

**Restock runway**:
Days the eligible, unscheduled daily-pool words could still fill for a length; below 180 a new review
batch starts.
_Avoid_: stock (unqualified)

## Delivery

**Acceptance example**:
A Given/When/Then case in a plan, numbered `AE<n>`, proven by a test tagged `(<plan>-AE<n>)`.
_Avoid_: AC, test case

**Cutover**:
The one-time switch of the backend `DB` binding from the legacy database to `harfhane`.
_Avoid_: migration (that is a schema change)

**Parked PR**:
A ready PR that must wait for the owner or the cutover; it does not count toward the open-PR cap.

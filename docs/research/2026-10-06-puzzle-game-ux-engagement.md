# What makes daily puzzle games compelling (2026-10-06)

Deep-research summary for Harfhane's UX and flow. Confidence: [E] evidence (primary source or
measured data), [M] medium (secondary source, unverified), [O] opinion or inference.

## Core mechanisms
- Scarcity and ritual [E]: Wordle's creator limited it to one game a day so people "leave wanting
  more" and spend about three minutes; no ads by choice.
  https://www.boston.com/news/national-news/2022/01/04/he-made-wordle-for-his-partner-now-its-an-online-hit/
- Turkish ritual [E]: Wordle Türkçe reached 2.5M players, 78% mobile, ~100k solve between 00:00
  and 01:00, average solve 3:32, 290k Twitter shares (2022 data).
  https://webrazzi.com/2022/03/29/25-milyon-kisiye-ulasan-wordle-turkce-icin-one-cikan-veriler/
  → the day must roll over exactly at Europe/Istanbul midnight [O].
- Social comparison without leaderboards [E]: the emoji grid automated what players did by hand.
  https://blog.x.com/engineering/en_us/topics/insights/2022/understanding-twitter-conversations--a-wordle-case-study
- Mastery [E]: ~25% of UK players play hard mode (7% official, 18% self-imposed).
  https://yougov.com/en-gb/articles/40799-wordle-starter-words-hard-mode-and-x6-how-are-brit
- Near-miss [E]: near-misses raise motivation only when the player has control (Clark et al. 2009),
  so a 6/6 is fine; staged "almost won" moments would be manipulative [O].
  https://pmc.ncbi.nlm.nih.gov/articles/PMC2658737/
- Clones [M]: Spotify closed Heardle in 2023 after visits fell from 10M to 6M in three months;
  readable rules beat novelty [O].

## Game feel
- Latency [E]: under ~100 ms feels direct (Swink); INP threshold 200 ms, hard on low-end devices.
  https://web.dev/inp — key press → letter in the tile within one frame, input not locked during
  reveal animations [O].
- Reveal timing [M, unverified]: Wordle ~250 ms per half-flip with ~300 ms stagger; Reactle uses
  350 ms. A five-letter row takes 1.5–2 s; measure on device.
- Haptics [E]: Android recommends action constants (`KEYBOARD_TAP`, `CONFIRM`, `REJECT`) over raw
  vibration. https://developer.android.com/develop/ui/views/haptics/haptics-principles
- Sound off by default; restrained "juice" fits a calm daily ritual [O].

## Flow and sessions
- Target session about 3–4 minutes [E, see above].
- Difficulty [E]: the NYT Wordle editor balances hard and easy words per week and removes rare or
  crude-meaning words.
  https://abc17news.com/news/national-world/cnn-national/2024/03/14/it-has-to-be-a-little-bit-challenging-inside-the-world-of-wordle-at-the-new-york-times/
- Invalid words [O]: a rejected guess must not cost a try or clear the row; keep the guess list
  broad and the answer list narrow and well known.
- Streaks [E]: Duolingo decoupling the streak from the daily goal lifted D14 retention 3.3%;
  missing one day does not materially break habit formation (Lally et al.).
  https://blog.duolingo.com/improving-the-streak ·
  https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit
- Ethical hooks [E]: "playing by appointment" is a recognised dark pattern (Zagal et al. 2013);
  prefer a countdown and opt-in reminders over guilt copy.
  https://research.chalmers.se/en/publication/177148
- No accounts means a cleared app loses the streak; consider an export/import code [O].

## Onboarding, accessibility, Turkish UX
- Best onboarding is the first guess; keep how-to-play to three example tiles [O].
- High-contrast mode plus a non-colour cue; share squares follow the mode [E/O].
- TalkBack: per-tile labels and a row summary after reveal [O]; respect reduce-motion [E].
- Keyboard: 29 Turkish letters, ≥48 dp targets, Enter and Delete at the ends, İ/ı mapping via
  `normalizeChar`, circumflex letters simplified [O].
- Copy: warm, short, informal "sen" voice; no shaming [O].

## Variety without breaking the ritual
- NYT adds separate puzzles and an archive instead of changing the main one; over half of weekly
  players play more than one puzzle a day [M].
  https://techcrunch.com/2024/05/07/nyt-games-wordle-archive-access-1000-past-puzzles
- For Harfhane [O]: 4 and 6 letters as separate dailies with their own streaks; quiet hard-mode
  setting; local insights (best letter, fastest solve). Themed days invite "why this word?" when
  words carry no meaning; unlimited stats stay separate from the streak.

## Ranked recommendations
Before the closed test:
1. Invalid-word experience (no lost try, shake, "Kelime listesinde yok"). High impact, low effort.
2. Answer-list curation with weekly difficulty balance; target 3.8–4.3 average guesses, <5% losses.
3. Input latency and animation budget on a 2–3 GB RAM Android.
4. Fix streak rules now: current, longest, total solved; Istanbul day; unlimited never counts.
5. Accessibility baseline: high contrast with non-colour cue, TalkBack labels, reduce-motion.
6. Turkish keyboard ergonomics.

After launch:
7. Local "rest day" streak protection (earn one per 7 played days, max 1 banked).
8. Streak calendar and personal records.
9. Share honesty (hint marker) and share image — note: the owner decided on 2026-10-06 that hint
   use is not shown in share text (Plan 008 R7); this recommendation conflicts and needs an owner
   call.
10. Optional hard mode and separate 4/6-letter dailies.

Needs an owner decision: any server-side aggregate ("x% solved in 3"), local notifications
(`POST_NOTIFICATIONS`, default off), streak transfer between devices (code only).

## Gaps
Wordle animation timings, NYT streak protection and Duolingo freeze churn numbers were not
confirmed from primary sources; Turkish word-game store reviews were not analysed; Wordle Türkçe
data is from 2022.

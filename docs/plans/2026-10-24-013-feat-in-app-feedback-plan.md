---
title: In-app feedback and word reports
type: feat
date: 2026-10-24
status: approved
---

# In-app feedback and word reports

## Goal
Testers and players currently send feedback and word reports over WhatsApp. The owner decided
(2026-10-24) to move this in-app: a feedback screen on mobile, stored in D1 and emailed to the
owner, plus a "report this word" shortcut from the game-over card. This keeps the MVP's
no-accounts shape (`docs/decisions/2026-10-05-mvp-scope-cut.md`) — feedback is anonymous, with an
optional free-text contact field the sender chooses to fill in, not an account.

## Requirements
- R1. `POST /api/feedback` validates and stores a feedback row, then best-effort emails the owner
  via Resend; the stored row is never lost because the email failed.
- R2. A `word_report` on a daily puzzle is verified against that date's scheduled word only for a
  strictly past date — comparing against today's word would let a caller probe today's answer by
  trial and error (201 for the right word, 422 for a wrong one), so a report for today or a future
  date is never compared: today's report is stored as-is, and a future date is rejected outright.
  The endpoint never confirms or denies today's or a future answer.
- R3. The endpoint is rate limited more strictly than the existing game endpoints (in-memory, per
  IP).
- R4. `GET /api/admin/feedback` (existing admin auth) lists recent feedback with an optional
  status filter; `PATCH /api/admin/feedback/:id` sets status for triage.
- R5. Mobile Settings has "Geri bildirim gönder", opening a feedback screen: multiline message,
  optional contact field, character counter, Gönder button, success/failure/offline states.
- R6. The game-over card has "Kelimeyi bildir", prefilling kind=word_report with the finished
  game's mode/date/length/word and a short reason field.
- R7. No IP address or device identifier is stored in the `feedback` table.

## Acceptance examples
- AE1 (R1). Given a valid `{ kind: 'general', message: 'Harika oyun!' }` body, `POST
  /api/feedback` returns 201, the row exists in `feedback`, and `sendFeedbackEmail` was called
  once.
- AE2 (R1). Given `sendFeedbackEmail` rejects, `POST /api/feedback` still returns 201 and the row
  is stored.
- AE3 (R2). Given a past date's scheduled 5-letter word was `KALEM`, the body `{ kind:
  'word_report', mode: 'daily', word_length: 5, puzzle_date: <that past date>, reported_word:
  'KALEM' }` is stored (201); given `reported_word: 'MASAL'` for the same past date, the route
  returns 422 and nothing is stored. Given `puzzle_date` is today, `POST /api/feedback` returns
  an identical 201 response whether `reported_word` matches today's scheduled word or not, and
  never looks up today's scheduled word.
- AE4 (R2). Given `puzzle_date` is tomorrow's Turkey day, `POST /api/feedback` returns 422 and
  never looks up tomorrow's scheduled word.
- AE5 (R3). Given 6 requests from the same IP within 10 minutes, the 6th returns 429.
- AE6 (R4). Given three stored rows with statuses `new`, `seen`, `done`, `GET
  /api/admin/feedback?status=new` returns only the first; `PATCH /api/admin/feedback/:id` with
  `{ status: 'done' }` updates it and a second `GET` with no filter shows the new status.
- AE7 (R5). Given the Settings screen, pressing "Geri bildirim gönder" opens the feedback screen;
  typing a message and pressing "Gönder" shows a success state; given the device is offline,
  pressing "Gönder" shows a failure state without crashing.
- AE8 (R6). Given a finished daily game for length 5 on today's date, pressing "Kelimeyi bildir"
  on the game-over card opens the feedback screen with kind=word_report and the mode, date,
  length and solution already attached (not re-typed by the player).
- AE9 (R7). Given the `0004_feedback.sql` migration applied through `readD1Migrations`, the
  `feedback` table has no column named `ip` or any device-identifier column.

## Key technical decisions
- KTD1. Storage-first, email-best-effort: the service inserts the row, then calls
  `sendFeedbackEmail` in a `try`/`catch` that only logs an in-memory/test-visible result; a
  rejected email never throws past the route (R1, AE2).
- KTD2. Word-report verification reuses the existing daily-word lookup (same repository pattern
  as `apps/backend/src/repositories/word-repository.ts`'s daily lookup, read-only, not touching
  that file while the concurrent `fix/backend-mvp-review` branch edits it) scoped to
  `date < today` (Turkey day via `getTodayString()`): a future date is rejected before any lookup
  runs, and today's date skips the lookup entirely and is stored as-is, since comparing against
  today's scheduled word would turn the endpoint into an answer oracle (right word → 201, wrong
  word → 422) (R2, AE3, AE4).
- KTD3. `feedback.status` is server-owned triage state (`new` default), separate from
  `kind`/`mode`; the admin list and patch follow the existing `routes -> services ->
  repositories` layering and the same `{ data }` / `{ error }` response shape as `admin.ts`.
- KTD4. Mobile's feedback screen and the game-over "Kelimeyi bildir" button are new files
  (`FeedbackScreen.tsx`, a `GameOverCard` addition) so the concurrent share-format work and this
  PR's diff do not collide line-for-line; the game-over hookup only reads existing props it
  already receives (mode, wordLength, dailyDate, solution), adding none.
- KTD5. `FEEDBACK_EMAIL` env var with `ADMIN_ALERT_EMAIL` fallback, mirroring the existing
  `ADMIN_ALERT_EMAIL` pattern in `apps/backend/src/types/env.ts`; both are optional strings, so a
  database with neither set still stores feedback (email is skipped, not retried).

## Data safety impact
New data type: user-provided feedback messages (required) and an optional free-text contact
field the sender chooses to type (e.g. an email address), stored in D1's new `feedback` table and
emailed once to the owner. Not shared with any third party beyond Resend (already used for
schedule alerts) as the delivery channel. No IP address or device identifier is stored (R7),
so a row cannot be linked back to a sender without the contact field they chose to provide.
Deletion on request: the owner deletes the row (and the corresponding email, if still in their
inbox) manually; there is no self-service deletion endpoint in this plan (no accounts to
authenticate a deletion request against). `docs/drafts/play-data-safety.md` is on another branch
and not updated here; see `docs/backlog.md` for the follow-up.

## Units
File ownership: this plan's backend unit does not touch `word-repository.ts`,
`schedule-health*`, `resend.ts` or `deploy-backend.yml` (owned by the concurrent
`fix/backend-mvp-review` branch) — it adds new files plus `index.ts`'s route mount and
`types/env.ts`'s two new optional fields only.

- U1 (backend). Migration `0004_feedback.sql`, `feedback-repository.ts`,
  `feedback-service.ts`, `feedback-schemas.ts`, `routes/feedback.ts`, `routes/admin.ts`
  additions, a new `sendFeedbackEmail` export in a new `utils/feedback-email.ts` (not
  `resend.ts`, to avoid the concurrent edit), rate limiter addition, tests. (R1–R4, R7, AE1–AE6,
  AE9)
- U2 (mobile, can start once U1's request/response shape is set). `FeedbackScreen.tsx`, Settings
  entry point, `GameOverCard` "Kelimeyi bildir" button, `api.ts` client method, tests. (R5–R6,
  AE7–AE8)

U2 is stacked on U1's branch (same migration/contract, no file overlap) and opens as its own PR.

## Not in this plan
Web feedback entry point (left for a follow-up if small — tracked in `docs/backlog.md`);
self-service deletion/export of a feedback row; `docs/drafts/play-data-safety.md` and
`PrivacyPage` updates (tracked in `docs/backlog.md`); applying `0004_feedback.sql` to the remote
database and setting `FEEDBACK_EMAIL`/`ADMIN_ALERT_EMAIL` secrets (owner, Invariant 4).

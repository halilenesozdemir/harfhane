# MVP scope cut: no accounts, no XP/badges/freeze/leaderboard

Date: 2026-10-05 · Status: accepted

## Decision
The MVP (first Play Store release and its first sale) is daily + unlimited play with local
streak, stats and share only, and **no accounts at all**. Removed from MVP scope, not merely
deferred to a later unit:
- Google sign-in, JWT, user profile, push notifications and reminder mail (web and mobile).
- Email/password sign-up, password reset, and the Resend reminder mail.
- XP, badges, streak-freeze and the leaderboard.

This supersedes the same-day assumption that sign-in would ship Google-only for MVP: there is
no sign-in of any kind for MVP. Anything that depended on the removed features (profile XP
display, badge grants, freeze tokens, leaderboard ranking, push-targeted reminders) is out of
scope until a later plan reintroduces it, if ever.

Privacy scope shrinks to match: no accounts, stats stay local to the device, and no per-player
data is held server-side — only the admin's own content and schedule data lives in D1.

## Reasons
- None of the removed features are needed for the first sale: the Supporter purchase (Plan
  005) does not need an account at all (`docs/decisions/2026-10-05-purchase-without-account.md`).
- Email/password and Google sign-in both carry integration cost (password storage/reset,
  Resend deliverability, OAuth client setup, JWT) for a feature nothing else in the MVP needs.
- XP/badges/freeze/leaderboard are account-gated features with no bearing on anonymous daily
  play, the MVP's entire core loop.
- Dropping accounts removes Plan 007 almost entirely from the first-sale critical path.

## Consequences
- Plan 007: scope drops to the static privacy page only (R3); Google sign-in, JWT, push and
  the play counter (R1, R2, R4 and their units) are marked postponed past MVP, not Google-only.
- Plan 004: KTD5 updated to anonymous play with no account at all. KTD6 (screen list) was
  finalized the same way: leaderboard, profile, duels, tournaments and lists are removed from
  the product entirely, not web-only.
- Removed, not deferred: the code for these features was deleted end to end — accounts, auth,
  profile, results, XP/badges/freeze/leaderboard, push, email sign-up/reset and duels in #54,
  lists in #37/#42, tournaments in #40. The database tables (`users`, `game_results`, `badges`,
  `user_xp`, `user_badges`, `push_subscriptions`, `streak_freezes`, `password_reset_tokens`,
  `duels`, `word_lists`, `word_list_words`, `list_likes`, `list_comments`,
  `tournament_results`, …) stay in the schema until an owner-approved drop migration
  (`docs/backlog.md`, numbered after Plan 008's `0002_word_pools.sql` — not `0002` itself) —
  deleting the code does not drop the schema, and Invariant 4 requires the owner for any
  remote D1 write, including applying that migration.
- `docs/roadmap.md` reorders so the first sale no longer waits on Plan 007 at all.

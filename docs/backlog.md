# Backlog

Deliberately deferred work. Delete an item when it is done; status lives in git.

## Mobile auth
Mobile needs native Google Sign-In and a backend endpoint that verifies mobile ID tokens. Part of the Android MVP plan.

## Mobile push
Web push exists. Expo push tokens need storage and sending alongside web push.

## Anonymous player analytics
Only signed-in players write `game_results`, so database counts understate real usage.
- Decide on a cookie-free metric, e.g. Cloudflare Web Analytics.
- The privacy policy must stay accurate.

## Web cleanup before the shared engine
The web app carries code from many experiments; removed features such as challenge mode and the discuss page may have left dead code.
- Audit unused files, hooks, routes, API endpoints and migrations-only tables before moving game logic into `packages/shared`.
- Plan web ↔ mobile routing: store links, deep links, "get the app" banner.

## Test typecheck config
`npx tsc -p apps/backend/tsconfig.test.json` reports 79 errors: missing Workers types, `ScheduledEvent`, implicit `any` in repositories. The cause is that the `types` override drops `@cloudflare/workers-types`. The normal `pnpm typecheck` passes.

## Legacy migrations folder
`apps/backend/migrations/` (26 files) is replaced by `apps/backend/db/migrations/0001_baseline.sql`.
- Delete the legacy folder at database cutover.
- Point the root `scripts/` (which target `harfhane-db`) at the new pipeline, or retire them.
- Until then `eslint.config.js` ignores them (Plan 003 lints `apps/` and `packages/` only; without the ignore ESLint parses root `*.js` with defaults and fails), so `no-console` and unused-code rules do not reach them.

## Known bug fixed in passing
`findOrCreateWord` inserted user words with `category = NULL` and no `length`. This violated `NOT NULL` and stored 6-letter words as length 5. The baseline schema and repository now handle both.

## UTC-date usage outside the Turkey-day fix (2026-10-05)
Fixing `getTodayString`/`getTimeUntilMidnight`/`getGameNumber` in `packages/shared/src/game/time.ts` (branch `fix/turkey-day-boundary`) surfaced other backend code still keying "today" off the plain UTC date instead of the Turkey calendar day, now that clients save game results under the Turkey date (`useGameStats.ts`):
- `apps/backend/src/routes/profile.ts` (`:13`, `:36`) — `/me` and `/freeze` can disagree with a just-played result between 21:00–24:00 UTC (`playedToday` false right after a win; a freeze token usable when it shouldn't be).
- `apps/backend/src/index.ts:95` — the scheduled reminder picks the daily word / target users by UTC day.
- `apps/backend/src/services/admin-service.ts:22` and `apps/backend/src/services/schedule-health-service.ts:19` — same UTC-day pattern.
- `apps/backend/src/routes/lists.ts:98` already uses `Europe/Istanbul` correctly — a model for the fix.
- Fix: route these through the now-shared `getTodayString()` (or equivalent Turkey-aware helper) in a follow-up unit; add a backend test asserting `getDailyWord()`'s no-args path matches `getTodayString()` at the 21:00 UTC boundary.

## Legacy docs review (2026-10-04)
- `products.md`: the 854-line PRD from the original product. It still describes the old word source and long-finished phases.
  - Recommendation: replace with a short product brief that points to `docs/plans/`, or move it to `docs/archive/`.
- `USAGE.md`: a Claude Code usage guide for the old multi-agent setup in `AGENTS.md`. It overlaps with the owner's global config.
  - Recommendation: fold the still-valid parts into `AGENTS.md`, then archive.
- `PWA_TEST.md`: still relevant while the web PWA ships. Keep.
- `DEPLOYMENT.md`: update the database section at cutover (`harfhane` and `db/migrations`).
- `SECURITY.md`: keep.
- `LEGACY_TEST_GUIDE.md`: untracked and owned by the owner; not touched.

## Feature ideas from the old backlog
`docs/archive/github-2026-10-05/todo/BACKLOG.md` lists product ideas from before October 2026: onboarding, password reset, GDPR account deletion, weekly leaderboard, admin auto-scheduling.
- Some reference removed features (challenge links, comments page); re-check each against the current code before planning.
- Promote an item into `docs/plans/` when picked up; delete this entry once the list is triaged.

## Mobile U7 screens — navigation wiring and app version
Plan 004 U7 (`apps/mobile/src/screens/{Home,HowToPlay,Stats,Settings}Screen.tsx`) built the screens without
wiring navigation, per the unit's scope boundary.
- The next unit must mount a `ThemeProvider` with a real `AsyncStorage`-backed `KeyValueStore` at the app root
  and route `HomeScreen.onStart` into the game screen; `StatsScreen` needs its `stats`/`isUnlimited` props
  loaded via `loadDailyStats`/`loadUnlimitedStats` from `src/stats/stats.ts`.
- `SettingsScreen` omits an app version line: `expo-constants` is not yet a dependency. Add it with
  `pnpm exec expo install expo-constants` if the version display is wanted.

## Player-facing word queries only exclude `source = 'user'`, not the full approved/family-safe filter
`findRandomWord`, `findWordById`, `findDailyWord` (`apps/backend/src/repositories/word-repository.ts`) and
`autoFillLength` (`admin-repository.ts`) now exclude `source = 'user'` so unmoderated custom-list words can't be served as an answer in unlimited
mode, the challenge/duel endpoint, or the daily word (Invariant 1). This is a legacy-schema-compatible
patch only: production still runs on `harfhane-db` (binding `DB`), which has a `source` column but no
`status`/`family_safe` columns, so the full `status = 'approved' AND family_safe = 1` filter used by the
`0001_baseline.sql` schema can't be applied there yet.
- At the DB cutover (`docs/plans/2026-10-04-001-infra-clean-database-plan.md`, plan 001), replace
  `source != 'user'` in these four queries with `status = 'approved' AND family_safe = 1` to match the
  baseline schema's own invariant (`words_require_active_word` / the `is_active` CHECK already encode this
  for new rows, but the read queries didn't, which was the bug this entry's fix closed for the legacy DB).
- Guess-validation (`wordExists`) was intentionally left untouched — it must keep accepting `source = 'user'`
  words so custom-list words remain guessable.

## Frontend style cleanup
Seen while removing the tournament feature (2026-10-05); not fixed there to keep that diff scoped.
- Arrow-function components that should be `function` declarations per `apps/frontend/CLAUDE.md`:
  `apps/frontend/src/components/Keyboard.tsx:11`, `apps/frontend/src/components/HomePage.tsx:14`,
  `apps/frontend/src/components/Header.tsx:6`, and any other remaining arrow-function components found
  when this is picked up.
- Leftover/stale comments: `apps/frontend/src/components/Keyboard.tsx:4`,
  `apps/frontend/src/components/Header.tsx:13,24,41`, `apps/frontend/src/context/ThemeContext.tsx:11-13,24-26`.

## og-image.svg still uses old Wordle-green tile colors
`apps/frontend/public/og-image.svg` has no "Nurdle"/"Wordle" wording (checked during the
2026-10-05 brand-icon fix), so it was left untouched there. It still fills its decorative tile
grid, divider and footer text with `#538d4e` (the old Wordle-tile green) instead of the
Harfhane brand token (`rgb(194 65 12)` / `#c2410c`). Regenerate `og-image.svg`/`og-image.png`
with the brand token colors when a design pass is budgeted for it.

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

## Architecture review findings (2026-10-05)
Four read-only reviews (system, backend, frontend, product) after the MVP was cut to daily + unlimited.
Items already in flight are left out: auth hardening, backend Turkey-day dates, Playwright e2e, docs cleanup.

### Needs the owner
- **Purchase without an account.** Plan 005 KTD3 assumes buying needs sign-in, which puts Google OAuth
  (plan 007 U3/U7), the privacy text and RevenueCat in series before the first sale. Alternative: RevenueCat
  anonymous app user id at launch, restore via the Play account, `logIn` alias when accounts arrive.
- **Per-length cutover.** Plan 001/006 tie the cutover to 90 days for every active length, but only the
  5-letter pool is reviewed. Cut over with the lengths that have 90+ days, hide the others until stocked;
  active lengths are hardcoded in `apps/backend/src/constants/schedule.ts:1`, `apps/frontend/src/types/index.ts`,
  `apps/mobile/src/screens/HomeScreen.tsx`, `apps/mobile/src/stats/stats.ts:4`.
- **Self-healing daily schedule.** The runway alert silently returns when `ADMIN_ALERT_EMAIL` is unset
  (`apps/backend/src/services/schedule-health-service.ts:32`) and auto-fill is a manual admin click. Let the
  cron top the schedule up to 90 days from approved stock (the DB trigger already limits it to approved,
  family-safe words) and alert on remaining stock, not runway.
- **Rate limiting that works.** `apps/backend/src/middleware/rate-limiter.ts` keeps counts in a per-isolate
  `Map`, so limits don't hold across Workers isolates; `/words/validate` is also counted twice. Move to the
  Workers Rate Limiting binding or a WAF rule (wrangler.toml / dashboard change).
- **Admin plane.** One static secret in `sessionStorage`, compared with `===` (`middleware/admin-auth.ts:6`),
  no rate limit on `/api/admin/*`. Put Cloudflare Access in front of `/admin` and `/api/admin/*`.
- **Further scope cuts to consider.** Email/password sign-up, password reset and Resend mail; XP, badges,
  freeze and leaderboard. The mobile MVP uses none of them and they carry most of the KVKK surface.

### Agent work, no owner needed
- **`0002` migration (local first, before the 346-word import).** Drop the `source = 'user'` escape in the
  `words` CHECK (`db/migrations/0001_baseline.sql:18`); add a `BEFORE UPDATE` guard on `daily_words`
  (only `BEFORE INSERT` exists, `:40-48`); block deactivating a word that is scheduled in the future;
  refuse activating a `rejected` word (`admin-repository.ts` `adminSetWordActive` writes approved +
  family_safe unconditionally); drop the list, tournament and duel tables. Remote apply needs the owner.
- **Deploy waits for CI.** `deploy-backend.yml` / `deploy-frontend.yml` run in parallel with `ci.yml`, so a
  red main still deploys. Gate deploys on CI, stop when `wrangler d1 migrations list --remote` shows pending
  migrations, smoke-test `GET /api/words/daily?length=N` after deploy and roll back on failure.
- **Observability.** No `[observability]` in wrangler.toml; `onError` (`apps/backend/src/index.ts`) and the
  cron's `Promise.allSettled` swallow errors with no log. Enable Workers Logs, add one logger module exempt
  from the no-console lint rule, log errors and cron results, ping a heartbeat at the end of the cron.
- **`/api/config`.** Shipped APKs can't be forced to update: expose `minSupportedVersion`, active lengths and
  feature flags (Invariant 8 needs a remote ads flag), and move response schemas into `packages/shared`.
- **Shared engine.** Game-session reducer, stats and storage-key schema exist twice (mobile `src/game`,
  `src/stats`; web `useGameState.ts`, `useGameStats.ts`). Move the mobile versions into `packages/shared`,
  version the storage schema, key daily saves by the server's `date`.
- **Deletions.** `apps/frontend/public/_worker.js` is now a passthrough that forces Pages Functions mode;
  `/api/words/challenge/:wordId` lets anyone walk the answer pool by id; `profile.ts` queries D1 directly
  twice (layering); root TDK scrape files (`scripts/scraped-words.json`, `tdk-seed.sql`, `tdk-wordlist.sql`,
  `scrape-words.ts`, `build-tdk-wordlist.mjs`) conflict with Invariant 3.
- **Web player experience.** `min-h-screen` instead of `dvh` on game pages; no safe-area padding under the
  keyboard; `index.html:6` disables zoom (`user-scalable=no`, WCAG 1.4.4); guesses and results are not
  announced to screen readers (no `aria-live` on the grid); no `prefers-reduced-motion`; admin components
  are eagerly imported into the player bundle (`App.tsx`); `/admin` and `/sifre-sifirla` lack `noindex`.

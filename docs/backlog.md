# Backlog

Deliberately deferred work. Delete an item when it is done; status lives in git.

## Baloo 2 on Tile and Key (Plan 011 U4, R4)
`apps/mobile/src/ui/layout.ts` now exports `FONT_FAMILY_DISPLAY` (Baloo 2 ExtraBold, loaded via
`@expo-google-fonts/baloo-2` in `App.tsx`). It is applied to the HomeScreen title/card titles, but
Plan 011 assigns `Tile.tsx` and `Key.tsx` to the B/C unit owners, so this unit (D) did not touch
them. Whoever owns the next Tile/Key change should set `fontFamily: FONT_FAMILY_DISPLAY` on the
letter/label text styles there too, matching the web tokens' `font-display`.

## og-image.svg still uses the old green brand colour (Plan 011 U4, R5 follow-up)
`apps/frontend/public/og-image.svg` (and its built `apps/frontend/dist/og-image.svg`/`.png`) hardcode
`#538d4e` (the pre-rebrand green) in multiple tile/text/line fills, instead of the current brand
token (`rgb(194 65 12)` light / `rgb(232 98 42)` dark, see `packages/ui-tokens/tokens.json`). This
unit fixed the web logo button (`Header.tsx`) and left the OG image alone, since redrawing a static
asset is out of scope here (R5 said "don't redraw icons"). Whoever owns social-preview assets next
should regenerate `og-image.svg`/`.png` with the brand token's colour.

## ALLOWED_WORD_LENGTHS duplicates backend's SCHEDULED_WORD_LENGTHS (Plan 010 U4)
`packages/shared/src/types/word-length.ts`'s `ALLOWED_WORD_LENGTHS = [4, 5, 6]` (used by the
`WordLength` brand/`parseWordLength`) duplicates `apps/backend/src/constants/schedule.ts`'s
`SCHEDULED_WORD_LENGTHS`/`ScheduledWordLength` — same allowed set, kept separate to keep this
unit's diff small (KTD3: packages never import apps). Whoever next touches either constant should
decide on a single source (most likely: backend re-exports/derives from shared's `WordLength`).

## INVALID_DATE no longer thrown (Plan 010 U4)
`apps/backend/src/errors/api-error.ts`'s `INVALID_DATE` was thrown by `word-service.ts`'s
`getDailyWord` for a malformed date string. That check moved to the `dailyWordQuerySchema` zod
schema (`parseTurkeyDate`, Plan 010 R3/AE2): `getDailyWord`'s `date` parameter is now `TurkeyDate`,
so a malformed string can no longer reach the service at all, and the route layer returns
`BAD_REQUEST` for a bad format instead. `INVALID_DATE` is tagged `@deferred` in `knip.jsonc`'s sense
until a caller needs it again; delete it if nothing picks it back up.

## knip findings recorded instead of fixed (2026-10-06)
From Plan 009 U7 (knip + dependency-cruiser in CI). Each is ignored in `knip.jsonc` with a one-line
reason; details here.
- `apps/backend/src/errors/api-error.ts`: `INTERNAL`, `UNAUTHORIZED` and `FORBIDDEN` are part of the
  `ApiError` vocabulary but no route throws them yet — `apps/backend/src/middleware/admin-auth.ts`
  hand-rolls its own 401 JSON instead of calling `UNAUTHORIZED()`. Either wire routes/middleware to
  use the full vocabulary or delete the unused members.
- `apps/frontend/src/utils/registerSW.ts`: `hasPendingUpdate`/`applyPendingUpdate` and the
  `sw-update-available` `CustomEvent` they support have no listener anywhere in the frontend. The
  app silently waits for the hourly background `registration.update()` instead of ever prompting
  the user to reload for a new service worker version. Decide whether to build the update-prompt UI
  or remove this half-built path.
- `apps/mobile/app.json` names `expo-updates` and `expo-system-ui` (via `userInterfaceStyle:
  "automatic"`) but neither is an installed dependency. In practice this means OTA updates are
  simply off (`expo-updates` was never installed, so `updates.enabled` has nothing to act on — not
  "OTA is default-enabled") and `userInterfaceStyle` isn't applied by the native config plugin;
  system dark mode still works today via the app's own DayNight theme and `useColorScheme`. Decide
  whether to install `expo-updates` for OTA updates (Faz 2/3) and `expo-system-ui` to let
  `userInterfaceStyle` take effect natively.
- `scripts/{import-curated,seed-db}.ts` (missing `wrangler` binary) are already covered by the
  "Legacy migrations folder" and "Legacy docs review" items below; `knip.jsonc` ignores them rather
  than reinstalling a dependency for scripts pending a retire-or-repoint decision. (`scripts/
  scrape-words.ts`, `auto-import.ts` and `enrich-meanings.ts` were deleted instead — see "Web cleanup
  before the shared engine" below.)

## Anonymous player analytics (2026-10-06)
Accounts, server-side game results, XP/badges/freeze, leaderboard and push/email reminders were removed end to
end for the MVP (owner decision 2026-10-05: no accounts). Every player is now anonymous and `game_results` is no
longer written at all — the backend only serves daily/random/validate word endpoints and the admin panel.
- Decide on a cookie-free metric, e.g. Cloudflare Web Analytics, if usage numbers are wanted.
- The privacy policy must stay accurate (no accounts, no server-side game history).
- If accounts return later (Faz 3), re-plan mobile auth/push from scratch rather than reviving the deleted code.

## Drop migration: every table left over from removed features
Code for these features is gone (accounts/auth/profile/results/XP/badges/freeze/leaderboard/push/email in #54,
lists in #37/#42, tournaments in #40, duels in #54), but deleting code does not drop schema. Drop, in one
migration (numbered after Plan 008's `0002_word_pools.sql`), every table `apps/backend/db/migrations/0001_baseline.sql` still carries for them: `users`,
`game_results`, `badges`, `user_xp`, `user_badges`, `push_subscriptions`, `streak_freezes`,
`password_reset_tokens`, `duels`, `word_lists`, `word_list_words`, `list_likes`, `list_comments`,
`tournament_results`. Also add the guard-rail changes already scoped for this same migration (drop the
`source = 'user'` escape in the `words` CHECK, a `BEFORE UPDATE` guard on `daily_words`, block deactivating a
word scheduled in the future, refuse activating a `rejected` word).
- Done: `apps/backend/db/migrations/0003_drop_removed_features.sql` is written (all 14 tables above,
  dropped child-before-parent), plus all four guard-rail changes, preserving `sqlite_sequence` across
  the `words` rebuild and using the Turkey-day date shift (not bare UTC) in the future-schedule guard.
  Covered by `apps/backend/tests/db/drop-removed-features-migration.test.ts`; two stacked follow-up PRs
  add `drop-removed-features-migration-nonempty.test.ts` (FK-safety against a non-empty database) and
  `drop-removed-features-migration-schema.test.ts` (full-row and `sqlite_master.sql` text coverage of
  the rebuilt `words` table). The admin-side 409 pre-checks for the two new `words` triggers landed
  separately, split out for the line-count limit. Code search before writing it found no remaining
  backend route/service/repository/script/cron/test touching any of the 14 tables — only
  `0001_baseline.sql` still declared them. `deploy-backend.yml` only runs `wrangler
  deploy`/`deployments status`/`rollback`, never `wrangler d1 migrations apply` or `d1 execute`, so
  merging this does not apply the migration remotely.
- Applying it to the remote `harfhane` database needs explicit owner approval (Invariant 4). Runbook:
  `docs/runbooks/apply-0003-drop-removed-features.md` (backup + Time Travel bookmark, remote read-only
  pre-checks, a local rehearsal, the remote apply with smoke queries, and the rollback path).
- Applied to remote `harfhane` on 2026-10-24 with owner approval (Invariant 4); pre-check users=0,
  post-check 4 triggers, words=346, seq unchanged.

## Web cleanup before the shared engine
The web app carries code from many experiments; removed features such as challenge mode and the discuss page may have left dead code.
- Audit done (2026-10-08): `pnpm knip` is clean and a manual grep for unused hooks/routes/components
  found nothing beyond the items resolved below.
- `GET /words/challenge/:wordId` (`apps/backend/src/routes/words.ts`) had no caller: the dead
  `useChallengeWord` hook was already gone, and `useSessionChallenge`/`challengeUrl` (GamePage,
  GameOverModal, SharePreview) are a local session-progress tracker and a client-built share link —
  neither ever called this route. Deleted the route, `getWordById` (`word-service.ts`) and
  `findWordById` (`word-repository.ts`) with their tests (#106, merged).
- `apps/frontend/public/_worker.js` was a bare `env.ASSETS.fetch(request)` passthrough that only
  forced Cloudflare Pages into Advanced Mode; `_headers`/`_redirects` still apply with it gone.
  Deleted it and its `eslint.config.js` override (#106, merged).
- Root TDK scrape/fetch files conflicted with Invariant 3 (no TDK data) and had no other reference
  anywhere in the repo: `tdk-seed.sql`, `tdk-wordlist.sql`, `scrape-words.ts`, `build-tdk-wordlist.mjs`
  (sourced a third-party word list, not TDK, but fed the TDK files and had a missing dependency),
  `auto-import.ts` and `enrich-meanings.ts` (both call `sozluk.gov.tr` directly) were all deleted, plus
  `new-words.sql` (generated only by `fetch-more-words.mjs`, itself also deleted for calling
  `sozluk.gov.tr`, with no other producer or consumer). `seed.sql` and `curated-words.json` are
  unrelated and still used (by the active `scripts/words/export_seed_sql.py` pipeline and
  `import-curated.ts` respectively) and were left alone; `scraped-words.json` had no producer or
  consumer left once `scrape-words.ts` and `auto-import.ts` were gone, so its `.gitignore` entry was
  removed too. Words now carry no TDK-sourced meanings (owner decision); `import-curated.ts` and
  `seed-db.ts` still hardcode `harfhane-db --remote` and are tracked separately below ("Legacy
  migrations folder") pending a retire-or-repoint decision — unrelated to the Invariant 3 issue, so
  left untouched here. Also dropped the `node-html-parser` `knip.jsonc` ignore that existed only for
  `scrape-words.ts`, and narrowed its `wrangler`-binary comment to the two scripts still affected.
- Plan web ↔ mobile routing (store links, deep links, "get the app" banner): still open, post-launch —
  not part of this cleanup pass.
- The CSP leftovers from Google sign-in (`accounts.google.com`, `oauth2.googleapis.com`) were removed
  in #110 (web) and #113 (backend).

## Test typecheck config
`npx tsc -p apps/backend/tsconfig.test.json` reports 79 errors: missing Workers types, `ScheduledEvent`, implicit `any` in repositories. The cause is that the `types` override drops `@cloudflare/workers-types`. The normal `pnpm typecheck` passes.

## Legacy migrations folder
`apps/backend/migrations/` (26 files) is replaced by `apps/backend/db/migrations/0001_baseline.sql`.
- Delete the legacy folder at database cutover.
- Point the root `scripts/` (which target `harfhane-db`) at the new pipeline, or retire them.
  `schedule-new-words.mjs`, `schedule-daily-words.ts` and the generated `schedule-new-words.sql`
  were deleted at the cutover binding switch (would have silently written to the now-dead
  `harfhane-db`); `enrich-meanings.ts` and `auto-import.ts` were deleted for a separate reason
  (Invariant 3 — see "Web cleanup before the shared engine"). `import-curated.ts` and `seed-db.ts`
  still hardcode `harfhane-db --remote` and were not touched — same risk, needs the same
  retire-or-repoint decision before anyone runs them again.
- Until then `eslint.config.js` ignores them (Plan 003 lints `apps/` and `packages/` only; without the ignore ESLint parses root `*.js` with defaults and fails), so `no-console` and unused-code rules do not reach them.

## Known bug fixed in passing
`findOrCreateWord` inserted user words with `category = NULL` and no `length`. This violated `NOT NULL` and stored 6-letter words as length 5. The baseline schema and repository now handle both.

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

## Architecture review findings (2026-10-05)
Four read-only reviews (system, backend, frontend, product) after the MVP was cut to daily + unlimited.
Items already in flight or already decided are left out: backend Turkey-day dates, Playwright e2e and docs
cleanup are in flight; auth hardening landed in #46; purchase-without-account, per-length visibility and the
self-healing schedule are now owner decisions recorded in `docs/plans/` and `docs/roadmap.md`, not open
backlog items; the further scope cuts considered here (accounts, XP/badges/freeze/leaderboard) were decided
and already removed end to end in #54.

### Needs the owner
- **Rate limiting that works.** `apps/backend/src/middleware/rate-limiter.ts` keeps counts in a per-isolate
  `Map`, so limits don't hold across Workers isolates; `/words/validate` is also counted twice. Move to the
  Workers Rate Limiting binding or a WAF rule (wrangler.toml / dashboard change).
- **Admin plane.** One static secret in `sessionStorage` (now compared in constant time, #46),
  no rate limit on `/api/admin/*`. Put Cloudflare Access in front of `/admin` and `/api/admin/*`.

### Agent work, no owner needed
- **Deploy stops on pending migrations.** Deploys now wait for CI, smoke-test `/api/health` and roll back
  (#53). Still open: stop the backend deploy when `wrangler d1 migrations list --remote` shows pending
  migrations.
- **Observability.** No `[observability]` in wrangler.toml; `onError` (`apps/backend/src/index.ts`) and the
  cron's `Promise.allSettled` swallow errors with no log. Enable Workers Logs, add one logger module exempt
  from the no-console lint rule, log errors and cron results, ping a heartbeat at the end of the cron.
- **`/api/config`.** Shipped APKs can't be forced to update: expose `minSupportedVersion` and feature flags
  (Invariant 8 needs a remote ads flag), and move response schemas into `packages/shared`. (Active-length
  reporting itself is covered by Plan 008 U1–U3.)
- **Shared engine.** Game-session reducer, stats and storage-key schema exist twice (mobile `src/game`,
  `src/stats`; web `useGameState.ts`, `useGameStats.ts`). Move the mobile versions into `packages/shared`,
  version the storage schema, key daily saves by the server's `date`.
- **Web player experience.** `min-h-screen` instead of `dvh` on game pages; no safe-area padding under the
  keyboard; `index.html:7` disables zoom (`user-scalable=no`, WCAG 1.4.4); guesses and results are not
  announced to screen readers (no `aria-live` on the grid); admin components are eagerly imported into the
  player bundle (`App.tsx`); `/admin` lacks `noindex`.
- **Sitemap still lists hidden lengths.** `apps/frontend/scripts/generate-sitemap.mjs`'s `STATIC_ROUTES`
  hard-codes `/daily/4`, `/daily/5` and `/daily/6` regardless of `PLAYABLE_WORD_LENGTHS` (Plan 008 R1); with
  only 5 playable, the sitemap still advertises `/daily/4`/`/daily/6` to crawlers even though the app
  redirects them away. Generate the sitemap's daily routes from the backend's playable lengths (or drop the
  non-playable ones) once this is worth a build-time fetch.

## Plan 008 U2/U3 follow-ups (playable lengths, 2026-10-06)
- **Lengths refresh only on cold start.** Both `apps/frontend/src/hooks/usePlayableLengths.ts`
  (`staleTime: Infinity`) and `apps/mobile/src/lib/playable-lengths.ts` (`usePlayableLengths`,
  fetched once per mount) only pick up a `PLAYABLE_WORD_LENGTHS` change on the next cold
  start/page load. Opening a length (KTD1's "one-line deploy") won't reach an already-running
  session until it's reloaded or restarted. Mobile: refetch when the app returns to the
  foreground (`AppState` → `active`). Web: a window-focus or visibility-change refetch, or a
  short `staleTime` instead of `Infinity`.
- **Stats of a hidden length become unreachable, not deleted.** If a length stops being playable
  (e.g. owner reverts `PLAYABLE_WORD_LENGTHS`), its `StatsContainer`/`StatsScreen` can no longer be
  opened from `HomeScreen` (the picker only offers playable lengths), but the stored
  `dailyStatsKey`/`unlimitedStatsKey` rows for that length remain in `AsyncStorage`/`localStorage`
  forever with no UI path to them. Decide whether that's acceptable (data just sits unused) or
  whether hidden-length stats need their own access point (e.g. still reachable once a length
  reopens) or a cleanup policy.

## Plan 008 U9 follow-up (web letter hint, 2026-10-06)
- **Midnight rollover can compute a hint against yesterday's word.** `useHint.ts` derives its
  localStorage key and reads `solution`/`guesses` from `useGameState`, but `useDailyWord` and
  `useGameState` already have a pre-existing drift in how they detect the day boundary (not
  introduced by this unit). If a tab is left open across midnight, it's possible for the hint
  hook to run `pickHint` against a `solution` that is stale relative to the now-current day's
  `getTodayString()`-keyed storage slot, or vice versa. Out of scope for U9; needs the same fix
  as (or depends on) resolving the `useDailyWord`/`useGameState` day-boundary drift itself.

## AC coverage check: source scanning is a stopgap
`scripts/check-ac-coverage.mjs` finds AE tags by regex-scanning test file source (JS/TS call
arguments, Python `def`/docstrings) rather than asking the test runner what tests actually exist
and ran. This is a parser, not a real one, so it can still be fooled by shapes it doesn't model
(e.g. a tag built from string concatenation, a dynamically generated test name, a test file the
runner excludes by config). Move the check to runner-collected test names instead (vitest's/
pytest's own test list, e.g. `vitest list --json` / `pytest --collect-only -q`) so it checks what
actually runs, not what the source merely looks like.

## AC coverage check / commit-gate gaps (PR #69 round 4, 2026-10-06)
- `.githooks/pre-commit`'s `CODE_PATTERN` does not match `scripts/` at all (it only matches
  `apps/`, `packages/`, and top-level files), so it never typechecks, lints or tests
  `scripts/*.mjs` or `scripts/**/*.py` changes. Include those paths in the pattern.
- `schedule-health-repository.test.ts`'s restock-runway query: removing `pool = 'daily'` from
  `fetchRestockRunwayDays` (`apps/backend/src/repositories/schedule-health-repository.ts`)
  survives the current test suite (an R4 mutation-testing gap, found in PR #69 round 4 review).
  Add a test that an unlimited-pool word of the matching length does not count toward
  `restockRunwayDays`.

## AC coverage check: more skip/pending shapes it can miss (PR #69 round 6, 2026-10-06)
`scripts/check-ac-coverage.mjs`'s skip handling (`describe.skip(...)`, `.skip`/`.todo` on a test
call, `@pytest.mark.skip`) does not yet cover: a skip block whose body contains an unbalanced `)`
(e.g. inside a string or comment, defeating `findMatchingParenIndex`'s naive depth count);
`@unittest.skip` applied at class level (skips every test method, not matched by the per-test
decorator check); a multi-line skip decorator (args spanning several lines before the decorated
`def`); `pytest.skip()` or `self.skipTest()` called from inside a test body (always-skips but
looks like a normal test to the regex); `describe.skip.each(...)` and `xdescribe(...)` (alternate
spellings of a skipped suite); `it.fails(...)` (Jest/Vitest: expected to fail, not a proof either);
and a template-literal test name whose state (e.g. a module-level counter or captured loop
variable used to build the name) never resets between files, so two tags can collide or one can
go unseen depending on scan order. Each needs its own fixture and regex/parsing fix in
`scripts/check-ac-coverage.mjs` and `scripts/check-ac-coverage.test.mjs`.

## Reusable factory (after Harfhane is stable)
Owner decision 2026-10-06: the development system (agents, `/unit`, Invariant style, commit gate, CI
deploy gate, review checklist, AE traceability, mutation gate, plan/ADR templates, monthly research
routine) should later be reusable for another product on the same stack (pnpm monorepo, Hono +
Workers + D1, React + Vite, Expo). Do it once Harfhane has shipped and the gates have settled: write an
ADR, map every file as factory or product, extract the factory layer into a GitHub template repo and
`~/second-brain/templates/`, then prove it by bootstrapping a small project through one unit. Until
then, write new rules so the factory part stays separable from product rules.

## Mobile UI primitives wiring (Plan 011 U7a, follow-up in U7b/U7c)
U7a (split across PR #97 `IconButton`/`TopBar`/`layout.ts` and a follow-up PR `Button`/`Card`,
based on #97) added the mobile UI standard's layout constants and shared primitives, but changed
no screen (the owner approved starting U7a in parallel with U1-U6's open PRs since it only adds
files). `ICON_SIZE` and `SCREEN_PADDING` (`apps/mobile/src/ui/layout.ts`) were tagged `@deferred`
for knip since nothing imported them yet; U7b/U7c wire `IconButton`/`TopBar` into `GameScreen`,
`StatsScreen`, `HowToPlayScreen`, `SettingsScreen`, `GameOverCard` and `HomeScreen`, at which point
both constants gain real importers and the tags come off. Both tags are off as of Plan 011 U7c:
`SCREEN_PADDING` from the `HomeScreen.tsx` prep edit (still the old screen; it just adopts the
constant for its existing padding value), and `ICON_SIZE` once `HomeHero`/`DailyCard`/
`UnlimitedCard` got their own test files (knip counts a component as really used once anything
outside it imports it, including its own test, so the `knip.jsonc` ignore entries this plan unit
briefly carried for those three files came off too — they were only ever needed between adding the
files and giving them their own tests). `TopBar`'s `leading`/`trailing`
are plain `ReactNode` slots; `lucide-react-native` landed on `main` via #93, so U7b/U7c can now
compose the actual `IconButton` + Lucide icon elements directly. `TopBar`'s `variant="home"` (no
title, an asymmetric leading slot for the streak chip, up to three trailing actions) is in place;
U7c still has to build the streak chip itself and wire `HomeScreen` to the variant, per
`docs/design/mobile-redesign-spec.md` section B.

`Button`/`Card` (the follow-up PR above) are likewise not wired into any screen; U7b/U7c adopt them
in `GameScreen`, `StatsScreen`, `HowToPlayScreen`, `SettingsScreen`, `GameOverCard` and
`HomeScreen`. Nunito body text (`docs/design/mobile-ui-standard.md` section 2) also stays open;
`Button`/`Card` text still uses the system font since adding `@expo-google-fonts/nunito` needs
touching `App.tsx`'s font loading, out of scope for a files-only unit.

`Chip`, `DepthTile` and `AppText` (a third PR, based on `Button`/`Card`) are likewise unwired: U7c
builds the home streak chip, mode cards' status rows and length selector (`Chip`), the hero
H-A-R-F tiles and a mode card's icon tile (`DepthTile`), and adopts `AppText` for card text (CA3).

## Engagement ideas after launch (owner undecided, 2026-10-06)
From `docs/research/2026-10-06-mobile-polish-engagement.md`: local streak calendar, hard mode,
local achievements, share image (needs a dependency), sound (off by default), visual themed weeks,
timed mode. Local reminders need an owner decision against the no-push scope cut. Revisit after the
closed test; promote chosen items into a plan.

## Keyboard still owns its own useHapticsSettings() call alongside the GameScreen prop (2026-10-07)
`GameScreen.tsx` now passes `isHapticsEnabled={game.isHapticsEnabled}` and
`isInputBlocked={session.isSubmitting}` to `Keyboard` (PR #87/#94 merged, so this was no longer
off limits). `Keyboard`'s own `useHapticsSettings()` call stays as a fallback for callers that
don't pass the prop (several `Keyboard.test.tsx` cases render it standalone), so there are two
hook instances live during a real game: `useGame`'s and `Keyboard`'s own, both reading the same
AsyncStorage key. Harmless today (the prop always wins via `??`), but worth collapsing to one
instance if `Keyboard` ever drops its standalone use case.

## Un-awaited `fireEvent`/`fireEvent.press` calls caused order-dependent test failures (2026-10-07)
RNTL 14's `fireEvent` and `fireEvent.press` both return `Promise<void>`; a few mobile test files
called them without `await` (often inside an `act(async () => {...})` wrapper, which doesn't make
the inner call awaited). The dangling promise could still be pending when the next `act()` call in
the file started, printing "You seem to have overlapping act() calls" and, in at least one case,
corrupting a later test's `screen` queries. Fixed in `Keyboard.test.tsx`, `SettingsScreen.test.tsx`
and `App.test.tsx` by awaiting every call directly (`await fireEvent.press(...)`, no `act()`
wrapper needed). `@typescript-eslint/no-floating-promises` would catch this class of bug, but it
needs type-aware linting (`parserOptions.project`), which `eslint.config.js` doesn't set up for
any workspace yet — enabling it is a repo-wide change, not specific to mobile tests, so it's left
here rather than done as part of this fix. Worth doing once the gate's lint step can afford the
slower typed run; audit the rest of `apps/mobile/src/**/*.test.tsx` and `apps/frontend` for the
same pattern at the same time.

## Web hint control sits too close to the keyboard (owner, 2026-10-07)
The hint control above the on-screen keyboard has no breathing room from it on web; add spacing
between them.

## Web desktop layout looks like a stretched mobile layout (owner: mobile first, 2026-10-07)
On desktop, the web app just stretches the mobile layout instead of using the extra width. A real
desktop layout is post-launch work; mobile ships first.

## Mobile U7b: game-over card touch targets and button hierarchy (2026-10-07)
Found during Plan 011 U1 review, deferred to the U7 mobile UI standard redesign:
- `GameOverCard`'s "Paylaş" and "Yeni kelime" buttons are ~45 dp tall (`SPACING.md` vertical
  padding plus `FONT_SIZE.bodyLarge` text), under the 48 dp minimum touch target
  (`docs/design/mobile-ui-standard.md`).
- "Yeni kelime" currently uses `colors.present`/`colors.presentFg` (a primary-looking fill) but is
  a secondary action next to "Paylaş"; it should use the secondary pairing
  (`colors.surface` + `colors.surfaceBorder`) instead.
- "Paylaş" has no icon; it should get a Lucide `Share2` icon next to the label, matching the icon
  convention used elsewhere in the mobile UI standard.

## Plan 009 R3: axe coverage only reaches four journeys so far (2026-10-08)
`apps/frontend/e2e/support/axe.ts` (`assertNoSeriousA11yViolations`) is wired into home, daily
(in-progress guess and the won game-over modal), and unlimited (on load and its won game-over
modal). Not yet scanned: the daily loss journey (`Oyun Bitti` heading state, `daily.spec.ts`), the
hint flow (the revealed-hint pill and the hint-exhausted state), the Turkish-keyboard journey
(`keyboard.spec.ts`), the legacy-redirect journeys (`home.spec.ts`'s `/lists`, `/play/...`,
`/tournament` redirects), and a reload-restore state (`a finished daily game survives a reload`).
Add scans to these once a future plan unit touches `apps/frontend/e2e/**` again, or as a dedicated
follow-up.

## Remaining `text-white` on bg-correct/bg-present spots not covered by any axe scan (2026-10-08)
Found while fixing Plan 009 R3's real color-contrast violations (PR #107): the same
`text-white`-on-brand-color pattern that failed axe on `HomePage.tsx` and `GameOverModal.tsx`
also appears in components no current Playwright journey visits, so axe never ran against them
and they were left unfixed to keep that PR scoped to what the scan actually caught:
- `apps/frontend/src/components/SplashScreen.tsx:61` — splash tile letters, `text-white` on
  alternating `bg-correct`/`bg-present`.
- `apps/frontend/src/components/StatsModal.tsx:33` — guess-distribution bar label, `text-white`
  on `bg-correct`/`bg-absent`.
- `apps/frontend/src/components/InstallPrompt.tsx:84` — install button, `text-white` on
  `bg-correct`.
- `apps/frontend/src/components/SettingsModal.tsx:20` — selected-option pill, `text-white` on
  `bg-correct`.
- `apps/frontend/src/components/GameErrorScreen.tsx:19` — retry button, `text-white` on
  `bg-tile-correct`.
Fix the same way: swap `text-white` for the semantic `-fg` token (`text-correct-fg` /
`text-present-fg`), or scan these screens first to confirm which ones actually fail before
changing them.

## Label eval candidate is not bound to the batch it vets (Plan 010 U5/U6, 2026-10-08)
`scripts/words/validate_labels.py --eval-candidate` isn't tied to the labelling run it vets (no
prompt version or model id recorded/checked); a stale, unrelated candidate file passes the gate
just as well as the real one, as long as it is not literally the golden file (only that exact case
is blocked, by the `--eval-candidate`/`--golden` realpath check in `validate_labels.py`). A
candidate file that copies the golden set's held-out decisions under a different path is not
detected at all (the `_copies_golden_decisions` heuristic that used to flag this was removed: it
was trivially bypassed by changing one reject reason, and it blocked a legitimately perfect
candidate). Needed once prompt calibration or model-swap tracking lands.

## test_eval_labels.py doesn't pin which hash half is held-out (2026-10-08)
`eval_labels.split_golden()`'s hash bucketing decides which half calibrates prompts and which is
held out for scoring, but no test pins bucket `0` to calibration and `1` to held-out specifically
(only that the two halves partition the set). Needed once prompt calibration reads the
calibration half, so a silent bucket swap doesn't go unnoticed.

## validate_labels.py's daily-pool cleanup also deletes a stale committed review CSV (2026-10-08)
`validate_labels.py main()`'s `_remove_stale_review_csv` runs for the daily pool too: a labels
file with blocking errors deletes `data/words/review/review-5.csv` even though the daily pool
isn't gated by the eval gate. `review-5.csv` is regenerable from `labels-5.jsonl` by a clean
re-run and git-recoverable (`git checkout -- data/words/review/review-5.csv`), but this is worth
a second look if the daily-pool cleanup should instead be scoped to `--pool unlimited` only.

## Flaky test quarantine: GameScreen.test.tsx win title (011-AE1, 2026-10-08)
`should show the game-over card with a deterministic win title when the daily word is guessed
with the keyboard (011-AE1)` (`apps/mobile/src/screens/GameScreen.test.tsx:65`) timed out once in
CI during Plan 011 U7c review (run 37762150965), passing on rerun. Per the flaky-test policy
(`AGENTS.md`), quarantined here rather than silently rerun; fix the root cause (likely
`advancePastGameOverGate`'s real-timer/fake-timer interaction under CI load) or delete within a
week of this entry.

## apps/mobile stats.ts yesterdayOf uses local time, breaks across a DST transition (2026-10-08)
`yesterdayOf` (`apps/mobile/src/stats/stats.ts:48-52`) builds `yesterday` with `new Date(today)` +
`date.setDate(date.getDate() - 1)`, both evaluated in the device's local time zone. In a positive-
offset DST zone (e.g. `TZ=Europe/Berlin`), the day after a fall-back transition (2026-10-26 in that
zone) computes `yesterday` as 2026-10-24 instead of 2026-10-25, so `recordDailyResult` wrongly
treats a streak as broken (or wrongly keeps one alive) right after the transition.
`apps/mobile/src/home/today-status.ts`'s own `yesterdayOf` (Plan 011 U7c) already parses/formats
in UTC and does not have this bug; fix `stats.ts` to share that one implementation instead of
duplicating a second, broken one.

## Plan 011 U7d: LaunchIntro design choices not specified by the owner (2026-10-09)
The owner's 2026-10-09 decision gave exact geometry for the launcher icon (240 px reference) but
not for: the adaptive-icon safe-zone shrink factor, the splash mask shrink factor, or the JS
intro's exact per-phase millisecond durations (only "~150 ms" tile stagger and "about 2 s" total
were specified). `apps/mobile/scripts/generate-brand-assets.mjs` uses `ADAPTIVE_SAFE_ZONE_SCALE =
0.58` (lowered from an initial 0.72 during review: the original value also had a double-scale bug
that shrank the adaptive/monochrome mark far more than 0.72 implied, and the mark was off-centre;
both are fixed, see the #133 PR) and `SPLASH_MASK_SCALE = 0.55`.

`apps/mobile/src/components/useLaunchIntroPhases.ts` initially picked phase durations that landed
the total intro around ~3.1 s (driven mostly by the fixed `motion-flip` (500 ms) token applied
across 8 tiles, plus a ~600 ms hold added during review so the wordmark is actually readable
before the cross-fade). The owner's 2026-10-09 follow-up decision asked for ~2.3 s instead: `Tile`
now takes an optional `flipDurationMs` prop (defaults to the shared 500 ms token, unchanged for
the real game reveal), and the intro passes a new `INTRO_FLIP_MS` (350 ms); `ROW_STAGGER_MS` drops
from 150 ms to 50 ms. `WORDMARK_HOLD_MS` (600 ms) is unchanged. `useLaunchIntroPhases.test.tsx`
pins the new ~2.3 s total under fake timers. Worth an owner look on a release build/screenshot
before the closed test, since neither the native splash mask nor the timing feel was verified
against a release build (Expo Go was used instead; see Plan 011 U7d PR for what that does and does
not cover).

## Plan 011 U7d: hero onLayout hook not added (2026-10-09)
The plan's U7d file list mentions "the hero onLayout hook in HomeScreen.tsx", carried over from
the pre-2026-10-09 spec where the intro morphed the splash tile into the hero's exact on-screen
slot. The owner's 2026-10-09 decision replaces that with a self-contained intro (mark fades away,
tiles reveal, wordmark gathers, then a plain cross-fade to the already-mounted home screen), which
never needs to know the hero's position. No onLayout hook was added to `HomeHero.tsx`/
`HomeScreen.tsx`; flag this if a future redesign wants the morph-into-hero effect back.

## Status bar icons during the launch intro (review of #136, 2026-10-10)
In the light theme `App.tsx` renders `StatusBar` style `dark`, so for the ~2.3 s intro the status
bar icons sit dark-on-dark over the fixed `#1c1611` overlay. Switch the status bar to `light`
while `LaunchIntro` is showing. Not checked on a device.

## Mobile: device clock off by a day (2026-10-10, review of #147)
`useGame.ts`'s `loadSession` now keys the daily game, its storage entry, the hint storage key,
and the stats entry all by the server's own `/words/daily` `date`, never the device's `today()`
(fixing the game-over-countdown/double-count bug). But several other mobile surfaces still read
the *device's* local date directly, so a device whose clock is a day off from the real Turkey day
can disagree with itself across screens:

- **(a) Device ahead by a day.** `GameOverCard`'s midnight-rollover check (`useIsDailyGameStale`)
  compares the live Turkey-day tracker (driven by the device clock) against the server's `date`.
  If the device is a day ahead, the tracker reads "tomorrow" all day while the server's `date`
  never catches up, so the new-day CTA ("Oyna") shows for the entire day instead of only after
  real midnight. Pressing it is harmless (loadSession restores the same already-finished,
  server-keyed entry, confirmed by `GameScreen.test.tsx`/`useGame.test.tsx`), but the CTA is shown
  far earlier than it should be.
- **(b) Device behind by a day.** The home screen's status (`useHomeStatus.ts`'s `useTurkeyDay`,
  driven by `now: () => Date` / `getTodayString(now())`) and the Stats screen's streak
  (`StatsScreen.tsx`'s `today = getTodayString()` default, feeding `getDisplayedStreak`) both still
  read the device's local date, while the actual game/hint/stats records are now keyed by the
  server's date. A device a day behind the real Turkey day sees yesterday's daily card status
  (e.g. "Yeni kelime hazır" for an already-played day) and a streak of 0 even though the server
  and the stored stats agree the player is on a current streak.
- **(c) Upgrade-time clock skew.** A player who upgrades (or first opens the app after this fix)
  while their device clock happens to be a day off loses that day's in-progress game: it was
  stored under the old device-dated key (from before this fix, or from another screen still using
  `today()`), which the server-keyed `loadSession` will never look up again. The same skew can
  also grant a second hint reveal once, if the hint storage key the device wrote under one date
  doesn't match the key a later, correctly server-dated read looks for.

Only affects devices whose clock disagrees with the real Turkey day by roughly a day; a correctly
set clock is unaffected (confirmed by the #147/#154 review — no blocking bug for correct clocks).
Decided not to chase further for now; suggested fix direction for a future pass: derive a single
server-day offset (or the server's own `date` string) from the `/words/daily` response once, and
thread that same value into `useHomeStatus.ts`, `StatsScreen.tsx`'s streak, and anywhere else that
currently calls `getTodayString()`/`today()` directly, instead of each screen computing its own
notion of "today" from the device clock independently.

## Deploy workflows pay for waiting on CI (2026-10-10)

`deploy-backend.yml` and `deploy-frontend.yml` poll the CI run of their commit (`gh run watch`), so
every deploy bills the CI duration a second time. A `workflow_run` trigger (start only after CI
succeeds on `main`) removes the wait, but `workflow_run` has no `paths` filter, which conflicts
with Invariant 9 as written; changing it needs an owner-approved ADR and an in-job path check.

## Plan 009 U6: backend Stryker mutation testing not wired (2026-10-10)

R7/KTD4 ask for Stryker on `apps/backend/src/{services,repositories}` too, with a fallback to a
plain Vitest config if the Workers pool doesn't work. It doesn't, in a way a plain config can't
paper over: `@stryker-mutator/vitest-runner@10.0.0` runs vitest through its own Node-API
invocation (`startVitest`), which does not go through `@cloudflare/vitest-pool-workers`'s custom
pool (`apps/backend/vitest.config.ts`'s `defineWorkersConfig`). Confirmed by running
`npx stryker run --mutate src/repositories/word-repository.ts` (and
`schedule-health-repository.ts`) from `apps/backend`: the dry run fails before a single mutant
runs, with `crypto.subtle.timingSafeEqual is not a function` — a Workers-only API that exists
under the real pool (`wrangler`/`miniflare`) but not under plain Node, which is what Stryker's
runner actually executes tests under regardless of the `vitest.config.ts` passed to it. Any
backend test touching a D1 binding would fail the same way, since D1 bindings don't exist outside
`workerd` either.

A "plain Vitest config" fallback would mean giving `services`/`repositories` their own non-D1,
non-Workers-binding test doubles so they can run under Stryker's plain-Node vitest at all — a
rewrite of how those layers are tested, not a config change, and out of scope for this unit per
the owner's "deliver shared now" instruction. `packages/shared` Stryker
(`packages/shared/stryker.conf.json`) ships in Plan 009 U6; `scripts/mutation-changed.mjs`'s
`PROJECTS` list has only `shared` for now. Revisit if Stryker ships a Workers-aware test runner,
or if backend services/repositories get a binding-free unit-test layer for another reason.

## Plan 009 U6: a throwaway git fixture's commands leaked onto the real repo via ambient GIT_* env vars (2026-10-10)

While building `scripts/mutation-changed.mjs`'s `getChangedFiles`, its first test suite spun up
throwaway git repos under `os.tmpdir()` to prove committed/uncommitted/untracked/deleted-file
handling. Those fixture repos' `git init`/`add`/`commit` calls ran inside the repo's own
pre-commit hook (`pnpm test` → `node --test scripts/*.test.mjs`), and git hooks run with
`GIT_DIR`/`GIT_WORK_TREE`/`GIT_INDEX_FILE`/`GIT_COMMON_DIR` already set to the *real* repository.
Those env vars are inherited by every child process unless explicitly cleared, so the fixtures'
git commands — despite being given a throwaway `cwd` — resolved against the real `.git`, and
their `git commit`s landed for real on the branch being worked on. Separately, one draft of the
fixture helper called `git config user.email`/`user.name` directly against what it believed was
an isolated repo; combined with the same env leak, this once wrote a stray `[user]` section and
flipped `core.bare` in the *shared* repo's `.git/config` (the repo all worktrees share), and moved
`refs/remotes/origin/main` to a fixture commit. The owner repaired it by hand.

Fixed in `scripts/mutation-changed.mjs` (`stripGitEnv`, used by every git call the script itself
makes) and in the test file's fixture helper (`fixtureGitEnv`, layering
`GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CEILING_DIRECTORIES=<tmp parent>`
on top, and supplying commit identity only via `GIT_AUTHOR_*`/`GIT_COMMITTER_*` env vars — never
`git config user.*`, so no config file is ever written, not even the fixture's own). Both strip
*every* `GIT_`-prefixed env var (not an allowlist), so a future git env var doesn't reopen the
same hole. Proven against a disposable "victim" git repo (not a worktree of this repo) with
`GIT_DIR`/`GIT_WORK_TREE`/`GIT_INDEX_FILE`/`GIT_COMMON_DIR`/`GIT_CONFIG` all pointed at it before
running the full test file: the victim's `.git/config`, refs and object count were identical
before and after (see the PR body for the exact before/after output). Any future contributor
adding a git-touching test fixture to this repo should run the same proof before trusting it.

## Plan 009 U6: packages/shared's first mutation scores need raising, and Stryker runs full (not incremental) (2026-10-10)

The first full `packages/shared` Stryker run (R10) scored 73.55% overall, above the 70 break
threshold, but two files are weak and will fail `scripts/mutation-changed.mjs`'s per-file gate
the moment a PR touches them again (the gate scores each changed file on its own, not blended
into the full-package average):

- `evaluate.ts`: 68.25% (6 survived + 14 no-coverage out of 63 countable mutants) — already below
  the 70 break threshold on its own.
- `keyboard.ts`: 0% (0 of 18 mutants killed; no test imports it directly, or exercises it only
  incidentally without asserting on its behavior).

Neither was fixed in U6 (out of scope: the unit adds the gate, not new tests for pre-existing
code, per R7's "old code is not retrofitted" decision). The first PR that changes either file will
have to bring that whole file's score over 70 as part of its own diff, not just avoid lowering it
further — flagged in that PR's "Not covered" or fixed before merging.

Also: `packages/shared/stryker.conf.json` does not enable Stryker's incremental mode
(`incrementalFile`/`--incremental`), and `scripts/mutation-changed.mjs` runs one Stryker
invocation per changed file rather than batching them (needed so "Instrumented N source file(s)
with M mutant(s)" unambiguously describes one file — see `decideFileResult`'s module comment).
Both are performance choices only (correctness is unaffected); worth revisiting once the gate is
running routinely and per-run time matters.

## Plan 010 U3 deferred until after the first release (owner, 2026-10-11)
Strict flags (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) and ts-reset for
`apps/mobile`. Mobile already compiles with `strict`; the bugs found in Phase 1 were date logic,
which these flags would not have caught. Pick up after launch with the U1/U2 pattern (type tests
that fail when a flag is removed).

## Plan 012 U5: StatsModal still renders distribution counts inside the filled bar (2026-10-14)

`apps/frontend/src/components/StatsModal.tsx`'s `DistributionBar` still draws the guess count
inside the coloured fill (`text-white text-xs font-bold` layered on `bg-correct`/`bg-absent`),
the same mobile-ui-standard C2 contrast issue Plan 012 U5 fixed in `GameOverModal.tsx` (R6,
AE7). Not in U5's scope (StatsModal's distribution bar is not part of R6), but worth the same
fix — move the count to a sibling span in `text-text-primary`, outside the fill — the next time
StatsModal.tsx is touched.

## Plan 013: web feedback entry point, PrivacyPage and data-safety draft (2026-10-24)

Plan 013 (in-app feedback) ships backend + mobile only; the web app gets no feedback entry point
in that plan (left out as "optional, only if small"). Also not done in Plan 013: updating
`PrivacyPage` and `docs/drafts/play-data-safety.md` to mention the new `feedback` table and
optional contact field (that draft is on another branch) — do both the next time either file is
touched, or as its own small follow-up plan.

## D1 export backups do not restore as-is (found 2026-10-24)
`wrangler d1 export harfhane --remote` taken after 0003 fails to import into a fresh local D1
(`no such table: main.words`), even with the four `CREATE TRIGGER` blocks moved to the end — the
dump's statement order no longer matches dependencies after 0003 rebuilt `words`. Time Travel
(`wrangler d1 time-travel restore`) is the working rollback; the SQL export is not a tested
restore path. Fix: a `scripts/` helper that reorders an export (tables, then data, then indexes and
triggers) plus a restore rehearsal in the runbook. Applied 0004 to remote `harfhane` on
2026-10-24 with owner approval: it only adds the `feedback` table and its index; the faithful
rehearsal failed on this import issue, a fresh 0001–0004 apply passed locally, and Time Travel
bookmark `00000076-00000000-0000510e-46b21427665e103e2ac2c7e4950fbd5f` was recorded first.

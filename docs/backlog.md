# Backlog

Deliberately deferred work. Delete an item when it is done; status lives in git.

## Agent docs overlap
`AGENTS.md` (generic multi-agent rules) and `CLAUDE.md` (772 lines) overlap. `AGENTS.md` still describes a delegation system that predates the owner's global model policy.
- Harmless today: both are read, and the rules mostly agree.
- Fix: make `AGENTS.md` the single project source (context, invariants, commands), have `CLAUDE.md` reference it, and drop the duplicated sections.

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

## Token cost of agent docs
`CLAUDE.md` (772 lines) and `AGENTS.md` (267 lines) load into every session.
- Slim them to project-specific rules.
- Keep generic rules in the owner's global config.
- See "Agent docs overlap".

## Test typecheck config
`npx tsc -p apps/backend/tsconfig.test.json` reports 79 errors: missing Workers types, `ScheduledEvent`, implicit `any` in repositories. The cause is that the `types` override drops `@cloudflare/workers-types`. The normal `pnpm typecheck` passes.

## Legacy migrations folder
`apps/backend/migrations/` (26 files) is replaced by `apps/backend/db/migrations/0001_baseline.sql`.
- Delete the legacy folder at database cutover.
- Point the root `scripts/` (which target `harfhane-db`) at the new pipeline, or retire them.

## Known bug fixed in passing
`findOrCreateWord` inserted user words with `category = NULL` and no `length`. This violated `NOT NULL` and stored 6-letter words as length 5. The baseline schema and repository now handle both.

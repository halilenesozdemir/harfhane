# Harfhane

Turkish word game (daily and unlimited modes, duels, XP, badges) on web and Android.
`AGENTS.md` holds the Invariants and agent setup; it is binding. App-specific notes: `apps/backend/CLAUDE.md`,
`apps/frontend/CLAUDE.md`, `apps/mobile/CLAUDE.md`.

## Layout

- `apps/backend` — Hono on Cloudflare Workers, D1. `apps/frontend` — React 19 + Vite PWA. `apps/mobile` — Expo Android.
- `packages/shared` (`@harfhane/shared`) — types and game logic used by all three apps, including `normalizeChar` / `normalizeWord`.
- `packages/ui-tokens` (`@harfhane/ui-tokens`) — design tokens: edit `tokens.json`, run `pnpm --filter @harfhane/ui-tokens run build`, commit the generated files (a test fails if they drift).
- `docs/roadmap.md` — plan order and what waits on the owner; read it before picking work. Plans in `docs/plans/`, evidence in `docs/research/`, ADRs in `docs/decisions/`, deferred work in `docs/backlog.md`. `docs/archive/` is history only.

## Commands

`pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm typecheck:test`, `pnpm lint`, `pnpm test` (shared, ui-tokens, frontend, mobile, backend).
Run one workspace with `pnpm --filter @harfhane/<name> run <script>`.

Commit gate: `.githooks/pre-commit` runs typecheck, test typecheck, lint and tests when code is staged (`pnpm install` enables it). A red gate means fix the code; never `--no-verify`.

## Rules agents here have broken before

- Turkish casing: never `.toUpperCase()` / `.toLowerCase()` on Turkish text; `"i".toUpperCase()` is `"I"`, not `"İ"`. Use `normalizeWord()` / `normalizeChar()`.
- User-facing text uses correct Turkish characters (ç ş ğ ı ö ü İ Ş Ç Ğ Ö Ü) and no emojis (Lucide icons instead).
- Stage files explicitly; never `git add -A`. The frontend build regenerates `apps/frontend/public/sitemap.xml`; commit it only when the change is about the sitemap.
- Work in a worktree under `../harfhane-wt/`, never in the main checkout, and never touch another agent's worktree.
- Do not edit `.claude/settings*.json`; that needs the owner.

## Conventions

- Tests: TDD; names are English, `should <behavior> when <condition>`. A test that proves an
  approved plan's acceptance example adds the id to the name: `should <behavior> when <condition>
  (<plan>-AE<n>)` (e.g. `should fail when AE has no test (008-AE4)`); `pnpm run check:ac` enforces
  this (`scripts/check-ac-coverage.mjs`).
- Commits: Conventional Commits whose scope is the changed path, e.g. `fix(repositories/admin-repository.ts): include length in daily word insert`.
- PRs: at most 500 changed lines, 15 files, 10 commits; split otherwise. Body has Summary, Verification (evidence, gate result) and Not covered.

## Done means

The commit gate is green, a fresh-context review (the `reviewer` agent) found nothing real or its findings are fixed, the PR body states the evidence and what was not verified, and anything left undone is in `docs/backlog.md`.

## Deploy

Merging to `main` deploys: `.github/workflows/deploy-backend.yml` (paths `apps/backend/**`, `packages/shared/**`) and `deploy-frontend.yml` (`apps/frontend/**`, `packages/shared/**`, Pages project `harfhane`). Manual fallback: `gh workflow run <file>`. Remote D1 writes are covered by Invariant 4.

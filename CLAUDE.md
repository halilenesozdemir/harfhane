# Project Rules — Harfhane

> Harfhane: TDK kelime havuzuyla oynanan Türkçe Wordle oyunu — günlük ve sınırsız mod, düello, turnuva, XP ve rozet.
> This file is read by Claude Code and all subagents it spawns. **`AGENTS.md` → Invariants is binding** and
> takes priority over anything here. Global user rules (`~/.claude/CLAUDE.md`) already cover TS strict/no
> `any`, no comments, no `console.*`, Conventional Commits, max 20-line functions / 250-line files, 2-level
> nesting, no magic numbers, pnpm, PEP, and the multi-agent model policy — not repeated below.

| Faz   | Odak                              | Durum      |
| ----- | ---------------------------------- | ---------- |
| Faz 1 | Monorepo + Hono Backend + D1       | Tamamlandı |
| Faz 2 | Custom Word Lists + Admin Paneli   | Geliştirme |
| Faz 3 | Kullanıcı Hesapları + Ticari Model | Roadmap    |

---

## Monorepo Structure

```
harfhane/
├── apps/
│   ├── frontend/            # React 19 + Vite + TypeScript — see apps/frontend/CLAUDE.md
│   └── backend/              # Hono + Cloudflare Workers — see apps/backend/CLAUDE.md
│       ├── db/migrations/   # Current schema source (0001_baseline.sql) — see AGENTS.md Invariant 2
│       ├── migrations/      # Legacy, pre-cutover; see docs/backlog.md "Legacy migrations folder"
│       └── db/seeds/
├── packages/shared/          # Shared TypeScript types (@harfhane/shared)
├── packages/ui-tokens/       # Design token source: tokens.json → generated CSS + TS (@harfhane/ui-tokens)
├── docs/
│   ├── plans/                # Active feature/infra plans
│   ├── decisions/             # ADRs — required to change an Invariant
│   ├── archive/               # Superseded docs (e.g. this file's previous version)
│   └── backlog.md             # Deliberately deferred work
├── .claude/{settings.json,skills/,agents/,commands/}
├── .github/workflows/         # deploy-backend.yml, deploy-frontend.yml
├── AGENTS.md                  # Invariants, tiers, delegation protocol
└── CLAUDE.md                  # This file
```

**CLAUDE.md hierarchy** (top to bottom, each layer adds to the one above):
1. `~/.claude/CLAUDE.md` — global user preferences
2. `CLAUDE.md` — this file
3. `apps/frontend/CLAUDE.md`, `apps/backend/CLAUDE.md` — app-specific context

---

## Commands

| Command | Scope |
| ------- | ----- |
| `pnpm dev` | Run frontend + backend dev servers in parallel |
| `pnpm dev:frontend` / `pnpm dev:backend` | Run one side only |
| `pnpm build` | Build shared, then frontend + backend |
| `pnpm typecheck` | Recursive `tsc --noEmit` across workspaces |
| `pnpm lint` | Recursive lint across workspaces |
| `pnpm test` | Vitest in shared, frontend and backend |
| `pnpm --filter @harfhane/backend run deploy` | `wrangler deploy` |
| `pnpm --filter @harfhane/backend run db:migrate:local` / `db:migrate:remote` | Apply `db/migrations/` via wrangler |
| `pnpm --filter @harfhane/frontend run test:coverage` | Frontend coverage run |

Per-app commands and gotchas: `apps/backend/CLAUDE.md`, `apps/frontend/CLAUDE.md`.

**Commit gate**: `.githooks/pre-commit` runs typecheck + lint + test whenever code is staged; `pnpm install` enables it via `prepare`. A red gate means fix the code, never `git commit --no-verify`.

---

## Backend Rules (Hono + D1)

- **Layering is mandatory**: `Routes (src/routes/) → Services (src/services/) → Repositories (src/repositories/)`. Routes never touch D1 directly.
- **Schema source**: `apps/backend/db/migrations/0001_baseline.sql` only (AGENTS.md Invariant 2). Tests apply it through `readD1Migrations` / `applyD1Migrations` (`apps/backend/vitest.config.ts`, `apps/backend/tests/helpers/db.ts`) — never hand-write schema in tests.
- **Validation**: all input validated at the route boundary with Zod (`@hono/zod-validator`), schemas under `src/schemas/`.
- **Errors**: typed `ApiError` classes (`src/errors/`); internal error detail never reaches the client.
- **API shape**: success `{ data: T }`, error `{ error: { code, message } }`; status codes limited to 200/201/400/401/404/409/422/500.
- **TDD**: write the failing test first. Test tree mirrors `src/`: `tests/repositories/`, `tests/services/`, `tests/routes/`.
- **Turkish text**: never `.toUpperCase()` on Turkish strings — use `normalizeWord()` (`src/utils/normalize.ts`); `"i".toUpperCase()` yields `"I"`, not `"İ"`.
- **Word lifecycle**: words are never deleted, only `is_active = 0`. Only `status = 'approved'` and `family_safe = 1` words may ship to players (Invariant 1) or be scheduled as daily (Invariant 4) — the DB enforces this, don't work around it.
- **Scheduling**: `daily_words` has `UNIQUE(date, length)`; use `ON CONFLICT(date, length) DO UPDATE SET word_id = excluded.word_id`.
- **No TDK data**: no scraping/copying from `sozluk.gov.tr`; every word row records `source` and `license` (Invariant 3).

## Frontend Rules (React + Vite)

- **Stack**: React 19, Vite 7, TypeScript 5 strict, Tailwind 3, TanStack Query v5, Lucide React.
- **Components**: declare with `function`, not arrow-`const`. Props interface named `ComponentNameProps`. Types live in `src/types/index.ts` (re-exports `@harfhane/shared`) — import from there, not the package directly.
- **Hooks**: custom hooks in `src/hooks/`, named `use*.ts`. Server state goes through TanStack Query, not duplicated into local/Context state; data transforms belong in `select`, not the component.
- **Styling**: token values live only in `packages/ui-tokens/tokens.json`; edit it, run `pnpm --filter @harfhane/ui-tokens run build`, commit the generated files (a test fails if they drift). Theme is a token set — use `--hh-*` Tailwind classes (`bg-correct`, `text-correct-fg`, `shadow-depth-*`); no raw hex in components (Invariant 5). No inline `style` or `!important` without a documented reason.
- **UI text**: no emojis anywhere (Lucide icons instead); every `<button>`/`<a>`/`onClick` has `cursor-pointer`; all user-facing text uses correct Turkish characters (ç ş ğ ı ö ü İ Ş Ç Ğ Ö Ü).
- **Turkish casing**: use `normalizeChar()` / `normalizeWord()` from `src/utils/gameLogic.ts`, same pitfall as backend.
- Full key-file map and gotchas: `apps/frontend/CLAUDE.md`.

## Testing

| Tool | Purpose |
| ---- | ------- |
| Vitest | Test runner, both apps |
| `@cloudflare/vitest-pool-workers` | Workers/D1 runtime for backend tests |
| `readD1Migrations` (`apps/backend/vitest.config.ts`) | Loads `db/migrations/` into `TEST_MIGRATIONS` |
| `apps/backend/tests/helpers/db.ts` | `applySchema` + `seedTestData` |

- Test names: `should [expected behavior] [when condition]`, in English.
- Frontend: AAA structure (Arrange/Act/Assert), `renderWithProviders` helper for TanStack Query context, `data-testid` for E2E selection.
- Coverage targets: 80% overall, 90% critical functions, 85% UI components, 95% utilities.

---

## Deploy

Deploys run via GitHub Actions on push to `main`, scoped by path filters, each with `workflow_dispatch` as a manual fallback (Invariant 9):

- `.github/workflows/deploy-backend.yml` — triggers on `apps/backend/**`, `packages/shared/**`; builds shared, runs `wrangler deploy` in `apps/backend`.
- `.github/workflows/deploy-frontend.yml` — triggers on `apps/frontend/**`, `packages/shared/**`; builds shared + frontend, runs `wrangler pages deploy ../frontend/dist --project-name harfhane`.

Manual deploy (local, needs `CLOUDFLARE_API_TOKEN`): use `/deploy` (below) or run the `deploy`/`build` scripts from **Commands** directly in each app. Writing to a remote D1 database still needs explicit owner approval each time (Invariant 4); backups go to `~/Backups/harfhane/`, never into the repo.

---

## Slash Commands

Defined in `.claude/commands/`, invoked as `/command`.

| Command | Purpose |
|---------|---------|
| `/commit` | Conventional Commit from staged changes |
| `/review [file]` | Code review — staged or given file |
| `/pr` | Open a GitHub PR |
| `/test [pattern]` | Run and summarize backend tests |
| `/check` | Full quality gate: typecheck + test + clean-code |
| `/deploy [frontend\|backend\|both]` | Cloudflare deploy, asks for confirmation |
| `/plan <feature>` | RIPER-protocol feature plan |
| `/schema-audit` | Audit schema against `db/migrations/` |
| `/prime-context` | Reload project context |

---

## Multi-Agent Delegation

Append `xN` to a prompt to request N agents. Tier roles, model mapping and the `x3`/`x5`/`x7`/`x10` breakdown are
defined in `AGENTS.md` ("Agent Tiers & Models", "Delegation Parameter"); this project's tiers (Principal / Staff
Engineer / MidCoder / Lead Analyst / Analyst) are distinct from the global Multi-Agent Defaults table — when the
two disagree on a Harfhane task, `AGENTS.md`'s tier table wins.

Agent definitions: `.claude/agents/*.md` (auto-loaded). Skills: `.claude/skills/*/SKILL.md` (auto-triggered by
description). `.github/agents/` and `.github/skills/` are legacy and inactive.

---

## PR & Commit Conventions

- Size limits: ≤500 changed lines, ≤15 files, ≤10 commits per PR — split or squash if exceeded.
- Commit subject scope is the changed file path, e.g. `fix(repositories/admin-repository.ts): include length in daily word insert`.
- Full PR checklist and severity levels for review findings: `AGENTS.md` and `.claude/skills/pr-standards/SKILL.md`, `.claude/skills/code-review/SKILL.md`.

---

## Shared Package (`packages/shared`)

- All types shared between frontend and backend live here: `WordEntry`, `WordData`, `DailyWordResponse`, `ApiError`, `GameResult`.
- Both apps import as `@harfhane/shared`.

---

## Full History

The pre-slimming version of this file (772 lines, generic checklists included) is archived at
`docs/archive/claude-md-2026-10-04.md` — nothing below was deleted, only moved there or deduplicated against
`AGENTS.md` and the user's global config.

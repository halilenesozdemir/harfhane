# Project Rules — Nurdle

> Nurdle: Risale-i Nur külliyatındaki kelimelerle oynanan Türkçe Wordle oyunu.
> Bu dosya Claude Code ve tüm subagent'lar tarafından okunur.

---

## Project Overview

**Current Phase: Faz 1** — Backend & DB Foundation

| Faz   | Odak                               | Durum        |
| ----- | ---------------------------------- | ------------ |
| Faz 1 | Monorepo + Hono Backend + D1       | Geliştirme   |
| Faz 2 | Custom Word Lists + Admin Paneli   | Planlama     |
| Faz 3 | Kullanıcı Hesapları + Ticari Model | Roadmap      |

---

## Monorepo Structure

```
nurdle/
├── apps/
│   ├── frontend/     # React 19 + Vite + TypeScript
│   └── backend/      # Hono + Cloudflare Workers
├── packages/
│   └── shared/       # Ortak TypeScript types (WordEntry, etc.)
├── .github/
│   ├── agents/       # Agent system prompt dosyaları
│   ├── instructions/ # Agent instruction dosyaları
│   ├── memory/       # Session ve karar hafızası
│   ├── metrics/      # Token ve performans takibi
│   ├── skills/       # Skill dosyaları
│   └── todo/         # Aktif plan takibi
├── AGENTS.md
├── CLAUDE.md
└── package.json      # pnpm workspaces root
```

---

## Frontend Development

### Stack

- **React 19** + **Vite 7** + **TypeScript 5** (strict mode)
- **Tailwind CSS 3.x** — utility-first, no CSS-in-JS
- **TanStack Query v5** — server state management
- **Lucide React** — icons only, no emojis in UI

### Rules

- Never use emojis in frontend code, templates, or user-facing text. Use Lucide icons or plain text instead.
- All buttons and clickable elements (`<button>`, `<a>`, elements with `onClick`) must have `cursor-pointer` class. Tailwind v4 does not add it by default.
- All TypeScript must pass strict mode. No `any`. No `@ts-ignore`.
- Component props require explicit interface definitions (`ComponentNameProps`).
- All types live in `src/types/index.ts` (frontend) or `packages/shared/src/index.ts` (shared).
- Custom hooks live in `src/hooks/`, named `use*.ts`.

### i18n & Copywriting

- All user-facing text MUST use correct Turkish characters: ç, ş, ğ, ı, ö, ü, İ, Ş, Ç, Ğ, Ö, Ü.
  - Never write "Hakkimizda" instead of "Hakkımızda", "Giris" instead of "Giriş".
- Write UI copy like a UX writer: concise, clear, action-oriented.
- Turkish: informal but respectful tone. Prefer native Turkish words over anglicisms where natural.
- English (future): standard US English, natural — do not translate literally.

---

## Backend Development

### Stack

- **Hono** — TypeScript HTTP framework on Cloudflare Workers
- **Cloudflare D1** (SQLite) — word lists, game metadata, user data (Faz 3)
- **Cloudflare R2** — custom word list file storage (Faz 2)
- **Wrangler** — local dev and deployment
- **Vitest** + `@cloudflare/vitest-pool-workers` — testing

### Architecture (Layered)

```
Routes (HTTP layer)
  → Services (business logic)
    → Repositories (data access / D1 queries)
```

Routes never touch D1 directly. All DB access goes through repositories.

### Rules

- **SOLID Principles**: Each module/route/service does ONE thing.
- **Clean Code**: Descriptive naming, small functions, no side effects where avoidable. No dead code.
- **TDD Required**: Write tests FIRST, then implement. Every route, service, and repository MUST have tests.
- **Test Structure**: Tests live in `apps/backend/tests/` mirroring `src/` structure.
- **Validation**: All input validated with Zod schemas at the route level via `@hono/zod-validator`. Schemas live in `src/schemas/`.
- **Error Handling**: Use typed error classes. Never expose internal errors to clients. Always return structured `ApiError` responses.
- **Database**: All schema changes via numbered migration files in `apps/backend/migrations/`. Never modify DB schema outside migrations.
- **Secrets**: Never hardcode. Use Wrangler bindings and `.dev.vars` for local secrets.

### API Conventions

- Base path: `/api/`
- RESTful resource naming: `/api/words`, `/api/words/daily`, `/api/words/:id`
- All responses: `{ data: T }` on success, `{ error: { code, message } }` on failure
- HTTP status codes used correctly (200, 201, 400, 401, 404, 422, 500)

---

## Database (Cloudflare D1)

### Word Schema (Faz 1)

```sql
CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  meaning TEXT NOT NULL,
  context TEXT,
  category TEXT CHECK(category IN ('isim', 'sıfat', 'fiil')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE daily_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words(id),
  date TEXT NOT NULL UNIQUE
);
```

- Never delete words — use `is_active = 0` to deactivate.
- `daily_words` table drives the daily game. Date format: `YYYY-MM-DD`.

### Custom Word Lists Schema (Faz 2)

```sql
CREATE TABLE word_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  r2_key TEXT,
  is_public INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE word_list_words (
  list_id INTEGER NOT NULL REFERENCES word_lists(id),
  word_id INTEGER NOT NULL REFERENCES words(id),
  PRIMARY KEY (list_id, word_id)
);
```

---

## Shared Package (`packages/shared`)

- All types shared between frontend and backend live here.
- Key types: `WordEntry`, `WordData`, `DailyWordResponse`, `ApiError`, `GameResult`
- Frontend imports: `@nurdle/shared`
- Backend imports: `@nurdle/shared`

---

## Cloudflare Deployment

### Frontend → Cloudflare Pages

- Build: `pnpm --filter @nurdle/frontend run build`
- Output: `apps/frontend/dist`
- Deploy: Cloudflare Pages, connected to GitHub `main` branch

### Backend → Cloudflare Workers

- Deploy: `pnpm --filter @nurdle/backend run deploy`
- Entry: `apps/backend/src/index.ts`
- Config: `apps/backend/wrangler.toml`
- Worker name: `nurdle-api`
- Custom domain: `api.nurdle.app` (future)

### CI/CD (GitHub Actions)

- Push to `main` triggers deploy
- Frontend changes → Pages deploy
- Backend changes → Workers deploy
- Shared changes → both deploys

---

## Phase-Specific Rules

### Faz 1 — Active

- Frontend: Migrate existing `src/` into `apps/frontend/src/`
- Backend: Hono + D1 setup, word CRUD API, migrate `words.json` → D1
- Shared: Extract `WordEntry` type into `packages/shared`
- No auth, no user accounts, no R2 in this phase

### Faz 2 — Planned

- R2 integration for custom word list file uploads
- Custom game slug system (`/play/:slug`)
- Admin panel (word management UI)
- No user accounts still — slug-based sharing only

### Faz 3 — Roadmap

- User accounts (Cloudflare D1 + JWT)
- Global stats & leaderboard
- Premium features (custom domain Nurdle creation)
- Analytics (Cloudflare Analytics Engine)

---

## Package Manager

- **pnpm workspaces** — always use `pnpm`, never `npm` or `yarn`
- Root workspace scripts: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test`
- Filter: `pnpm --filter @nurdle/frontend run dev`

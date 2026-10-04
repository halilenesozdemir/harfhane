# Backend — Harfhane API

Backend-specific context. Extends root CLAUDE.md.

---

## Quick Reference

```bash
pnpm --filter @harfhane/backend run dev        # start local worker (port 8787)
pnpm --filter @harfhane/backend run deploy     # deploy to Cloudflare Workers
pnpm --filter @harfhane/backend run test       # run Vitest
pnpm --filter @harfhane/backend run typecheck  # TypeScript check
wrangler d1 execute harfhane-db --local --file=scripts/seed.sql  # seed local DB
```

---

## Stack

- **Hono** — TypeScript HTTP framework on Cloudflare Workers
- **Cloudflare D1** (SQLite) — primary database
- **Wrangler** — local dev and deployment
- **Vitest** + `@cloudflare/vitest-pool-workers` — test runner with Workers environment

---

## Architecture

```
Routes (src/routes/)       — HTTP layer only, no business logic
  → Services (src/services/)   — business logic, orchestration
    → Repositories (src/repositories/)  — D1 queries, no business logic
```

Supporting layers:
- `src/schemas/` — Zod validation schemas, used at route boundary
- `src/errors/` — typed error classes (`ApiError`)
- `src/utils/` — pure utilities (normalize, etc.)
- `src/middleware/` — Hono middleware
- `src/types/` — backend-specific types

---

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Hono app entry, route mounting |
| `src/routes/words.ts` | Word API routes |
| `src/routes/lists.ts` | Word list routes |
| `src/routes/admin.ts` | Admin panel routes |
| `src/routes/auth.ts` | Auth routes |
| `src/routes/results.ts` | Game result routes |
| `src/services/word-service.ts` | Word business logic |
| `src/services/list-service.ts` | List business logic |
| `src/services/admin-service.ts` | Admin business logic |
| `src/services/social-service.ts` | Likes/comments logic |
| `src/repositories/word-repository.ts` | D1 word queries |
| `src/repositories/list-repository.ts` | D1 list queries |
| `src/repositories/admin-repository.ts` | D1 admin queries |
| `src/schemas/word-schemas.ts` | Zod schemas for word routes |
| `src/utils/normalize.ts` | Turkish uppercase normalization |
| `src/errors/api-error.ts` | Typed error classes |
| `migrations/0001_initial_schema.sql` | Base DB schema |
| `tests/helpers/db.ts` | Shared test schema + seed |

---

## Critical Rules

- NEVER call `.toUpperCase()` on Turkish text — use `normalizeWord()` from `src/utils/normalize.ts`. `"i".toUpperCase()` returns `"I"` (wrong), not `"İ"`.
- NEVER access D1 directly in routes — always go through a repository.
- D1 `exec()` does NOT support multi-statement SQL — use `db.prepare().run()` per statement.
- All schema changes require a numbered migration file in `migrations/` (e.g., `0010_description.sql`).
- Words are never deleted — set `is_active = 0`.
- TDD mandatory: write the test first, then implement.
- Test structure mirrors `src/`: `tests/repositories/`, `tests/services/`, `tests/routes/`.
- `noImplicitReturns` is on — all code paths must have explicit `return`.

---

## API Response Format

```typescript
// Success
{ data: T }

// Error
{ error: { code: string; message: string } }
```

HTTP status codes: 200, 201, 400, 401, 404, 409, 422, 500

---

## D1 Database

- **Name:** `harfhane-db`
- **ID:** `1fad4aa7-baa4-41ce-a0f4-976904b8d29b`
- **Local state:** `.wrangler/state/v3/d1/`
- `daily_words` has `UNIQUE(date, length)` — scheduling uses UPSERT: `ON CONFLICT(date, length) DO UPDATE SET word_id = excluded.word_id`

---

## Environment

- Secrets in `.dev.vars` (gitignored) — use `CLOUDFLARE_API_TOKEN` for deploys
- `wrangler.toml` — D1 binding config and Worker settings

---

## Common Gotchas

- Wrangler OAuth token expires in ~1h — always use `CLOUDFLARE_API_TOKEN` env var for deploys, not interactive login.
- Turkcell Güvenli İnternet can block Cloudflare endpoints with ECONNRESET — disable "Aile Profili" or use a hotspot.

# Backend — apps/backend

Hono on Cloudflare Workers with D1. Tests run in the Workers runtime via `@cloudflare/vitest-pool-workers`. Local worker: `pnpm --filter @harfhane/backend run dev` (port 8787).

## Rules

- Layering: `src/routes/` → `src/services/` → `src/repositories/`. Routes never touch D1. Input is validated at the route with Zod (`@hono/zod-validator`, schemas in `src/schemas/`). Tests mirror `src/` under `tests/`.
- Responses: success `{ data: T }`, error `{ error: { code, message } }` through the `ApiError` classes in `src/errors/`; internal detail never reaches the client. Status codes: 200, 201, 400, 401, 404, 409, 422, 500.
- Turkish casing: `normalizeWord()` from `src/utils/normalize.ts`.
- D1 `exec()` does not run multi-statement SQL; use one `db.prepare(...).bind(...).run()` per statement.
- Words are never deleted; set `is_active = 0`.
- `daily_words` is `UNIQUE(date, length)`; schedule with `ON CONFLICT(date, length) DO UPDATE SET word_id = excluded.word_id`.

## Schema and databases

- Schema changes go in a new numbered file in `db/migrations/` (`0002_<topic>.sql`, …). `0001_baseline.sql` is applied to `harfhane`; never edit an applied migration. Tests load the folder through `vitest.config.ts` and `tests/helpers/db.ts`.
- The legacy `migrations/` folder belongs to the old `harfhane-db` and is history only; do not add to it or delete it (cutover in `docs/plans/2026-10-04-001-infra-clean-database-plan.md`).
- Bindings in `wrangler.toml`: `DB` = `harfhane-db` (legacy, still serves production until cutover); `DB_NEXT` = `harfhane` (target schema, `migrations_dir = db/migrations`).

## Gotchas

- Secrets live in `.dev.vars` (gitignored). Deploy with the `CLOUDFLARE_API_TOKEN` env var; the interactive Wrangler OAuth token expires in about an hour.
- Turkcell Güvenli İnternet can block Cloudflare endpoints with ECONNRESET; disable "Aile Profili" or use a hotspot.

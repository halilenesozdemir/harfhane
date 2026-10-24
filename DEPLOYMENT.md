# Deployment

Current deploy setup for Harfhane. Superseded `docs/archive/deployment-2026-10-24.md`, which
described a pre-MVP-scope-cut stack (accounts, push, a differently-named database) that no longer
exists — see `docs/decisions/2026-10-05-mvp-scope-cut.md`.

## Services

| Service  | Platform           | URL                 |
| -------- | ------------------ | ------------------- |
| Frontend | Cloudflare Pages (`harfhane` project) | `harfhane.app` |
| Backend  | Cloudflare Workers (`harfhane-api`)   | `api.harfhane.app` |
| Database | Cloudflare D1 (`harfhane`)            | —                   |

## Deploy workflows

A push to `main` runs CI first; the deploy workflows below only run after CI succeeds on that
commit (`.github/workflows/deploy-*.yml`'s "Wait for CI to pass" step). Each workflow also has
`workflow_dispatch` for a manual run (`gh workflow run <file>`), restricted to `main` (Invariant 9:
every deploy workflow lists its own file in `paths` and keeps `workflow_dispatch`).

- **`.github/workflows/deploy-backend.yml`** — triggers on push to `main` touching
  `apps/backend/**`, `packages/shared/**`, `pnpm-lock.yaml` or its own file. Deploys with
  `wrangler deploy --var GIT_SHA:"$GITHUB_SHA"`, then smoke-tests production: polls
  `GET /api/health` until `data.version` matches `$GITHUB_SHA`, then checks `GET
  /api/words/daily` returns `200` or `404` (a `404` just means no word is scheduled today —
  Invariant 10's schedule-health alert covers that case, and it must not roll back a hotfix). A
  failed deploy or smoke test auto-rolls back with `wrangler rollback` to the version that was
  live before this run (captured in a "Capture current deployed version" step).
- **`.github/workflows/deploy-frontend.yml`** — triggers on push to `main` touching
  `apps/frontend/**`, `packages/shared/**`, `packages/ui-tokens/**`, `pnpm-lock.yaml` or its own
  file. Builds the frontend (`VITE_API_URL` from the repository Actions variable `vars.VITE_API_URL`, `VITE_BUILD_SHA` set to
  `$GITHUB_SHA`) and deploys with `wrangler pages deploy ../frontend/dist --project-name harfhane`.
  Smoke test: polls `https://harfhane.app/` until the page's `<meta name="build" content="...">`
  marker matches `$GITHUB_SHA` and the response contains `id="root"`. No automatic rollback —
  Cloudflare Pages keeps prior deployments, so roll back manually from the Pages dashboard or by
  redeploying a prior commit.

Both workflows serialize on their own `concurrency` group (one deploy at a time per service) and
need `CLOUDFLARE_API_TOKEN` (account id `fd32026d220617d20fb552d13fb82abd` is inlined in both
files).

## Database

D1 database `harfhane` (binding `DB`, `apps/backend/wrangler.toml`). Schema lives only in
`apps/backend/db/migrations/` (Invariant 2) — never hand-apply schema changes outside those files.

**Invariant 4: production needs the owner.** No agent ever runs `wrangler d1 migrations apply
--remote`, `d1 execute --remote` (beyond read-only queries) or `d1 time-travel restore` without
explicit owner approval in the current session. Neither deploy workflow applies migrations
remotely — `deploy-backend.yml` only runs `wrangler deploy` / `deployments status` / `rollback`.

- **Runbooks:** `docs/runbooks/` holds owner-run migration runbooks, e.g.
  `docs/runbooks/apply-0003-drop-removed-features.md` — back up, bookmark, read-only pre-checks,
  rehearse locally against the backup, apply remotely, smoke-test, and the rollback path.
- **Backups:** `wrangler d1 export harfhane --remote --output ~/Backups/harfhane/<name>.sql`.
  Backups and any local rehearsal persist directory (`--persist-to`) never go into the repo or
  anywhere under the checkout (Invariant 4) — they can contain personal data from legacy tables
  still in the schema.
- **Rollback:** `wrangler d1 time-travel restore harfhane --remote --bookmark <id>` is the
  verified working rollback for a bad migration. A plain SQL export is **not** a tested restore
  path — `docs/backlog.md`'s "D1 export backups do not restore as-is" note found that a post-0003
  export fails to reimport into a fresh local D1 because statement order no longer matches table
  dependencies; always take a Time Travel bookmark before a remote write, in addition to the SQL
  backup.

## Secrets and environment variables

Backend (`apps/backend/src/types/env.ts`'s `Env` interface — the actual list; do not add to this
doc without updating that file too):

| Name | Required | Set via | Used for |
| --- | --- | --- | --- |
| `ADMIN_SECRET` | yes | `wrangler secret put ADMIN_SECRET` | Compared (constant-time) against the `X-Admin-Secret` header to gate `/api/admin/*` (`apps/backend/src/middleware/admin-auth.ts`). |
| `RESEND_API_KEY` | yes | `wrangler secret put RESEND_API_KEY` | Sends the schedule-health alert and feedback-notification emails via Resend. |
| `ADMIN_ALERT_EMAIL` | optional | `wrangler secret put ADMIN_ALERT_EMAIL` | Recipient for the daily schedule-health alert (Invariant 10); also the feedback-email fallback if `FEEDBACK_EMAIL` is unset. |
| `FEEDBACK_EMAIL` | optional | `wrangler secret put FEEDBACK_EMAIL` | Recipient for in-app feedback notifications; falls back to `ADMIN_ALERT_EMAIL` when unset. |
| `GIT_SHA` | set by CI | `--var GIT_SHA:"$GITHUB_SHA"` on `wrangler deploy` | Exposed at `/api/health` so the deploy smoke test can confirm the live version. |
| `PLAYABLE_WORD_LENGTHS` | no (optional in `env.ts`; set to `"5"` today) | `[vars]` in `apps/backend/wrangler.toml` (currently `"5"`) | Comma-separated word lengths actually playable; a non-empty subset of the always-scheduled 4/5/6 (`apps/backend/src/constants/schedule.ts`). Not a secret — plain `[vars]`, not `wrangler secret put`. |

Frontend: `VITE_API_URL` (production only, injected by `deploy-frontend.yml` from the repository
Actions variable `vars.VITE_API_URL`) and `VITE_BUILD_SHA` (`$GITHUB_SHA`, read by the smoke test's `<meta
name="build">` tag). Local dev needs neither — the Vite proxy sends `/api` to
`localhost:8787` (`apps/frontend/vite.config.ts`).

GitHub Actions secret: `CLOUDFLARE_API_TOKEN` (Workers edit + Pages edit scope), used by both
deploy workflows.

## Mobile release

Not part of this deploy pipeline — Android ships through EAS/Google Play. See
`docs/guides/mobile-release.md`.

## Manual deploy

Only needed if `workflow_dispatch` isn't available:

```bash
# Backend
cd apps/backend && CLOUDFLARE_API_TOKEN=... pnpm exec wrangler deploy

# Frontend (wrangler is a dependency of apps/backend, not apps/frontend — same as CI)
pnpm --filter @harfhane/shared run build
VITE_API_URL=https://api.harfhane.app/api pnpm --filter @harfhane/frontend run build
cd apps/backend && CLOUDFLARE_API_TOKEN=... pnpm exec wrangler pages deploy ../frontend/dist --project-name harfhane --branch main
```
Without `--branch main`, running this from any other local branch creates a preview deploy, not production.

## Post-deploy checks

- Backend: `curl https://api.harfhane.app/api/health` — `data.version` equals the `main` commit
  SHA that was just deployed.
- Backend: `curl -o /dev/null -w '%{http_code}' https://api.harfhane.app/api/words/daily` —
  `200` (today's word exists) or `404` (none scheduled; check the schedule, see Invariant 10).
- Frontend: `https://harfhane.app` loads and its `<meta name="build">` tag matches the same SHA.

Both deploy workflows already run these checks automatically; this section is for verifying a
manual deploy.

## Troubleshooting

### Wrangler auth

OAuth tokens expire in about an hour; always pass `CLOUDFLARE_API_TOKEN` explicitly rather than
relying on an interactive login.

### Port conflicts (local dev)

```bash
lsof -ti:8787 | xargs kill -9   # backend (wrangler dev)
lsof -ti:5173 | xargs kill -9   # frontend (vite dev)
```

### Build issues

```bash
pnpm store prune
pnpm install
pnpm build
```

# Frontend — apps/frontend

React 19, Vite 7, Tailwind 3, TanStack Query v5, Lucide React, React Router (routes in `src/App.tsx`), `vite-plugin-pwa`.

## Rules

- Components are declared with `function`; props interface is `ComponentNameProps`. Types live in `src/types/index.ts`, which re-exports `@harfhane/shared`; import from there, not from the package.
- Custom hooks go in `src/hooks/` as `use*.ts`. Server state goes through TanStack Query, not copied into local or Context state; transforms belong in `select`.
- Every `<button>`, `<a>` and `onClick` element has `cursor-pointer`.
- No inline `style` or `!important` without a documented reason.
- The API base URL comes from `VITE_API_URL` (production only); in dev the Vite proxy sends `/api` to `localhost:8787`. Never hardcode it.
- `pnpm build` runs `scripts/generate-sitemap.mjs`, which rewrites `public/sitemap.xml`.

## E2E Smoke Tests (Playwright)

`e2e/*.spec.ts` is a deterministic browser smoke suite: it runs against the built app (`vite preview`)
with the API fully stubbed via route interception and the clock frozen to a fixed Turkey-time instant —
no backend, no network, no real day boundary. Run it with `pnpm test:e2e` (root) or
`pnpm --filter @harfhane/frontend run test:e2e`; browsers need `playwright install chromium` once locally.

Run it before shipping any change that touches routing, the game loop (`useGameState`, `GameGrid`,
`Keyboard`), daily/unlimited mode, or localStorage persistence — unit tests don't exercise the real
browser flow end to end. It is intentionally excluded from the commit-gate pre-commit hook (too slow);
CI runs it as its own `e2e` job on every PR.

## E2E against the real backend (`real-backend` project)

`e2e/real-backend/*.spec.ts` (Plan 009 U3, R4/AE3) exercises the daily journey against a real
`wrangler dev --local` backend and a local-only D1 built from `apps/backend/db/migrations` plus
`apps/backend/tests/fixtures/e2e-seed.sql` — no stubbing, no `--remote`, ever. Run the whole thing
end to end from a clean checkout with:

```
pnpm run test:e2e:real
```

This builds the local D1 (migrate + seed into a gitignored `.wrangler/` persist directory under
`apps/backend`), builds the frontend against that backend (a separate `dist-e2e-real-backend`
output, `VITE_API_URL` pointing at `wrangler dev`'s port), and runs Playwright's `real-backend`
project, which starts and tears down both servers itself. `pnpm test:e2e` (the stubbed suite above)
never runs this project.

Owner decision 2026-10-10 (GitHub Actions minutes are a monthly budget): this gate runs locally
before a PR is marked ready, with its output pasted into the PR body — CI only has a
`workflow_dispatch`-only job for it (`.github/workflows/e2e-real-backend.yml`), never on every PR.

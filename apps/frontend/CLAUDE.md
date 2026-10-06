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

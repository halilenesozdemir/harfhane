<h1 align="center">Harfhane</h1>

<p align="center">
  A Turkish word-guessing game for web and Android.<br>
  One shared daily word and unlimited practice. No accounts, no ads at launch.
</p>

<p align="center"><i>In development — not launched yet.</i></p>

---

## The game

- **Daily** — everyone gets the same word each Turkey day (midnight in Turkey time, UTC+3)
- **Unlimited** — play random words from a separate pool as long as you like
- **Word lengths** — 5 letters at launch; 4 and 6 open once each has 90 days of reviewed daily words
- **Letter hint**, shareable results, statistics, haptics on Android
- **No accounts** — progress stays on the device

Turkish is handled correctly end to end: `i` becomes `İ` and `ı` becomes `I`, never the other way
around. All casing goes through `normalizeChar` / `normalizeWord` in `@harfhane/shared`.

## Architecture

```
apps/
├── backend/    Hono on Cloudflare Workers, D1 (SQLite) — routes → services → repositories
├── frontend/   React 19 + Vite PWA, Tailwind, TanStack Query — Cloudflare Pages
└── mobile/     Expo (React Native) Android app
packages/
├── shared/     Types and game logic shared by all three apps
└── ui-tokens/  Design tokens generated for web and mobile
```

The word lists come from an open-license source (MPL-2.0); see [`data/words/README.md`](data/words/README.md).

## Engineering practices

- **Tests first.** Vitest and Jest unit tests, Playwright for web end-to-end, Maestro flows on Android.
- **Mutation testing.** Stryker runs on changed code in CI and fails the build when tests miss mutants.
- **Acceptance examples.** Every plan's acceptance examples must have a test tagged with their id;
  `pnpm check:ac` enforces it.
- **Architecture checks.** `dependency-cruiser` enforces the backend layering and keeps
  `packages/*` from importing `apps/*`; `knip` catches unused files, exports and dependencies.
- **Strict TypeScript.** `exactOptionalPropertyTypes`, ts-reset and branded types.
- **Written decisions.** Plans in [`docs/plans`](docs/plans), ADRs in [`docs/decisions`](docs/decisions),
  domain terms in [`GLOSSARY.md`](GLOSSARY.md).
- **AI-assisted, human-owned.** Coding agents work under the rules in [`AGENTS.md`](AGENTS.md) and
  [`CLAUDE.md`](CLAUDE.md): isolated worktrees, a pre-commit gate, and a fresh-context review per PR.

## Getting started

Requires Node.js 22 (see `.nvmrc`) and pnpm 9.

```bash
pnpm install          # also enables the pre-commit gate
pnpm --filter @harfhane/backend run db:migrate:local
pnpm dev              # frontend on :5173, backend on :8787
```

The frontend proxies `/api/` to the backend.

Android:

```bash
pnpm --filter @harfhane/mobile run start
```

## Checks

```bash
pnpm check            # build shared, typecheck, lint, tests, acceptance-example coverage
pnpm test:e2e         # Playwright (web)
pnpm test:mutation    # Stryker on changed files
pnpm test:maestro     # Maestro flows (Android emulator)
pnpm knip
pnpm depcruise
```

## Deployment

Merging to `main` deploys through GitHub Actions: the backend to Cloudflare Workers
(`apps/backend/**`, `packages/shared/**`) and the frontend to Cloudflare Pages
(`apps/frontend/**`, `packages/shared/**`). Both need the `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` repository secrets.

## License

All rights reserved. The source is public for reading; no license is granted to reuse it.
The word lists keep their own MPL-2.0 license.

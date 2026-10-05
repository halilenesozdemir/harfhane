---
title: Lint TypeScript in every workspace
type: infra
date: 2026-10-05
status: approved
---

# Lint TypeScript in every workspace

## Goal
`pnpm lint` passes today while checking almost nothing: only `apps/frontend` has ESLint, and it lints `*.js/jsx` only. Rules such as no `console.*` and no unused code are enforced by review alone. Lint all TypeScript so the commit gate and CI enforce them.

## Requirements
- R1. `pnpm lint` lints every `*.ts`/`*.tsx` file in `apps/` and `packages/` (generated and build output excluded).
- R2. `typescript-eslint` recommended rules, `no-console`, and React hooks rules for the frontend.
- R3. The commit gate and CI fail on a lint error, as they do today.
- R4. No player-visible behavior change.

## Acceptance examples
- AE1 (R1, R3). Given `console.log('x')` staged in `apps/backend/src`, when committing, then the gate fails on `no-console`.
- AE2 (R1). Given the current code, `pnpm lint` exits 0 after U1.

## Key technical decisions
- KTD1. **One root `eslint.config.js`** replaces `apps/frontend/eslint.config.js`; root `lint` runs ESLint once over the repo. Per-workspace lint scripts go away.
- KTD2. Baseline measured on 2026-10-05: 17 findings — frontend 16 (11 `react-hooks/set-state-in-effect`, 2 `exhaustive-deps`, 2 unused vars, 1 `preserve-manual-memoization`), ui-tokens 1, backend and shared 0.
- KTD3. `set-state-in-effect`, `exhaustive-deps` and `preserve-manual-memoization` start as warnings: fixing them changes component behavior and needs tests per component (U2). Everything else is an error from day one.

## Scope boundaries
- Out of scope: type-aware rules (`recommendedTypeChecked`), Prettier, formatting rules.

## Units
- U1. Root config, dependencies, scripts; fix the unused-variable findings. React hook findings stay warnings. (R1, R2, R3)
- U2. Fix each hook warning with a test that pins current behavior, then make those rules errors. (R2, R4)

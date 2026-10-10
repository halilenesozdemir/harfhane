---
title: End-to-end tests and quality gates
type: test
date: 2026-10-06
status: approved
---

# End-to-end tests and quality gates

## Goal
The exit gate of Phase 1 (`docs/roadmap.md`): before the clean-database cutover and the owner's
emulator session, every user journey is proven by automated tests on web and Android, and the
factory gets deterministic checks that make LLM-written code harder to get wrong silently.

Research: `docs/research/2026-10-06-engineering-standards.md`. Owner approval 2026-10-06: Maestro
and the test tooling below may be added as dev dependencies.

Owner decision 2026-10-10: GitHub Actions minutes are a monthly budget (October's ran out in ten
days), so the two slow gates — real-backend Playwright (R4) and mutation testing (R7) — run
locally through a `pnpm` script before a PR is marked ready, with the result in the PR body. CI
gets them only as a manually triggered (`workflow_dispatch`) job, never on every PR.

## Requirements
- R1. Every acceptance example in an approved plan (`AE<n>` in Plans 004 and 008, and this plan)
  is referenced by at least one test name, and CI fails when an approved plan's AE has none.
- R2. Web journeys run in Playwright against the built app with the API stubbed: home, daily win
  and loss, unlimited, letter hint, length picker and redirects, Turkish keyboard (İ/ı, physical
  and on-screen), restore after reload, Turkey-day rollover, phone viewport, share text.
- R3. Every Playwright journey also runs an axe accessibility scan; serious and critical
  violations fail the test.
- R4. A second Playwright project runs a few journeys against the real backend (`wrangler dev`,
  local D1 built from `db/migrations` plus a test seed). It never touches a remote database.
- R5. Android journeys run with Maestro on an emulator: home, daily, unlimited, hint, back button,
  restore after app restart, dark mode. They run locally and in EAS when that exists; not in CI.
- R6. Core game logic in `packages/shared` (`normalizeWord`, `normalizeChar`, guess evaluation,
  share text, Turkey-day helpers) has property tests.
- R7. Mutation testing gates `packages/shared` and the backend `services/` and `repositories/`
  layers from the start: for every PR that changes files in those paths, Stryker mutates only
  those files and the script exits non-zero when their score is below the threshold (owner
  decision 2026-10-06: constraints first, scoped so old code is not retrofitted). It runs locally
  before the PR is marked ready, not in per-PR CI (owner decision 2026-10-10).
- R8. Dead code and layer violations are caught in CI: unused files/exports/dependencies, and
  backend imports that skip `routes → services → repositories` or apps imported from `packages/*`.
- R9. A flaky-test policy exists: a test that fails intermittently is quarantined with a backlog
  entry and fixed or deleted within a week; tests are never silently retried to green.
- R10. A short test report per gate run (journeys passed, AE coverage, axe, mutation score) is kept
  as a CI artifact for CI gates and in the PR body for the local ones (real-backend, mutation), and
  the Phase 1 exit result is written to `docs/research/`.

## Acceptance examples
- AE1 (R1). Given Plan 008 lists AE1–AE7 and no test name contains "AE7", the traceability check
  fails and names Plan 008 AE7.
- AE2 (R2, R3). Given the daily journey, a player wins in three guesses, sees the result and share
  text, and the axe scan reports no serious or critical violation.
- AE3 (R4). Given a local D1 seeded with one scheduled 5-letter word, the real-backend journey
  loads the daily game and validates a guess through the real `/api/words/validate`.
- AE4 (R5). Given the emulator, the Maestro daily flow plays a game to the end and the Android back
  button returns to the home screen.
- AE5 (R6). For any string, `normalizeWord(normalizeWord(s)) === normalizeWord(s)`, and every
  dotted/dotless i maps per Turkish rules.
- AE6 (R7). Given a PR that changes `packages/shared/src/game/evaluate.ts` and a test suite that
  lets a duplicate-letter mutant survive, the changed-files mutation script prints the mutation
  score of the changed file and exits non-zero because it is below the threshold.

## Key technical decisions
- KTD1. Traceability check is a small Node script (`scripts/check-ac-coverage.mjs`) that reads
  `status: approved` plans, collects `AE<n>` ids per plan, and greps test files for
  `<plan number>-AE<n>` in test names (e.g. `should … (008-AE4)`). Plans with no AEs are skipped.
- KTD2. Playwright projects: `stubbed` (default, CI) and `real-backend` (local script and a
  `workflow_dispatch`-only CI job, with `wrangler dev --local`, seed in
  `apps/backend/tests/fixtures/e2e-seed.sql`).
- KTD3. Tools: `@axe-core/playwright`, `fast-check`, Stryker (`@stryker-mutator/core` with the
  Vitest runner) scoped to the paths in KTD4, `knip`, `dependency-cruiser`, Maestro CLI (not an npm
  dependency; documented in `docs/guides/mobile-run.md`). Check each package's current version and
  Vitest compatibility before adding.
- KTD4. Mutation testing runs only on changed files under `packages/shared/src` and
  `apps/backend/src/{services,repositories}` (Stryker `--mutate` from `git diff origin/main...HEAD`,
  incremental cache), with a `break` threshold `MUTATION_BREAK_THRESHOLD = 70` raised as scores settle. Backend
  mutants run in the Workers Vitest pool; check Stryker's runner support for it and fall back to a
  plain Vitest config for repositories if needed.

  2026-10-10 (U6 implementation): backend is deferred, not implemented. Stryker's vitest-runner
  runs vitest through its own Node-API call, bypassing `@cloudflare/vitest-pool-workers`'s custom
  pool entirely, so a plain-config fallback can't close the gap without also rewriting
  `services`/`repositories` tests with binding-free doubles — out of scope for this unit. Only
  `packages/shared/src` is wired (`scripts/mutation-changed.mjs`'s `PROJECTS`). See
  `docs/backlog.md` ("Plan 009 U6: backend Stryker mutation testing not wired") for the
  reproduction and what a real fix needs.
- KTD5. Mobile `testID`s are added where Maestro needs stable selectors; no visible UI change.

## Units
File ownership: A owns `scripts/check-ac-coverage.mjs`, `.github/workflows/ci.yml` and
`AGENTS.md`/`CLAUDE.md` edits; B owns `apps/frontend/e2e/**` and `apps/frontend/playwright.config.ts`;
C owns `apps/mobile/.maestro/**` and mobile `testID`s; D owns `packages/shared/**`. U6 also edits
`.claude/commands/unit.md` and `docs/guides/review-checklist.md`, and adds its own
`workflow_dispatch` workflow file instead of editing `ci.yml`; it starts after other edits to
those files have merged.

- U1 (A). Traceability script, tests for it, CI step; flaky-test policy line in `AGENTS.md`; test
  naming rule `(<plan>-AE<n>)` in `CLAUDE.md` and `.claude/commands/unit.md`. Existing tests that
  prove an AE get the id added. (R1, R9, AE1)
- U2 (B). Playwright journeys for R2 with axe scans; split specs per journey. (R2, R3, AE2)
- U3 (B, after U2). `real-backend` Playwright project with a local seed, a `pnpm` script, and a
  `workflow_dispatch`-only CI job. (R4, AE3)
- U4 (C). Maestro flows for R5, `testID`s, run guide. (R5, AE4)
- U5 (D). fast-check property tests for shared logic. (R6, AE5)
- U6 (D, after U5). Stryker for shared and backend services/repositories, a changed-files local
  gate (`pnpm` script, `/unit` step) plus a `workflow_dispatch`-only CI job, a
  `docs/guides/review-checklist.md` item that a PR changing the KTD4 paths without a mutation
  score in its body is a finding, first full-run report in the PR body. (R7, R10, AE6)
- U7 (A, after U1). knip and dependency-cruiser in CI, fix or record what they find. (R8)
- U8 (A, last). Phase 1 exit run: all gates, report in `docs/research/`, failures fixed or put in
  `docs/backlog.md`. (R10)

## Not in this plan
Visual regression screenshots, load testing, and running Maestro in CI (Android emulators in CI
are slow; revisit with EAS Workflows in Phase 4).

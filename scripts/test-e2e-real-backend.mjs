#!/usr/bin/env node
// Runs the `real-backend` Playwright project (Plan 009 U3, R4/AE3) end to end
// from a clean checkout: builds a local-only D1 from apps/backend/db/migrations,
// seeds it with apps/backend/tests/fixtures/e2e-seed.sql, builds the frontend
// against that backend, then runs the real-backend Playwright project (which
// itself starts `wrangler dev --local` and `vite preview` as its webServer
// entries — see apps/frontend/playwright.config.ts).
//
// Local only: every wrangler invocation here passes --local and --persist-to
// a gitignored directory. Nothing here ever touches a remote database.
//
// Owner decision 2026-10-10 (docs/plans/2026-10-06-009-test-e2e-quality-gates-plan.md):
// GitHub Actions minutes are a monthly budget, so this gate runs locally
// before a PR is marked ready; CI only gets a workflow_dispatch-only job for
// it (.github/workflows/e2e-real-backend.yml), never on every PR.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { rmSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKEND_DIR = path.join(ROOT, 'apps/backend');
const FRONTEND_DIR = path.join(ROOT, 'apps/frontend');

// Keep these in sync with apps/frontend/playwright.config.ts.
const REAL_BACKEND_API_PORT = 8788;
const REAL_BACKEND_DIST_DIR = 'dist-e2e-real-backend';
const REAL_BACKEND_PERSIST_DIR = '.wrangler/state-e2e-real-backend';

function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

function main() {
  const persistDirAbs = path.join(BACKEND_DIR, REAL_BACKEND_PERSIST_DIR);
  rmSync(persistDirAbs, { recursive: true, force: true });

  run(
    'pnpm',
    ['exec', 'wrangler', 'd1', 'migrations', 'apply', 'harfhane', '--local', '--persist-to', REAL_BACKEND_PERSIST_DIR],
    { cwd: BACKEND_DIR }
  );
  run(
    'pnpm',
    [
      'exec',
      'wrangler',
      'd1',
      'execute',
      'harfhane',
      '--local',
      '--persist-to',
      REAL_BACKEND_PERSIST_DIR,
      '--file',
      'tests/fixtures/e2e-seed.sql',
      '-y',
    ],
    { cwd: BACKEND_DIR }
  );

  run('pnpm', ['exec', 'vite', 'build', '--outDir', REAL_BACKEND_DIST_DIR], {
    cwd: FRONTEND_DIR,
    env: { ...process.env, VITE_API_URL: `http://localhost:${REAL_BACKEND_API_PORT}/api` },
  });

  run('pnpm', ['exec', 'playwright', 'test', '--project=real-backend'], {
    cwd: FRONTEND_DIR,
    env: { ...process.env, E2E_REAL_BACKEND: '1' },
  });
}

main();

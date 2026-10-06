import path from 'node:path';
import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';

const TEST_SECRETS = {
  JWT_SECRET: 'local-test-secret-not-real-0123456789abcdef',
  ADMIN_SECRET: 'local-test-admin-secret',
  GIT_SHA: 'test-git-sha-0123456789abcdef',
  PLAYABLE_WORD_LENGTHS: '6,5',
};

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(path.join(__dirname, 'db/migrations'));

  return {
    test: {
      poolOptions: {
        workers: {
          wrangler: { configPath: './wrangler.toml' },
          miniflare: { bindings: { ...TEST_SECRETS, TEST_MIGRATIONS: migrations } },
        },
      },
    },
    resolve: {
      conditions: ['workerd', 'worker', 'browser'],
    },
  };
});

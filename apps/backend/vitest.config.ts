import path from 'node:path';
import { defineWorkersConfig, readD1Migrations } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(path.join(__dirname, 'db/migrations'));

  return {
    test: {
      poolOptions: {
        workers: {
          wrangler: { configPath: './wrangler.toml' },
          miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
        },
      },
    },
    resolve: {
      conditions: ['workerd', 'worker', 'browser'],
    },
  };
});

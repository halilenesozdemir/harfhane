import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// App.tsx has no Route for these removed-feature paths; Cloudflare Pages
// applies public/_redirects at the edge instead (301s, matched top to bottom,
// above the SPA catch-all). This is the only place that proves the file still
// lists each removed path — the stubbed Playwright suite runs against
// `vite preview`, which never applies `_redirects`.
const REDIRECTS_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  '_redirects'
);

const REMOVED_PATHS = ['/tournament', '/discuss', '/lists', '/play/*', '/c/*', '/sifre-sifirla'];

describe('public/_redirects', () => {
  const contents = readFileSync(REDIRECTS_PATH, 'utf-8');
  const rules = contents
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  it.each(REMOVED_PATHS)('should 301 %s to the home page', (removedPath) => {
    expect(rules).toContain(`${removedPath} / 301`);
  });

  it('should keep the SPA catch-all below the removed-feature rules', () => {
    const catchAllIndex = rules.indexOf('/* /index.html 200');
    expect(catchAllIndex).toBeGreaterThan(-1);
    for (const removedPath of REMOVED_PATHS) {
      expect(rules.indexOf(`${removedPath} / 301`)).toBeLessThan(catchAllIndex);
    }
  });
});

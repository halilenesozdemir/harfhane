import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

describe('GET /api/health', () => {
  it('returns 200 with the configured version when GIT_SHA is set', async () => {
    const res = await SELF.fetch('http://example.com/api/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { version: string } };
    expect(typeof body.data.version).toBe('string');
    expect(body.data.version.length).toBeGreaterThan(0);
  });
});

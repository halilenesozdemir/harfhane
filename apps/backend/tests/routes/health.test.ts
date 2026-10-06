import { describe, it, expect } from 'vitest';
import { SELF, env } from 'cloudflare:test';

describe('GET /api/health', () => {
  it('should return the configured GIT_SHA as version when GIT_SHA is set', async () => {
    const res = await SELF.fetch('http://example.com/api/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { version: string } };
    expect(body.data.version).toBe(env.GIT_SHA);
  });
});

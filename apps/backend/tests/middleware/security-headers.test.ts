import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

async function fetchCsp(): Promise<string> {
  const res = await SELF.fetch('http://example.com/api/health');
  return res.headers.get('Content-Security-Policy') ?? '';
}

describe('securityHeaders', () => {
  it('should not allow Google OAuth origins when no sign-in exists', async () => {
    const csp = await fetchCsp();
    expect(csp).not.toContain('accounts.google.com');
    expect(csp).not.toContain('oauth2.googleapis.com');
  });

  it('should limit connect-src to self and the API origin when sending the CSP', async () => {
    const csp = await fetchCsp();
    expect(csp).toContain("connect-src 'self' https://api.harfhane.app;");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

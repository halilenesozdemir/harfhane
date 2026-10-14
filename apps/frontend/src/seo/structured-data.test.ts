import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const ROBOTS_TXT = readFileSync(resolve(process.cwd(), 'public/robots.txt'), 'utf8');
const HEADERS_FILE = readFileSync(resolve(process.cwd(), 'public/_headers'), 'utf8');
const REDIRECTS_FILE = readFileSync(resolve(process.cwd(), 'public/_redirects'), 'utf8');

interface WebApplicationJsonLd {
  operatingSystem?: string;
  inLanguage?: string;
  isAccessibleForFree?: boolean;
  aggregateRating?: unknown;
}

function extractJsonLdBlocks(html: string): WebApplicationJsonLd[] {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return matches.map((match) => JSON.parse(match[1] ?? '{}') as WebApplicationJsonLd);
}

function getWebApplicationBlock(html: string): WebApplicationJsonLd {
  const [webApplication] = extractJsonLdBlocks(html);
  if (!webApplication) throw new Error('index.html has no JSON-LD blocks');
  return webApplication;
}

describe('index.html structured data', () => {
  it('should only claim the platforms Harfhane actually ships on (web and Android, no iOS)', () => {
    expect(getWebApplicationBlock(INDEX_HTML).operatingSystem).toBe('Web, Android');
  });

  it('should set inLanguage to tr and isAccessibleForFree without a fake rating', () => {
    const webApplication = getWebApplicationBlock(INDEX_HTML);
    expect(webApplication.inLanguage).toBe('tr');
    expect(webApplication.isAccessibleForFree).toBe(true);
    expect(webApplication.aggregateRating).toBeUndefined();
  });

  it('should set html lang to tr', () => {
    expect(INDEX_HTML).toMatch(/<html lang="tr">/);
  });
});

describe('robots.txt', () => {
  it('should disallow the unapproved privacy draft and the admin panel', () => {
    expect(ROBOTS_TXT).toMatch(/^Disallow: \/admin$/m);
    expect(ROBOTS_TXT).toMatch(/^Disallow: \/gizlilik$/m);
  });
});

describe('_headers', () => {
  it('should send X-Robots-Tag: noindex for the unapproved privacy draft', () => {
    const gizlilikBlock = HEADERS_FILE.split(/\n(?=\/)/).find((block) => block.startsWith('/gizlilik'));
    expect(gizlilikBlock).toContain('X-Robots-Tag: noindex');
  });
});

describe('_redirects', () => {
  const removedRoutes = ['/tournament', '/discuss', '/lists', '/play/*', '/c/*', '/sifre-sifirla'];

  it.each(removedRoutes)('should 301 the removed route %s to the home page before the SPA catch-all', (route) => {
    const escapedRoute = route.replace(/[*]/g, '\\*');
    const rule = new RegExp(`^${escapedRoute} / 301$`, 'm');
    expect(REDIRECTS_FILE).toMatch(rule);
  });

  it('should keep the SPA catch-all after every removed-route redirect', () => {
    const catchAllIndex = REDIRECTS_FILE.indexOf('/* /index.html 200');
    for (const route of removedRoutes) {
      expect(REDIRECTS_FILE.indexOf(`${route} / 301`)).toBeLessThan(catchAllIndex);
    }
  });
});

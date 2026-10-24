import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRERENDERED_ROUTES, outputFileFor, renderRouteHtml } from './prerender';
import { HOME_META, getGameMeta } from './route-meta';

const INDEX_HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const SITEMAP_XML = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf8');
const SITE_ORIGIN = 'https://harfhane.app';
const DAILY_FIVE = getGameMeta('daily', 5, 5);

function sitemapPaths(): string[] {
  return [...SITEMAP_XML.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => (match[1] ?? '').replace(SITE_ORIGIN, ''));
}

describe('renderRouteHtml', () => {
  it('should give the route its own title, description, canonical and og:url when rendered', () => {
    const html = renderRouteHtml(INDEX_HTML, DAILY_FIVE);

    expect(html).toContain('<title>Günlük Kelime Oyunu — 5 Harf | Harfhane</title>');
    expect(html).toContain(`<meta name="description" content="${DAILY_FIVE.description}" />`);
    expect(html).toContain('<link rel="canonical" href="https://harfhane.app/daily/5" />');
    expect(html).toContain('<meta property="og:url" content="https://harfhane.app/daily/5" />');
    expect(html).toContain('>Günlük Kelime Oyunu — 5 Harf</h1>');
  });

  it('should leave no trace of the home page title, description or canonical when rendered', () => {
    const html = renderRouteHtml(INDEX_HTML, DAILY_FIVE);

    expect(html).not.toContain(HOME_META.title);
    expect(html).not.toContain(HOME_META.description);
    expect(html).not.toContain('Her gün yeni bir Türkçe kelime bul!');
    expect(html).not.toContain('href="https://harfhane.app/"');
    expect(html).not.toContain('>HARFHANE</h1>');
  });

  it('should escape HTML-special characters when the meta text contains them', () => {
    const html = renderRouteHtml(INDEX_HTML, { ...DAILY_FIVE, title: 'A & B <C> | Harfhane', description: 'Say "hi"' });

    expect(html).toContain('<title>A &amp; B &lt;C&gt; | Harfhane</title>');
    expect(html).toContain('<meta name="description" content="Say &quot;hi&quot;" />');
  });

  it('should throw when index.html no longer contains a marker it replaces', () => {
    const drifted = INDEX_HTML.replace('<link rel="canonical" href="https://harfhane.app/" />', '');

    expect(() => renderRouteHtml(drifted, DAILY_FIVE)).toThrow(/canonical/);
  });
});

describe('PRERENDERED_ROUTES', () => {
  it('should cover every sitemap URL except the home page when compared with public/sitemap.xml', () => {
    const prerendered = PRERENDERED_ROUTES.map((route) => route.canonicalPath);

    expect(['/', ...prerendered].sort()).toEqual(sitemapPaths().sort());
  });

  it('should map each route to an .html file Cloudflare Pages serves without a trailing slash', () => {
    expect(PRERENDERED_ROUTES.map(outputFileFor)).toEqual([
      'daily/5.html',
      'unlimited.html',
      'unlimited/5.html',
      'gizlilik.html',
    ]);
  });
});

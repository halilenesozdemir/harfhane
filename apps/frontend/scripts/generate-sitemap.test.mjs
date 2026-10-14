import { describe, expect, it } from 'vitest';
import { STATIC_ROUTES, buildSitemap } from './generate-sitemap.mjs';

const REMOVED_ROUTES = ['/tournament', '/discuss', '/lists', '/play', '/c/', '/challenge', '/sifre-sifirla'];

describe('generate-sitemap STATIC_ROUTES', () => {
  it('should list only the 5-letter daily and unlimited routes, not 4 or 6 (not yet playable at launch)', () => {
    const paths = STATIC_ROUTES.map((route) => route.path);
    expect(paths).toContain('/daily/5');
    expect(paths).toContain('/unlimited/5');
    expect(paths).not.toContain('/daily/4');
    expect(paths).not.toContain('/daily/6');
    expect(paths).not.toContain('/unlimited/4');
    expect(paths).not.toContain('/unlimited/6');
  });

  it('should not list any removed-feature route', () => {
    const sitemap = buildSitemap('2026-01-01');
    for (const removedRoute of REMOVED_ROUTES) {
      expect(sitemap).not.toContain(`<loc>https://harfhane.app${removedRoute}`);
    }
  });

  it('should not list the unapproved privacy draft route', () => {
    const sitemap = buildSitemap('2026-01-01');
    expect(sitemap).not.toMatch(/gizlilik/i);
  });

  it('should render a valid urlset with the given lastmod date for every route', () => {
    const sitemap = buildSitemap('2026-03-14');
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    const lastmodCount = sitemap.split('<lastmod>2026-03-14</lastmod>').length - 1;
    expect(lastmodCount).toBe(STATIC_ROUTES.length);
  });
});

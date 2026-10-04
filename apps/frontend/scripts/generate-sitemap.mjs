import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SITE_ORIGIN = 'https://harfhane.app';
const OUTPUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'sitemap.xml'
);

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/daily/4', changefreq: 'daily', priority: '0.9' },
  { path: '/daily/5', changefreq: 'daily', priority: '0.9' },
  { path: '/daily/6', changefreq: 'daily', priority: '0.9' },
  { path: '/unlimited', changefreq: 'weekly', priority: '0.7' },
  { path: '/lists', changefreq: 'weekly', priority: '0.6' },
  { path: '/tournament', changefreq: 'weekly', priority: '0.6' },
];

function buildSitemap(lastmod) {
  const urlEntries = STATIC_ROUTES.map(
    (route) => `  <url>
    <loc>${SITE_ORIGIN}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

function getBuildDate() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

writeFileSync(OUTPUT_PATH, buildSitemap(getBuildDate()), 'utf-8');

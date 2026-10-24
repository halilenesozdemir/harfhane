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

// Only 5-letter words are playable at launch (4 and 6 are scheduled but not
// yet playable); listing their routes would send crawlers to a page that
// immediately redirects away. Update this once a length ships (R1).
const PLAYABLE_AT_LAUNCH_LENGTH = 5;

export const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: `/daily/${PLAYABLE_AT_LAUNCH_LENGTH}`, changefreq: 'daily', priority: '0.9' },
  { path: '/unlimited', changefreq: 'weekly', priority: '0.7' },
  { path: `/unlimited/${PLAYABLE_AT_LAUNCH_LENGTH}`, changefreq: 'weekly', priority: '0.7' },
  { path: '/gizlilik', changefreq: 'yearly', priority: '0.3' },
];

export function buildSitemap(lastmod) {
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

export function getBuildDate() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  writeFileSync(OUTPUT_PATH, buildSitemap(getBuildDate()), 'utf-8');
}

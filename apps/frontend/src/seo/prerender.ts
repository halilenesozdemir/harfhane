import { HOME_META, PRIVACY_META, getGameMeta, type RouteMeta } from './route-meta';

const SITE_ORIGIN = 'https://harfhane.app';

// Mirrors PLAYABLE_AT_LAUNCH_LENGTH in scripts/generate-sitemap.mjs; a test
// keeps the prerendered paths and the sitemap in step.
const PLAYABLE_AT_LAUNCH_LENGTH = 5;

// Every sitemap URL except `/`, which is index.html itself. Without its own
// file, each of these got index.html's home-page title and canonical before
// JavaScript ran, so Google treated them as copies of the home page.
export const PRERENDERED_ROUTES: readonly RouteMeta[] = [
  getGameMeta('daily', PLAYABLE_AT_LAUNCH_LENGTH, PLAYABLE_AT_LAUNCH_LENGTH),
  getGameMeta('unlimited', PLAYABLE_AT_LAUNCH_LENGTH, undefined),
  getGameMeta('unlimited', PLAYABLE_AT_LAUNCH_LENGTH, PLAYABLE_AT_LAUNCH_LENGTH),
  PRIVACY_META,
];

const HOME_HEADING = '>HARFHANE</h1>';
const HOME_SUMMARY =
  'Her gün yeni bir Türkçe kelime bul. 6 hakkın var — yeşil doğru yer, sarı yanlış yer, gri hiç yok.';
const HOME_SOCIAL_DESCRIPTIONS = [
  'Her gün yeni bir Türkçe kelime bul! Ücretsiz Türkçe kelime oyunu. Günlük bulmaca ve sınırsız mod.',
  'Her gün yeni bir Türkçe kelime bul! Ücretsiz günlük kelime oyunu.',
];

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function replaceAll(html: string, from: string, to: string): string {
  if (!html.includes(from)) throw new Error(`prerender: index.html no longer contains "${from}"`);
  return html.split(from).join(to);
}

function headingFor(route: RouteMeta): string {
  return route.title.replace(/ \| Harfhane$/, '');
}

// Returns index.html with the route's title, description, canonical and
// social URL, plus a route-specific heading and summary in the no-JS fallback.
// Throws if index.html drifted so a stale marker fails the build loudly.
export function renderRouteHtml(indexHtml: string, route: RouteMeta): string {
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  const url = `${SITE_ORIGIN}${route.canonicalPath}`;
  let html = replaceAll(indexHtml, escapeHtml(HOME_META.title), title);
  html = replaceAll(html, escapeHtml(HOME_META.description), description);
  for (const social of HOME_SOCIAL_DESCRIPTIONS) html = replaceAll(html, social, description);
  html = replaceAll(html, `<link rel="canonical" href="${SITE_ORIGIN}/" />`, `<link rel="canonical" href="${url}" />`);
  html = replaceAll(html, `<meta property="og:url" content="${SITE_ORIGIN}/" />`, `<meta property="og:url" content="${url}" />`);
  html = replaceAll(html, HOME_HEADING, `>${escapeHtml(headingFor(route))}</h1>`);
  return replaceAll(html, HOME_SUMMARY, description);
}

// `/daily/5` -> `daily/5.html`: Cloudflare Pages serves it at `/daily/5`
// without a trailing-slash redirect. Pages ignores `/* /index.html 200` as a
// loop; its own SPA fallback (no top-level 404.html) only covers missing files.
export function outputFileFor(route: RouteMeta): string {
  return `${route.canonicalPath.slice(1)}.html`;
}

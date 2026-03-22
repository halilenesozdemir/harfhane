const API_BASE = 'https://api.harfhane.app/api';
const SITE_URL = 'https://harfhane.app';
const DEFAULT_TITLE = 'Harfhane — Türkçe Kelime Oyunu Platformu';
const DEFAULT_DESC = 'Kendi Türkçe kelime oyununu oluştur, oyna ve arkadaşlarınla paylaş.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const slugMatch = url.pathname.match(/^\/play\/([a-z0-9-]+)$/);

    if (slugMatch) {
      const slug = slugMatch[1];
      const pageUrl = `${SITE_URL}/play/${slug}`;

      let title = DEFAULT_TITLE;
      let description = DEFAULT_DESC;

      try {
        const apiRes = await fetch(`${API_BASE}/lists/${slug}`);
        if (apiRes.ok) {
          const data = await apiRes.json();
          const list = data?.data?.list;
          if (list) {
            title = `${list.name} — Harfhane`;
            description = list.description
              ?? `${list.wordLength} harflik${list.wordCount ? `, ${list.wordCount} kelimelik` : ''} kelime listesi`;
          }
        }
      } catch {}

      const htmlResponse = await env.ASSETS.fetch(new Request(`${SITE_URL}/`, { headers: request.headers }));

      return new HTMLRewriter()
        .on('title', {
          element(el) { el.setInnerContent(title); },
        })
        .on('meta[name="description"]', {
          element(el) { el.setAttribute('content', description); },
        })
        .on('link[rel="canonical"]', {
          element(el) { el.setAttribute('href', pageUrl); },
        })
        .on('meta[property="og:title"]', {
          element(el) { el.setAttribute('content', title); },
        })
        .on('meta[property="og:description"]', {
          element(el) { el.setAttribute('content', description); },
        })
        .on('meta[property="og:url"]', {
          element(el) { el.setAttribute('content', pageUrl); },
        })
        .on('meta[name="twitter:title"]', {
          element(el) { el.setAttribute('content', title); },
        })
        .on('meta[name="twitter:description"]', {
          element(el) { el.setAttribute('content', description); },
        })
        .transform(htmlResponse);
    }

    return env.ASSETS.fetch(request);
  },
};

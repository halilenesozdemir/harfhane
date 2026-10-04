import { useEffect } from 'react';

const SITE_ORIGIN = 'https://harfhane.app';

interface PageMetaProps {
  title: string;
  description: string;
  canonicalPath: string;
  noIndex?: boolean;
}

function upsertHeadElement(selector: string, tag: 'meta' | 'link', attrs: Record<string, string>): void {
  const existing = document.head.querySelector(selector);
  const element = existing ?? document.head.appendChild(document.createElement(tag));
  Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value));
}

function removeHeadElement(selector: string): void {
  document.head.querySelector(selector)?.remove();
}

export function PageMeta({ title, description, canonicalPath, noIndex = false }: PageMetaProps): null {
  useEffect(() => {
    document.title = title;
    upsertHeadElement('meta[name="description"]', 'meta', { name: 'description', content: description });
    upsertHeadElement('link[rel="canonical"]', 'link', { rel: 'canonical', href: `${SITE_ORIGIN}${canonicalPath}` });
    if (noIndex) upsertHeadElement('meta[name="robots"]', 'meta', { name: 'robots', content: 'noindex' });
    else removeHeadElement('meta[name="robots"][content="noindex"]');
  }, [title, description, canonicalPath, noIndex]);

  return null;
}

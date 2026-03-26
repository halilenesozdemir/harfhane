import type { Env } from '../types/env';

const DAILY_SLUG_RE = /^daily-\d{4}-\d{2}-\d{2}$/;

export function isDailyDiscussionSlug(slug: string): boolean {
  return DAILY_SLUG_RE.test(slug);
}

export async function upsertDiscussionList(db: Env['DB'], slug: string): Promise<number> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO word_lists (slug, name, description, word_length, is_public, has_daily)
       VALUES (?, ?, NULL, 5, 0, 0)`
    )
    .bind(slug, `Günlük tartışma — ${slug.slice(6)}`)
    .run();

  const row = await db
    .prepare('SELECT id FROM word_lists WHERE slug = ?')
    .bind(slug)
    .first<{ id: number }>();

  if (!row) throw new Error(`Failed to upsert discussion list for ${slug}`);
  return row.id;
}

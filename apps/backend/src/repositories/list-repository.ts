import type { Env } from '../types/env';

export interface ListRow {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  word_length: number;
  is_public: number;
  has_daily: number;
  owner_user_id: number | null;
  created_at: string;
  word_count?: number;
  like_count?: number;
  comment_count?: number;
}

export interface WordRow {
  id: number;
  word: string;
  meaning: string;
  context: string;
  category: string;
}

export async function findListBySlug(db: Env['DB'], slug: string): Promise<ListRow | null> {
  const row = await db
    .prepare(
      `SELECT wl.*, COUNT(wlw.word_id) as word_count
       FROM word_lists wl
       LEFT JOIN word_list_words wlw ON wlw.list_id = wl.id
       WHERE wl.slug = ?
       GROUP BY wl.id`
    )
    .bind(slug)
    .first<ListRow>();
  return row ?? null;
}

export async function findAllPublicLists(db: Env['DB']): Promise<ListRow[]> {
  const { results } = await db
    .prepare(
      `SELECT wl.*,
              COUNT(wlw.word_id) as word_count,
              (SELECT COUNT(*) FROM list_likes ll WHERE ll.list_id = wl.id) as like_count,
              (SELECT COUNT(*) FROM list_comments lc WHERE lc.list_id = wl.id) as comment_count
       FROM word_lists wl
       LEFT JOIN word_list_words wlw ON wlw.list_id = wl.id
       WHERE wl.is_public = 1
       GROUP BY wl.id
       ORDER BY wl.created_at DESC`
    )
    .all<ListRow>();
  return results;
}

export async function findRandomWordFromList(
  db: Env['DB'],
  listId: number
): Promise<WordRow | null> {
  const row = await db
    .prepare(
      `SELECT w.id, w.word, w.meaning, w.context, w.category
       FROM word_list_words wlw
       JOIN words w ON w.id = wlw.word_id
       WHERE wlw.list_id = ? AND w.is_active = 1
       ORDER BY RANDOM()
       LIMIT 1`
    )
    .bind(listId)
    .first<WordRow>();
  return row ?? null;
}

export async function createList(
  db: Env['DB'],
  slug: string,
  name: string,
  description: string | null,
  wordLength: number,
  isPublic: boolean,
  ownerUserId: number | null = null,
  hasDaily = false
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO word_lists (slug, name, description, word_length, is_public, owner_user_id, has_daily)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id`
    )
    .bind(slug, name, description ?? null, wordLength, isPublic ? 1 : 0, ownerUserId, hasDaily ? 1 : 0)
    .first<{ id: number }>();
  return result!.id;
}

export async function updateList(
  db: Env['DB'],
  listId: number,
  patch: { name?: string; description?: string | null; isPublic?: boolean; hasDaily?: boolean }
): Promise<void> {
  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  if (patch.name !== undefined) { sets.push('name = ?'); values.push(patch.name); }
  if (patch.description !== undefined) { sets.push('description = ?'); values.push(patch.description); }
  if (patch.isPublic !== undefined) { sets.push('is_public = ?'); values.push(patch.isPublic ? 1 : 0); }
  if (patch.hasDaily !== undefined) { sets.push('has_daily = ?'); values.push(patch.hasDaily ? 1 : 0); }

  if (sets.length === 0) return;

  values.push(listId);
  await db
    .prepare(`UPDATE word_lists SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function addWordToList(
  db: Env['DB'],
  listId: number,
  wordId: number
): Promise<void> {
  await db
    .prepare(`INSERT OR IGNORE INTO word_list_words (list_id, word_id) VALUES (?, ?)`)
    .bind(listId, wordId)
    .run();
}

export async function removeWordFromList(
  db: Env['DB'],
  listId: number,
  wordId: number
): Promise<void> {
  await db
    .prepare(`DELETE FROM word_list_words WHERE list_id = ? AND word_id = ?`)
    .bind(listId, wordId)
    .run();
}

export async function deleteList(db: Env['DB'], listId: number): Promise<void> {
  await db.prepare(`DELETE FROM word_lists WHERE id = ?`).bind(listId).run();
}

export async function findAllLists(db: Env['DB']): Promise<ListRow[]> {
  const { results } = await db
    .prepare(
      `SELECT wl.*, COUNT(wlw.word_id) as word_count
       FROM word_lists wl
       LEFT JOIN word_list_words wlw ON wlw.list_id = wl.id
       GROUP BY wl.id
       ORDER BY wl.created_at DESC`
    )
    .all<ListRow>();
  return results;
}

export async function findListsByOwner(db: Env['DB'], userId: number): Promise<ListRow[]> {
  const { results } = await db
    .prepare(
      `SELECT wl.*, COUNT(wlw.word_id) as word_count
       FROM word_lists wl
       LEFT JOIN word_list_words wlw ON wlw.list_id = wl.id
       WHERE wl.owner_user_id = ?
       GROUP BY wl.id
       ORDER BY wl.created_at DESC`
    )
    .bind(userId)
    .all<ListRow>();
  return results;
}

export async function findListWords(
  db: Env['DB'],
  listId: number
): Promise<WordRow[]> {
  const { results } = await db
    .prepare(
      `SELECT w.id, w.word, w.meaning, w.context, w.category
       FROM word_list_words wlw
       JOIN words w ON w.id = wlw.word_id
       WHERE wlw.list_id = ?
       ORDER BY w.word`
    )
    .bind(listId)
    .all<WordRow>();
  return results;
}

export async function slugExists(db: Env['DB'], slug: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT 1 FROM word_lists WHERE slug = ?`)
    .bind(slug)
    .first();
  return row !== null;
}

export async function findOrCreateWord(
  db: Env['DB'],
  word: string,
  meaning: string | null,
  wordLength: number
): Promise<number> {
  const existing = await db
    .prepare(`SELECT id FROM words WHERE word = ?`)
    .bind(word)
    .first<{ id: number }>();
  if (existing) return existing.id;

  const result = await db
    .prepare(
      `INSERT INTO words (word, length, meaning, context, category, is_active, source, license)
       VALUES (?, ?, ?, '', NULL, 1, 'user', 'user-submitted')
       RETURNING id`
    )
    .bind(word, wordLength, meaning ?? '')
    .first<{ id: number }>();

  if (!result) throw new Error(`Failed to insert word: ${word} (length ${wordLength})`);
  return result.id;
}

export async function countActiveWordsInList(db: Env['DB'], listId: number): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as count FROM word_list_words wlw
       JOIN words w ON w.id = wlw.word_id
       WHERE wlw.list_id = ? AND w.is_active = 1`
    )
    .bind(listId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function findWordFromListAtOffset(
  db: Env['DB'],
  listId: number,
  offset: number
): Promise<WordRow | null> {
  const row = await db
    .prepare(
      `SELECT w.id, w.word, w.meaning, w.context, w.category
       FROM word_list_words wlw
       JOIN words w ON w.id = wlw.word_id
       WHERE wlw.list_id = ? AND w.is_active = 1
       ORDER BY w.id ASC
       LIMIT 1 OFFSET ?`
    )
    .bind(listId, offset)
    .first<WordRow>();
  return row ?? null;
}

export async function wordExistsInList(
  db: Env['DB'],
  listId: number,
  word: string
): Promise<boolean> {
  const tdkRow = await db
    .prepare(`SELECT 1 FROM valid_words WHERE word = ? LIMIT 1`)
    .bind(word)
    .first();
  if (tdkRow) return true;

  const listRow = await db
    .prepare(
      `SELECT 1 FROM word_list_words wlw
       JOIN words w ON w.id = wlw.word_id
       WHERE wlw.list_id = ? AND w.word = ? AND w.is_active = 1`
    )
    .bind(listId, word)
    .first();
  return listRow !== null;
}

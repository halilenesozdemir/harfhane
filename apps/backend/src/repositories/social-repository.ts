import type { Env } from '../types/env';

export interface CommentRow {
  id: number;
  user_id: number;
  list_id: number;
  content: string;
  created_at: string;
  username: string;
}

export async function getLikeCount(db: Env['DB'], listId: number): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) as count FROM list_likes WHERE list_id = ?`)
    .bind(listId)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function toggleLike(
  db: Env['DB'],
  userId: number,
  listId: number
): Promise<{ liked: boolean; count: number }> {
  const existing = await db
    .prepare(`SELECT 1 FROM list_likes WHERE user_id = ? AND list_id = ?`)
    .bind(userId, listId)
    .first();

  if (existing) {
    await db
      .prepare(`DELETE FROM list_likes WHERE user_id = ? AND list_id = ?`)
      .bind(userId, listId)
      .run();
    const count = await getLikeCount(db, listId);
    return { liked: false, count };
  } else {
    await db
      .prepare(`INSERT INTO list_likes (user_id, list_id) VALUES (?, ?)`)
      .bind(userId, listId)
      .run();
    const count = await getLikeCount(db, listId);
    return { liked: true, count };
  }
}

export async function getComments(db: Env['DB'], listId: number): Promise<CommentRow[]> {
  const { results } = await db
    .prepare(
      `SELECT lc.id, lc.user_id, lc.list_id, lc.content, lc.created_at, u.username
       FROM list_comments lc
       JOIN users u ON u.id = lc.user_id
       WHERE lc.list_id = ?
       ORDER BY lc.created_at ASC`
    )
    .bind(listId)
    .all<CommentRow>();
  return results;
}

export async function addComment(
  db: Env['DB'],
  userId: number,
  listId: number,
  content: string
): Promise<CommentRow> {
  const result = await db
    .prepare(
      `INSERT INTO list_comments (user_id, list_id, content)
       VALUES (?, ?, ?)
       RETURNING id, user_id, list_id, content, created_at`
    )
    .bind(userId, listId, content)
    .first<Omit<CommentRow, 'username'>>();

  if (!result) throw new Error('Failed to insert comment');

  const user = await db
    .prepare(`SELECT username FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ username: string }>();

  return { ...result, username: user?.username ?? '' };
}

export async function findCommentById(
  db: Env['DB'],
  commentId: number
): Promise<CommentRow | null> {
  const row = await db
    .prepare(
      `SELECT lc.id, lc.user_id, lc.list_id, lc.content, lc.created_at, u.username
       FROM list_comments lc
       JOIN users u ON u.id = lc.user_id
       WHERE lc.id = ?`
    )
    .bind(commentId)
    .first<CommentRow>();
  return row ?? null;
}

export async function deleteComment(db: Env['DB'], commentId: number): Promise<void> {
  await db
    .prepare(`DELETE FROM list_comments WHERE id = ?`)
    .bind(commentId)
    .run();
}

export async function getUserLikeStatus(
  db: Env['DB'],
  userId: number,
  listId: number
): Promise<boolean> {
  const row = await db
    .prepare(`SELECT 1 FROM list_likes WHERE user_id = ? AND list_id = ?`)
    .bind(userId, listId)
    .first();
  return row !== null;
}

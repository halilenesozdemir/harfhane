import type { Env } from '../types/env';

export async function getFrozenDates(db: Env['DB'], userId: number): Promise<string[]> {
  const { results } = await db
    .prepare('SELECT frozen_date FROM streak_freezes WHERE user_id = ?')
    .bind(userId)
    .all<{ frozen_date: string }>();
  return results.map(r => r.frozen_date);
}

export async function getFreezeTokens(db: Env['DB'], userId: number): Promise<number> {
  const row = await db
    .prepare('SELECT freeze_tokens FROM users WHERE id = ?')
    .bind(userId)
    .first<{ freeze_tokens: number }>();
  return row?.freeze_tokens ?? 0;
}

export async function applyFreeze(db: Env['DB'], userId: number, date: string): Promise<boolean> {
  const tokens = await getFreezeTokens(db, userId);
  if (tokens <= 0) return false;

  const alreadyFrozen = await db
    .prepare('SELECT 1 FROM streak_freezes WHERE user_id = ? AND frozen_date = ?')
    .bind(userId, date)
    .first();
  if (alreadyFrozen) return false;

  await db.prepare('INSERT INTO streak_freezes (user_id, frozen_date) VALUES (?, ?)').bind(userId, date).run();
  await db.prepare('UPDATE users SET freeze_tokens = freeze_tokens - 1 WHERE id = ?').bind(userId).run();
  return true;
}

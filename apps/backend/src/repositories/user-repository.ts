import type { Env } from '../types/env';

export interface UserRow {
  id: number;
  email: string;
  username: string;
  google_id: string | null;
  created_at: string;
}

export function findUserByEmail(db: Env['DB'], email: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
}

export function findUserById(db: Env['DB'], id: number): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

export function findUserByGoogleId(db: Env['DB'], googleId: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE google_id = ?').bind(googleId).first<UserRow>();
}

async function updateUserGoogleId(db: Env['DB'], userId: number, googleId: string): Promise<UserRow> {
  const result = await db
    .prepare('UPDATE users SET google_id = ? WHERE id = ? RETURNING *')
    .bind(googleId, userId)
    .first<UserRow>();
  if (!result) throw new Error('User update failed');
  return result;
}

async function createGoogleUser(db: Env['DB'], googleId: string, email: string, username: string): Promise<UserRow> {
  const result = await db
    .prepare('INSERT INTO users (email, username, password_hash, google_id) VALUES (?, ?, \'GOOGLE_AUTH\', ?) RETURNING *')
    .bind(email, username, googleId)
    .first<UserRow>();
  if (!result) throw new Error('User creation failed');
  return result;
}

export async function upsertGoogleUser(
  db: Env['DB'],
  googleId: string,
  email: string,
  username: string
): Promise<UserRow> {
  const byGoogleId = await findUserByGoogleId(db, googleId);
  if (byGoogleId) return byGoogleId;

  const byEmail = await findUserByEmail(db, email);
  if (byEmail) return updateUserGoogleId(db, byEmail.id, googleId);

  return createGoogleUser(db, googleId, email, username);
}

export async function deleteUser(db: Env['DB'], userId: number): Promise<void> {
  const ownedLists = 'SELECT id FROM word_lists WHERE owner_user_id = ?';
  await db.batch([
    db.prepare(`DELETE FROM word_list_words WHERE list_id IN (${ownedLists})`).bind(userId),
    db.prepare(`DELETE FROM list_likes WHERE list_id IN (${ownedLists}) OR user_id = ?`).bind(userId, userId),
    db.prepare(`DELETE FROM list_comments WHERE list_id IN (${ownedLists}) OR user_id = ?`).bind(userId, userId),
    db.prepare('DELETE FROM word_lists WHERE owner_user_id = ?').bind(userId),
    db.prepare('DELETE FROM game_results WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM tournament_results WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM duels WHERE challenger_id = ? OR opponent_id = ?').bind(userId, userId),
    db.prepare('DELETE FROM user_xp WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM user_badges WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM streak_freezes WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM users WHERE id = ?').bind(userId),
  ]);
}

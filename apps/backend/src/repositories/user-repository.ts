import type { Env } from '../types/env';

export interface UserRow {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  google_id: string | null;
  created_at: string;
}

export function findUserByEmail(db: Env['DB'], email: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
}

export function findUserByUsername(db: Env['DB'], username: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<UserRow>();
}

export function findUserById(db: Env['DB'], id: number): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

export async function createUser(
  db: Env['DB'],
  email: string,
  username: string,
  passwordHash: string
): Promise<UserRow> {
  const result = await db
    .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?) RETURNING *')
    .bind(email, username, passwordHash)
    .first<UserRow>();
  if (!result) throw new Error('User creation failed');
  return result;
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

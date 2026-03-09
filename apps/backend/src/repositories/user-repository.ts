import type { Env } from '../types/env';

export interface UserRow {
  id: number;
  email: string;
  username: string;
  password_hash: string;
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

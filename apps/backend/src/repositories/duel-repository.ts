import type { D1Database } from '@cloudflare/workers-types';

export interface DuelRow {
  id: number;
  word_id: number;
  challenger_id: number;
  challenger_guesses: number;
  challenger_won: number;
  opponent_id: number | null;
  opponent_guesses: number | null;
  opponent_won: number | null;
  created_at: string;
}

export async function upsertDuel(
  db: D1Database,
  wordId: number,
  challengerId: number,
  guesses: number,
  won: boolean
): Promise<DuelRow> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO duels (word_id, challenger_id, challenger_guesses, challenger_won)
       VALUES (?, ?, ?, ?)`
    )
    .bind(wordId, challengerId, guesses, won ? 1 : 0)
    .run();

  const row = await db
    .prepare(`SELECT * FROM duels WHERE word_id = ? AND challenger_id = ?`)
    .bind(wordId, challengerId)
    .first<DuelRow>();

  if (!row) throw new Error('Failed to upsert duel');
  return row;
}

export async function recordOpponentResult(
  db: D1Database,
  wordId: number,
  opponentId: number,
  guesses: number,
  won: boolean
): Promise<void> {
  await db
    .prepare(
      `UPDATE duels
       SET opponent_id = ?, opponent_guesses = ?, opponent_won = ?
       WHERE word_id = ? AND opponent_id IS NULL AND challenger_id != ?`
    )
    .bind(opponentId, guesses, won ? 1 : 0, wordId, opponentId)
    .run();
}

export async function getDuel(db: D1Database, wordId: number): Promise<DuelRow | null> {
  return db
    .prepare(`SELECT * FROM duels WHERE word_id = ?`)
    .bind(wordId)
    .first<DuelRow>();
}

export async function getDuelForUser(
  db: D1Database,
  wordId: number,
  userId: number
): Promise<DuelRow | null> {
  return db
    .prepare(`SELECT * FROM duels WHERE word_id = ? AND (challenger_id = ? OR opponent_id = ?)`)
    .bind(wordId, userId, userId)
    .first<DuelRow>();
}

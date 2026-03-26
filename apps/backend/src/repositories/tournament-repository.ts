import type { Env } from '../types/env';

export interface TournamentWordRow {
  id: number;
  word: string;
  meaning: string;
  length: number;
}

export interface TournamentLeaderboardRow {
  user_id: number;
  username: string;
  total_score: number;
  games_played: number;
  games_won: number;
  avg_guesses: number;
}

export interface TournamentUserStats {
  total_score: number;
  games_played: number;
  games_won: number;
  best_score: number;
}

const VALID_LENGTHS = [4, 5, 6] as const;

export async function getTournamentWord(db: Env['DB']): Promise<TournamentWordRow | null> {
  const lengthIndex = Math.floor(Math.random() * VALID_LENGTHS.length);
  const wordLength = VALID_LENGTHS[lengthIndex]!;

  const row = await db
    .prepare(
      `SELECT id, word, meaning, length
       FROM words
       WHERE is_active = 1 AND length = ? AND LENGTH(word) = ?
       ORDER BY RANDOM()
       LIMIT 1`
    )
    .bind(wordLength, wordLength)
    .first<TournamentWordRow>();

  return row;
}

export async function saveTournamentResult(
  db: Env['DB'],
  userId: number,
  wordId: number,
  wordLength: number,
  guesses: number,
  won: boolean,
  score: number
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tournament_results (user_id, word_id, word_length, guesses, won, score)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(userId, wordId, wordLength, guesses, won ? 1 : 0, score)
    .run();
}

export type TournamentPeriod = 'all' | 'week' | 'month';

function periodStartDate(period: TournamentPeriod): string | null {
  if (period === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - (period === 'week' ? 7 : 30));
  return d.toISOString().slice(0, 10);
}

export async function getTournamentLeaderboard(
  db: Env['DB'],
  period: TournamentPeriod = 'all',
  limit = 50
): Promise<TournamentLeaderboardRow[]> {
  const fromDate = periodStartDate(period);
  const dateFilter = fromDate ? 'AND tr.played_at >= ?' : '';

  const query = db.prepare(
    `SELECT
       tr.user_id,
       u.username,
       SUM(tr.score) AS total_score,
       COUNT(*) AS games_played,
       SUM(tr.won) AS games_won,
       ROUND(AVG(CASE WHEN tr.won = 1 THEN tr.guesses END), 1) AS avg_guesses
     FROM tournament_results tr
     JOIN users u ON u.id = tr.user_id
     WHERE 1=1 ${dateFilter}
     GROUP BY tr.user_id, u.username
     HAVING games_played >= 1
     ORDER BY total_score DESC
     LIMIT ?`
  );

  const bound = fromDate ? query.bind(fromDate, limit) : query.bind(limit);
  const rows = await bound.all<TournamentLeaderboardRow>();
  return rows.results ?? [];
}

export async function getUserTournamentStats(
  db: Env['DB'],
  userId: number
): Promise<TournamentUserStats> {
  const row = await db
    .prepare(
      `SELECT
         COALESCE(SUM(score), 0) AS total_score,
         COUNT(*) AS games_played,
         COALESCE(SUM(won), 0) AS games_won,
         COALESCE(MAX(score), 0) AS best_score
       FROM tournament_results
       WHERE user_id = ?`
    )
    .bind(userId)
    .first<TournamentUserStats>();

  return row ?? { total_score: 0, games_played: 0, games_won: 0, best_score: 0 };
}

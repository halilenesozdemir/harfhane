import type { Env } from '../types/env';
import { getFrozenDates } from './freeze-repository';

export interface ResultRow {
  id: number;
  user_id: number;
  date: string;
  word_length: number;
  guesses: number;
  won: number;
  created_at: string;
}

export interface LeaderboardRow {
  user_id: number;
  username: string;
  total_won: number;
  total_played: number;
  win_rate: number;
  current_streak: number;
  max_streak: number;
  total_xp: number;
  level: number;
}

export async function saveResult(
  db: Env['DB'],
  userId: number,
  date: string,
  wordLength: number,
  guesses: number,
  won: boolean
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO game_results (user_id, date, word_length, guesses, won)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date, word_length) DO NOTHING
    `)
    .bind(userId, date, wordLength, guesses, won ? 1 : 0)
    .run();
}

export async function getUserStats(db: Env['DB'], userId: number): Promise<{
  totalPlayed: number;
  totalWon: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
}> {
  const rows = await db
    .prepare(`
      SELECT date, won, guesses, word_length
      FROM game_results
      WHERE user_id = ?
      ORDER BY date DESC
    `)
    .bind(userId)
    .all<{ date: string; won: number; guesses: number; word_length: number }>();

  const [frozenDates] = await Promise.all([getFrozenDates(db, userId)]);

  const results = rows.results ?? [];
  const totalPlayed = results.length;
  const totalWon = results.filter(r => r.won).length;
  const winRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

  const wonDates = new Set([
    ...results.filter(r => r.won).map(r => r.date),
    ...frozenDates,
  ]);
  const allDates = [...new Set([
    ...results.map(r => r.date),
    ...frozenDates,
  ])].sort();

  let currentStreak = 0;
  let maxStreak = 0;
  let streak = 0;

  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i]!;
    if (wonDates.has(date)) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 0;
    }
  }

  // Güncel streak: sondan geriye git
  for (let i = allDates.length - 1; i >= 0; i--) {
    if (wonDates.has(allDates[i]!)) currentStreak++;
    else break;
  }

  // Tahmin dağılımı (sadece kazanılan)
  const guessDistribution = [0, 0, 0, 0, 0, 0];
  for (const r of results) {
    if (r.won && r.guesses >= 1 && r.guesses <= 6) {
      guessDistribution[r.guesses - 1]!++;
    }
  }

  return { totalPlayed, totalWon, winRate, currentStreak, maxStreak, guessDistribution };
}

export type LeaderboardPeriod = 'all' | 'week' | 'month';

function periodStartDate(period: LeaderboardPeriod): string | null {
  if (period === 'all') return null;
  const d = new Date();
  d.setDate(d.getDate() - (period === 'week' ? 7 : 30));
  return d.toISOString().slice(0, 10);
}

export async function getLeaderboard(
  db: Env['DB'],
  period: LeaderboardPeriod = 'all',
  limit = 50
): Promise<LeaderboardRow[]> {
  const fromDate = periodStartDate(period);
  const dateFilter = fromDate ? 'AND gr.date >= ?' : '';
  const orderBy = period === 'all'
    ? 'ORDER BY total_xp DESC, total_won DESC'
    : 'ORDER BY total_won DESC, win_rate DESC';

  const query = db.prepare(`
    SELECT
      gr.user_id,
      u.username,
      SUM(gr.won) AS total_won,
      COUNT(*) AS total_played,
      ROUND(SUM(gr.won) * 100.0 / COUNT(*), 1) AS win_rate,
      COALESCE(xp.total_xp, 0) AS total_xp,
      COALESCE(xp.level, 1) AS level
    FROM game_results gr
    JOIN users u ON u.id = gr.user_id
    LEFT JOIN user_xp xp ON xp.user_id = gr.user_id
    WHERE 1=1 ${dateFilter}
    GROUP BY gr.user_id, u.username, xp.total_xp, xp.level
    HAVING total_played >= 1
    ${orderBy}
    LIMIT ?
  `);

  const bound = fromDate ? query.bind(fromDate, limit) : query.bind(limit);
  const rows = await bound.all<Omit<LeaderboardRow, 'current_streak' | 'max_streak'>>();

  if (!rows.results?.length) return [];

  const result: LeaderboardRow[] = [];
  for (const row of rows.results) {
    const stats = await getUserStats(db, row.user_id);
    result.push({ ...row, current_streak: stats.currentStreak, max_streak: stats.maxStreak });
  }

  return result;
}

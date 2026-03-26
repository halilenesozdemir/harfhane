import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types/env';
import { requireAuth } from '../middleware/auth-middleware';
import {
  getTournamentWord,
  saveTournamentResult,
  getTournamentLeaderboard,
  getUserTournamentStats,
  type TournamentPeriod,
} from '../repositories/tournament-repository';

type TournamentEnv = { Bindings: Env; Variables: { userId: number } };

export const tournament = new Hono<TournamentEnv>();

const BASE_SCORES = [600, 500, 400, 300, 200, 100] as const;
const LENGTH_BONUS: Record<number, number> = { 4: 0, 5: 50, 6: 100 };

function calculateScore(won: boolean, guesses: number, wordLength: number): number {
  if (!won) return 0;
  const guessIndex = Math.max(0, Math.min(guesses - 1, BASE_SCORES.length - 1));
  const base = BASE_SCORES[guessIndex]!;
  const bonus = LENGTH_BONUS[wordLength] ?? 0;
  return base + bonus;
}

const saveResultSchema = z.object({
  word_id: z.number().int().positive(),
  word_length: z.number().int().min(4).max(6),
  guesses: z.number().int().min(1).max(6),
  won: z.boolean(),
});

tournament.get('/word', requireAuth, async (c) => {
  const userId = c.get('userId');
  const [word, stats] = await Promise.all([
    getTournamentWord(c.env.DB),
    getUserTournamentStats(c.env.DB, userId),
  ]);

  if (!word) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'No active words available' } }, 404);
  }

  return c.json({
    data: {
      word: { id: word.id, word: word.word, length: word.length, meaning: word.meaning },
      stats,
    },
  });
});

tournament.post(
  '/result',
  requireAuth,
  zValidator('json', saveResultSchema, (r, c) => {
    if (!r.success) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: r.error.issues[0]?.message ?? 'Invalid body' } }, 422);
    }
    return;
  }),
  async (c) => {
    const userId = c.get('userId');
    const { word_id, word_length, guesses, won } = c.req.valid('json');
    const score = calculateScore(won, guesses, word_length);

    await saveTournamentResult(c.env.DB, userId, word_id, word_length, guesses, won, score);
    const stats = await getUserTournamentStats(c.env.DB, userId);

    return c.json({ data: { score, total_score: stats.total_score } }, 201);
  }
);

const VALID_PERIODS = new Set<TournamentPeriod>(['all', 'week', 'month']);

tournament.get('/leaderboard', async (c) => {
  const raw = c.req.query('period') ?? 'all';
  const period: TournamentPeriod = VALID_PERIODS.has(raw as TournamentPeriod)
    ? (raw as TournamentPeriod)
    : 'all';
  const rows = await getTournamentLeaderboard(c.env.DB, period);
  return c.json({ data: { leaderboard: rows } });
});

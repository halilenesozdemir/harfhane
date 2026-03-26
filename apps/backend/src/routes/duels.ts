import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types/env';
import type { DuelPublic } from '@nurdle/shared';
import { requireAuth } from '../middleware/auth-middleware';
import { NOT_FOUND } from '../errors/api-error';
import {
  upsertDuel,
  recordOpponentResult,
  getDuelForUser,
  type DuelRow,
} from '../repositories/duel-repository';

type DuelEnv = { Bindings: Env; Variables: { userId: number } };

const registerDuelSchema = z.object({
  word_id: z.number().int().positive(),
  guesses: z.number().int().min(1).max(6),
  won: z.boolean(),
});

function buildDuelPublic(row: DuelRow, userId: number): DuelPublic {
  const isChallenger = row.challenger_id === userId;
  const opponentFinished = row.opponent_guesses !== null;

  if (isChallenger) {
    return {
      id: row.id,
      wordId: row.word_id,
      myRole: 'challenger',
      myGuesses: row.challenger_guesses,
      myWon: row.challenger_won === 1,
      opponentGuesses: opponentFinished ? row.opponent_guesses : null,
      opponentWon: opponentFinished ? row.opponent_won === 1 : null,
      opponentFinished,
    };
  }

  return {
    id: row.id,
    wordId: row.word_id,
    myRole: 'opponent',
    myGuesses: row.opponent_guesses ?? 0,
    myWon: row.opponent_won === 1,
    opponentGuesses: row.challenger_guesses,
    opponentWon: row.challenger_won === 1,
    opponentFinished: true,
  };
}

export const duels = new Hono<DuelEnv>();

duels.post('/', requireAuth, zValidator('json', registerDuelSchema), async (c) => {
  const userId = c.get('userId');
  const { word_id, guesses, won } = c.req.valid('json');

  const existing = await getDuelForUser(c.env.DB, word_id, userId);

  if (existing && existing.challenger_id !== userId) {
    await recordOpponentResult(c.env.DB, word_id, userId, guesses, won);
    const updated = await getDuelForUser(c.env.DB, word_id, userId);
    if (!updated) throw NOT_FOUND('Duel');
    return c.json({ data: { duel: buildDuelPublic(updated, userId) } }, 201);
  }

  const row = await upsertDuel(c.env.DB, word_id, userId, guesses, won);
  return c.json({ data: { duel: buildDuelPublic(row, userId) } }, 201);
});

duels.get('/:wordId', requireAuth, async (c) => {
  const userId = c.get('userId');
  const wordId = parseInt(c.req.param('wordId') ?? '', 10);

  if (isNaN(wordId)) throw NOT_FOUND('Duel');

  const row = await getDuelForUser(c.env.DB, wordId, userId);
  if (!row) throw NOT_FOUND('Duel');

  return c.json({ data: { duel: buildDuelPublic(row, userId) } });
});

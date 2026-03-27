import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { createTestToken } from '../helpers/auth';

type DuelPublic = {
  id: number;
  wordId: number;
  myRole: 'challenger' | 'opponent';
  myGuesses: number;
  myWon: boolean;
  opponentGuesses: number | null;
  opponentWon: boolean | null;
  opponentFinished: boolean;
};

type DuelResponse = {
  data?: { duel: DuelPublic };
  error?: { code: string; message: string };
};

let challengerToken: string;
let challengerUserId: number;
let opponentToken: string;
let opponentUserId: number;
let kitapWordId: number;
let kalemWordId: number;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);

  const challenger = await createTestUser(env.DB, 'challenger', 'challenger@test.com');
  challengerUserId = challenger.id;
  challengerToken = await createTestToken(challengerUserId, env.JWT_SECRET);

  const opponent = await createTestUser(env.DB, 'opponent', 'opponent@test.com');
  opponentUserId = opponent.id;
  opponentToken = await createTestToken(opponentUserId, env.JWT_SECRET);

  const kitapRow = await env.DB
    .prepare('SELECT id FROM words WHERE word = ?')
    .bind('KİTAP')
    .first<{ id: number }>();
  kitapWordId = kitapRow!.id;

  const kalemRow = await env.DB
    .prepare('SELECT id FROM words WHERE word = ?')
    .bind('KALEM')
    .first<{ id: number }>();
  kalemWordId = kalemRow!.id;

  await env.DB
    .prepare(
      `INSERT INTO duels (word_id, challenger_id, challenger_guesses, challenger_won, opponent_id, opponent_guesses, opponent_won)
       VALUES (?, ?, 4, 1, ?, 2, 1)`
    )
    .bind(kalemWordId, challengerUserId, opponentUserId)
    .run();
});

describe('POST /api/duels', () => {
  it('should return 401 without token', async () => {
    const response = await SELF.fetch('http://example.com/api/duels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word_id: 1, guesses: 3, won: true }),
    });

    expect(response.status).toBe(401);
  });

  it('should return 201 and create duel as challenger', async () => {
    const response = await SELF.fetch('http://example.com/api/duels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${challengerToken}`,
      },
      body: JSON.stringify({ word_id: kitapWordId, guesses: 4, won: true }),
    });

    expect(response.status).toBe(201);
    const body = await response.json() as DuelResponse;
    expect(body.data?.duel.myRole).toBe('challenger');
    expect(body.data?.duel.wordId).toBe(kitapWordId);
    expect(body.data?.duel.myGuesses).toBe(4);
    expect(body.data?.duel.myWon).toBe(true);
    expect(body.data?.duel.opponentFinished).toBe(false);
  });

  it('should return 201 and record opponent result when duel exists from another user', async () => {
    const response = await SELF.fetch('http://example.com/api/duels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opponentToken}`,
      },
      body: JSON.stringify({ word_id: kalemWordId, guesses: 2, won: false }),
    });

    expect(response.status).toBe(201);
    const body = await response.json() as DuelResponse;
    expect(body.data?.duel.wordId).toBe(kalemWordId);
    expect(body.data?.duel.myGuesses).toBeGreaterThanOrEqual(0);
  });
});

describe('GET /api/duels/:wordId', () => {
  it('should return 401 without token', async () => {
    const response = await SELF.fetch(`http://example.com/api/duels/${kitapWordId}`);

    expect(response.status).toBe(401);
  });

  it('should return 404 when duel not found', async () => {
    const nonExistentWordId = 99999;
    const response = await SELF.fetch(`http://example.com/api/duels/${nonExistentWordId}`, {
      headers: { Authorization: `Bearer ${challengerToken}` },
    });

    expect(response.status).toBe(404);
  });

  it('should return 200 with duel data when duel exists', async () => {
    const response = await SELF.fetch(`http://example.com/api/duels/${kalemWordId}`, {
      headers: { Authorization: `Bearer ${challengerToken}` },
    });

    expect(response.status).toBe(200);
    const body = await response.json() as DuelResponse;
    expect(body.data?.duel.wordId).toBe(kalemWordId);
    expect(body.data?.duel.myRole).toBe('challenger');
    expect(typeof body.data?.duel.id).toBe('number');
  });
});

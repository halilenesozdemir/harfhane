import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { processGameXP } from '../../src/services/gamification-service';

let userId: number;

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);
  const user = await createTestUser(env.DB, 'xptest', 'xptest@test.com');
  userId = user.id;
});

describe('processGameXP', () => {
  it('should award base XP on loss', async () => {
    const result = await processGameXP(env.DB, userId, false, 6);
    expect(result.earned).toBe(10);
    expect(result.breakdown.base).toBe(10);
    expect(result.breakdown.guessBonus).toBe(0);
  });

  it('should award base + guess bonus on win', async () => {
    const result = await processGameXP(env.DB, userId, true, 3);
    expect(result.breakdown.base).toBe(50);
    expect(result.breakdown.guessBonus).toBe(50);
    expect(result.earned).toBe(100);
  });

  it('should accumulate XP across games', async () => {
    const first = await processGameXP(env.DB, userId, true, 2);
    const second = await processGameXP(env.DB, userId, true, 6);
    expect(second.total).toBeGreaterThan(first.total);
  });

  it('should return levelUp true when crossing level threshold', async () => {
    const user2 = await createTestUser(env.DB, 'leveluptest', 'levelup@test.com');
    await env.DB.prepare('INSERT INTO user_xp (user_id, total_xp, level) VALUES (?, 240, 1)').bind(user2.id).run();
    const result = await processGameXP(env.DB, user2.id, true, 1);
    expect(result.levelUp).toBe(true);
    expect(result.level).toBeGreaterThan(1);
  });

  it('should award first-step badge on first game', async () => {
    const user3 = await createTestUser(env.DB, 'badgetest', 'badge@test.com');
    await env.DB.prepare(
      `INSERT INTO game_results (user_id, date, word_length, guesses, won) VALUES (?, '2026-01-01', 5, 3, 1)`
    ).bind(user3.id).run();
    const result = await processGameXP(env.DB, user3.id, true, 3);
    const badgeSlugs = result.newBadges.map(b => b.slug);
    expect(badgeSlugs).toContain('first-step');
  });

  it('should award sharpshooter badge on 1-guess win', async () => {
    const user4 = await createTestUser(env.DB, 'sharptest', 'sharp@test.com');
    await env.DB.prepare(
      `INSERT INTO game_results (user_id, date, word_length, guesses, won) VALUES (?, '2026-01-01', 5, 1, 1)`
    ).bind(user4.id).run();
    const result = await processGameXP(env.DB, user4.id, true, 1);
    const badgeSlugs = result.newBadges.map(b => b.slug);
    expect(badgeSlugs).toContain('sharpshooter');
  });

  it('should not award badge twice', async () => {
    const user5 = await createTestUser(env.DB, 'noduptest', 'nodup@test.com');
    await env.DB.prepare(
      `INSERT INTO game_results (user_id, date, word_length, guesses, won) VALUES (?, '2026-01-01', 5, 3, 1)`
    ).bind(user5.id).run();
    const first = await processGameXP(env.DB, user5.id, true, 3);
    await env.DB.prepare(
      `INSERT INTO game_results (user_id, date, word_length, guesses, won) VALUES (?, '2026-01-02', 5, 3, 1)`
    ).bind(user5.id).run();
    const second = await processGameXP(env.DB, user5.id, true, 3);
    expect(first.newBadges.some(b => b.slug === 'first-step')).toBe(true);
    expect(second.newBadges.some(b => b.slug === 'first-step')).toBe(false);
  });

  it('should award freeze token at FREEZE_TOKEN_MILESTONE games', async () => {
    const user6 = await createTestUser(env.DB, 'freezetest', 'freeze@test.com');
    const seedResults = Array.from({ length: 5 }, (_, i) =>
      env.DB.prepare(
        `INSERT INTO game_results (user_id, date, word_length, guesses, won) VALUES (?, ?, 5, 3, 1)`
      ).bind(user6.id, `2026-01-0${i + 1}`).run()
    );
    await Promise.all(seedResults);
    const result = await processGameXP(env.DB, user6.id, true, 3);
    expect(result.freezeTokenEarned).toBe(true);
  });
});

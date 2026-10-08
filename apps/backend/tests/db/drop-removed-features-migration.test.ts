import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema, seedTestData } from '../helpers/db';
import { findDailyWord, findRandomWord, wordExists } from '../../src/repositories/word-repository';

const DROPPED_TABLES = [
  'users',
  'game_results',
  'badges',
  'user_xp',
  'user_badges',
  'push_subscriptions',
  'streak_freezes',
  'password_reset_tokens',
  'duels',
  'word_lists',
  'word_list_words',
  'list_likes',
  'list_comments',
  'tournament_results',
];

const KEPT_TABLES = ['words', 'valid_words', 'daily_words'];

async function tableExists(name: string): Promise<boolean> {
  const row = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .bind(name)
    .first();
  return row !== null;
}

beforeEach(async () => {
  await applySchema(env.DB);
});

describe('0003_drop_removed_features migration', () => {
  it.each(DROPPED_TABLES)('should drop the %s table left over from removed features', async (table) => {
    expect(await tableExists(table)).toBe(false);
  });

  it.each(KEPT_TABLES)('should keep the %s table the live game needs', async (table) => {
    expect(await tableExists(table)).toBe(true);
  });

  it.each(['idx_words_length_active', 'idx_words_status'])(
    'should keep the %s index on the rebuilt words table',
    async (indexName) => {
      const row = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?`)
        .bind(indexName)
        .first();
      expect(row).not.toBeNull();
    }
  );

  it('should keep game data readable after the migration', async () => {
    await seedTestData(env.DB);

    const daily = await findDailyWord(env.DB, '2026-01-01');
    expect(daily?.word).toBe('KİTAP');

    const random = await findRandomWord(env.DB, 5);
    expect(random).not.toBeNull();

    expect(await wordExists(env.DB, 'KALEM')).toBe(true);
  });
});

async function insertWord(overrides: {
  word: string;
  status?: string;
  familySafe?: number;
  isActive?: number;
  pool?: string;
  source?: string;
}): Promise<number> {
  const {
    word,
    status = 'approved',
    familySafe = 1,
    isActive = 1,
    pool = 'daily',
    source = 'test',
  } = overrides;
  const result = await env.DB.prepare(
    `INSERT INTO words (word, length, source, license, status, family_safe, is_active, pool)
     VALUES (?, ?, ?, 'test', ?, ?, ?, ?)`
  )
    .bind(word, word.length, source, status, familySafe, isActive, pool)
    .run();
  return result.meta.last_row_id as number;
}

describe('words CHECK without the source = user escape', () => {
  it('should reject an active, draft word even when source is user', async () => {
    await expect(
      insertWord({ word: 'TASLA', status: 'draft', source: 'user' })
    ).rejects.toThrow();
  });

  it('should reject an active, non-family-safe word even when source is user', async () => {
    await expect(
      insertWord({ word: 'ACIMA', familySafe: 0, source: 'user' })
    ).rejects.toThrow();
  });

  it('should allow an active, approved, family-safe word when source is user', async () => {
    const wordId = await insertWord({ word: 'DOGAN', status: 'approved', familySafe: 1, source: 'user' });
    expect(wordId).toBeGreaterThan(0);
  });
});

describe('daily_words_require_active_word_on_update trigger', () => {
  it('should reject reassigning a scheduled day to an unlimited-pool word', async () => {
    const dailyWordId = await insertWord({ word: 'BEKLE', pool: 'daily' });
    const unlimitedWordId = await insertWord({ word: 'BIRAZ', pool: 'unlimited' });
    const { meta } = await env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
      .bind(dailyWordId, '2026-04-01')
      .run();

    await expect(
      env.DB.prepare('UPDATE daily_words SET word_id = ? WHERE id = ?')
        .bind(unlimitedWordId, meta.last_row_id)
        .run()
    ).rejects.toThrow();
  });

  it('should allow reassigning a scheduled day to another valid daily-pool word', async () => {
    const firstWordId = await insertWord({ word: 'KAPAK', pool: 'daily' });
    const secondWordId = await insertWord({ word: 'KUTUP', pool: 'daily' });
    const { meta } = await env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
      .bind(firstWordId, '2026-04-02')
      .run();

    await expect(
      env.DB.prepare('UPDATE daily_words SET word_id = ? WHERE id = ?')
        .bind(secondWordId, meta.last_row_id)
        .run()
    ).resolves.toBeDefined();
  });
});

describe('words_block_deactivate_scheduled_future trigger', () => {
  it('should reject deactivating a word scheduled as a future daily word', async () => {
    const wordId = await insertWord({ word: 'YARIN', pool: 'daily' });
    await env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
      .bind(wordId, '2999-01-01')
      .run();

    await expect(
      env.DB.prepare('UPDATE words SET is_active = 0 WHERE id = ?').bind(wordId).run()
    ).rejects.toThrow();
  });

  it('should reject deactivating a word scheduled for today, not only strictly future days', async () => {
    // Kills the `date >= date('now')` -> `date > date('now')` mutant: today must
    // still count as "scheduled", not just days strictly after today.
    const wordId = await insertWord({ word: 'BUGUN', pool: 'daily' });
    await env.DB.prepare(`INSERT INTO daily_words (word_id, date, length) VALUES (?, date('now'), 5)`)
      .bind(wordId)
      .run();

    await expect(
      env.DB.prepare('UPDATE words SET is_active = 0 WHERE id = ?').bind(wordId).run()
    ).rejects.toThrow();
  });

  it('should allow deactivating a word with no future schedule', async () => {
    const wordId = await insertWord({ word: 'DUMAN', pool: 'daily' });

    await expect(
      env.DB.prepare('UPDATE words SET is_active = 0 WHERE id = ?').bind(wordId).run()
    ).resolves.toBeDefined();
  });
});

describe('words_block_activate_rejected trigger', () => {
  it('should reject activating a word whose status is rejected', async () => {
    const wordId = await insertWord({ word: 'KOTUS', status: 'rejected', isActive: 0 });

    await expect(
      env.DB.prepare('UPDATE words SET is_active = 1, status = ? WHERE id = ?')
        .bind('approved', wordId)
        .run()
    ).rejects.toThrow();
  });

  it('should allow activating a draft word that was never rejected', async () => {
    const wordId = await insertWord({ word: 'HAZIR', status: 'draft', isActive: 0 });

    await expect(
      env.DB.prepare('UPDATE words SET is_active = 1, status = ? WHERE id = ?')
        .bind('approved', wordId)
        .run()
    ).resolves.toBeDefined();
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema, seedTestData, createTestUser } from '../helpers/db';
import { deleteUser } from '../../src/repositories/user-repository';
import { upsertDuel, recordOpponentResult } from '../../src/repositories/duel-repository';
import { saveResult } from '../../src/repositories/result-repository';
import { upsertSubscription } from '../../src/repositories/push-repository';

let ownerId: number;
let otherId: number;
let ownedListId: number;
let otherListId: number;
let wordId: number;

async function tableHasRow(sql: string, params: unknown[]): Promise<boolean> {
  const row = await env.DB.prepare(sql).bind(...params).first();
  return row !== null;
}

async function createList(
  db: D1Database,
  slug: string,
  name: string,
  ownerUserId: number
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO word_lists (slug, name, word_length, is_public, owner_user_id)
       VALUES (?, ?, 5, 1, ?)
       RETURNING id`
    )
    .bind(slug, name, ownerUserId)
    .first<{ id: number }>();
  return result!.id;
}

async function addWordToList(db: D1Database, listId: number, wordId: number): Promise<void> {
  await db
    .prepare('INSERT OR IGNORE INTO word_list_words (list_id, word_id) VALUES (?, ?)')
    .bind(listId, wordId)
    .run();
}

async function addLike(db: D1Database, userId: number, listId: number): Promise<void> {
  await db.prepare('INSERT INTO list_likes (user_id, list_id) VALUES (?, ?)').bind(userId, listId).run();
}

async function addComment(db: D1Database, userId: number, listId: number, content: string): Promise<void> {
  await db
    .prepare('INSERT INTO list_comments (user_id, list_id, content) VALUES (?, ?, ?)')
    .bind(userId, listId, content)
    .run();
}

beforeAll(async () => {
  await applySchema(env.DB);
  await seedTestData(env.DB);

  const owner = await createTestUser(env.DB, 'deleteme', 'deleteme@test.com');
  const other = await createTestUser(env.DB, 'bystander', 'bystander@test.com');
  ownerId = owner.id;
  otherId = other.id;

  const word = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('KİTAP').first<{ id: number }>();
  wordId = word!.id;

  ownedListId = await createList(env.DB, 'owner-list', 'Owner Liste', ownerId);
  otherListId = await createList(env.DB, 'other-list', 'Other Liste', otherId);
  await addWordToList(env.DB, ownedListId, wordId);

  await addLike(env.DB, otherId, ownedListId);
  await addComment(env.DB, otherId, ownedListId, 'Güzel liste');
  await addComment(env.DB, otherId, otherListId, 'Kendi listem');
  await addLike(env.DB, ownerId, otherListId);

  await upsertDuel(env.DB, wordId, ownerId, 4, true);
  const word2 = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('KALEM').first<{ id: number }>();
  await upsertDuel(env.DB, word2!.id, otherId, 3, true);
  await recordOpponentResult(env.DB, word2!.id, ownerId, 5, false);
  const word3 = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('BEYAZ').first<{ id: number }>();
  await upsertDuel(env.DB, word3!.id, otherId, 2, true);

  await saveResult(env.DB, ownerId, '2026-01-01', 5, 4, true, 'daily');
  await saveResult(env.DB, otherId, '2026-01-01', 5, 5, false, 'daily');

  await upsertSubscription(env.DB, ownerId, { endpoint: 'https://push.example/owner', p256dh: 'p', auth: 'a' });

  await deleteUser(env.DB, ownerId);
});

describe('deleteUser', () => {
  it('should delete the users row', async () => {
    expect(await tableHasRow('SELECT id FROM users WHERE id = ?', [ownerId])).toBe(false);
  });

  it('should delete word lists owned by the user', async () => {
    expect(await tableHasRow('SELECT id FROM word_lists WHERE id = ?', [ownedListId])).toBe(false);
  });

  it('should delete word_list_words rows for the deleted list', async () => {
    expect(
      await tableHasRow('SELECT 1 FROM word_list_words WHERE list_id = ?', [ownedListId])
    ).toBe(false);
  });

  it('should delete likes and comments left by others on the deleted list', async () => {
    expect(await tableHasRow('SELECT 1 FROM list_likes WHERE list_id = ?', [ownedListId])).toBe(false);
    expect(await tableHasRow('SELECT 1 FROM list_comments WHERE list_id = ?', [ownedListId])).toBe(false);
  });

  it('should delete the user own likes and comments made elsewhere', async () => {
    expect(await tableHasRow('SELECT 1 FROM list_likes WHERE user_id = ?', [ownerId])).toBe(false);
    expect(await tableHasRow('SELECT 1 FROM list_comments WHERE user_id = ?', [ownerId])).toBe(false);
  });

  it('should delete duels where the user is challenger or opponent', async () => {
    expect(
      await tableHasRow('SELECT 1 FROM duels WHERE challenger_id = ? OR opponent_id = ?', [ownerId, ownerId])
    ).toBe(false);
  });

  it('should delete game results, push subscriptions for the user', async () => {
    expect(await tableHasRow('SELECT 1 FROM game_results WHERE user_id = ?', [ownerId])).toBe(false);
    expect(await tableHasRow('SELECT 1 FROM push_subscriptions WHERE user_id = ?', [ownerId])).toBe(false);
  });

  it('should not delete the words table', async () => {
    expect(await tableHasRow('SELECT id FROM words WHERE id = ?', [wordId])).toBe(true);
  });

  it('should leave the other user untouched', async () => {
    expect(await tableHasRow('SELECT id FROM users WHERE id = ?', [otherId])).toBe(true);
  });

  it('should keep the other user own list', async () => {
    expect(await tableHasRow('SELECT id FROM word_lists WHERE id = ?', [otherListId])).toBe(true);
  });

  it('should keep the other user own comment on their own list', async () => {
    expect(
      await tableHasRow('SELECT 1 FROM list_comments WHERE list_id = ? AND user_id = ?', [otherListId, otherId])
    ).toBe(true);
  });

  it('should delete the duel row where the deleted user is the opponent', async () => {
    const word2 = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('KALEM').first<{ id: number }>();
    expect(await tableHasRow('SELECT 1 FROM duels WHERE word_id = ?', [word2!.id])).toBe(false);
  });

  it('should keep a duel row that never involved the deleted user', async () => {
    const word3 = await env.DB.prepare('SELECT id FROM words WHERE word = ?').bind('BEYAZ').first<{ id: number }>();
    expect(
      await tableHasRow('SELECT 1 FROM duels WHERE word_id = ? AND challenger_id = ?', [word3!.id, otherId])
    ).toBe(true);
  });

  it('should keep the other user own game result', async () => {
    expect(await tableHasRow('SELECT 1 FROM game_results WHERE user_id = ?', [otherId])).toBe(true);
  });
});

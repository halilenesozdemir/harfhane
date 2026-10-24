import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema, seedTestData } from '../helpers/db';
import {
  insertFeedback,
  listFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  findScheduledWord,
} from '../../src/repositories/feedback-repository';
import type { CreateFeedbackInput } from '../../src/schemas/feedback-schemas';
import type { TurkeyDate, WordLength } from '@harfhane/shared';

const baseInput: CreateFeedbackInput = { kind: 'general', message: 'Harika oyun!', app_platform: 'web' };

beforeEach(async () => {
  await applySchema(env.DB);
});

describe('feedback-repository', () => {
  it('inserts, reads back and lists a feedback row, newest first', async () => {
    const first = await insertFeedback(env.DB, { ...baseInput, message: 'first' });
    expect(first.status).toBe('new');

    const second = await insertFeedback(env.DB, { ...baseInput, message: 'second' });
    expect((await listFeedback(env.DB))[0]?.id).toBe(second.id);
    expect(await getFeedbackById(env.DB, first.id)).toMatchObject({ message: 'first' });
  });

  it('filters by status and reflects an updateFeedbackStatus change', async () => {
    const row = await insertFeedback(env.DB, baseInput);
    await updateFeedbackStatus(env.DB, row.id, 'done');

    expect(await listFeedback(env.DB, 'new')).toHaveLength(0);
    expect((await listFeedback(env.DB, 'done'))[0]?.id).toBe(row.id);
  });

  it('returns null from getFeedbackById/updateFeedbackStatus when the id does not exist', async () => {
    expect(await getFeedbackById(env.DB, 999999)).toBeNull();
    expect(await updateFeedbackStatus(env.DB, 999999, 'done')).toBeNull();
  });

  it('finds the scheduled word for a date and length, or null when none is scheduled', async () => {
    await seedTestData(env.DB);
    expect(await findScheduledWord(env.DB, '2026-01-01' as TurkeyDate, 5 as WordLength)).toBe('KİTAP');
    expect(await findScheduledWord(env.DB, '2099-01-01' as TurkeyDate, 5 as WordLength)).toBeNull();
  });

  it('should have no ip or device-identifier column on the feedback table (013-AE9)', async () => {
    const columns = await env.DB.prepare('PRAGMA table_info(feedback)').all<{ name: string }>();
    const names = columns.results.map((c) => c.name.toLowerCase());
    expect(names.some((n) => n.includes('ip') || n.includes('device'))).toBe(false);
  });
});

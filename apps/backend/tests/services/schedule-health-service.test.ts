import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';
import {
  checkScheduleHealthAndAlert,
  getScheduleHealth,
  severityFor,
  restockStatusFor,
} from '../../src/services/schedule-health-service';
import { SCHEDULE_WARNING_DAYS, SCHEDULE_CRITICAL_DAYS, RESTOCK_WARNING_DAYS } from '../../src/constants/schedule';

beforeAll(async () => {
  await applySchema(env.DB);
});

describe('severityFor', () => {
  it('returns critical at or under the critical threshold', () => {
    expect(severityFor(0)).toBe('critical');
    expect(severityFor(SCHEDULE_CRITICAL_DAYS)).toBe('critical');
  });

  it('returns warning between the critical and warning thresholds', () => {
    expect(severityFor(SCHEDULE_CRITICAL_DAYS + 1)).toBe('warning');
    expect(severityFor(SCHEDULE_WARNING_DAYS)).toBe('warning');
  });

  it('returns ok above the warning threshold', () => {
    expect(severityFor(SCHEDULE_WARNING_DAYS + 1)).toBe('ok');
  });
});

describe('restockStatusFor', () => {
  it('should return restock when runway is below the restock warning threshold', () => {
    expect(restockStatusFor(0)).toBe('restock');
    expect(restockStatusFor(RESTOCK_WARNING_DAYS - 1)).toBe('restock');
  });

  it('should return ok when runway is at or above the restock warning threshold', () => {
    expect(restockStatusFor(RESTOCK_WARNING_DAYS)).toBe('ok');
    expect(restockStatusFor(RESTOCK_WARNING_DAYS + 1)).toBe('ok');
  });
});

describe('getScheduleHealth', () => {
  it('should mark every active length as critical and needing restock when nothing is scheduled', async () => {
    const health = await getScheduleHealth(env.DB);
    expect(health.length).toBeGreaterThan(0);
    for (const entry of health) {
      expect(entry.severity).toBe('critical');
      expect(entry.restockStatus).toBe('restock');
    }
  });
});

describe('checkScheduleHealthAndAlert', () => {
  it('skips silently without throwing when ADMIN_ALERT_EMAIL is not configured', async () => {
    await expect(
      checkScheduleHealthAndAlert(env.DB, 'fake-resend-key', undefined, '5')
    ).resolves.toBeUndefined();
  });
});

describe('getScheduleHealth Turkey day boundary', () => {
  async function seedScheduledDay(): Promise<void> {
    await env.DB.prepare(
      `INSERT INTO words (word, meaning, context, category, length, source, license, status, family_safe, is_active)
       VALUES ('BOYUT', 'ölçü', 'boyutu ölç', 'isim', 5, 'test', 'test', 'approved', 1, 1)`
    ).run();
    const word = await env.DB
      .prepare("SELECT id FROM words WHERE word = 'BOYUT'")
      .first<{ id: number }>();
    await env.DB.prepare(
      'INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)'
    ).bind(word!.id, '2026-06-15').run();
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('measures runway in game days just before the Turkey midnight crossover', async () => {
    await seedScheduledDay();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T20:59:00Z'));

    const health = await getScheduleHealth(env.DB);
    const fiveLetterEntry = health.find((entry) => entry.length === 5);
    expect(fiveLetterEntry?.runwayDays).toBe(0);
  });

  it('counts the newly scheduled day in the runway right at the 21:00 UTC crossover', async () => {
    await seedScheduledDay();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T21:00:00Z'));

    const health = await getScheduleHealth(env.DB);
    const fiveLetterEntry = health.find((entry) => entry.length === 5);
    expect(fiveLetterEntry?.runwayDays).toBe(1);
  });
});

describe('getScheduleHealth restock status', () => {
  const TODAY = '2026-09-01';
  const RESTOCK_WORD_COUNT = 120;
  const SCHEDULED_RUNWAY_DAYS = 200;

  async function insertDailyWord(word: string, length: number): Promise<number> {
    const row = await env.DB.prepare(
      `INSERT INTO words (word, meaning, context, category, length, source, license, status, family_safe, is_active)
       VALUES (?, ?, ?, 'isim', ?, 'test', 'test', 'approved', 1, 1)
       RETURNING id`
    )
      .bind(word, 'test anlamı', 'test bağlamı', length)
      .first<{ id: number }>();
    if (!row) throw new Error('word insert failed');
    return row.id;
  }

  function addDays(date: string, days: number): string {
    const cursor = new Date(`${date}T00:00:00Z`);
    cursor.setUTCDate(cursor.getUTCDate() + days);
    return cursor.toISOString().slice(0, 10);
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should match AE5: 120 eligible 5-letter words give getScheduleHealth a restock runway of 120 (008-AE5)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T10:00:00Z`));

    const fillerWordId = await insertDailyWord('FILLR', 5);
    for (let day = 0; day < SCHEDULED_RUNWAY_DAYS; day++) {
      await env.DB.prepare('INSERT INTO daily_words (word_id, date, length) VALUES (?, ?, 5)')
        .bind(fillerWordId, addDays(TODAY, day))
        .run();
    }

    for (let i = 0; i < RESTOCK_WORD_COUNT; i++) {
      const word = String(20000 + i)
        .padStart(5, '0')
        .replace(/\d/g, (d) => 'ABCDEFGHIJ'[Number(d)]!);
      await insertDailyWord(word, 5);
    }

    const health = await getScheduleHealth(env.DB);
    const fiveLetterEntry = health.find((entry) => entry.length === 5);
    expect(fiveLetterEntry?.runwayDays).toBeGreaterThanOrEqual(180);
    expect(fiveLetterEntry?.restockRunwayDays).toBe(RESTOCK_WORD_COUNT);
    expect(fiveLetterEntry?.restockStatus).toBe('restock');
  });
});

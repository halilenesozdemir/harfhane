import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from '../helpers/db';
import {
  checkScheduleHealthAndAlert,
  getScheduleHealth,
  severityFor,
} from '../../src/services/schedule-health-service';
import { SCHEDULE_WARNING_DAYS, SCHEDULE_CRITICAL_DAYS } from '../../src/constants/schedule';

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

describe('getScheduleHealth', () => {
  it('marks every active length as critical when nothing is scheduled', async () => {
    const health = await getScheduleHealth(env.DB);
    expect(health.length).toBeGreaterThan(0);
    for (const entry of health) {
      expect(entry.severity).toBe('critical');
    }
  });
});

describe('checkScheduleHealthAndAlert', () => {
  it('skips silently without throwing when ADMIN_ALERT_EMAIL is not configured', async () => {
    await expect(
      checkScheduleHealthAndAlert(env.DB, 'fake-resend-key', undefined)
    ).resolves.toBeUndefined();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from './helpers/db';
import { SCHEDULE_TOPUP_DAYS } from '../src/constants/schedule';

const { checkScheduleHealthAndAlertMock } = vi.hoisted(() => ({
  checkScheduleHealthAndAlertMock: vi.fn(),
}));

vi.mock('../src/services/schedule-health-service', () => ({
  checkScheduleHealthAndAlert: checkScheduleHealthAndAlertMock,
}));

const { autoFillDailyScheduleMock } = vi.hoisted(() => ({
  autoFillDailyScheduleMock: vi.fn(),
}));

vi.mock('../src/services/admin-service', () => ({
  autoFillDailySchedule: autoFillDailyScheduleMock,
}));

beforeEach(async () => {
  await applySchema(env.DB);
  checkScheduleHealthAndAlertMock.mockReset();
  autoFillDailyScheduleMock.mockReset();
  autoFillDailyScheduleMock.mockResolvedValue({ scheduled: 0, skipped: 0 });
});

describe('scheduled()', () => {
  it('calls the schedule-health alert once per cron run with the playable-lengths env var', async () => {
    checkScheduleHealthAndAlertMock.mockResolvedValue(undefined);
    const worker = (await import('../src/index')).default;

    await worker.scheduled({} as ScheduledEvent, env as never);

    expect(checkScheduleHealthAndAlertMock).toHaveBeenCalledTimes(1);
    expect(checkScheduleHealthAndAlertMock).toHaveBeenCalledWith(
      env.DB,
      env.RESEND_API_KEY,
      env.ADMIN_ALERT_EMAIL,
      env.PLAYABLE_WORD_LENGTHS
    );
  });

  it('does not let a failing alert check break the cron run', async () => {
    checkScheduleHealthAndAlertMock.mockRejectedValue(new Error('alert boom'));
    const worker = (await import('../src/index')).default;

    await expect(worker.scheduled({} as ScheduledEvent, env as never)).resolves.toBeUndefined();
  });

  it('does not let a missing alert email break the cron run', async () => {
    checkScheduleHealthAndAlertMock.mockResolvedValue(undefined);
    const worker = (await import('../src/index')).default;
    const envWithoutAlertEmail = { ...env, ADMIN_ALERT_EMAIL: undefined };

    await expect(worker.scheduled({} as ScheduledEvent, envWithoutAlertEmail as never)).resolves.toBeUndefined();
    expect(checkScheduleHealthAndAlertMock).toHaveBeenCalledTimes(1);
    expect(checkScheduleHealthAndAlertMock).toHaveBeenCalledWith(
      envWithoutAlertEmail.DB,
      envWithoutAlertEmail.RESEND_API_KEY,
      undefined,
      envWithoutAlertEmail.PLAYABLE_WORD_LENGTHS
    );
  });

  it('should top up the schedule before checking its health (Plan 006 U3a)', async () => {
    checkScheduleHealthAndAlertMock.mockResolvedValue(undefined);
    const worker = (await import('../src/index')).default;

    await worker.scheduled({} as ScheduledEvent, env as never);

    expect(autoFillDailyScheduleMock).toHaveBeenCalledTimes(1);
    expect(autoFillDailyScheduleMock).toHaveBeenCalledWith(env.DB, SCHEDULE_TOPUP_DAYS);
  });

  it('should not let a failing auto-fill break the cron run', async () => {
    autoFillDailyScheduleMock.mockRejectedValue(new Error('autofill boom'));
    checkScheduleHealthAndAlertMock.mockResolvedValue(undefined);
    const worker = (await import('../src/index')).default;

    await expect(worker.scheduled({} as ScheduledEvent, env as never)).resolves.toBeUndefined();
    expect(checkScheduleHealthAndAlertMock).toHaveBeenCalledTimes(1);
    expect(checkScheduleHealthAndAlertMock).toHaveBeenCalledWith(
      env.DB,
      env.RESEND_API_KEY,
      env.ADMIN_ALERT_EMAIL,
      env.PLAYABLE_WORD_LENGTHS
    );
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema } from './helpers/db';

const { checkScheduleHealthAndAlertMock, getSubscriptionsForUsersWithoutTodayPlayMock } = vi.hoisted(() => ({
  checkScheduleHealthAndAlertMock: vi.fn(),
  getSubscriptionsForUsersWithoutTodayPlayMock: vi.fn(),
}));

vi.mock('../src/services/schedule-health-service', () => ({
  checkScheduleHealthAndAlert: checkScheduleHealthAndAlertMock,
}));

vi.mock('../src/repositories/push-repository', () => ({
  getSubscriptionsForUsersWithoutTodayPlay: getSubscriptionsForUsersWithoutTodayPlayMock,
}));

beforeEach(async () => {
  await applySchema(env.DB);
  checkScheduleHealthAndAlertMock.mockReset();
  getSubscriptionsForUsersWithoutTodayPlayMock.mockReset();
  getSubscriptionsForUsersWithoutTodayPlayMock.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('scheduled()', () => {
  it('calls the schedule-health alert once per cron run', async () => {
    checkScheduleHealthAndAlertMock.mockResolvedValue(undefined);
    const worker = (await import('../src/index')).default;

    await worker.scheduled({} as ScheduledEvent, env as never);

    expect(checkScheduleHealthAndAlertMock).toHaveBeenCalledTimes(1);
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
  });

  it('queries the previous UTC day for play status just before the Turkey midnight crossover', async () => {
    checkScheduleHealthAndAlertMock.mockResolvedValue(undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T20:59:00Z'));
    const worker = (await import('../src/index')).default;

    await worker.scheduled({} as ScheduledEvent, env as never);

    expect(getSubscriptionsForUsersWithoutTodayPlayMock).toHaveBeenCalledWith(env.DB, '2026-06-14');
  });

  it('rolls over to the Turkey calendar day right at the 21:00 UTC crossover', async () => {
    checkScheduleHealthAndAlertMock.mockResolvedValue(undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T21:00:00Z'));
    const worker = (await import('../src/index')).default;

    await worker.scheduled({} as ScheduledEvent, env as never);

    expect(getSubscriptionsForUsersWithoutTodayPlayMock).toHaveBeenCalledWith(env.DB, '2026-06-15');
  });
});

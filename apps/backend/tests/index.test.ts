import { describe, it, expect, vi, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import { applySchema, createTestUser } from './helpers/db';

const { checkScheduleHealthAndAlertMock } = vi.hoisted(() => ({
  checkScheduleHealthAndAlertMock: vi.fn(),
}));

vi.mock('../src/services/schedule-health-service', () => ({
  checkScheduleHealthAndAlert: checkScheduleHealthAndAlertMock,
}));

beforeEach(async () => {
  await applySchema(env.DB);
  checkScheduleHealthAndAlertMock.mockReset();
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

  it('does not send reminder emails to users who have not played today', async () => {
    checkScheduleHealthAndAlertMock.mockResolvedValue(undefined);
    await createTestUser(env.DB, 'reminderuser', 'reminder@test.com');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    const worker = (await import('../src/index')).default;

    await worker.scheduled({} as ScheduledEvent, env as never);

    const resendCalls = fetchSpy.mock.calls.filter(([input]) => String(input).includes('api.resend.com'));
    fetchSpy.mockRestore();
    expect(resendCalls).toHaveLength(0);
  });
});

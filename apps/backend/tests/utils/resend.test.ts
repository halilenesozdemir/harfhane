import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { env, fetchMock } from 'cloudflare:test';
import { applySchema } from '../helpers/db';
import { sendScheduleAlertEmail, type ScheduleAlertEntry } from '../../src/utils/resend';
import { checkScheduleHealthAndAlert } from '../../src/services/schedule-health-service';

const RESEND_ORIGIN = 'https://api.resend.com';
const ALERT_RECIPIENT = 'admin@test.com';

const ENTRY: ScheduleAlertEntry = {
  length: 5,
  runwayDays: 2,
  lastScheduledDate: '2026-10-07',
  unscheduledStock: 10,
};

interface ResendBody {
  to: string;
  subject: string;
  html: string;
}

function interceptResend(captured: ResendBody[]): void {
  fetchMock
    .get(RESEND_ORIGIN)
    .intercept({ path: '/emails', method: 'POST' })
    .reply(200, (opts) => {
      captured.push(JSON.parse(String(opts.body)) as ResendBody);
      return { id: 'email-id' };
    });
}

beforeAll(async () => {
  await applySchema(env.DB);
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => {
  fetchMock.assertNoPendingInterceptors();
});

afterAll(() => {
  fetchMock.deactivate();
});

describe('sendScheduleAlertEmail', () => {
  it('should POST the schedule alert to Resend with the entry details', async () => {
    const captured: ResendBody[] = [];
    interceptResend(captured);

    await sendScheduleAlertEmail('fake-resend-key', ALERT_RECIPIENT, [ENTRY]);

    expect(captured).toHaveLength(1);
    expect(captured[0]!.to).toBe(ALERT_RECIPIENT);
    expect(captured[0]!.html).toContain('5 harf');
  });
});

describe('checkScheduleHealthAndAlert through Resend', () => {
  it('should send one alert email when lengths are at risk and an admin email is set', async () => {
    const captured: ResendBody[] = [];
    interceptResend(captured);

    await checkScheduleHealthAndAlert(env.DB, 'fake-resend-key', ALERT_RECIPIENT);

    expect(captured).toHaveLength(1);
    expect(captured[0]!.subject).toContain('Takvim');
  });
});

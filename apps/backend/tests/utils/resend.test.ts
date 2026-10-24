import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendScheduleAlertEmail, type ScheduleAlertEntry } from '../../src/utils/resend';

const ENTRIES: ScheduleAlertEntry[] = [
  {
    length: 5,
    runwayDays: 10,
    lastScheduledDate: '2026-06-01',
    unscheduledStock: 50,
    restockRunwayDays: 50,
    restockStatus: 'restock',
  },
];

describe('sendScheduleAlertEmail', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should resolve when Resend responds ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );

    await expect(sendScheduleAlertEmail('fake-key', 'admin@harfhane.app', ENTRIES)).resolves.toBeUndefined();
  });

  it('should throw when Resend responds with a non-OK status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('unauthorized', { status: 401, statusText: 'Unauthorized' }))
    );

    await expect(sendScheduleAlertEmail('bad-key', 'admin@harfhane.app', ENTRIES)).rejects.toThrow(
      /Resend API error: 401/
    );
  });
});

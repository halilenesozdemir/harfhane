import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ScheduleHealthRow } from '../../src/repositories/schedule-health-repository';

const { findScheduleRunwayMock } = vi.hoisted(() => ({
  findScheduleRunwayMock: vi.fn<() => Promise<ScheduleHealthRow[]>>(),
}));

vi.mock('../../src/repositories/schedule-health-repository', () => ({
  findScheduleRunway: findScheduleRunwayMock,
}));

const { sendScheduleAlertEmailMock } = vi.hoisted(() => ({
  sendScheduleAlertEmailMock: vi.fn(),
}));

vi.mock('../../src/utils/resend', () => ({
  sendScheduleAlertEmail: sendScheduleAlertEmailMock,
}));

const { checkScheduleHealthAndAlert } = await import('../../src/services/schedule-health-service');

const HEALTHY_ROW = {
  runwayDays: 30,
  lastScheduledDate: '2026-02-01',
  unscheduledStock: 50,
  restockRunwayDays: 200,
};

const EMPTY_ROW = {
  runwayDays: 0,
  lastScheduledDate: null,
  unscheduledStock: 0,
  restockRunwayDays: 0,
};

const CRITICAL_ROW = {
  runwayDays: 2,
  lastScheduledDate: '2026-01-05',
  unscheduledStock: 1,
  restockRunwayDays: 200,
};

// Schedule runway is healthy (ok), but the restock stock alone is below RESTOCK_WARNING_DAYS (180).
const RESTOCK_ONLY_AT_RISK_ROW = {
  runwayDays: 30,
  lastScheduledDate: '2026-02-01',
  unscheduledStock: 50,
  restockRunwayDays: 50,
};

// Severity is 'warning' (between SCHEDULE_CRITICAL_DAYS=3 and SCHEDULE_WARNING_DAYS=14), not critical,
// and restock stock is healthy.
const WARNING_ONLY_ROW = {
  runwayDays: 10,
  lastScheduledDate: '2026-01-20',
  unscheduledStock: 10,
  restockRunwayDays: 200,
};

beforeEach(() => {
  findScheduleRunwayMock.mockReset();
  sendScheduleAlertEmailMock.mockReset();
});

describe('checkScheduleHealthAndAlert playable-length filtering', () => {
  it('should not send an email when only the playable length is healthy and the unplayable lengths are empty', async () => {
    findScheduleRunwayMock.mockResolvedValue([
      { length: 4, ...EMPTY_ROW },
      { length: 5, ...HEALTHY_ROW },
      { length: 6, ...EMPTY_ROW },
    ]);

    await checkScheduleHealthAndAlert({} as never, 'fake-resend-key', 'owner@example.com', '5');

    expect(sendScheduleAlertEmailMock).not.toHaveBeenCalled();
  });

  it('should send an email with only the playable length when the playable length is at risk', async () => {
    findScheduleRunwayMock.mockResolvedValue([
      { length: 4, ...EMPTY_ROW },
      { length: 5, ...CRITICAL_ROW },
      { length: 6, ...EMPTY_ROW },
    ]);

    await checkScheduleHealthAndAlert({} as never, 'fake-resend-key', 'owner@example.com', '5');

    expect(sendScheduleAlertEmailMock).toHaveBeenCalledTimes(1);
    const [, , entries] = sendScheduleAlertEmailMock.mock.calls[0]!;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ length: 5 });
  });

  it('should fall back to the default playable length when PLAYABLE_WORD_LENGTHS is unparseable', async () => {
    findScheduleRunwayMock.mockResolvedValue([
      { length: 4, ...CRITICAL_ROW },
      { length: 5, ...HEALTHY_ROW },
      { length: 6, ...CRITICAL_ROW },
    ]);

    await checkScheduleHealthAndAlert({} as never, 'fake-resend-key', 'owner@example.com', 'garbage');

    expect(sendScheduleAlertEmailMock).not.toHaveBeenCalled();
  });

  it('should fall back to the default playable length when PLAYABLE_WORD_LENGTHS is empty', async () => {
    findScheduleRunwayMock.mockResolvedValue([
      { length: 4, ...CRITICAL_ROW },
      { length: 5, ...HEALTHY_ROW },
      { length: 6, ...CRITICAL_ROW },
    ]);

    await checkScheduleHealthAndAlert({} as never, 'fake-resend-key', 'owner@example.com', undefined);

    expect(sendScheduleAlertEmailMock).not.toHaveBeenCalled();
  });

  it('should send an email with only the at-risk playable length when multiple lengths are playable', async () => {
    findScheduleRunwayMock.mockResolvedValue([
      { length: 4, ...EMPTY_ROW },
      { length: 5, ...HEALTHY_ROW },
      { length: 6, ...CRITICAL_ROW },
    ]);

    await checkScheduleHealthAndAlert({} as never, 'fake-resend-key', 'owner@example.com', '5,6');

    expect(sendScheduleAlertEmailMock).toHaveBeenCalledTimes(1);
    const [, , entries] = sendScheduleAlertEmailMock.mock.calls[0]!;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ length: 6 });
  });

  it('should send an email when a playable length is healthy on schedule runway but needs restock (006-AE5)', async () => {
    findScheduleRunwayMock.mockResolvedValue([{ length: 5, ...RESTOCK_ONLY_AT_RISK_ROW }]);

    await checkScheduleHealthAndAlert({} as never, 'fake-resend-key', 'owner@example.com', '5');

    expect(sendScheduleAlertEmailMock).toHaveBeenCalledTimes(1);
    const [, , entries] = sendScheduleAlertEmailMock.mock.calls[0]!;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ length: 5 });
  });

  it('should send an email when a playable length is only at warning severity, not critical (006-AE3)', async () => {
    findScheduleRunwayMock.mockResolvedValue([{ length: 5, ...WARNING_ONLY_ROW }]);

    await checkScheduleHealthAndAlert({} as never, 'fake-resend-key', 'owner@example.com', '5');

    expect(sendScheduleAlertEmailMock).toHaveBeenCalledTimes(1);
    const [, , entries] = sendScheduleAlertEmailMock.mock.calls[0]!;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ length: 5 });
  });
});

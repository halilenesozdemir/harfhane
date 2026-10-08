import { describe, it, expect, vi, afterEach } from 'vitest';

const {
  adminFindDailyScheduleMock,
  adminGetStatsMock,
  adminAutoFillScheduleMock,
  adminFindWordByIdMock,
  adminWordScheduledOnOrAfterMock,
  adminSetWordActiveMock,
} = vi.hoisted(() => ({
  adminFindDailyScheduleMock: vi.fn().mockResolvedValue([]),
  adminGetStatsMock: vi.fn().mockResolvedValue({}),
  adminAutoFillScheduleMock: vi.fn().mockResolvedValue({ scheduled: 0, skipped: 0 }),
  adminFindWordByIdMock: vi.fn(),
  adminWordScheduledOnOrAfterMock: vi.fn(),
  adminSetWordActiveMock: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../src/repositories/admin-repository', () => ({
  adminFindDailySchedule: adminFindDailyScheduleMock,
  adminGetStats: adminGetStatsMock,
  adminAutoFillSchedule: adminAutoFillScheduleMock,
  adminFindWordById: adminFindWordByIdMock,
  adminWordScheduledOnOrAfter: adminWordScheduledOnOrAfterMock,
  adminSetWordActive: adminSetWordActiveMock,
}));

afterEach(() => {
  vi.useRealTimers();
  adminFindDailyScheduleMock.mockClear();
  adminGetStatsMock.mockClear();
  adminAutoFillScheduleMock.mockClear();
  adminFindWordByIdMock.mockClear();
  adminWordScheduledOnOrAfterMock.mockClear();
  adminSetWordActiveMock.mockClear();
});

describe('getDailySchedule Turkey day boundary', () => {
  it('defaults the schedule window start to the Turkey calendar day just before the crossover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T20:59:00Z'));
    const { getDailySchedule } = await import('../../src/services/admin-service');

    await getDailySchedule({} as never);

    expect(adminFindDailyScheduleMock).toHaveBeenCalledWith({}, '2026-06-14', '2026-07-14');
  });

  it('rolls the schedule window start to the next Turkey calendar day at the 21:00 UTC crossover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T21:00:00Z'));
    const { getDailySchedule } = await import('../../src/services/admin-service');

    await getDailySchedule({} as never);

    expect(adminFindDailyScheduleMock).toHaveBeenCalledWith({}, '2026-06-15', '2026-07-15');
  });
});

describe('getStats Turkey day boundary', () => {
  it('passes the Turkey calendar day just before the crossover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T20:59:00Z'));
    const { getStats } = await import('../../src/services/admin-service');

    await getStats({} as never);

    expect(adminGetStatsMock).toHaveBeenCalledWith({}, '2026-06-14');
  });

  it('rolls over to the next Turkey calendar day at the 21:00 UTC crossover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T21:00:00Z'));
    const { getStats } = await import('../../src/services/admin-service');

    await getStats({} as never);

    expect(adminGetStatsMock).toHaveBeenCalledWith({}, '2026-06-15');
  });
});

describe('autoFillDailySchedule Turkey day boundary', () => {
  it('starts the autofill window on the Turkey calendar day just before the crossover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T20:59:00Z'));
    const { autoFillDailySchedule } = await import('../../src/services/admin-service');

    await autoFillDailySchedule({} as never, 7);

    expect(adminAutoFillScheduleMock).toHaveBeenCalledWith({}, '2026-06-14', '2026-06-21');
  });

  it('rolls the autofill window start to the next Turkey calendar day at the 21:00 UTC crossover', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T21:00:00Z'));
    const { autoFillDailySchedule } = await import('../../src/services/admin-service');

    await autoFillDailySchedule({} as never, 7);

    expect(adminAutoFillScheduleMock).toHaveBeenCalledWith({}, '2026-06-15', '2026-06-22');
  });
});

describe('toggleWordActive Turkey day boundary', () => {
  it('should check the future schedule against the Turkey calendar day, not the UTC day, when deactivating', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T22:30:00Z'));
    adminFindWordByIdMock.mockResolvedValue({ id: 1, status: 'approved' });
    adminWordScheduledOnOrAfterMock.mockResolvedValue(false);
    const { toggleWordActive } = await import('../../src/services/admin-service');

    await toggleWordActive({} as never, 1, false);

    expect(adminWordScheduledOnOrAfterMock).toHaveBeenCalledWith({}, 1, '2026-10-09');
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Dashboard from './Dashboard';
import * as adminApi from '../../lib/admin-api';
import type { AdminStats, ScheduleHealthEntry } from '../../lib/admin-api';

vi.mock('../../lib/admin-api');

const STATS: AdminStats = {
  words: { total: 100, active: 90, inactive: 10 },
  daily: { today: '2026-10-05', scheduledNext30: 30, unscheduledNext30: 0 },
};

const HEALTH: ScheduleHealthEntry[] = [
  { length: 5, runwayDays: 90, lastScheduledDate: '2026-12-01', unscheduledStock: 10, severity: 'ok' },
];

describe('Dashboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show a loading message before the stats resolve', () => {
    vi.spyOn(adminApi, 'getAdminStats').mockReturnValue(new Promise(() => {}));
    vi.spyOn(adminApi, 'getScheduleHealth').mockReturnValue(new Promise(() => {}));
    render(<Dashboard secret="s" />);
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  it('should show the stats after they resolve', async () => {
    vi.spyOn(adminApi, 'getAdminStats').mockResolvedValue(STATS);
    vi.spyOn(adminApi, 'getScheduleHealth').mockResolvedValue(HEALTH);
    render(<Dashboard secret="s" />);
    await waitFor(() => expect(screen.getByText('Toplam Kelime')).toBeInTheDocument());
  });

  it('should show an error message when the request fails', async () => {
    vi.spyOn(adminApi, 'getAdminStats').mockRejectedValue(new Error('Sunucu hatası'));
    vi.spyOn(adminApi, 'getScheduleHealth').mockResolvedValue(HEALTH);
    render(<Dashboard secret="s" />);
    await waitFor(() => expect(screen.getByText('Sunucu hatası')).toBeInTheDocument());
  });

  it('should refetch when the secret changes', async () => {
    const getAdminStats = vi.spyOn(adminApi, 'getAdminStats').mockResolvedValue(STATS);
    vi.spyOn(adminApi, 'getScheduleHealth').mockResolvedValue(HEALTH);
    const { rerender } = render(<Dashboard secret="a" />);
    await waitFor(() => expect(getAdminStats).toHaveBeenCalledWith('a'));

    rerender(<Dashboard secret="b" />);

    await waitFor(() => expect(getAdminStats).toHaveBeenCalledWith('b'));
  });
});

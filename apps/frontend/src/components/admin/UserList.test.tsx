import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import UserList from './UserList';
import * as adminApi from '../../lib/admin-api';
import type { AdminUserRow } from '../../lib/admin-api';

vi.mock('../../lib/admin-api');

const USERS: AdminUserRow[] = [
  { id: 1, username: 'ayse', email: 'ayse@example.com', created_at: '2026-01-01', total_played: 5, total_won: 3, last_played: '2026-01-02' },
];

describe('UserList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show a loading message before the users resolve', () => {
    vi.spyOn(adminApi, 'getAdminUsers').mockReturnValue(new Promise(() => {}));
    render(<UserList secret="s" />);
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  it('should show the users after they resolve', async () => {
    vi.spyOn(adminApi, 'getAdminUsers').mockResolvedValue(USERS);
    render(<UserList secret="s" />);
    await waitFor(() => expect(screen.getByText('ayse')).toBeInTheDocument());
  });

  it('should show an error message when the request fails', async () => {
    vi.spyOn(adminApi, 'getAdminUsers').mockRejectedValue(new Error('network'));
    render(<UserList secret="s" />);
    await waitFor(() => expect(screen.getByText('Kullanıcılar yüklenemedi.')).toBeInTheDocument());
  });

  it('should refetch when the secret changes', async () => {
    const getAdminUsers = vi.spyOn(adminApi, 'getAdminUsers').mockResolvedValue(USERS);
    const { rerender } = render(<UserList secret="a" />);
    await waitFor(() => expect(getAdminUsers).toHaveBeenCalledWith('a'));

    rerender(<UserList secret="b" />);

    await waitFor(() => expect(getAdminUsers).toHaveBeenCalledWith('b'));
  });
});

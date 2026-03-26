import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { fetchUnlimitedStats } from '../lib/api';
import type { UnlimitedPersonalStats } from '../types';

export function useUnlimitedStats() {
  const { token } = useAuth();
  return useQuery<{ stats: UnlimitedPersonalStats }>({
    queryKey: ['unlimited-stats'],
    queryFn: () => fetchUnlimitedStats(token!),
    enabled: !!token,
    staleTime: 1000 * 60,
  });
}

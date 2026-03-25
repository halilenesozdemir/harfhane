import { useQuery } from '@tanstack/react-query';
import { getXPProfile } from '../lib/auth-api';
import type { XPProfile } from '../types';

export function useXP(token: string | null) {
  return useQuery<XPProfile>({
    queryKey: ['xp', 'profile', token],
    queryFn: () => getXPProfile(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

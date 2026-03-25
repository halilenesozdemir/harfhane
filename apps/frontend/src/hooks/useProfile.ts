import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfileData, applyStreakFreeze } from '../lib/auth-api';

export function useProfile(token: string | null) {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => getProfileData(token!),
    enabled: !!token,
    staleTime: 1000 * 30,
  });
}

export function useStreakFreeze(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => applyStreakFreeze(token!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
}

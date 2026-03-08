import { useQuery } from '@tanstack/react-query';
import { fetchDailyWord, fetchRandomWord } from '../lib/api';

export function useDailyWord(length: number = 5) {
  return useQuery({
    queryKey: ['word', 'daily', length],
    queryFn: () => fetchDailyWord(length),
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useRandomWord(enabled: boolean, length: number = 5) {
  return useQuery({
    queryKey: ['word', 'random', length],
    queryFn: () => fetchRandomWord(length),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

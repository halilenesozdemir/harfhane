import { useQuery } from '@tanstack/react-query';
import { fetchDailyWord, fetchRandomWord } from '../lib/api';

export function useDailyWord() {
  return useQuery({
    queryKey: ['word', 'daily'],
    queryFn: fetchDailyWord,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
}

export function useRandomWord(enabled: boolean) {
  return useQuery({
    queryKey: ['word', 'random'],
    queryFn: fetchRandomWord,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

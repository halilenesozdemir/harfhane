import { useQuery } from '@tanstack/react-query';
import { fetchDailyWord, fetchRandomWord, fetchRandomWordFromList, fetchListInfo, fetchPublicLists, fetchDailyWordFromList } from '../lib/api';
import type { WordListInfo } from '../lib/api';

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

export function useListInfo(slug: string | null) {
  return useQuery({
    queryKey: ['list', 'info', slug],
    queryFn: () => fetchListInfo(slug!),
    enabled: slug !== null,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useSlugWord(slug: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['word', 'slug', slug],
    queryFn: () => fetchRandomWordFromList(slug!),
    enabled: enabled && slug !== null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useSlugDailyWord(slug: string | null, date: string, enabled: boolean) {
  return useQuery({
    queryKey: ['word', 'slug-daily', slug, date],
    queryFn: () => fetchDailyWordFromList(slug!, date),
    enabled: enabled && slug !== null,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function usePublicLists() {
  return useQuery({
    queryKey: ['lists', 'public'],
    queryFn: fetchPublicLists,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export type { WordListInfo };

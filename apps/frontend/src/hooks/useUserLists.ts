import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateListInput, AddWordsInput, UpdateListInput } from '@harfhane/shared';
import { fetchMyLists, createList, updateList, deleteList, addWordsToList } from '../lib/api';

export function useMyLists(token: string | null) {
  return useQuery({
    queryKey: ['lists', 'mine'],
    queryFn: () => fetchMyLists(token!),
    enabled: token !== null,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useCreateList(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateListInput) => createList(token!, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lists', 'mine'] });
      void qc.invalidateQueries({ queryKey: ['lists', 'public'] });
    },
  });
}

export function useUpdateList(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, patch }: { slug: string; patch: UpdateListInput }) =>
      updateList(token!, slug, patch),
    onSuccess: (_data, { slug }) => {
      void qc.invalidateQueries({ queryKey: ['lists', 'mine'] });
      void qc.invalidateQueries({ queryKey: ['list', 'info', slug] });
    },
  });
}

export function useDeleteList(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteList(token!, slug),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lists', 'mine'] });
      void qc.invalidateQueries({ queryKey: ['lists', 'public'] });
    },
  });
}

export function useAddWords(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: AddWordsInput }) =>
      addWordsToList(token!, slug, input),
    onSuccess: (_data, { slug }) => {
      void qc.invalidateQueries({ queryKey: ['list', 'info', slug] });
      void qc.invalidateQueries({ queryKey: ['lists', 'mine'] });
    },
  });
}

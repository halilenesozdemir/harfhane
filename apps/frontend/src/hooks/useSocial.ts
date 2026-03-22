import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchListLikes, toggleLike, fetchListComments, addComment, deleteComment } from '../lib/api';

export function useListLikes(slug: string, token?: string) {
  return useQuery({
    queryKey: ['likes', slug, !!token],
    queryFn: () => fetchListLikes(slug, token),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useToggleLike(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => toggleLike(token!, slug),
    onSuccess: (_data, slug) => {
      void qc.invalidateQueries({ queryKey: ['likes', slug] });
    },
  });
}

export function useListComments(slug: string) {
  return useQuery({
    queryKey: ['comments', slug],
    queryFn: () => fetchListComments(slug),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useAddComment(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, content }: { slug: string; content: string }) =>
      addComment(token!, slug, content),
    onSuccess: (_data, { slug }) => {
      void qc.invalidateQueries({ queryKey: ['comments', slug] });
    },
  });
}

export function useDeleteComment(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, commentId }: { slug: string; commentId: number }) =>
      deleteComment(token!, slug, commentId),
    onSuccess: (_data, { slug }) => {
      void qc.invalidateQueries({ queryKey: ['comments', slug] });
    },
  });
}

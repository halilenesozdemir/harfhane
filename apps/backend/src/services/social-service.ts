import type { ListLikeResponse, ListComment, ListCommentsResponse, AddCommentResponse } from '@nurdle/shared';
import type { Env } from '../types/env';
import { NOT_FOUND, FORBIDDEN } from '../errors/api-error';
import {
  toggleLike,
  getLikeCount,
  getComments,
  addComment,
  findCommentById,
  deleteComment,
  getUserLikeStatus,
} from '../repositories/social-repository';
import { findListBySlug } from '../repositories/list-repository';
import { isDailyDiscussionSlug, upsertDiscussionList } from '../repositories/discussion-repository';

async function requireList(db: Env['DB'], slug: string): Promise<number> {
  if (isDailyDiscussionSlug(slug)) return upsertDiscussionList(db, slug);
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  return row.id;
}

function toComment(row: { id: number; content: string; username: string; created_at: string }): ListComment {
  return {
    id: row.id,
    content: row.content,
    username: row.username,
    createdAt: row.created_at,
  };
}

export async function toggleListLike(
  db: Env['DB'],
  userId: number,
  slug: string
): Promise<ListLikeResponse> {
  const listId = await requireList(db, slug);
  return toggleLike(db, userId, listId);
}

export async function getListLikes(
  db: Env['DB'],
  slug: string,
  userId?: number
): Promise<{ count: number; liked: boolean }> {
  const listId = await requireList(db, slug);
  const count = await getLikeCount(db, listId);
  const liked = userId != null ? await getUserLikeStatus(db, userId, listId) : false;
  return { count, liked };
}

export async function getListComments(
  db: Env['DB'],
  slug: string
): Promise<ListCommentsResponse> {
  const listId = await requireList(db, slug);
  const rows = await getComments(db, listId);
  return { comments: rows.map(toComment) };
}

export async function addListComment(
  db: Env['DB'],
  userId: number,
  slug: string,
  content: string
): Promise<AddCommentResponse> {
  const listId = await requireList(db, slug);
  const row = await addComment(db, userId, listId, content);
  return { comment: toComment(row) };
}

export async function deleteListComment(
  db: Env['DB'],
  userId: number,
  commentId: number
): Promise<void> {
  const comment = await findCommentById(db, commentId);
  if (!comment) throw NOT_FOUND('Comment');
  if (comment.user_id !== userId) throw FORBIDDEN();
  await deleteComment(db, commentId);
}

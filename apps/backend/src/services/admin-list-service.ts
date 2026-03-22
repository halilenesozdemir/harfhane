import type { WordList } from '@nurdle/shared';
import type { Env } from '../types/env';
import { ApiError, NOT_FOUND } from '../errors/api-error';
import {
  findAllLists,
  findListBySlug,
  findListWords,
  createList,
  updateList,
  addWordToList,
  removeWordFromList,
  deleteList,
  slugExists,
} from '../repositories/list-repository';

function toWordList(row: {
  id: number; slug: string; name: string; description: string | null;
  word_length: number; is_public: number; has_daily?: number; owner_user_id?: number | null;
  created_at: string; word_count?: number;
}): WordList {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    wordLength: row.word_length,
    isPublic: row.is_public === 1,
    hasDaily: (row.has_daily ?? 0) === 1,
    ownerUserId: row.owner_user_id ?? null,
    createdAt: row.created_at,
    wordCount: row.word_count ?? 0,
  };
}

export async function adminListAll(db: Env['DB']) {
  const rows = await findAllLists(db);
  return { lists: rows.map(toWordList) };
}

export async function adminCreateList(
  db: Env['DB'],
  slug: string,
  name: string,
  description: string | undefined,
  wordLength: number,
  isPublic: boolean
) {
  if (await slugExists(db, slug)) {
    throw new ApiError(409, 'CONFLICT', `Slug '${slug}' is already taken`);
  }
  await createList(db, slug, name, description ?? null, wordLength, isPublic);
  const row = await findListBySlug(db, slug);
  return toWordList(row!);
}

export async function adminUpdateList(
  db: Env['DB'],
  slug: string,
  patch: { name?: string; description?: string | null; is_public?: boolean }
) {
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  await updateList(db, row.id, {
    name: patch.name,
    description: patch.description,
    isPublic: patch.is_public,
  });
  const updated = await findListBySlug(db, slug);
  return toWordList(updated!);
}

export async function adminDeleteList(db: Env['DB'], slug: string) {
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  await deleteList(db, row.id);
}

export async function adminGetListWords(db: Env['DB'], slug: string) {
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  const words = await findListWords(db, row.id);
  return { words };
}

export async function adminAddWord(db: Env['DB'], slug: string, wordId: number) {
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  await addWordToList(db, row.id, wordId);
}

export async function adminRemoveWord(db: Env['DB'], slug: string, wordId: number) {
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  await removeWordFromList(db, row.id, wordId);
}

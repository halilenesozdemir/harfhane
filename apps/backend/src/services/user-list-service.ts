import type { WordList, WordListResponse, WordListsResponse, AddWordsResult, UpdateListInput } from '@nurdle/shared';
import type { Env } from '../types/env';
import { NOT_FOUND, FORBIDDEN, CONFLICT } from '../errors/api-error';
import { normalizeWord } from '../utils/normalize';
import { slugify } from '../utils/slugify';
import {
  findListBySlug,
  findListsByOwner,
  createList,
  updateList,
  deleteList,
  addWordToList,
  slugExists,
  findOrCreateWord,
  type ListRow,
} from '../repositories/list-repository';

function toWordList(row: ListRow): WordList {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    wordLength: row.word_length,
    isPublic: row.is_public === 1,
    hasDaily: row.has_daily === 1,
    ownerUserId: row.owner_user_id ?? null,
    createdAt: row.created_at,
    wordCount: row.word_count ?? 0,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
  };
}

async function resolveSlug(db: Env['DB'], base: string, userId: number): Promise<string> {
  const attempt = (suffix: string) => `${base}${suffix}`;

  if (!(await slugExists(db, attempt('')))) return attempt('');

  // Try with user id suffix
  const withUser = attempt(`-${userId}`);
  if (!(await slugExists(db, withUser))) return withUser;

  // Try with random hex
  const hex = Math.random().toString(16).slice(2, 6);
  const withHex = attempt(`-${hex}`);
  if (!(await slugExists(db, withHex))) return withHex;

  throw CONFLICT('Bu liste kodu zaten kullanımda. Farklı bir isim veya slug deneyin.');
}

export async function createUserList(
  db: Env['DB'],
  userId: number,
  input: {
    name: string;
    description?: string;
    wordLength: number;
    isPublic: boolean;
    slug?: string;
    hasDaily?: boolean;
  }
): Promise<WordListResponse> {
  let slug: string;

  if (input.slug) {
    if (await slugExists(db, input.slug)) {
      throw CONFLICT('Bu liste kodu zaten kullanımda.');
    }
    slug = input.slug;
  } else {
    const base = slugify(input.name) || `liste-${userId}`;
    slug = await resolveSlug(db, base, userId);
  }

  await createList(db, slug, input.name, input.description ?? null, input.wordLength, input.isPublic, userId, input.hasDaily ?? false);

  const row = await findListBySlug(db, slug);
  return { list: toWordList(row!) };
}

export async function getUserLists(
  db: Env['DB'],
  userId: number
): Promise<WordListsResponse> {
  const rows = await findListsByOwner(db, userId);
  return { lists: rows.map(toWordList) };
}

export async function updateUserList(
  db: Env['DB'],
  userId: number,
  slug: string,
  patch: UpdateListInput
): Promise<WordListResponse> {
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  if (row.owner_user_id !== userId) throw FORBIDDEN();

  await updateList(db, row.id, patch);

  const updated = await findListBySlug(db, slug);
  return { list: toWordList(updated!) };
}

export async function deleteUserList(
  db: Env['DB'],
  userId: number,
  slug: string
): Promise<void> {
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  if (row.owner_user_id !== userId) throw FORBIDDEN();
  await deleteList(db, row.id);
}

export async function addWordsToUserList(
  db: Env['DB'],
  userId: number,
  slug: string,
  words: Array<{ word: string; meaning?: string }>
): Promise<AddWordsResult> {
  const row = await findListBySlug(db, slug);
  if (!row) throw NOT_FOUND('Word list');
  if (row.owner_user_id !== userId) throw FORBIDDEN();

  const result: AddWordsResult = { added: 0, skipped: 0, errors: [] };

  for (const entry of words) {
    const normalized = normalizeWord(entry.word);

    if (normalized.length !== row.word_length) {
      result.errors.push(`"${entry.word}": ${row.word_length} harfli olmalı (${normalized.length} harf)`);
      result.skipped++;
      continue;
    }

    try {
      const wordId = await findOrCreateWord(db, normalized, entry.meaning ?? null, row.word_length);
      await addWordToList(db, row.id, wordId);
      result.added++;
    } catch {
      result.errors.push(`"${entry.word}": eklenemedi`);
      result.skipped++;
    }
  }

  return result;
}

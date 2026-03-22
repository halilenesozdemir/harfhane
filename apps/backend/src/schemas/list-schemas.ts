import { z } from 'zod';

export const createUserListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  wordLength: z.number().int().min(4).max(6).default(5),
  isPublic: z.boolean().default(false),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir').min(2).max(50).optional(),
  hasDaily: z.boolean().default(false),
});

export const updateUserListSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
  hasDaily: z.boolean().optional(),
});

export const addWordsToListSchema = z.object({
  words: z.array(
    z.object({
      word: z.string().min(1).max(15),
      meaning: z.string().max(500).optional(),
    })
  ).min(1).max(200),
});

export const addCommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

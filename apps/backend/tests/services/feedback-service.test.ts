import { describe, it, expect, vi, afterEach } from 'vitest';
import type { TurkeyDate } from '@harfhane/shared';
import type { FeedbackRow } from '../../src/repositories/feedback-repository';
import type { Env } from '../../src/types/env';
import type { CreateFeedbackInput } from '../../src/schemas/feedback-schemas';

const { insertFeedbackMock, findScheduledWordMock, sendFeedbackEmailMock } = vi.hoisted(() => ({
  insertFeedbackMock: vi.fn(),
  findScheduledWordMock: vi.fn(),
  sendFeedbackEmailMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../src/repositories/feedback-repository', () => ({
  insertFeedback: insertFeedbackMock,
  listFeedback: vi.fn(),
  updateFeedbackStatus: vi.fn(),
  getFeedbackById: vi.fn(),
  findScheduledWord: findScheduledWordMock,
}));

vi.mock('../../src/utils/feedback-email', () => ({
  sendFeedbackEmail: sendFeedbackEmailMock,
}));

const baseEnv = { FEEDBACK_EMAIL: 'owner@example.com', RESEND_API_KEY: 'test-key' } as unknown as Env;

function makeRow(overrides: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: 1,
    created_at: '2026-10-24T00:00:00.000Z',
    kind: 'general',
    message: 'msg',
    contact: null,
    app_platform: 'android',
    app_version: null,
    mode: null,
    word_length: null,
    puzzle_date: null,
    reported_word: null,
    status: 'new',
    ...overrides,
  };
}

function wordReportInput(overrides: Partial<CreateFeedbackInput> = {}): CreateFeedbackInput {
  return {
    kind: 'word_report',
    message: 'x',
    app_platform: 'android',
    mode: 'daily',
    word_length: 5,
    puzzle_date: '2026-10-24' as TurkeyDate,
    reported_word: 'KALEM',
    ...overrides,
  } as CreateFeedbackInput;
}

afterEach(() => {
  vi.useRealTimers();
  insertFeedbackMock.mockReset();
  findScheduledWordMock.mockReset();
  sendFeedbackEmailMock.mockClear();
});

describe('submitFeedback', () => {
  it('stores the row and emails once for a valid general feedback body (013-AE1)', async () => {
    insertFeedbackMock.mockResolvedValue(makeRow());
    const { submitFeedback } = await import('../../src/services/feedback-service');

    const result = await submitFeedback({} as never, baseEnv, {
      kind: 'general',
      message: 'Harika oyun!',
      app_platform: 'web',
    } as CreateFeedbackInput);

    expect(result.emailSent).toBe(true);
    expect(sendFeedbackEmailMock).toHaveBeenCalledTimes(1);
  });

  it('still returns the stored row when sendFeedbackEmail rejects (013-AE2)', async () => {
    insertFeedbackMock.mockResolvedValue(makeRow());
    sendFeedbackEmailMock.mockRejectedValueOnce(new Error('resend down'));
    const { submitFeedback } = await import('../../src/services/feedback-service');

    const result = await submitFeedback({} as never, baseEnv, {
      kind: 'general',
      message: 'x',
      app_platform: 'web',
    } as CreateFeedbackInput);

    expect(result.emailSent).toBe(false);
    expect(result.feedback.id).toBe(1);
  });

  describe('word_report date handling', () => {
    it('should return an identical response shape for today whether the reported word is right or wrong (013-AE3)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-24T10:00:00Z'));
      insertFeedbackMock.mockImplementation(async (_db: unknown, input: CreateFeedbackInput) =>
        makeRow({ kind: 'word_report', mode: input.mode ?? null, word_length: input.word_length ?? null, puzzle_date: input.puzzle_date ?? null, reported_word: input.reported_word ?? null })
      );
      const { submitFeedback } = await import('../../src/services/feedback-service');

      const right = await submitFeedback({} as never, baseEnv, wordReportInput({ reported_word: 'KALEM' }));
      const wrong = await submitFeedback({} as never, baseEnv, wordReportInput({ reported_word: 'MASAL' }));

      expect(findScheduledWordMock).not.toHaveBeenCalled();
      expect(right.feedback.status).toBe(wrong.feedback.status);
      expect(insertFeedbackMock).toHaveBeenCalledTimes(2);
    });

    it('should reject a past date when the reported word does not match the scheduled word (013-AE3)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-24T10:00:00Z'));
      findScheduledWordMock.mockResolvedValue('KALEM');
      const { submitFeedback } = await import('../../src/services/feedback-service');

      await expect(
        submitFeedback({} as never, baseEnv, wordReportInput({ puzzle_date: '2026-10-23' as TurkeyDate, reported_word: 'MASAL' }))
      ).rejects.toMatchObject({ code: 'WORD_MISMATCH' });
      expect(insertFeedbackMock).not.toHaveBeenCalled();
    });

    it('should store a past date when the reported word matches the scheduled word (013-AE3)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-24T10:00:00Z'));
      findScheduledWordMock.mockResolvedValue('KALEM');
      insertFeedbackMock.mockResolvedValue(makeRow({ kind: 'word_report', puzzle_date: '2026-10-23' }));
      const { submitFeedback } = await import('../../src/services/feedback-service');

      const result = await submitFeedback({} as never, baseEnv, wordReportInput({ puzzle_date: '2026-10-23' as TurkeyDate, reported_word: 'KALEM' }));

      expect(findScheduledWordMock).toHaveBeenCalledWith({}, '2026-10-23', 5);
      expect(result.feedback.id).toBe(1);
    });

    it('should reject a future date without looking up the scheduled word (013-AE4)', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-24T10:00:00Z'));
      const { submitFeedback } = await import('../../src/services/feedback-service');

      await expect(
        submitFeedback({} as never, baseEnv, wordReportInput({ puzzle_date: '2026-10-25' as TurkeyDate }))
      ).rejects.toMatchObject({ code: 'FUTURE_DATE' });
      expect(findScheduledWordMock).not.toHaveBeenCalled();
    });
  });
});

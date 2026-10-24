import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CreateFeedbackInput } from '../../src/schemas/feedback-schemas';
import type { Env } from '../../src/types/env';

const { insertFeedbackMock, findScheduledWordMock, sendFeedbackEmailMock } = vi.hoisted(() => ({
  insertFeedbackMock: vi.fn(),
  findScheduledWordMock: vi.fn(),
  sendFeedbackEmailMock: vi.fn(),
}));

vi.mock('../../src/repositories/feedback-repository', () => ({
  insertFeedback: insertFeedbackMock,
  listFeedback: vi.fn(),
  updateFeedbackStatus: vi.fn(),
  getFeedbackById: vi.fn(),
  findScheduledWord: findScheduledWordMock,
}));
vi.mock('../../src/utils/feedback-email', () => ({ sendFeedbackEmail: sendFeedbackEmailMock }));

afterEach(() => {
  insertFeedbackMock.mockReset();
  findScheduledWordMock.mockReset();
  sendFeedbackEmailMock.mockReset();
});

const fakeEnv = { DB: {} as unknown, RESEND_API_KEY: 'test-key', ADMIN_ALERT_EMAIL: 'owner@example.com' } as Env;
const generalInput: CreateFeedbackInput = { kind: 'general', message: 'Harika oyun!', app_platform: 'web' };
const wordReportInput: CreateFeedbackInput = {
  kind: 'word_report',
  message: 'bu kelime yanlış',
  app_platform: 'android',
  mode: 'daily',
  word_length: 5 as never,
  puzzle_date: '2026-01-01' as never,
  reported_word: 'KALEM' as never,
};

describe('submitFeedback', () => {
  it('stores the row and sends exactly one email on success (013-AE1)', async () => {
    insertFeedbackMock.mockResolvedValue({ id: 1 });
    sendFeedbackEmailMock.mockResolvedValue(undefined);

    const { submitFeedback } = await import('../../src/services/feedback-service');
    const result = await submitFeedback(fakeEnv.DB, fakeEnv, generalInput);

    expect(insertFeedbackMock).toHaveBeenCalledTimes(1);
    expect(sendFeedbackEmailMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ feedback: { id: 1 }, emailSent: true });
  });

  it('still stores the row and does not throw when the email rejects (013-AE2)', async () => {
    insertFeedbackMock.mockResolvedValue({ id: 2 });
    sendFeedbackEmailMock.mockRejectedValue(new Error('Resend down'));

    const { submitFeedback } = await import('../../src/services/feedback-service');
    const result = await submitFeedback(fakeEnv.DB, fakeEnv, generalInput);

    expect(insertFeedbackMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ feedback: { id: 2 }, emailSent: false });
  });

  it('stores a daily word_report that matches the scheduled word (013-AE3)', async () => {
    findScheduledWordMock.mockResolvedValue('KALEM');
    insertFeedbackMock.mockResolvedValue({ id: 3 });
    sendFeedbackEmailMock.mockResolvedValue(undefined);

    const { submitFeedback } = await import('../../src/services/feedback-service');
    const result = await submitFeedback(fakeEnv.DB, fakeEnv, wordReportInput);

    expect(result.feedback).toEqual({ id: 3 });
    expect(insertFeedbackMock).toHaveBeenCalledTimes(1);
  });

  it('rejects with 422 and stores nothing when the reported word does not match (013-AE3)', async () => {
    findScheduledWordMock.mockResolvedValue('KALEM');

    const { submitFeedback } = await import('../../src/services/feedback-service');
    await expect(
      submitFeedback(fakeEnv.DB, fakeEnv, { ...wordReportInput, reported_word: 'MASAL' as never })
    ).rejects.toMatchObject({ statusCode: 422 });
    expect(insertFeedbackMock).not.toHaveBeenCalled();
  });

  it('rejects a future puzzle_date with 422 before any scheduled-word lookup (013-AE4)', async () => {
    const { submitFeedback } = await import('../../src/services/feedback-service');
    await expect(
      submitFeedback(fakeEnv.DB, fakeEnv, { ...wordReportInput, puzzle_date: '2099-01-01' as never })
    ).rejects.toMatchObject({ statusCode: 422 });
    expect(findScheduledWordMock).not.toHaveBeenCalled();
    expect(insertFeedbackMock).not.toHaveBeenCalled();
  });

});

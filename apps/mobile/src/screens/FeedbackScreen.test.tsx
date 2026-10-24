import { act, fireEvent, screen } from '@testing-library/react-native';
import { FeedbackScreen } from './FeedbackScreen';
import { ApiRequestError } from '../lib/api';
import { renderWithTheme } from '../test-utils/render-with-theme';

const mockExpoConfig: { version?: string } = { version: '1.2.3' };
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return mockExpoConfig;
    },
  },
}));

describe('FeedbackScreen', () => {
  it('should show the Turkish message field and a disabled Gönder button when empty', async () => {
    const submitFeedback = jest.fn();
    await renderWithTheme(<FeedbackScreen initialKind="general" onClose={jest.fn()} submitFeedback={submitFeedback} />);
    expect(screen.getByLabelText('Mesajınız')).toBeTruthy();
    expect(screen.getByLabelText('İletişim (isteğe bağlı)')).toBeTruthy();
    expect(screen.getByTestId('feedback-submit').props.accessibilityState.disabled).toBe(true);
  });

  it('should enable Gönder once a non-empty message is typed and show a success state once sent (013-AE7)', async () => {
    const submitFeedback = jest.fn().mockResolvedValue({ id: 1, status: 'new' });
    const onClose = jest.fn();
    await renderWithTheme(<FeedbackScreen initialKind="general" onClose={onClose} submitFeedback={submitFeedback} />);

    await act(async () => fireEvent.changeText(screen.getByTestId('feedback-message'), 'Harika oyun!'));
    expect(screen.getByTestId('feedback-submit').props.accessibilityState.disabled).toBe(false);

    await act(async () => fireEvent.press(screen.getByTestId('feedback-submit')));

    expect(submitFeedback).toHaveBeenCalledWith({
      kind: 'general',
      message: 'Harika oyun!',
      app_platform: 'android',
      app_version: '1.2.3',
    });
    expect(await screen.findByText('Geri bildiriminiz gönderildi, teşekkürler!')).toBeTruthy();

    await act(async () => fireEvent.press(screen.getByTestId('feedback-close')));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show a failure state without crashing when the submission is offline or the server rejects it (013-AE7)', async () => {
    const submitFeedback = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await renderWithTheme(<FeedbackScreen initialKind="general" onClose={jest.fn()} submitFeedback={submitFeedback} />);

    await act(async () => fireEvent.changeText(screen.getByTestId('feedback-message'), 'Bağlantı yok'));
    await act(async () => fireEvent.press(screen.getByTestId('feedback-submit')));

    expect(await screen.findByText('Gönderilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.')).toBeTruthy();
    expect(screen.getByTestId('feedback-message')).toBeTruthy();
  });

  it('should show a rate-limit message when the server returns 429', async () => {
    const submitFeedback = jest.fn().mockRejectedValue(new ApiRequestError('Çok fazla istek.', 429, 'RATE_LIMITED'));
    await renderWithTheme(<FeedbackScreen initialKind="general" onClose={jest.fn()} submitFeedback={submitFeedback} />);

    await act(async () => fireEvent.changeText(screen.getByTestId('feedback-message'), 'deneme'));
    await act(async () => fireEvent.press(screen.getByTestId('feedback-submit')));

    expect(await screen.findByText('Çok sık gönderdin, biraz sonra tekrar dene.')).toBeTruthy();
  });

  it('should show a validation message when the server returns 422', async () => {
    const submitFeedback = jest.fn().mockRejectedValue(new ApiRequestError('Invalid', 422, 'VALIDATION_ERROR'));
    await renderWithTheme(<FeedbackScreen initialKind="general" onClose={jest.fn()} submitFeedback={submitFeedback} />);

    await act(async () => fireEvent.changeText(screen.getByTestId('feedback-message'), 'deneme'));
    await act(async () => fireEvent.press(screen.getByTestId('feedback-submit')));

    expect(await screen.findByText('Gönderilemedi, metni kontrol edip tekrar dene.')).toBeTruthy();
  });

  it('should show the word-report kind with a reason field and the prefilled word already attached, not retyped (013-AE8)', async () => {
    const submitFeedback = jest.fn().mockResolvedValue({ id: 2, status: 'new' });
    const prefill = { mode: 'daily' as const, wordLength: 5, puzzleDate: '2026-10-24', reportedWord: 'KALEM' };
    await renderWithTheme(
      <FeedbackScreen initialKind="word_report" prefill={prefill} onClose={jest.fn()} submitFeedback={submitFeedback} />,
    );

    expect(screen.getByLabelText('Bildirim nedeni')).toBeTruthy();
    expect(screen.getByText('Bildirilen kelime: KALEM (Günlük, 5 harf, 2026-10-24)')).toBeTruthy();

    await act(async () => fireEvent.changeText(screen.getByTestId('feedback-message'), 'Bu kelime çok nadir kullanılıyor'));
    await act(async () => fireEvent.press(screen.getByTestId('feedback-submit')));

    expect(submitFeedback).toHaveBeenCalledWith({
      kind: 'word_report',
      message: 'Bu kelime çok nadir kullanılıyor',
      app_platform: 'android',
      app_version: '1.2.3',
      mode: 'daily',
      word_length: 5,
      puzzle_date: '2026-10-24',
      reported_word: 'KALEM',
    });
  });

  it('should send mode/word_length/reported_word without puzzle_date for an unlimited word report', async () => {
    const submitFeedback = jest.fn().mockResolvedValue({ id: 4, status: 'new' });
    const prefill = { mode: 'unlimited' as const, wordLength: 5, puzzleDate: null, reportedWord: 'KALEM' };
    await renderWithTheme(
      <FeedbackScreen initialKind="word_report" prefill={prefill} onClose={jest.fn()} submitFeedback={submitFeedback} />,
    );

    await act(async () => fireEvent.changeText(screen.getByTestId('feedback-message'), 'Bu kelime bende hiç karşılaşmadı'));
    await act(async () => fireEvent.press(screen.getByTestId('feedback-submit')));

    expect(submitFeedback).toHaveBeenCalledWith({
      kind: 'word_report',
      message: 'Bu kelime bende hiç karşılaşmadı',
      app_platform: 'android',
      app_version: '1.2.3',
      mode: 'unlimited',
      word_length: 5,
      reported_word: 'KALEM',
    });
    const sentBody = submitFeedback.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sentBody).not.toHaveProperty('puzzle_date');
  });

  it('should include the trimmed contact field only when filled in', async () => {
    const submitFeedback = jest.fn().mockResolvedValue({ id: 3, status: 'new' });
    await renderWithTheme(<FeedbackScreen initialKind="general" onClose={jest.fn()} submitFeedback={submitFeedback} />);

    await act(async () => fireEvent.changeText(screen.getByTestId('feedback-message'), 'Mesaj'));
    await act(async () => fireEvent.changeText(screen.getByTestId('feedback-contact'), '  test@example.com  '));
    await act(async () => fireEvent.press(screen.getByTestId('feedback-submit')));

    expect(submitFeedback).toHaveBeenCalledWith(expect.objectContaining({ contact: 'test@example.com' }));
  });

  it('should disable Gönder again while a whitespace-only message is typed', async () => {
    const submitFeedback = jest.fn();
    await renderWithTheme(<FeedbackScreen initialKind="general" onClose={jest.fn()} submitFeedback={submitFeedback} />);

    await act(async () => fireEvent.changeText(screen.getByTestId('feedback-message'), '   '));
    expect(screen.getByTestId('feedback-submit').props.accessibilityState.disabled).toBe(true);
  });
});

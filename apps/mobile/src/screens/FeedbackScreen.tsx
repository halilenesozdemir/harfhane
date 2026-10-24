import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../ThemeProvider';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { TopBar } from '../ui/TopBar';
import { FONT_SIZE, ICON_SIZE, RADIUS, SCREEN_PADDING, SPACING } from '../ui/layout';
import { ApiRequestError, type ApiClient, type FeedbackPrefill } from '../lib/api';

export interface FeedbackScreenProps {
  readonly initialKind: 'general' | 'word_report';
  readonly prefill?: FeedbackPrefill;
  readonly onClose: () => void;
  readonly submitFeedback: ApiClient['submitFeedback'];
}

type SubmitStatus = 'idle' | 'sending' | 'success' | 'failure';

const MESSAGE_MAX_LENGTH = 1000;
const CONTACT_MAX_LENGTH = 200;
const MESSAGE_INPUT_LINES = 6;
const TITLE = 'Geri bildirim';
const GENERAL_MESSAGE_LABEL = 'Mesajınız';
const WORD_REPORT_MESSAGE_LABEL = 'Bildirim nedeni';
const GENERAL_PLACEHOLDER = 'Görüş, öneri veya sorun bildirin';
const WORD_REPORT_PLACEHOLDER = 'Bu kelime neden hatalı veya uygunsuz?';
const CONTACT_LABEL = 'İletişim (isteğe bağlı)';
const CONTACT_PLACEHOLDER = 'E-posta (isteğe bağlı)';
const SUBMIT_LABEL = 'Gönder';
const SUCCESS_TEXT = 'Geri bildiriminiz gönderildi, teşekkürler!';
const NETWORK_FAILURE_TEXT = 'Gönderilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.';
const RATE_LIMITED_TEXT = 'Çok sık gönderdin, biraz sonra tekrar dene.';
const VALIDATION_FAILURE_TEXT = 'Gönderilemedi, metni kontrol edip tekrar dene.';
const CLOSE_LABEL = 'Kapat';
const BACK_LABEL = 'Geri';
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_BAD_REQUEST = 400;
const HTTP_UNPROCESSABLE_ENTITY = 422;

function failureMessageFor(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === HTTP_TOO_MANY_REQUESTS) return RATE_LIMITED_TEXT;
    if (error.status === HTTP_UNPROCESSABLE_ENTITY || error.status === HTTP_BAD_REQUEST) return VALIDATION_FAILURE_TEXT;
  }
  return NETWORK_FAILURE_TEXT;
}

function wordReportSummary(prefill: FeedbackPrefill): string {
  const modeText = prefill.mode === 'daily' ? 'Günlük' : 'Sınırsız';
  const dateText = prefill.puzzleDate ? `, ${prefill.puzzleDate}` : '';
  return `Bildirilen kelime: ${prefill.reportedWord} (${modeText}, ${prefill.wordLength} harf${dateText})`;
}

function isMessageValid(message: string): boolean {
  const trimmed = message.trim();
  return trimmed.length > 0 && trimmed.length <= MESSAGE_MAX_LENGTH;
}

interface WordReportSummaryProps {
  readonly prefill: FeedbackPrefill;
}

function WordReportSummaryBox({ prefill }: WordReportSummaryProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Text style={[styles.summaryText, { color: colors.text }]}>{wordReportSummary(prefill)}</Text>
    </View>
  );
}

export function FeedbackScreen({ initialKind, prefill, onClose, submitFeedback }: FeedbackScreenProps) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [failureMessage, setFailureMessage] = useState(NETWORK_FAILURE_TEXT);
  const appVersion = Constants.expoConfig?.version;
  const messageLabel = initialKind === 'word_report' ? WORD_REPORT_MESSAGE_LABEL : GENERAL_MESSAGE_LABEL;
  const messagePlaceholder = initialKind === 'word_report' ? WORD_REPORT_PLACEHOLDER : GENERAL_PLACEHOLDER;
  const canSubmit = isMessageValid(message) && status !== 'sending';

  const handleSubmit = useCallback(() => {
    if (!isMessageValid(message)) return;
    setStatus('sending');
    const trimmedContact = contact.trim();
    void submitFeedback({
      kind: initialKind,
      message: message.trim(),
      ...(trimmedContact.length > 0 ? { contact: trimmedContact } : {}),
      app_platform: 'android',
      ...(appVersion ? { app_version: appVersion } : {}),
      ...(initialKind === 'word_report' && prefill
        ? {
            mode: prefill.mode,
            word_length: prefill.wordLength,
            ...(prefill.puzzleDate ? { puzzle_date: prefill.puzzleDate } : {}),
            reported_word: prefill.reportedWord,
          }
        : {}),
    })
      .then(() => setStatus('success'))
      .catch((error: unknown) => {
        setFailureMessage(failureMessageFor(error));
        setStatus('failure');
      });
  }, [message, contact, initialKind, prefill, appVersion, submitFeedback]);

  if (status === 'success') {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <TopBar
          title={TITLE}
          leading={<IconButton icon={<ArrowLeft size={ICON_SIZE.lg} color={colors.text} />} accessibilityLabel={BACK_LABEL} onPress={onClose} />}
        />
        <View style={styles.body}>
          <Text accessibilityLiveRegion="polite" style={[styles.statusText, { color: colors.correctText }]}>
            {SUCCESS_TEXT}
          </Text>
          <Button label={CLOSE_LABEL} variant="primary" onPress={onClose} testID="feedback-close" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TopBar
        title={TITLE}
        leading={<IconButton icon={<ArrowLeft size={ICON_SIZE.lg} color={colors.text} />} accessibilityLabel={BACK_LABEL} onPress={onClose} />}
      />
      <View style={styles.body}>
        {initialKind === 'word_report' && prefill ? <WordReportSummaryBox prefill={prefill} /> : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>{messageLabel}</Text>
          <TextInput
            testID="feedback-message"
            accessibilityLabel={messageLabel}
            value={message}
            onChangeText={setMessage}
            placeholder={messagePlaceholder}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={MESSAGE_INPUT_LINES}
            maxLength={MESSAGE_MAX_LENGTH}
            style={[
              styles.messageInput,
              { color: colors.text, backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          />
          <Text style={[styles.counter, { color: colors.textMuted }]}>{`${message.trim().length}/${MESSAGE_MAX_LENGTH}`}</Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>{CONTACT_LABEL}</Text>
          <TextInput
            testID="feedback-contact"
            accessibilityLabel={CONTACT_LABEL}
            value={contact}
            onChangeText={setContact}
            placeholder={CONTACT_PLACEHOLDER}
            placeholderTextColor={colors.textMuted}
            maxLength={CONTACT_MAX_LENGTH}
            style={[styles.contactInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          />
        </View>

        <Button testID="feedback-submit" label={SUBMIT_LABEL} variant="primary" onPress={handleSubmit} disabled={!canSubmit} />

        {status === 'failure' ? (
          <Text accessibilityLiveRegion="polite" style={[styles.statusText, { color: colors.text }]}>
            {failureMessage}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, paddingHorizontal: SCREEN_PADDING, paddingTop: SPACING.sm, paddingBottom: SCREEN_PADDING, gap: SPACING.lg },
  field: { gap: SPACING.xs },
  label: { fontSize: FONT_SIZE.body, fontWeight: '600' },
  messageInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.body,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  contactInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.body,
  },
  counter: { fontSize: FONT_SIZE.caption, textAlign: 'right' },
  summaryBox: { borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md },
  summaryText: { fontSize: FONT_SIZE.body },
  statusText: { fontSize: FONT_SIZE.body, fontWeight: '600', textAlign: 'center' },
});

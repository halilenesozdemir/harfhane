import type { FeedbackRow } from '../repositories/feedback-repository';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Harfhane <bildirim@harfhane.app>';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Minimal HTML body; mirrors utils/resend.ts's Resend call shape without
// sharing that file (owned by the concurrent fix/backend-mvp-review branch).
function buildFeedbackEmailHtml(feedback: FeedbackRow): string {
  const title = feedback.kind === 'word_report' ? 'Kelime bildirimi' : 'Geri bildirim';
  const details = [
    feedback.kind === 'word_report'
      ? `Mod: ${feedback.mode} · Uzunluk: ${feedback.word_length} · Tarih: ${feedback.puzzle_date} · Kelime: ${escapeHtml(feedback.reported_word ?? '-')}`
      : null,
    feedback.contact ? `İletişim: ${escapeHtml(feedback.contact)}` : null,
    `Platform: ${feedback.app_platform} · Sürüm: ${escapeHtml(feedback.app_version ?? '-')}`,
  ].filter(Boolean);

  return `<!DOCTYPE html><html lang="tr"><body style="font-family:Arial,sans-serif;">
    <h2>${title}</h2>
    <p style="white-space:pre-wrap;">${escapeHtml(feedback.message)}</p>
    ${details.map((d) => `<p style="color:#555;font-size:13px;">${d}</p>`).join('')}
  </body></html>`;
}

/** Best-effort Resend email for a stored feedback row (KTD1). */
export async function sendFeedbackEmail(apiKey: string, to: string, feedback: FeedbackRow): Promise<void> {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject: `Harfhane — ${feedback.kind === 'word_report' ? 'Kelime Bildirimi' : 'Geri Bildirim'}`,
      html: buildFeedbackEmailHtml(feedback),
    }),
  });

  if (!response.ok) throw new Error(`Resend request failed with status ${response.status}`);
}

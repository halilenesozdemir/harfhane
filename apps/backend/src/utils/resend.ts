const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Harfhane <bildirim@harfhane.app>';

export interface ScheduleAlertEntry {
  length: number;
  runwayDays: number;
  lastScheduledDate: string | null;
  unscheduledStock: number;
  restockRunwayDays: number;
  restockStatus: 'ok' | 'restock';
}

function buildScheduleAlertRow(entry: ScheduleAlertEntry): string {
  const lastDate = entry.lastScheduledDate ?? 'yok';
  const restockNote =
    entry.restockStatus === 'restock'
      ? ` — <strong style="color:#ffb703;">stok takviyesi gerekiyor</strong> (kullanılabilir kelime: ${entry.restockRunwayDays})`
      : '';
  return `<li style="color:#ffffff;font-size:14px;margin:0 0 6px;">${entry.length} harf: <strong>${entry.runwayDays} gün</strong> kaldı
    (son tarih: ${lastDate}, planlanmamış stok: ${entry.unscheduledStock})${restockNote}</li>`;
}

function buildScheduleAlertHtml(entries: ScheduleAlertEntry[]): string {
  const rows = entries.map(buildScheduleAlertRow).join('');
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Harfhane Takvim Uyarısı</title>
</head>
<body style="margin:0;padding:0;background-color:#121213;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#121213;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color:#1a1a1b;border-radius:12px;overflow:hidden;max-width:500px;width:100%;">
          <tr>
            <td style="background-color:#c9b458;padding:24px;text-align:center;">
              <span style="font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#121213;letter-spacing:2px;">TAKVİM UYARISI</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="color:#818384;font-size:15px;margin:0 0 16px;line-height:1.6;">Aşağıdaki uzunluklar için günlük kelime takvimi yakında tükeniyor:</p>
              <ul style="margin:0;padding:0 0 0 18px;">${rows}</ul>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendScheduleAlertEmail(
  apiKey: string,
  to: string,
  entries: ScheduleAlertEntry[]
): Promise<void> {
  await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject: 'Harfhane — Takvim Uyarısı',
      html: buildScheduleAlertHtml(entries),
    }),
  });
}

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Harfhane <bildirim@harfhane.app>';

function buildReminderHtml(username: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bugünkü kelimeyi çözdün mü?</title>
</head>
<body style="margin:0;padding:0;background-color:#121213;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#121213;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background-color:#1a1a1b;border-radius:12px;overflow:hidden;max-width:500px;width:100%;">
          <tr>
            <td style="background-color:#538d4e;padding:24px;text-align:center;">
              <span style="font-family:Georgia,serif;font-size:32px;font-weight:bold;color:#ffffff;letter-spacing:4px;">HARFHANE</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="color:#ffffff;font-size:18px;font-weight:bold;margin:0 0 12px;">Merhaba ${username}!</p>
              <p style="color:#818384;font-size:15px;margin:0 0 24px;line-height:1.6;">Bugünkü kelimeyi henüz çözmedin. Gün bitmeden şansını dene!</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#538d4e;border-radius:8px;padding:14px 32px;">
                    <a href="https://harfhane.app" style="color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">Oynamaya Başla</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;border-top:1px solid #3a3a3c;">
              <p style="color:#818384;font-size:12px;margin:0;text-align:center;">
                Bu bildirimi kapatmak için
                <a href="https://harfhane.app" style="color:#538d4e;">Harfhane</a> ayarlarından e-posta bildirimlerini kapat.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendReminderEmail(
  apiKey: string,
  to: string,
  username: string
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
      subject: 'Bugünkü Harfhane kelimesini çözdün mü?',
      html: buildReminderHtml(username),
    }),
  });
}

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Harfhane <noreply@harfhane.app>';

export async function sendPasswordResetEmail(
  apiKey: string,
  toEmail: string,
  resetUrl: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="UTF-8" /><title>Şifre Sıfırlama</title></head>
    <body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px;">
      <div style="max-width:480px;margin:auto;background:#1e293b;border-radius:16px;padding:40px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="display:inline-block;background:#22c55e;border-radius:12px;padding:12px 20px;">
            <span style="color:#fff;font-weight:700;font-size:28px;letter-spacing:4px;">HARFHANE</span>
          </div>
        </div>
        <h2 style="margin:0 0 16px;font-size:20px;color:#f8fafc;">Şifrenizi Sıfırlayın</h2>
        <p style="margin:0 0 24px;color:#94a3b8;line-height:1.6;">
          Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.
        </p>
        <a href="${resetUrl}"
           style="display:block;text-align:center;background:#22c55e;color:#fff;font-weight:600;
                  padding:14px 24px;border-radius:10px;text-decoration:none;font-size:16px;margin-bottom:24px;">
          Şifremi Sıfırla
        </a>
        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
          Bu butona tıklamak istemiyorsanız aşağıdaki linki tarayıcınıza kopyalayın:<br/>
          <span style="color:#94a3b8;word-break:break-all;">${resetUrl}</span>
        </p>
        <hr style="border:none;border-top:1px solid #334155;margin:24px 0;" />
        <p style="margin:0;color:#475569;font-size:12px;">
          Bu linkin geçerlilik süresi 1 saattir. Bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
        </p>
      </div>
    </body>
    </html>
  `;

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [toEmail],
      subject: 'Şifrenizi Sıfırlayın — Harfhane',
      html,
    }),
  });

  if (!response.ok) throw new Error('Email gönderilemedi');
}

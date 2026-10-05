import type { Env } from '../types/env';

export async function setEmailNotifications(
  db: Env['DB'],
  userId: number,
  enabled: boolean
): Promise<void> {
  await db
    .prepare('UPDATE users SET email_notifications = ? WHERE id = ?')
    .bind(enabled ? 1 : 0, userId)
    .run();
}

export async function getEmailNotificationsStatus(
  db: Env['DB'],
  userId: number
): Promise<boolean> {
  const row = await db
    .prepare('SELECT email_notifications FROM users WHERE id = ?')
    .bind(userId)
    .first<{ email_notifications: number }>();

  return row?.email_notifications === 1;
}

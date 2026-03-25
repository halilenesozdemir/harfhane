import type { Env } from '../types/env';

export interface EmailReminderTarget {
  id: number;
  email: string;
  username: string;
}

export async function getUsersForEmailReminder(
  db: Env['DB'],
  today: string
): Promise<EmailReminderTarget[]> {
  const rows = await db
    .prepare(
      `SELECT u.id, u.email, u.username
       FROM users u
       WHERE u.email_notifications = 1
         AND NOT EXISTS (
           SELECT 1 FROM game_results gr
           WHERE gr.user_id = u.id AND gr.date = ?
         )`
    )
    .bind(today)
    .all<EmailReminderTarget>();

  return rows.results ?? [];
}

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

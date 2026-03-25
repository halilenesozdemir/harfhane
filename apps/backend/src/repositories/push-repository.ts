import type { Env } from '../types/env';
import type { PushSubscriptionData } from '../utils/web-push';

export interface PushSubscriptionRow extends PushSubscriptionData {
  id: number;
  user_id: number;
}

export async function upsertSubscription(
  db: Env['DB'],
  userId: number,
  subscription: PushSubscriptionData
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth`
    )
    .bind(userId, subscription.endpoint, subscription.p256dh, subscription.auth)
    .run();
}

export async function deleteSubscription(
  db: Env['DB'],
  userId: number,
  endpoint: string
): Promise<void> {
  await db
    .prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
    .bind(userId, endpoint)
    .run();
}

export async function getSubscriptionsForUsersWithoutTodayPlay(
  db: Env['DB'],
  today: string
): Promise<PushSubscriptionRow[]> {
  const rows = await db
    .prepare(
      `SELECT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth
       FROM push_subscriptions ps
       WHERE NOT EXISTS (
         SELECT 1 FROM game_results gr
         WHERE gr.user_id = ps.user_id AND gr.date = ?
       )`
    )
    .bind(today)
    .all<PushSubscriptionRow>();

  return rows.results ?? [];
}

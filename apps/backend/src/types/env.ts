export interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  APP_URL: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  RESEND_API_KEY: string;
  ADMIN_ALERT_EMAIL?: string;
  GIT_SHA?: string;
}

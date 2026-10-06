export interface Env {
  DB: D1Database;
  ADMIN_SECRET: string;
  RESEND_API_KEY: string;
  ADMIN_ALERT_EMAIL?: string;
  GIT_SHA?: string;
}

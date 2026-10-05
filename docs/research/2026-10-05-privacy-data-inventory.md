# Harfhane — Privacy Data Inventory

Date: 2026-10-05. Scope: what the current code actually collects, stores, sends, and to whom. Grounded in
`apps/backend`, `apps/frontend`, `apps/mobile` at commit `4786f74` (branch `docs/privacy-draft`). This is
research input for a draft privacy policy — it is not legal advice.

## 1. Database tables holding personal/device data

Schema source: `apps/backend/db/migrations/0001_baseline.sql`.

| Table | Personal data | Evidence |
| --- | --- | --- |
| `users` | email, username, password hash (PBKDF2-SHA256, 100k iterations, per-user salt; `apps/backend/src/utils/auth.ts:70-80`), `google_id`, `email_notifications` flag, `freeze_tokens`, `created_at` | `apps/backend/db/migrations/0001_baseline.sql:50-59` |
| `password_reset_tokens` | random token, `user_id`, expiry | `0001_baseline.sql:153-160` |
| `push_subscriptions` | Web Push `endpoint` URL (identifies browser/push service), `p256dh`/`auth` keys, `user_id` | `0001_baseline.sql:137-145` |
| `game_results` | `user_id`, play date, word length, guesses, win flag, mode | `0001_baseline.sql:99-112` |
| `tournament_results` | `user_id`, word, guesses, score, timestamp | `0001_baseline.sql:162-173` |
| `duels` | `challenger_id`, `opponent_id`, guesses/won per side | `0001_baseline.sql:175-186` |
| `user_xp`, `user_badges` | `user_id`, XP total, level, earned badges | `0001_baseline.sql:122-135` |
| `streak_freezes` | `user_id`, date | `0001_baseline.sql:147-151` |
| `word_lists`, `word_list_words` | `owner_user_id` (nullable), list content (not personal) | `0001_baseline.sql:62-80` |
| `list_likes`, `list_comments` | `user_id` + free-text comment content | `0001_baseline.sql:82-97` |
| `words`, `valid_words`, `daily_words`, `badges` | No personal data (word dictionary/catalog) | `0001_baseline.sql:3-48,114-120` |

## 2. Backend — collection and processing

### Auth (`apps/backend/src/routes/auth.ts`)
- **Register** (`auth.ts:89-114`): email, username, password → PBKDF2-SHA256 hash stored, never the raw password.
- **Login** (`auth.ts:116-136`): verifies password, issues JWT (30-day expiry, `JWT_EXPIRES_IN` = `auth.ts:30`).
- **Google OAuth** (`auth.ts:138-171`): redirects to Google; on callback, exchanges `code` for an access token
  (`exchangeGoogleCode`, `auth.ts:49-69`), then calls Google's userinfo endpoint (`fetchGoogleUserInfo`,
  `auth.ts:71-81`) which returns `id`, `email`, `name` (`GoogleUserInfo`, `auth.ts:43-47`). Only `google_id`,
  email, and name/username are persisted via `upsertGoogleUser` (`auth.ts:162`); the Google access/id tokens
  themselves are not stored.
- **Forgot/reset password** (`auth.ts:188-219`): generates a random token (`generateToken`, `auth.ts:24-28`),
  stores it with 1-hour expiry (`RESET_TOKEN_EXPIRES_MS`, `auth.ts:22`), emails a reset link via Resend
  (see §2.3).
- **Account deletion** (`auth.ts:236-239`): `DELETE FROM users WHERE id = ?`
  (`apps/backend/src/repositories/user-repository.ts:82-84`). Relies entirely on SQL foreign-key cascade
  behavior defined in the schema:
  - **Deleted (CASCADE)**: `game_results`, `tournament_results`, `push_subscriptions`,
    `password_reset_tokens`, `streak_freezes`, `user_xp`, `user_badges`, `list_likes`, `list_comments`,
    `duels` rows where the user is `challenger_id`.
  - **NOT deleted, anonymized**: `duels` rows where the user is `opponent_id` → `opponent_id` set to NULL
    (`ON DELETE SET NULL`, `0001_baseline.sql:181`); the challenger's duel record and score survive.
  - **NOT deleted, orphaned**: `word_lists` owned by the user → `owner_user_id` set to NULL
    (`ON DELETE SET NULL`, `0001_baseline.sql:70`). The word list itself (name, description, word content)
    is **not deleted** by account deletion.
  - This is grounded entirely in the FK clauses above — no explicit cleanup code was found beyond the
    single `DELETE FROM users` statement.

### Results / gamification (`apps/backend/src/routes/results.ts`, `src/services/gamification-service.ts`)
Stores per-user game outcomes (date, word length, guesses, win/lose, mode) tied to `user_id`; feeds XP/level
and badge calculations. No content beyond gameplay metadata (no raw guessed words stored per result row
beyond `word_id` reference).

### Push notifications (`apps/backend/src/routes/push.ts`, `src/utils/web-push.ts`, `src/repositories/push-repository.ts`)
- `POST /subscribe` stores a Web Push subscription (`endpoint`, `p256dh`, `auth`) tied to `user_id`
  (`push.ts:18-23`, `push-repository.ts:8-23`).
- `DELETE /unsubscribe` removes one subscription (`push.ts:25-30`).
- `GET /vapid-public-key` exposes the server's public VAPID key (not personal data) (`push.ts:32-34`).
- A scheduled Cloudflare Worker cron job (`apps/backend/src/index.ts:93-121`) runs daily: finds every
  subscription belonging to a user who has **not** played that day
  (`getSubscriptionsForUsersWithoutTodayPlay`, `push-repository.ts:38-54`) and sends an encrypted reminder
  push directly to the browser's push service at the stored `endpoint` URL (`sendPushNotification`,
  `web-push.ts:152-179`). The push payload (title/body/URL) is end-to-end encrypted to the subscription keys
  before leaving the Worker; the browser's push service (e.g. Google FCM, Mozilla autopush — whichever
  service issued the `endpoint`) sees the destination endpoint but not the decrypted content.

### Email (`apps/backend/src/utils/email.ts`, `src/utils/resend.ts`)
All outbound email goes through **Resend** (`RESEND_API_URL = 'https://api.resend.com/emails'`,
`email.ts:1`, `resend.ts:1`), using `RESEND_API_KEY` (`src/types/env.ts:11`).
- **Password reset email** (`email.ts:4-57`): sent to the user's registered email with a one-time reset
  link, triggered by `/auth/forgot-password` (`auth.ts:201`).
  Note: same-day, the handler returns `{sent: true}` even when no account exists for that email, to avoid
  leaking account existence (`auth.ts:192-194`) — relevant to a "legitimate interest" wording in the policy.
- **Daily reminder email** (`resend.ts:51-69`): sent to users with `email_notifications = 1` who have not
  played that day yet (`getUsersForEmailReminder`, `notification-repository.ts:9-27`), via the same daily
  cron job (`index.ts:117-119`). Contains username and a link back to the app. Users can opt out through
  `PATCH /notifications/email` (`notifications.ts:21-30`), which flips `users.email_notifications`.
- **Admin schedule-health alert email** (`resend.ts:71+`, sent via `checkScheduleHealthAndAlert`,
  `index.ts:120`): goes to `ADMIN_ALERT_EMAIL` (an operator address, not a player's), content is aggregate
  word-inventory stats, not personal data.

### Rate limiting (`apps/backend/src/middleware/rate-limiter.ts`)
Reads client IP from `CF-Connecting-IP` / `X-Forwarded-For` headers (`rate-limiter.ts:16-20`) to key an
**in-memory** (`Map`, `rate-limiter.ts:14`) hit counter per route, reset every 60s. The IP is **not** written
to D1 or any log statement found in this file; it only exists in the Worker's transient in-memory map for the
rate-limit window, and that memory is not durable across Worker instance recycling. Applied to
`/auth/register`, `/auth/login`, `/auth/forgot-password` (`auth.ts:85-87`) and a separate game-endpoint
limiter (`gameRateLimiter`, `rate-limiter.ts:55`).

### Logs
No `console.*` calls were found logging email, IP, or other personal fields in the reviewed route/service
files (consistent with the project's "no console.* in production code" rule). Cloudflare's own platform-level
request logs (if enabled on the account) are outside this codebase's visibility — see "Unverified" below.

## 3. Frontend (`apps/frontend`)

### localStorage keys
| Key pattern | Content | Evidence |
| --- | --- | --- |
| `harfhane:token` | JWT auth token | `apps/frontend/src/context/AuthContext.tsx:23,44,61,84,92,109,113,134,141,147` |
| `harfhane:game:anon:{date}:{length}` / `harfhane:game:{userId}:{date}:{length}` | In-progress/completed daily game state (guesses, board), migrated from anonymous key to user-keyed key on login | `apps/frontend/src/hooks/useGameState.ts:30-34` |
| `harfhane:install-prompt-dismissed` | Timestamp of PWA install-prompt dismissal | `apps/frontend/src/components/InstallPrompt.tsx:22,62` |
| How-to-play "seen" flag (`HAS_SEEN_HELP_KEY`) | Boolean | `apps/frontend/src/components/HomePage.tsx:23,173` |
| Generic helper | `useLocalStorage` hook used by other features (theme, stats, etc.) for arbitrary key/value pairs | `apps/frontend/src/hooks/useLocalStorage.ts:5,26` |

All of the above stays on-device (browser localStorage); none of it is a cookie and none is transmitted to
a third party by this code.

### Third-party requests from the frontend
- **Google Fonts**: `apps/frontend/src/index.css:1` — `@import url('https://fonts.googleapis.com/css2?...')`.
  This causes the browser to fetch font CSS/files directly from Google's servers, which receives the
  visitor's IP address and standard HTTP request metadata (user agent, referrer) as part of that request —
  the app does not proxy or self-host these fonts.
- **No analytics, ads, or tracking scripts were found**: a repo-wide search for `gtag`, `google-analytics`,
  `sentry`, `posthog`, `mixpanel`, `amplitude` in `apps/frontend/src` and `index.html` returned no matches.
- **PWA**: `apps/frontend/public/manifest.json` declares app metadata (name, icons, theme color) for
  "add to home screen" installability. No service-worker file was found in the repo, so there is currently
  no offline caching or background sync layer beyond the manifest itself.
- **Cookies**: no cookie-setting code (`document.cookie`, `Set-Cookie` handling) was found in
  `apps/frontend/src`; auth is bearer-JWT via `Authorization` header plus localStorage, not cookies.

## 4. Mobile (`apps/mobile`)
- `apps/mobile/src/game/device-store.ts:1-4` wires `AsyncStorage` (on-device key/value store) as the
  mobile app's storage backend for game state, via the same `KeyValueStore` interface as other game-storage
  code. Correction (2026-10-05): `apps/mobile/src/lib/api.ts` (merged in #14) calls `GET /api/words/daily`, `GET /api/words/random` and `POST /api/words/validate` (the guess) without account data.

## 5. Hosting / infrastructure
- Backend: Cloudflare Workers + D1 (`apps/backend/wrangler.toml` / deploy workflow references), confirmed by
  `.github/workflows/deploy-backend.yml` triggers and `wrangler deploy`/`db:migrate:*` scripts in the root
  `CLAUDE.md` Commands table.
  - Frontend: Cloudflare Pages (`wrangler pages deploy`, same workflow file reference).
  - D1's physical data-processing location (which Cloudflare region/datacenter actually stores the database)
    is **not determinable from this code** — it depends on the Cloudflare account/project configuration, not
    anything in the repository.

## 6. Unverified / needs owner confirmation
These are explicitly **not** confirmed by this code read and must not be asserted as fact in the policy
without the owner checking:
1. Whether Cloudflare's platform-level HTTP request logging (standard Workers/Pages access logs) is enabled
   on the account, and its retention period — this is an account setting, invisible from the repo.
2. Resend's own data retention / sub-processor policy for the emails it relays (sender responsibility only
   covers what is sent, not Resend's internal retention).
3. Google's data handling for the OAuth userinfo call and for the Fonts CDN request — governed by Google's
   own policies, outside this codebase.
4. Whether `ADMIN_ALERT_EMAIL` and `ADMIN_SECRET` map to a real operator identity (owner's own email) —
   relevant for naming a "veri sorumlusu" contact but is a deployment secret, not code.
5. Any server-side request logging Cloudflare may attach automatically to D1 queries (e.g. for debugging) —
   not controllable or visible from `apps/backend/src`.
6. Legal basis / consent language, retention periods in days, and the identity of the "veri sorumlusu" are
   business/legal decisions, not something derivable from code — left as placeholders in the draft policy.

<!-- Archived 2026-10-24: stale (TDK/Wordle-era draft — Google OAuth, VAPID push, JWT secret, the
`harfhane-db` database name, `apps/backend/migrations/` path — all removed or renamed since; see
docs/decisions/2026-10-05-mvp-scope-cut.md). Superseded by DEPLOYMENT.md. Kept verbatim for history
only; do not use as a source for current deploy steps. -->

# Deployment Guide

## Genel Bakış

| Servis   | Platform             | URL                        |
| -------- | -------------------- | -------------------------- |
| Frontend | Cloudflare Pages     | `harfhane.app`             |
| Backend  | Cloudflare Workers   | `api.harfhane.app`         |
| Veritabanı | Cloudflare D1      | `harfhane-db`                |

GitHub Actions üzerinden `main` branch'e push ile otomatik tetiklenir.

---

## Manuel Deploy

### Backend (Cloudflare Workers)

```bash
CLOUDFLARE_API_TOKEN=... pnpm --filter @harfhane/backend run deploy
```

### Frontend (Cloudflare Pages)

```bash
# Build
VITE_API_URL=https://api.harfhane.app/api pnpm --filter @harfhane/frontend run build

# Deploy
CLOUDFLARE_API_TOKEN=... pnpm --filter @harfhane/frontend exec wrangler pages deploy dist --project-name harfhane
```

---

## Environment Variables

### Backend — `.dev.vars` (lokal, gitignored)

```env
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=...
RESEND_API_KEY=...
```

Cloudflare Workers'ta bu değerlerin her biri `wrangler secret put <KEY>` ile yüklenir.

### Frontend

| Variable | Ortam | Açıklama |
|----------|-------|----------|
| `VITE_API_URL` | Production | `https://api.harfhane.app/api` |

Lokalde env var gerekmez — Vite proxy `/api` → `localhost:8787` yönlendirir.

---

## Veritabanı Migration

```bash
# Lokal — geliştirme ortamı
wrangler d1 migrations apply harfhane-db --local

# Production — dikkatli uygula
wrangler d1 migrations apply harfhane-db --remote
```

Migration dosyaları: `apps/backend/migrations/`

---

## GitHub Actions Secrets

| Secret | Açıklama |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | Workers Scripts Edit + Pages Edit yetkili token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare hesap ID'si |

---

## Post-Deploy Kontrol

- [ ] `https://harfhane.app` yükleniyor
- [ ] `https://api.harfhane.app/api/words/daily?date=YYYY-MM-DD` yanıt veriyor
- [ ] Google OAuth çalışıyor
- [ ] Push bildirimi kaydı yapılabiliyor
- [ ] Mobil görünüm düzgün

---

## Sorun Giderme

### Wrangler auth hatası

OAuth token ~1 saatte expiry'ye girer. Her zaman env var kullan:

```bash
CLOUDFLARE_API_TOKEN=... wrangler ...
```

### Port çakışması

```bash
lsof -ti:8787 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Build hatası

```bash
pnpm store prune
pnpm install
pnpm build
```

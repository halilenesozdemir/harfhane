<h1 align="center">Harfhane</h1>

<p align="center">
  Türkçe kelimelerle oynanan günlük kelime tahmin oyunu.
</p>

<p align="center">
  <a href="https://harfhane.app">harfhane.app</a>
</p>

---

## Teknoloji

| Katman     | Teknoloji                                                       |
| ---------- | --------------------------------------------------------------- |
| Frontend   | React 19, TypeScript 5, Vite 7, Tailwind CSS 3, TanStack Query |
| Backend    | Hono, TypeScript, Cloudflare Workers                            |
| Veritabanı | Cloudflare D1 (SQLite)                                          |
| Depolama   | Cloudflare R2                                                   |
| Auth       | JWT + Google OAuth                                              |

## Monorepo Yapısı

```
harfhane/
├── apps/
│   ├── frontend/          # React 19 + Vite (@harfhane/frontend)
│   │   └── src/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── context/
│   │       ├── types/
│   │       └── utils/
│   └── backend/           # Hono API (@harfhane/backend)
│       ├── migrations/
│       └── src/
│           ├── routes/
│           ├── services/
│           ├── repositories/
│           ├── schemas/
│           ├── middleware/
│           └── utils/
└── packages/
    └── shared/            # Ortak TypeScript tipleri (@harfhane/shared)
```

## Özellikler

- **Günlük Mod** — Her gün yeni kelime; tüm oyuncular aynı kelimeyi çözer
- **Sınırsız Mod** — Rastgele kelime, dilediğin kadar oyna
- **Meydan Okuma** — Çözdüğün kelimeyi arkadaşına gönder
- **Turnuva** — Katılımcılar arasında rekabetçi mod
- **Düello** — Bire bir anlık rekabet
- **XP & Rozet** — Oyun içi ilerleme sistemi
- **Liderboard** — Günlük ve genel sıralamalar
- **Push Bildirimleri** — Günlük kelime hatırlatması
- **PWA** — Ana ekrana eklenebilir, offline çalışır
- **Admin Paneli** — Kelime listesi yönetimi

## Gereksinimler

- Node.js >= 20
- pnpm >= 9

## Kurulum

```bash
pnpm install
```

## Geliştirme

```bash
# Frontend + Backend birlikte
pnpm dev

# Ayrı ayrı
pnpm --filter @harfhane/frontend run dev    # localhost:5173
pnpm --filter @harfhane/backend run dev     # localhost:8787
```

Frontend `/api/` isteklerini otomatik olarak backend'e (8787) proxy'ler.

## Build & Typecheck

```bash
pnpm build
pnpm typecheck
```

## Test

```bash
# Backend testleri
pnpm --filter @harfhane/backend run test

# Watch modu
pnpm --filter @harfhane/backend run test:watch
```

## Veritabanı

```bash
# Local migration
pnpm --filter @harfhane/backend run db:migrate:local

# Production migration
pnpm --filter @harfhane/backend run db:migrate:remote

# Local seed
wrangler d1 execute harfhane-db --local --file=scripts/seed.sql
```

## Deploy

`main` branch'e push ile GitHub Actions üzerinden otomatik deploy.

| Değişen dizin        | Backend | Frontend |
| -------------------- | ------- | -------- |
| `apps/backend/**`    | Evet    |          |
| `apps/frontend/**`   |         | Evet     |
| `packages/shared/**` | Evet    | Evet     |

- **Frontend**: Cloudflare Pages → `harfhane.app`
- **Backend**: Cloudflare Workers → `api.harfhane.app`

### Gerekli GitHub Secrets

| Secret | Açıklama |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | Workers + Pages Edit yetkili token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare hesap ID'si |

## Geliştirme Rehberi

Geliştirme süreci, slash komutları ve agent sistemi için: [USAGE.md](USAGE.md)

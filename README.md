<p align="center">
  <img src="public/logo.svg" alt="Nurdle" width="100" />
</p>

<h1 align="center">Nurdle</h1>

<p align="center">
  Risale-i Nur külliyatındaki kelimelerle oynanan Türkçe Wordle oyunu.
</p>

---

## Teknoloji

| Katman     | Teknoloji                                                        |
| ---------- | ---------------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite 7, Tailwind CSS 3, TanStack Query v5  |
| Backend    | Hono, TypeScript, Cloudflare Workers *(Faz 1)*                  |
| Veritabanı | Cloudflare D1 (SQLite) *(Faz 1)*                                |
| Depolama   | Cloudflare R2 *(Faz 2)*                                         |
| CI/CD      | GitHub Actions                                                   |

## Proje Yapısı

```
nurdle/
├── apps/
│   ├── frontend/          # React 19 + Vite uygulaması (@nurdle/frontend)
│   │   ├── src/
│   │   │   ├── components/    # React bileşenleri
│   │   │   ├── hooks/         # Custom hook'lar
│   │   │   ├── context/       # React Context (ThemeProvider vb.)
│   │   │   ├── data/          # words.json (Faz 1'de D1'e taşınacak)
│   │   │   ├── types/         # TypeScript tipleri
│   │   │   └── utils/         # Yardımcı fonksiyonlar
│   │   └── public/            # Statik dosyalar, PWA manifest
│   └── backend/           # Hono API (@nurdle/backend) — Faz 1
│       ├── migrations/        # D1 migration dosyaları
│       └── src/
│           ├── routes/        # HTTP rotaları
│           ├── services/      # İş mantığı
│           ├── repositories/  # D1 veri erişim katmanı
│           ├── schemas/       # Zod doğrulama şemaları
│           └── types/         # TypeScript tipleri
└── packages/
    └── shared/            # Ortak TypeScript tipleri (@nurdle/shared)
```

## Oyun Modları

- **Günlük Mod** — Her gün yeni bir kelime; tüm oyuncular aynı kelimeyi çözer
- **Sınırsız Mod** — Dilediğin kadar oyna, her seferinde rastgele kelime

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
pnpm dev:frontend    # localhost:5173
pnpm dev:backend     # localhost:8787
```

Frontend geliştirme sunucusu `/api/` isteklerini otomatik olarak backend'e (8787) proxy'ler.

## Build ve Typecheck

```bash
pnpm build
pnpm typecheck
```

## Veritabanı Migration

```bash
# Lokal
pnpm --filter @nurdle/backend run db:migrate:local

# Production
pnpm --filter @nurdle/backend run db:migrate:remote
```

## Testler

```bash
# Backend testleri
pnpm --filter @nurdle/backend run test

# Watch modunda
pnpm --filter @nurdle/backend run test:watch
```

## Deploy

`main` branch'e push üzerinden GitHub Actions ile otomatik deploy edilir.

- **Frontend**: Cloudflare Pages
- **Backend**: Cloudflare Workers (`api.nurdle.app`)

### Hangi deploy tetiklenir?

| Değişen dizin        | Backend deploy | Frontend deploy |
| -------------------- | -------------- | --------------- |
| `apps/backend/**`    | Evet           |                 |
| `apps/frontend/**`   |                | Evet            |
| `packages/shared/**` | Evet           | Evet            |

### Gerekli GitHub Secrets

- `CLOUDFLARE_API_TOKEN` — Scoped API Token (Workers Scripts Edit + Pages Edit)
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare hesap ID'si

## Agent Sistemi

Bu proje Claude Code multi-agent sistemini kullanır. Prompt sonuna `xN` ekleyerek multi-agent modu aktifleştirilir:

```
x3  → 1 Principal + 1 Staff Engineer + 1 Analyst
x5  → 1 Principal + 1 Staff Eng + 1 MidCoder + 1 Lead Analyst + 1 Analyst
x7  → 1 Principal + 2 Staff Eng + 1 MidCoder + 1 Lead Analyst + 2 Analyst
x10 → 2 Principal + 2 Staff Eng + 2 MidCoder + 1 Lead Analyst + 3 Analyst
```

Tam kural seti: `AGENTS.md`

## Geliştirme Fazları

| Faz   | Kapsam                                          | Durum      |
| ----- | ----------------------------------------------- | ---------- |
| Faz 1 | Monorepo + Hono Backend + D1 + words.json → DB  | Geliştirme |
| Faz 2 | Custom kelime listeleri, admin paneli, R2        | Planlama   |
| Faz 3 | Kullanıcı hesapları, leaderboard, ticari model  | Roadmap    |

Detaylı roadmap: `products.md`

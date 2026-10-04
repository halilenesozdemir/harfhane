# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 2.x.x   | Active             |
| < 2.0   | Not supported      |

---

## Security Model

Harfhane, Cloudflare Workers üzerinde çalışan bir Hono backend + React frontend'den oluşur.

### Authentication

| Mekanizma | Detay |
|-----------|-------|
| JWT | `Authorization: Bearer <token>` header ile taşınır |
| Google OAuth | ID token backend'de doğrulanır, kendi JWT'miz üretilir |
| Token yenileme | Silent refresh — 14 dakikada bir + visibility change |
| Session | `localStorage`'da token; sensitive veri yok |

### Veri Depolama

| Veri | Konum | Hassasiyet |
|------|-------|------------|
| JWT token | localStorage | Düşük (short-lived) |
| Oyun durumu | localStorage | Hayır |
| İstatistik | localStorage + D1 | Hayır |
| Kullanıcı verisi | Cloudflare D1 | Evet — backend'de |
| Push subscription | Cloudflare D1 | Evet — backend'de |

### API Güvenliği

- Rate limiting: auth endpointleri için `rateLimiter`, oyun endpointleri için `gameRateLimiter`
- CORS: sadece `harfhane.app`, `localhost:5173`, `localhost:4173`, `*.harfhane.pages.dev`
- Security headers: `securityHeaders` middleware — CSP, X-Frame-Options, HSTS
- Input validation: tüm route'larda Zod schema
- Admin routes: `X-Admin-Secret` header kontrolü

### Content Security Policy

Frontend için `public/_headers` (Cloudflare Pages):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.harfhane.app https://accounts.google.com https://oauth2.googleapis.com; manifest-src 'self'; worker-src 'self'; frame-ancestors 'none'
```

Backend API için `src/middleware/security-headers.ts`.

---

## Known Limitations

1. **Admin Secret**: `X-Admin-Secret` header ile korunan admin rotaları, header-based auth kullanır. Faz 3'te JWT tabanlı role sistemine geçilecek.
2. **localStorage token**: XSS saldırısına karşı httpOnly cookie kadar güçlü değil. Token kısa ömürlüdür (15 dakika), refresh token D1'de saklanır.

---

## Security Best Practices

### Geliştirici Kuralları

- Secrets asla kaynak kodda — `.dev.vars` ve Cloudflare Secrets
- `dangerouslySetInnerHTML` yasak
- SQL sorgularında parameterized query — D1 `prepare().bind()` kullan
- `console.*` production'da yasak

### Bağımlılık Yönetimi

```bash
pnpm audit              # zafiyet taraması
```

- Kritik patch: 48 saat içinde
- Bağımlılık güncellemesi: aylık

---

## Güvenlik Açığı Bildirimi

GitHub'da public issue açma. Doğrudan iletişime geç.

| Önem | İlk Yanıt | Hedef Fix |
|------|-----------|-----------|
| Critical | 24 saat | 48 saat |
| High | 48 saat | 1 hafta |
| Medium | 1 hafta | 2 hafta |
| Low | 2 hafta | Sonraki release |

---

**Son Güncelleme:** Mart 2026
**Versiyon:** 2.2.0

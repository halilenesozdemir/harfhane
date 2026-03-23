---
description: Cloudflare'a deploy et. Kullanım: /deploy [frontend|backend|both]
---

Cloudflare'a deploy yap.

Argüman: $ARGUMENTS (frontend | backend | both — default: her ikisini de sor)

Adımlar:
1. Argümanı parse et:
   - `frontend` → sadece frontend
   - `backend` → sadece backend
   - `both` → her ikisi
   - Boşsa → kullanıcıya sor
2. Deploy öncesi kontrol:
   - `git status` — uncommitted değişiklik var mı? Uyar.
   - `pnpm typecheck` — tip hatası var mı? Varsa dur.
3. Kullanıcıdan onay al: "Deploy edilecek: [frontend/backend/both] — devam?"

### Frontend Deploy
```
pnpm --filter @nurdle/frontend run build
```
Build başarılıysa:
```
pnpm --filter @nurdle/frontend exec wrangler pages deploy dist --project-name nurdle
```

### Backend Deploy
```
pnpm --filter @nurdle/backend run deploy
```

4. Deploy sonucunu raporla:
   - URL'ler
   - Deploy süresi
   - Hata varsa tam çıktı

Kural: `CLOUDFLARE_API_TOKEN` env var yoksa kullanıcıya hatırlat.
Kural: Production deploy her zaman onay gerektirir — auto-deploy yok.

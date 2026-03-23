---
description: Session başında proje durumunu yükle ve özetle. Her yeni konuşmada ilk çalıştır.
---

Proje durumunu yükle ve özet sun.

```bash
git branch --show-current
git log -5 --oneline
git status --short
```

Ardından şunu sun:

```
## Proje Durumu — Nurdle

**Branch**: [branch adı]
**Son 5 Commit**: [liste]
**Uncommitted**: [var/yok]

### Aktif Fazlar
- Faz 2: Custom Word Lists + Admin Panel [Geliştirme]

### Dosya Yapısı
- apps/frontend/ — React 19 + Vite
- apps/backend/ — Hono + Cloudflare Workers
- packages/shared/ — Ortak tipler
- .claude/ — Claude Code altyapısı

### Kullanılabilir Komutlar
/commit   /review   /pr   /test   /check   /deploy   /plan   /schema-audit

### Sıradaki Adım
[Git log ve status'a bakarak ne üzerinde çalışıldığını tahmin et]
```

Özeti verdikten sonra: "Nasıl devam edelim?" diye sor.

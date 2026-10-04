---
description: Tam kalite kapısı — TypeScript check + test + kod incelemesi. Commit öncesi çalıştır.
---

Tam quality gate çalıştır. Bu komutu her PR öncesi çalıştır.

Adımlar (sırayla):

### 1. TypeScript Check
```
pnpm typecheck
```
Hata varsa listele, devam etme — önce düzelt.

### 2. Backend Testleri
```
pnpm --filter @harfhane/backend run test
```
Başarısız test varsa listele.

### 3. Staged Değişiklik İncelemesi
`git diff --staged` çalıştır ve `.claude/skills/clean-code/SKILL.md` checklist'ini uygula:
- Console.* var mı?
- any tipi var mı?
- Yorum var mı?
- Fonksiyon 20 satırı geçiyor mu?
- Dosya 250 satırı geçiyor mu?

### 4. Harfhane-Spesifik Kontroller
- Turkish character'lar doğru mu?
- normalizeWord() kullanılıyor mu (toUpperCase yerine)?
- cursor-pointer interactive elementlerde var mı?
- D1 multi-statement exec() var mı?

### 5. Özet Rapor

```
## Quality Gate Raporu

**TypeScript**: ✅ Temiz | ❌ {n} hata
**Tests**: ✅ {n}/{n} geçti | ❌ {n} başarısız
**Clean Code**: ✅ Temiz | ⚠️ {n} uyarı
**Harfhane Rules**: ✅ Temiz | ❌ {n} ihlal

**Karar**: Commit'e hazır | Düzeltme gerekli
```

Hata yoksa `/commit` çalıştırmayı öner.

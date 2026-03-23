---
description: Backend testlerini çalıştır ve sonuçları özetle. Kullanım: /test [dosya-pattern]
---

Testleri çalıştır ve sonuçları analiz et.

Argüman: $ARGUMENTS

Adımlar:
1. Hedefi belirle:
   - Argüman varsa: `pnpm --filter @nurdle/backend run test -- $ARGUMENTS`
   - Argüman yoksa: `pnpm --filter @nurdle/backend run test`
2. Test sonuçlarını oku
3. Özeti sun:

```
## Test Sonuçları

**Toplam**: {n} test
**Geçen**: {n} ✓
**Başarısız**: {n} ✗
**Atlanan**: {n} -

### Başarısız Testler

- [test adı] — [dosya:satır]
  Hata: [mesaj]

### Coverage (varsa)

| Scope | Coverage |
|-------|----------|
| Overall | {n}% |
| Statements | {n}% |

### Değerlendirme

[Coverage hedefleri karşılanıyor mu? Başarısız testler için öneri]
```

4. Eğer testler başarısız olursa root cause analizi yap ve düzeltme öner.

Hedef coverage:
- Genel: ≥80%
- Critical fonksiyonlar: ≥90%
- Utility'ler: ≥95%

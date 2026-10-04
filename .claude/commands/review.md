---
description: Staged veya belirtilen dosyaların kod incelemesini yap. Kullanım: /review [dosya-yolu]
---

Kod incelemesi yap. Argüman verilmişse o dosyayı, verilmemişse staged değişiklikleri incele.

Argüman: $ARGUMENTS

Adımlar:
1. Hedefi belirle:
   - Argüman varsa: belirtilen dosyayı oku
   - Argüman yoksa: `git diff --staged` ile staged değişiklikleri al
   - İkisi de yoksa: `git diff HEAD~1` ile son commit'i incele
2. `.claude/skills/code-review/SKILL.md` kurallarını uygula
3. `.claude/skills/clean-code/SKILL.md` checklist'ini kontrol et
4. Raporu şu formatta sun:

```
## Code Review Raporu

**Scope**: [incelenen dosya/değişiklik]
**Sonuç**: Onaylandı | Revizyon Gerekli | Reddedildi

### Critical (Blocker)
- [dosya:satır] — açıklama

### Major
- [dosya:satır] — açıklama

### Minor
- [dosya:satır] — açıklama

### Özet
Critical: {n} | Major: {n} | Minor: {n}
Karar: [Onayla / Revizyon iste]
```

Harfhane-spesifik kontroller:
- Turkish characters doğru mu? (ç, ş, ğ, ı, ö, ü)
- cursor-pointer var mı interactive elementlerde?
- Emoji var mı UI'da? (yasak — Lucide icon kullan)
- Turkish uppercase için normalizeWord() kullanılıyor mu?
- D1 exec() multi-statement var mı? (yasak)

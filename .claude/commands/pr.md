---
description: Mevcut branch için GitHub Pull Request oluştur.
---

Mevcut branch'teki değişiklikleri PR olarak aç.

Adımlar:
1. `git status` ve `git log main..HEAD --oneline` çalıştır — değişiklikleri anla
2. `git diff main...HEAD` çalıştır — tam diff'i incele
3. PR başlığı ve açıklaması oluştur:

```markdown
## Summary

- [Ne değişti ve neden]
- [Teknik yaklaşım]
- [Trade-off veya kararlar]

## Changed Files

- [dosya — ne değişti]

## Test Plan

1. [Test adımı]
2. [Edge case]
3. [Beklenen sonuç]

## References

- [İlgili issue, doc, karar]
```

4. PR boyutunu kontrol et:
   - 500 satır üstündeyse uyar ve bölmeyi öner
   - 15 dosya üstündeyse uyar
5. Kullanıcıya başlık + açıklamayı göster ve onay al
6. Onay gelince:
   - `git push -u origin HEAD` (yoksa)
   - `gh pr create --title "..." --body "..."` çalıştır
7. PR URL'ini kullanıcıya ver

Kural: Hiçbir zaman main'e doğrudan push etme. Force-push yapma.

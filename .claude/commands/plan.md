---
description: Yeni bir feature için RIPER protokolüyle uygulama planı oluştur. Kullanım: /plan <feature açıklaması>
---

RIPER protokolüyle feature planı oluştur.

Feature: $ARGUMENTS

## R — Research (Araştır)

1. İlgili mevcut kodu oku:
   - `apps/frontend/src/` içinde ilgili component/hook var mı?
   - `apps/backend/src/` içinde ilgili route/service/repo var mı?
   - `packages/shared/src/` içinde ilgili tip var mı?
2. Mevcut pattern'leri tespit et — ne zaten yapılmış?
3. Bağımlılıkları belirle — neleri etkileyecek?

## I — Innovate (Tasarla)

4. En az 2 yaklaşım öner:
   - Yaklaşım A: [açıklama, artılar, eksiler]
   - Yaklaşım B: [açıklama, artılar, eksiler]
5. Önerilen yaklaşımı belirt ve gerekçesini açıkla

## P — Plan (Planla)

6. Task breakdown oluştur:

```
## Uygulama Planı — [Feature Adı]

### Etkilenen Dosyalar
- [dosya] — [ne değişecek]

### Task Listesi (öncelik sırasıyla)
1. [ ] DB migration (varsa)
2. [ ] Shared types
3. [ ] Backend: repository
4. [ ] Backend: service
5. [ ] Backend: route + Zod schema
6. [ ] Backend: tests
7. [ ] Frontend: API client
8. [ ] Frontend: hook
9. [ ] Frontend: component
10. [ ] Frontend: integration test

### Agent Önerisi
Bu iş için: x{3|5|7|10} — [neden]

### Risk
- [Risk 1] — [önlem]
```

7. Kullanıcıdan onay al. Onay gelince implement et.

## E — Execute (Uygula)
Onay sonrası göreve geç.

## R — Review (Gözden Geçir)
Uygulama sonrası `/review` çalıştır.

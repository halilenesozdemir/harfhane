---
name: RIPER Workflow
description: Activated for non-trivial feature development tasks. Enforces Research→Innovate→Plan→Execute→Review phases. Prevents jumping to implementation before understanding the problem. Use /plan command to trigger.
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# RIPER Workflow Skill

Non-trivial feature veya architectural değişiklik için zorunlu 5-adım protokol.

**Atla:** Tek satır fix, typo, tek dosya değişikliği, analysis-only görevler.
**Uygula:** Yeni feature, multi-file değişiklik, DB şema değişikliği, mimari karar.

---

## R — Research (Araştır)

Kodla başlama. Önce anla.

1. Mevcut kodu tara — ne zaten var?
2. İlgili dosyaları oku: routes, services, repositories, components, hooks, types
3. Pattern'leri tespit et — proje nasıl organize edilmiş?
4. Bağımlılıkları belirle — bu değişiklik neyi etkiler?
5. Blocker'ları tespit et — DB migration gerekiyor mu? Breaking change var mı?

**Output:**
```
Research Özeti:
- Mevcut: [ne var]
- Eksik: [ne yok]
- Bağımlılıklar: [etkilenen dosyalar]
- Riskler: [potansiyel sorunlar]
```

---

## I — Innovate (Tasarla)

En az 2 yaklaşım düşün.

```
Yaklaşım A: [açıklama]
+ Artılar
- Eksiler

Yaklaşım B: [açıklama]
+ Artılar
- Eksiler

Öneri: Yaklaşım [A/B] — çünkü [gerekçe]
```

---

## P — Plan (Planla)

Task breakdown yap. Onay al. Sonra implement et.

```
## Uygulama Planı

### Etkilenen Dosyalar
- [dosya] — [değişiklik türü]

### Task Sırası
1. [ ] Shared types (packages/shared/)
2. [ ] DB migration (migrations/)
3. [ ] Repository method
4. [ ] Service logic
5. [ ] Route + Zod schema
6. [ ] Backend tests
7. [ ] Frontend API client
8. [ ] Custom hook
9. [ ] Component
10. [ ] /check çalıştır

### Onay Gerekli
[Bu planı onaylıyor musun?]
```

**Onay alınmadan Execute'a geçme.**

---

## E — Execute (Uygula)

Plan onaylandıktan sonra:

1. Task'ları sırayla uygula.
2. Her task sonrası kısa kontrol yap — plan hâlâ geçerli mi?
3. Beklenmedik bir şey çıkarsa dur ve kullanıcıya danış.
4. **Circuit breaker:** Eğer aynı hatayı 2 kez yaşadıysan dur — farklı yaklaşım dene.
5. Hiçbir zaman plan dışı dosya düzenleme.

---

## R — Review (Gözden Geçir)

Implement sonrası:

1. `/check` komutunu çalıştır (typecheck + test + clean-code).
2. `.claude/skills/code-review/SKILL.md` checklist'ini uygula.
3. Harfhane-spesifik kontroller:
   - Turkish chars doğru mu?
   - cursor-pointer var mı?
   - normalizeWord() kullanılıyor mu?
4. Sonucu kullanıcıya raporla.
5. Review temizse `/commit` öner.

---

## Circuit Breaker Kuralları

- Aynı hata **2 kez** tekrarlandıysa: dur, farklı yaklaşım öner.
- **3 re-plan** döngüsü geçtiyse: kullanıcıya escalate et.
- Test başarısız ve sebebi net değilse: analiz yap, implement etme.
- 10 dosyadan fazla değişiklik gerekiyorsa: plan'ı böl, küçük PR'lara dönüştür.

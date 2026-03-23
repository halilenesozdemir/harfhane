---
description: Veritabanı şema değişikliklerini doğrula. Migration öncesi çalıştır.
---

D1 veritabanı şema değişikliklerini denetle.

Adımlar:

### 1. Migration Dosyalarını İncele
```bash
ls -la apps/backend/migrations/
```
- Numbering doğru mu? (0001, 0002, 0003...)
- Son migration hangi tarihe ait?
- Eksik numara var mı?

### 2. Şema Tutarlılığı Kontrolü
Son migration dosyasını oku ve kontrol et:
- [ ] `CREATE TABLE` ifadeleri PRIMARY KEY içeriyor mu?
- [ ] Foreign key'ler `REFERENCES` + `ON DELETE` tanımlı mı?
- [ ] `UNIQUE` constraint'ler doğru tanımlı mı? (`UNIQUE(date, length)` gibi)
- [ ] `is_active` alanı soft-delete için mevcut mu?
- [ ] `created_at` için `DEFAULT (datetime('now'))` var mı?

### 3. Shared Types Uyumu
`packages/shared/src/index.ts` içindeki tipleri oku:
- DB şemasındaki alanlar TypeScript tiplerine yansımış mı?
- Yeni sütun varsa shared type güncellendi mi?

### 4. Repository Uyumu
`apps/backend/src/repositories/` içindeki query'leri kontrol et:
- Yeni/değişen sütunlar query'lerde kullanılıyor mu?
- D1 multi-statement exec() kullanımı var mı? (YASAK — sadece prepare().run())

### 5. Rapor

```
## Schema Audit Raporu

**Migration**: [en son migration dosyası]
**Tarih**: [dosya tarihi]

### Kontroller
- [ ] Numbering sıralı
- [ ] PRIMARY KEY var
- [ ] Foreign keys tanımlı
- [ ] UNIQUE constraints doğru
- [ ] Soft delete (is_active) mevcut
- [ ] Shared types güncellendi
- [ ] Repository query'leri uyumlu
- [ ] Hiçbir exec() multi-statement yok

**Sonuç**: Güvenli | Düzeltme Gerekli
```

Sorun varsa ne düzeltileceğini belirt.

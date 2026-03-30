# Nurdle — Claude Code Kullanım Kılavuzu

> Bu dosya, Harfhane projesindeki AI altyapısını günlük geliştirme sürecinde nasıl kullanacağını açıklar.

---

## 1. Her Oturum Başında

```
/prime-context
```

Git durumunu, son commitleri ve aktif planı yükler. Her konuşmaya bununla başla.

**Neden:** Claude her konuşmayı sıfırdan başlatır. Bu komut, önceki oturumun bıraktığı noktayı ve proje bağlamını hızla yükler.

---

## 2. İşin Büyüklüğüne Göre xN Seç

Prompt sonuna `xN` ekleyerek kaç agent çalışacağını belirlersin.

| Durum | Suffix | Agent Sayısı |
|-------|--------|-------------|
| Tek satır fix, typo düzeltme | Yok | 1 |
| Küçük değişiklik, tek dosya | Yok | 1 |
| Küçük feature + test | `x3` | 3 |
| Orta feature, birden fazla dosya | `x5` | 5 |
| Büyük feature (backend + frontend + test) | `x7` | 7 |
| Major refactor veya mimari değişiklik | `x10` | 10 |

**Örnek kullanım:**
```
Wordle oyununa ipucu sistemi ekle x5
Admin paneline bulk word import özelliği ekle x7
```

**Neden:** Küçük işlerde tek agent daha hızlı ve ucuzdur. Büyük işlerde paralel çalışan uzman agentlar hem hızı artırır hem de hata riskini düşürür.

---

## 3. Yeni Feature'larda PEP Süreci

Yeni bir özellik veya çok dosyalı değişiklik istediğinde Claude sana otomatik olarak soru sorar:

```
1. Claude → 3-5 soru sorar (kapsam, davranış, teknik karar)
2. Sen    → soruları cevaplarsın
3. Claude → onaylı plan üretir (hangi dosyalar, hangi agentlar)
4. Sen    → planı onaylarsın
5. Claude → implement eder
```

**PEP'i atlamak istersen:**
```
Şunu hemen yap: login formuna validasyon ekle
```

**Daha detaylı plan görmek istersen:**
```
/plan <feature adı>
```

**Neden:** Büyük işlerde önce anlaşmak, implementasyonu yarıda bırakmaktan çok daha ucuzdur. PEP, "yanlış anlamışım" sorununu önler.

---

## 4. Slash Komutları

Claude Code'da `/` ile başlayan komutlar önceden tanımlı iş akışlarını çalıştırır.

| Komut | Ne yapar | Ne zaman kullanılır |
|-------|----------|---------------------|
| `/prime-context` | Proje durumunu yükler | Her oturum başında |
| `/plan <feature>` | RIPER protokolüyle feature planı üretir | Büyük işe başlamadan önce |
| `/check` | Typecheck + test + clean-code kontrolü | Commit öncesi |
| `/review` | Staged dosyaları code review yapar | Commit öncesi |
| `/commit` | Conventional Commit mesajı üretir ve commit atar | Değişiklikler hazır olduğunda |
| `/test` | Backend testlerini çalıştırır ve özetler | Test yazarken / debug ederken |
| `/deploy frontend` | Cloudflare Pages'e deploy eder | Release zamanı |
| `/deploy backend` | Cloudflare Workers'a deploy eder | Release zamanı |
| `/schema-audit` | DB migration değişikliğini doğrular | Migration öncesi |

---

## 5. Tipik İş Akışları

### Küçük Fix

```
1. Problemi yaz → Claude düzeltir
2. /check
3. /commit
```

### Yeni Feature

```
1. /prime-context
2. "X özelliğini ekle x5" → PEP soruları → planı onayla
3. Claude implement eder
4. /check       → typecheck + test geçmeli
5. /review      → kod kalitesini kontrol et
6. /commit      → commit mesajı üret ve onayla
7. /deploy      → gerekirse deploy et
```

### DB Şema Değişikliği

```
1. Migration dosyasını yaz
2. /schema-audit    → tutarlılık kontrolü
3. /check
4. /commit
5. wrangler d1 migrations apply (manuel)
```

---

## 6. Otomatik Çalışan Şeyler

Bunlar hook olarak çalışır — senin bir şey yapman gerekmez:

| Tetikleyici | Ne olur |
|-------------|---------|
| Herhangi bir dosya düzenlendiğinde | Prettier otomatik formatlar |
| `.ts` / `.tsx` dosyası değiştiğinde | TypeScript type check çalışır, hatalar terminale düşer |
| `rm -rf`, `sudo`, `curl \| bash` denendiğinde | Komut bloklanır, uyarı verilir |
| Oturum kapandığında | `.github/logs/sessions.log`'a kayıt düşülür |

**Neden:** Formatlama ve type check manuel çalıştırmak unutuluyor. Hook'lar bu disiplini otomatik sağlar.

---

## Hızlı Referans

```
/prime-context   → oturum başlangıcı
/plan            → büyük iş planla
/check           → commit öncesi kalite kapısı
/commit          → commit at
/deploy          → cloudflare'e gönder
/schema-audit    → db değişikliği öncesi kontrol

xN suffix        → paralel agent sayısı (x3/x5/x7/x10)
PEP              → soru-cevap → plan → implement sırası
```

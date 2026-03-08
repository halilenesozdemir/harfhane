# Multi-Agent Delegation System — Kullanım Kılavuzu

> Versiyon: 4.7.0 | Son Güncelleme: 2026-02-26

---

## İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Sistem Mimarisi](#sistem-mimarisi)
3. [Agent Katmanları](#agent-katmanları)
4. [xN Delegasyon Parametresi](#xn-delegasyon-parametresi)
5. [Slash Komutları](#slash-komutları)
6. [Review Zinciri](#review-zinciri)
7. [Proje Bağlamı Keşfi (PCD)](#proje-bağlamı-keşfi-pcd)
8. [Prompt Zenginleştirme Protokolü (PEP)](#prompt-zenginleştirme-protokolü-pep)
9. [Skill Dosyaları](#skill-dosyaları)
10. [Maliyet Optimizasyonu](#maliyet-optimizasyonu)
11. [Özelleştirme](#özelleştirme)
12. [Model Fallback](#model-fallback)
13. [Session Memory](#session-memory)
14. [Çakışma Önleme Mekanizması](#çakışma-önleme-mekanizması)
15. [Metrik Toplama Sistemi](#metrik-toplama-sistemi)
16. [Token Optimizasyonu](#token-optimizasyonu)
17. [Araçlar](#araçlar)
18. [SSS](#sss)

---

## Hızlı Başlangıç

### 1. Boilerplate'i Projenize Kopyalayın

```bash
# Boilerplate'i kendi projenize kopyalayın
cp -r agentDelegation/.github /path/to/your/project/
cp agentDelegation/AGENTS.md /path/to/your/project/
cp agentDelegation/.vscode/settings.json /path/to/your/project/.vscode/
```

### 2. VS Code'da Açın

VS Code 1.109+ gereklidir. Copilot Chat veya GitHub Copilot Agent Mode aktif olmalıdır.

### 3. İlk Kullanım

```
# Tek agent modu (varsayılan)
Kullanıcı modülünü oluştur

# Multi-agent modu
/delegate Auth modülünü oluştur, JWT authentication ekle x7
```

---

## Sistem Mimarisi

```
┌──────────────────────────────────────────────────────────────────┐
│                         Kullanıcı                                │
│                       prompt + xN                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    🎯 Orchestrator                                │
│                 Claude Opus 4.6 (copilot)                        │
│          Görev analizi → Bölme → Dağıtım → Toplama               │
└──┬────────────┬────────────┬────────────┬────────────┬───────────┘
   │            │            │            │            │
   ▼            ▼            ▼            ▼            ▼
┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐
│ Tier 1 │ │ Tier 1.5 │ │ Tier 2 │ │ Tier 2.5 │ │   Tier 3   │
│Princip.│ │Staff Eng │ │MidCoder│ │Lead Anl. │ │  Analyst   │
│  x1-2  │ │   x1-2   │ │  x1-2  │ │   x1     │ │   x1-3     │
│ Claude │ │  Claude  │ │  GPT   │ │ Gemini   │ │  Gemini    │
│ Opus   │ │  Sonnet  │ │  5.3   │ │ 3.1 Pro  │ │  3 Flash   │
│  4.6   │ │   4.6    │ │ Codex  │ │(Preview) │ │            │
└────┬───┘ └────┬─────┘ └───┬────┘ └────┬─────┘ └─────┬──────┘
     │          │           │           │              │
     │     ◄────┘ review    │           │              │
     │                 ◄────┘ review    │              │
     │                            ◄─────┘ review ─────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Nihai Çıktı → Kullanıcı                       │
└──────────────────────────────────────────────────────────────────┘
```

### Review Zinciri

```
Analyst çıktısı ──review──▶ Lead Analyst ──konsolide──▶ (kodlama agentlar için hazır)
MidCoder çıktısı ──review──▶ Staff Engineer ──review──▶ Principal ──▶ Orchestrator ──▶ Kullanıcı
```

---

## Agent Katmanları

### Tier 1 — Principal (Claude Opus 4.6)

| Agent          | Rol                                   | Tool Erişimi                     |
| -------------- | ------------------------------------- | -------------------------------- |
| PrincipalAlpha | Birincil mimari, quality gate, review | edit, search, read, fetch, agent |
| PrincipalBeta  | İkincil mimari (x10 modunda aktif)    | edit, search, read, fetch, agent |

**Ne yapar?**

- Teknik mimari kararlar alır
- Staff Engineer çıktılarını review eder
- ADR (Architecture Decision Record) formatında karar belgeleri üretir
- Nihai kalite kapısı olarak görev yapar

**Ne yapmaz?**

- Basit/tekrarlayan kodlama görevleri (Staff Engineer devralır)
- Analiz ve araştırma işleri

### Tier 1.5 — Staff Engineer (Claude Sonnet 4.6)

| Agent              | Rol                                       | Tool Erişimi              |
| ------------------ | ----------------------------------------- | ------------------------- |
| StaffEngineerAlpha | Birincil kodlama, feature implementasyonu | edit, search, read, fetch |
| StaffEngineerBeta  | İkincil kodlama (x7+ modunda aktif)       | edit, search, read, fetch |

**Ne yapar?**

- Tüm kodlama görevlerini üstlenir (feature, modül, servis, component)
- Karmaşık iş mantığı ve core modüller yazar
- MidCoder çıktılarını review eder ve gerekirse düzeltir
- Production-ready kalitede kod üretir

**Ne yapmaz?**

- Mimari kararlar almaz (belirsizlikte Principal'a yönlendirir)
- Alt-agent çalıştıramaz (`agent` tool yok)

### Tier 2 — MidCoder (GPT-5.3-Codex)

| Agent         | Rol                                 | Tool Erişimi       |
| ------------- | ----------------------------------- | ------------------ |
| MidCoderAlpha | Birincil basit kodlama              | edit, search, read |
| MidCoderBeta  | İkincil kodlama (x10 modunda aktif) | edit, search, read |

**Ne yapar?**

- API endpoint'leri, utility fonksiyonlar, component'ler yazar
- Boilerplate kod üretir
- Unit test yazar

**Ne yapmaz?**

- Mimari kararlar almaz (belirsizlikte Staff Engineer veya Principal'a yönlendirir)
- Dış kaynak erişimi (`fetch` yok)

### Tier 2.5 — Lead Analyst (Gemini 3.1 Pro Preview)

| Agent       | Rol                                 | Tool Erişimi        |
| ----------- | ----------------------------------- | ------------------- |
| LeadAnalyst | Analyst çıktı review, konsolidasyon | read, search, fetch |

**Ne yapar?**

- Analyst (Tier 3) çıktılarını review eder ve kalite kontrolü yapar
- Birden fazla Analyst raporunu tek bir tutarlı raporda birleştirir
- Bulguları öncelik sırasına koyar (P0 > P1 > P2)
- Eksik veya hatalı analizler için düzeltme talep eder (maks 2 tur)

**Ne yapmaz?**

- ❌ ASLA dosya düzenlemez (salt okunur)
- ❌ Alt-agent çalıştıramaz
- ❌ Kodlama agent'larının kararlarını override edemez

### Tier 3 — Analyst (Gemini 3 Flash)

| Agent        | Rol                                     | Tool Erişimi        |
| ------------ | --------------------------------------- | ------------------- |
| AnalystAlpha | Kod tabanı analizi, bağımlılık auditi   | read, search, fetch |
| AnalystBeta  | Performans analizi, güvenlik auditi     | read, search, fetch |
| AnalystGamma | Test senaryosu üretimi, doküman analizi | read, search, fetch |

**Ne yapar?**

- Kod tabanı haritalama, karmaşıklık analizi
- Bağımlılık ve güvenlik auditi
- Doküman okuma ve özetleme
- Test senaryosu üretimi

**Ne yapmaz?**

- ❌ ASLA dosya düzenlemez (salt okunur)
- ❌ Alt-agent çalıştıramaz

---

## xN Delegasyon Parametresi

Prompt sonuna `xN` ekleyerek multi-agent modunu aktive edin.

### Sabit Dağılımlar

| Parametre | Toplam | Principal | Staff Eng | MidCoder | Lead Analyst | Analyst | Açıklama                    |
| --------- | ------ | --------- | --------- | -------- | ------------ | ------- | --------------------------- |
| _(yok)_   | 1      | —         | —         | —        | —            | —       | Tek agent, varsayılan model |
| `x3`      | 3      | 1         | 1         | 0        | 0            | 1       | Minimum ekip                |
| `x5`      | 5      | 1         | 1         | 1        | 1            | 1       | Standart ekip               |
| `x7`      | 7      | 1         | 2         | 1        | 1            | 2       | Genişletilmiş ekip          |
| `x10`     | 10     | 2         | 2         | 2        | 1            | 3       | Tam ekip                    |

### Dinamik Dağılım

x3, x5, x7, x10 dışındaki değerler oransal dağılır:

- **Tier 1 (Principal)**: ~%15 (en az 1)
- **Tier 1.5 (Staff Eng)**: ~%20 (en az 1)
- **Tier 2 (MidCoder)**: ~%20 (N ≥ 5 ise en az 1)
- **Tier 2.5 (Lead Analyst)**: ~%10 (N ≥ 5 ise en az 1)
- **Tier 3 (Analyst)**: ~%35 (kalan)

Örnek: `x8` → 1 Principal + 2 Staff Eng + 2 MidCoder + 1 Lead Analyst + 2 Analyst

### Kullanım Örnekleri

```
# Küçük görev — 3 agent yeterli
/delegate Login formu oluştur x3

# Orta görev — 5 agent
/delegate Kullanıcı modülünü CRUD ile birlikte oluştur x5

# Büyük görev — genişletilmiş ekip
/delegate E-ticaret sepet modülünü tasarla ve implement et x7

# Kapsamlı görev — tam ekip
/delegate Mikroservis mimarisine geçiş yap x10

# xN yok — tek agent
Şu bug'ı düzelt: login sayfasında redirect çalışmıyor
```

---

## Slash Komutları

| Komut        | Açıklama                  | Örnek                                   |
| ------------ | ------------------------- | --------------------------------------- |
| `/delegate`  | Multi-agent delegasyon    | `/delegate Auth modülü x7`              |
| `/review`    | Review zinciri başlat     | `/review src/auth/`                     |
| `/status`    | Delegasyon durumu         | `/status`                               |
| `/architect` | Doğrudan Principal görevi | `/architect Hexagonal architecture kur` |
| `/resume`    | Son session'ı geri yükle  | `/resume`                               |
| `/history`   | Session geçmişi listele   | `/history`                              |

### /delegate

Ana delegasyon komutu. `xN` parametresiyle agent sayısını belirler, görevi parçalar ve tier'lara dağıtır.

### /review

Manuel review zinciri. Belirtilen dosya/dizini veya tüm son çıktıları review zincirine sokar.

### /status

Mevcut oturumun durumunu gösterir — hangi agent ne yapıyor, review durumları, maliyet özeti.

### /architect

Orchestrator'ı atlayarak doğrudan PrincipalAlpha'ya mimari görev atar. Tek başına çözülebilecek mimari işler için idealdir.

### /resume

Son session'ın bağlamını ve aktif planı (`active-plan.md`) geri yükler. Token limiti nedeniyle yarıda kalan işlere kaldığı yerden devam etmek için kullanılır.

### /history

Son 20 session'ı listeler. Yeni bir geliştirici veya uzun aradan sonra projeye dönerken bağlam kazanmak için kullanılır.

---

## Review Zinciri

### Akış

```
1. Agent görevi tamamlar → Çıktı üretir
2. Reviewer çıktıyı inceler → Feedback verir
3a. ✅ Onay → Çıktı yukarı tier'a / Orchestrator'a gider
3b. ⚠️ Düzeltme → Agent düzeltir → Tekrar review (max 2 tur)
3c. ❌ Red → Üst tier devralır
```

### Severity Seviyeleri

| Seviye        | Aksiyon                                      |
| ------------- | -------------------------------------------- |
| 🔴 Critical   | Merge engelleyici — reviewer düzeltir        |
| 🟠 Major      | Mutlaka düzeltilmeli — görev sahibi düzeltir |
| 🟡 Minor      | Önerilir ama blocker değil                   |
| 🔵 Suggestion | Nice-to-have                                 |

### Kurallar

- Maksimum **2 düzeltme turu** — sonra üst tier devralır
- Analyst'ler Lead Analyst kararını override edemez
- Lead Analyst, kodlama agent'larının kararlarını override edemez
- MidCoder'lar Staff Engineer kararını override edemez
- Staff Engineer'lar Principal kararını override edemez
- Orchestrator arabuluculuk yapar

---

## Proje Bağlamı Keşfi (PCD)

> **v4.6.0+** — Bu özellik otomatik olarak aktiftir ve tüm agent'lar için geçerlidir.

Bu boilerplate'i bir projeye kopyaladığınızda, agent'lar otomatik olarak hedef projenin dokümanlarını tarar ve sistem bağlamı olarak kullanır. Böylece projeye özgü kurallar, mimari kararlar ve kodlama konvansiyonları tüm geliştirme sürecinde takip edilir.

### Taranan Kaynaklar

| Öncelik | Kaynak | Pattern | Açıklama |
|---------|--------|---------|----------|
| 1 | Root README | `README.md` | Ana proje dokümantasyonu |
| 2 | Root markdown dosyaları | `*.md` (kök dizin) | Katkı rehberleri, kodlama standartları |
| 3 | Docs klasörü | `docs/**/*.md` | Genişletilmiş dokümantasyon, tasarım dokümanları |
| 4 | Docs klasörü (diğer) | `docs/**/*.{txt,rst,adoc}` | Alternatif dokümantasyon formatları |

### Hariç Tutulan Dosyalar

Boilerplate'in kendi dosyaları proje bağlamı olarak **taranmaz**:

- `AGENTS.md` — Delegasyon sistemi kuralları
- `CHANGELOG.md` — Delegasyon sistemi değişiklikleri
- `LICENSE` — Lisans dosyası
- `USAGE.md` — Delegasyon sistemi kullanım kılavuzu
- `.github/**` — Delegasyon sistemi iç dosyaları

### Öncelik Hiyerarşisi

```
Seviye 1 (En yüksek): Boilerplate Yapısal Kuralları
  └─ Tier hiyerarşisi, review zinciri, dosya sahipliği, agent izinleri
  └─ Proje dokümanları tarafından ASLA geçersiz kılınamaz

Seviye 2: Proje-Spesifik Kurallar
  └─ Kodlama standartları, isimlendirme, mimari pattern'ler
  └─ Framework/kütüphane tercihleri, API tasarım kuralları
  └─ Boilerplate kodlama varsayılanlarını GEÇERSİZ KILAR

Seviye 3 (En düşük): Boilerplate Kodlama Varsayılanları
  └─ Varsayılan isimlendirme kuralları, varsayılan error handling
  └─ YALNIZCA proje dokümanlarında belirtilmediğinde uygulanır
```

### Örnek Kullanım Senaryoları

**Senaryo 1**: Bir React projesine bu boilerplate'i eklediniz. Projenin `README.md`'sinde "Tailwind CSS kullanılır, BEM isimlendirme yasaktır" yazıyor. Agent'lar boilerplate'in varsayılan BEM kuralları yerine projenin Tailwind tercihini takip eder.

**Senaryo 2**: Projenin `docs/api-guide.md`'sinde REST API isimlendirme kuralları tanımlı. Agent'lar API endpoint'leri yazarken bu kurallara uyar.

**Senaryo 3**: Projenin `CONTRIBUTING.md`'sinde "tab indent kullanın" diyor, boilerplate "space indent" diyor. Proje kuralı geçerlidir.

### Detaylar

Tam protokol: `.github/instructions/project-context-discovery.instructions.md`

---

## Prompt Zenginleştirme Protokolü (PEP)

> **v4.7.0+** — Bu özellik otomatik olarak aktiftir. Non-trivial görevlerde Orchestrator geliştirmeye başlamadan önce soru sorar.

Vague veya eksik prompt'lar hatalı implementasyona, token israfına ve revizyon döngülerine yol açar. PEP bu sorunu çözer — hedefe yönelik sorular sorarak gereksinimleri netleştirir ve detaylı plan oluşturur.

### Ne Zaman Aktif Olur?

| Durum | PEP Uygulanır? | Açıklama |
|-------|:--------------:|----------|
| Yeni feature, modül, component | ✅ Evet | Kapsam ve gereksinimler netleştirilir |
| Mimari değişiklik, refactoring | ✅ Evet | Yaklaşım ve kısıtlamalar belirlenir |
| Multi-file değişiklik | ✅ Evet | Etki alanı ve bağımlılıklar sorgulanır |
| API/veritabanı tasarımı | ✅ Evet | Şema ve davranış kararları alınır |
| Typo düzeltme, tek satır fix | ❌ Hayır | Trivial görevlerde atlanır |
| Analiz-only görevler | ❌ Hayır | Kod değişikliği olmayan görevlerde atlanır |
| `/resume` ile devam | ❌ Hayır | Zaten onaylanmış plan var |
| Kullanıcı "skip questions" derse | ❌ Hayır | Kullanıcı override'ı |

### Soru Kategorileri

Orchestrator, görev tipine göre en uygun kategorilerden **3-7 soru** seçer:

1. **Kapsam & Sınırlar**: Feature'ın neyi içerip neyi içermediği, entegrasyon kapsamı
2. **Davranışsal Gereksinimler**: Varsayılan değerler, limitler, hata senaryoları, edge case'ler
3. **Teknik Kararlar**: Mimari pattern, state yönetimi, veri modeli, auth stratejisi
4. **UI/UX Tercihleri**: Layout, component tercih, feedback pattern'leri (frontend görevleri için)
5. **Test & Kalite**: Coverage kapsamı, test senaryoları, performans hedefleri
6. **Proje Bağlam Uyumu**: Mevcut pattern'larla tutarlılık, isimlendirme, bağımlılık tercihi

### Süreç

```
1. Orchestrator prompt'u analiz eder
   └─ Net gereksinimler, varsayımlar, bilgi boşlukları, karar noktaları belirlenir

2. 3-7 hedefli soru sorulur
   └─ Seçenekli sorular, önerilen varsayılan ile birlikte
   └─ Kullanıcı tüm soruları tek seferde cevaplayabilir

3. Cevaplara göre implementasyon planı oluşturulur
   └─ Gereksinimler, teknik yaklaşım, görev dağılımı, agent atamaları

4. Kullanıcı onayı beklenir
   └─ Onay → implementasyon başlar
   └─ Değişiklik → plan revize edilir (max 2 tur)
   └─ "Just do it" → mevcut planla devam edilir
```

### Örnek Kullanım

```
Kullanıcı: "Auth modülünü oluştur x7"

Orchestrator (PEP):
  📋 Prompt Zenginleştirme — Clarification Questions

  Kapsam:
  1. Auth yöntemi ne olmalı? (Önerilen: JWT) → JWT / OAuth / Session-based

  Davranış:
  2. Token süresi ne kadar olsun? → 15dk / 1 saat / 24 saat
  3. Refresh token kullanılsın mı? → Evet (önerilen) / Hayır

  Teknik:
  4. Kullanıcı verisi nerede tutulacak? → PostgreSQL / MongoDB / Mevcut DB

  > 💡 Tümünü yanıtlayın veya "skip questions" diyerek varsayılanlarla devam edin.

Kullanıcı: "JWT, 1 saat, evet refresh token, PostgreSQL"

Orchestrator: [Detaylı plan oluşturur] → Kullanıcı onayı → İmplementasyon başlar
```

### Detaylar

Tam protokol: `.github/instructions/prompt-enrichment.instructions.md`

---

## Skill Dosyaları

Her tier'ın kendine özgü skill dosyaları vardır:

| Skill                | Konum                                          | Kullanan Tier                  |
| -------------------- | ---------------------------------------------- | ------------------------------ |
| Clean Code           | `.github/skills/clean-code/SKILL.md`           | Tüm kodlama tier'ları + T2.5 (awareness) |
| Code Architecture    | `.github/skills/code-architecture/SKILL.md`    | Tier 1 (Principal)             |
| Code Review          | `.github/skills/code-review/SKILL.md`          | Tier 1, 1.5, 2, 2.5            |
| Frontend Development | `.github/skills/frontend-development/SKILL.md` | Tier 1, 1.5 & 2 (frontend işleri) |
| Backend Development  | `.github/skills/backend-development/SKILL.md`  | Tier 1, 1.5 & 2 (backend işleri) |
| Implementation       | `.github/skills/implementation/SKILL.md`       | Tier 1, 1.5 & 2                  |
| Analysis             | `.github/skills/analysis/SKILL.md`             | Tier 2.5 & 3                   |
| Commit Standards     | `.github/skills/commit-standards/SKILL.md`     | Tier 1, 1.5 & 2                |
| PR Standards         | `.github/skills/pr-standards/SKILL.md`         | Tier 1, 1.5 & 2                |
| Testing Standards    | `.github/skills/testing-standards/SKILL.md`    | Tier 1, 1.5 & 2                |

### Skill İçerikleri

- **Clean Code**: Kod hijyeni, isimlendirme, yapı kuralları, mutlak yasaklar
- **Code Architecture**: Mimari paternler (hexagonal, clean, layered), SOLID rehberi, ADR şablonu
- **Code Review**: Checklist (Critical/Major/Minor/Suggestion), code smell kataloğu, feedback formatı
- **Frontend Development**: React kodlama kuralları, SCSS/BEM standartları, TanStack Query, a11y, SEO, performans
- **Backend Development**: REST API tasarımı, veritabanı pattern'leri, JWT auth, middleware mimarisi, error handling
- **Implementation**: Kodlama standartları, error handling, pattern örnekleri
- **Analysis**: Analiz şablonları (kod tabanı, bağımlılık, risk, test senaryosu), araştırma protokolü
- **Commit Standards**: Conventional Commits formatı, commit tipleri, scope kuralları
- **PR Standards**: 500 satır limiti, PR şablonu, review rehberi, checklist
- **Testing Standards**: Vitest + RTL, coverage hedefleri, AAA pattern, Storybook gereksinimleri

---

## Maliyet Optimizasyonu

### Model Maliyet Karşılaştırması

| Model                    | Göreli Maliyet | Kullanım Alanı                      |
| ------------------------ | -------------- | ----------------------------------- |
| Claude Opus 4.6          | $$$$$          | Mimari, review, nihai otorite       |
| Claude Sonnet 4.6        | $$$$           | Tüm kodlama, Staff Engineer review  |
| GPT-5.3-Codex            | $$$            | Basit kodlama, boilerplate          |
| Gemini 3.1 Pro (Preview) | $$             | Analyst çıktı review, konsolidasyon |
| Gemini 3 Flash           | $              | Analiz, araştırma, doküman          |

### Tasarruf Örneği

**Senaryo**: "E-ticaret sepet modülü oluştur" x10

| Tüm Tier 1                                             | x10 Dağılımı                                             | Tasarruf |
| ------------------------------------------------------ | -------------------------------------------------------- | -------- |
| 10 × $$$$$ = $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ | 2×$$$$$ + 2×$$$$ + 2×$$$ + 1×$$ + 3×$ = optimize dağılım | ~%55     |

### İlke

> **En pahalı modeli yalnızca gerçekten gerektiğinde kullan.**
> Analiz, araştırma ve basit kodlama görevleri ucuz model'lerle yapılabilir.

---

## Özelleştirme

### Yeni Agent Ekleme

`.github/instructions/agent-scaffolding.instructions.md` dosyasındaki rehberi izleyerek yeni agent oluşturabilirsiniz.

**Adımlar:**

1. Rehberdeki Tier Konfigürasyon Matrisi'nden doğru model, fallback ve tool setini belirleyin.
2. Agent dosyası şablonunu kullanarak `.github/agents/<agent-name>.agent.md` oluşturun.
3. Instructions dosyası şablonunu kullanarak `.github/instructions/<tier-prefix>-<agent-name>.instructions.md` oluşturun.
4. Post-creation checklist'teki 6 adımı tamamlayın.
5. Sistem doğrulama kurallarını (Kural 2 ve 7) çalıştırarak entegrasyonu doğrulayın.

Manuel ekleme tercih ederseniz:
1. `.github/agents/` dizinine yeni `.agent.md` dosyası oluşturun.
2. YAML frontmatter'da `name`, `model`, `tools` tanımlayın.
3. Orchestrator'ın `agents` listesine yeni agent'ı ekleyin.
4. İlgili instruction dosyasına `applyTo` pattern'ını güncelleyin.

### Yeni Skill Ekleme

1. `.github/skills/[skill-name]/SKILL.md` dosyası oluşturun.
2. YAML frontmatter'da `name` ve `description` tanımlayın.
3. İlgili agent'ların talimatlarında bu skill'e referans ekleyin.

### xN Dağılımını Değiştirme

`.github/instructions/delegation-rules.instructions.md` dosyasındaki tabloyu güncelleyin.

### Yeni Prompt Ekleme

1. `.github/prompts/[command].prompt.md` dosyası oluşturun.
2. YAML frontmatter'da `name`, `description`, `agent`, `model` tanımlayın.
3. `/command` olarak Copilot Chat'te kullanılabilir olur.

---

## Model Fallback

Her agent'ın birincil modeli erişilemez olduğunda otomatik olarak yedek modele geçilir.

### Fallback Tablosu

| Tier                        | Birincil                 | Yedek                    |
| --------------------------- | ------------------------ | ------------------------ |
| Orchestrator / T1 Principal | Claude Opus 4.6          | Claude Opus 4.5          |
| T1.5 Staff Engineer         | Claude Sonnet 4.6        | Claude Sonnet 4.5        |
| T2 MidCoder                 | GPT-5.3-Codex            | GPT-5.2-Codex            |
| T2.5 Lead Analyst           | Gemini 3.1 Pro (Preview) | Gemini 3.0 Pro (Preview) |
| T3 Analyst                  | Gemini 3 Flash           | Claude Haiku 4.5         |

### Kurallar

- Fallback aktivasyonu agent'ın izinlerini veya tier yetkilerini **değiştirmez**.
- Agent, fallback'e geçtiğini task raporunda belirtmelidir.
- Analyst tier'ı için ek fallback: Haiku 4.5 de erişilemezse `auto` modeline düşer.
- Detaylar: `.github/instructions/model-fallback.instructions.md`

---

## Session Memory

Her oturum sonunda konuşma geçmişi, alınan kararlar ve yapılan değişiklikler otomatik olarak kaydedilir.

### Nasıl Çalışır?

1. **Oturum başlangıcı**: Orchestrator yeni session dosyası oluşturur (`YYYY-MM-DD-HH-MM-session-name.md`)
2. **Oturum sırasında**: Kararlar, değişiklikler ve önemli bağlam not edilir
3. **Oturum sonu**: Tüm bilgiler template formatında session dosyasına yazılır

### Dosya Yapısı

```
.github/memory/
├── sessions/                    # Aktif session dosyaları (max 20)
│   ├── _session-template.md     # Session dosyası şablonu
│   └── YYYY-MM-DD-HH-MM-*.md   # Session kayıtları
└── history/
    └── archive.md               # Eski session'ların özet arşivi
```

### Kurallar

- Maksimum **20 session** dosyası tutulur; eskiler otomatik olarak arşivlenir.
- Yalnızca **Orchestrator** session dosyası oluşturur/düzenler.
- Diğer agent'lar session dosyalarını **salt okunur** olarak kullanır.
- **v4.1.0+**: `SubagentStop` hook'u otomatik olarak `.github/logs/agent-activity.log` dosyasına session marker yazar. Bu, Orchestrator'ın açıkça kaydetmediği durumlarda bile oturum izlenebilirliğini sağlar.
- `/resume` komutuyla son session ve aktif plan geri yüklenir.
- `/history` komutuyla son session'lar listelenir.

---

## Çakışma Önleme Mekanizması

Multi-agent modunda birden fazla agent'ın aynı dosyayı düzenlemeye çalışmasını engellemek için bir sahiplik (ownership) sistemi kullanılır.

### Nasıl Çalışır?

1. **Görev Dağıtımı**: Orchestrator görevleri dağıtırken her agent'a hangi dosyaları düzenleyebileceğini (Owned Files) açıkça belirtir.
2. **Exclusive Write**: Bir dosya aynı anda sadece bir agent'a atanabilir.
3. **Read-Only Access**: Agent'lar kendilerine atanmayan dosyaları okuyabilir ama düzenleyemez.
4. **Çakışma Tespiti**: Eğer bir agent kendisine atanmayan bir dosyayı düzenlemesi gerektiğini fark ederse, bunu raporunda belirtir ve Orchestrator sahipliği yeniden düzenler.

---

## Metrik Toplama Sistemi

Sistem, agent performansını ve token kullanımını sürekli olarak takip eder.

### Takip Edilen Metrikler

- **Token Kullanımı** (`.github/metrics/token-usage.md`): Tahmin edilen vs gerçekleşen token tüketimi. Bu veri, görev planlama algoritmasını kalibre etmek için kullanılır.
- **Agent Performansı** (`.github/metrics/agent-performance.md`): Tamamlanan/başarısız görev sayıları, ortalama review turları, maliyet dağılımı ve fallback aktivasyonları.

Bu metrikler, Orchestrator tarafından her oturum sonunda otomatik olarak güncellenir.

---

## Token Optimizasyonu

Sistem, token tüketimini minimize ederken çıktı kalitesini korumak için dört strateji kullanır.

### 1. Paylaşılan Kurallar (Shared Base)

Tüm agent'larda tekrarlanan kurallar `shared-base.instructions.md` dosyasında merkezileştirilmiştir. Agent dosyaları bu kurallara referans verir, içeriği kopyalamaz.

### 2. İsteğe Bağlı Skill Yükleme (Context Loading)

Skill dosyaları görev tipine göre yüklenir — hepsi birden değil. Orchestrator, her görev atamasında hangi skill'lerin yükleneceğini belirtir.

### 3. Token-Aware Görev Planlama (Task Planning)

Görevler maksimum **15K token bütçesiyle** alt-görevlere bölünür. Bütçe aşılmak üzereyken aktif plan kaydedilir ve `/resume` ile devam edilir.

### 4. Aktif Plan Takibi

`.github/todo/active-plan.md` dosyasında mevcut plan, tamamlanan ve bekleyen görevler, bağımlılık grafiği ve devam noktası takip edilir.

### Token Bütçesi Tablosu

| Görev Tipi              | Tahmini Token |
| ----------------------- | ------------- |
| Basit utility fonksiyon | 2K-5K         |
| API endpoint            | 5K-8K         |
| React component         | 5K-10K        |
| Karmaşık iş mantığı     | 8K-15K        |
| Analiz raporu           | 3K-8K         |
| Doküman özeti           | 2K-4K         |

---

## Araçlar

### Sistem Doğrulama Kuralları

Boilerplate bütünlüğünü doğrulamak için `.github/instructions/system-validation.instructions.md` dosyasındaki kurallar kullanılır. Script yerine agent'lar bu kuralları read/search araçlarıyla manuel olarak uygular.

Kontrol edilen 9 kural:

- **Kural 1 — Versiyon tutarlılığı**: README, USAGE ve CHANGELOG'daki versiyon eşleşmesi
- **Kural 2 — Dosya sayıları**: Agent, instruction, skill ve hook dosyası minimum sayıları
- **Kural 3 — Yasak referanslar**: x10 üzeri xN referansları (x12, x15 vb.)
- **Kural 4 — Code fence kontrolü**: 4+ backtick hataları
- **Kural 5 — Unicode kontrolü**: Bozuk karakter (U+FFFD) tespiti
- **Kural 6 — Hook paritesi**: PreToolUse ve PostToolUse edit tool listelerinin eşleşmesi
- **Kural 7 — Model tutarlılığı**: Agent YAML model/modelFallback değerlerinin kanonik tabloyla eşleşmesi
- **Kural 8 — PCD dosyası**: Project Context Discovery instruction dosyasının varlığı ve gerekli bölümlerin kontrolü
- **Kural 9 — PEP dosyası**: Prompt Enrichment Protocol instruction dosyasının varlığı ve gerekli bölümlerin kontrolü

Doğrulama zamanlaması: Her versiyon bumplanmasından sonra, agent eklenip çıkarıldığında, hook dosyaları değiştirildiğinde ve PCD/PEP dosyaları değiştirildiğinde Orchestrator veya Principal bu kuralları çalıştırır.

### Proje Bağlamı Keşfi (PCD) Yapılandırması

Boilerplate'i bir projeye taşıdığınızda PCD otomatik olarak aktif olur. Özel yapılandırma gerekmez — agent'lar projenin root `README.md`, diğer `.md` dosyaları ve `docs/` klasörünü otomatik tarar.

PCD davranışını özelleştirmek için:
- **Proje kurallarını belirtin**: Projenin `README.md` veya `docs/` altındaki dosyalarda kodlama standartları, mimari kararlar ve konvansiyonları net şekilde yazın.
- **Bağlam bütçesini bilin**: Her tier'ın PCD dosya ve token limiti vardır (T1: 5 dosya/8K, T3: 2 dosya/3K).
- **Detaylar**: `.github/instructions/project-context-discovery.instructions.md`

### Agent Scaffolding Rehberi

Yeni agent oluşturmak için `.github/instructions/agent-scaffolding.instructions.md` dosyasındaki kurallar izlenir. Bash script yerine agent'lar bu rehberdeki template ve konfigürasyon matrisini kullanarak dosyaları manuel oluşturur.

Rehber içerikleri:

- **Adlandırma kuralları**: Kebab-case isimlendirme, PascalCase dönüşüm, dosya yolu şablonları
- **Tier konfigürasyon matrisi**: Her tier için model, fallback, tool seti ve izinler
- **Agent dosyası şablonu**: `.agent.md` YAML frontmatter ve markdown yapısı
- **Instructions dosyası şablonu**: `.instructions.md` yapısı
- **Post-creation checklist**: Oluşturma sonrası yapılması gereken 6 adım
- **Doğrulama kontrolleri**: Dosya adı regex, mevcut dosya kontrolü, tier validasyonu

### Mimari Karar Kayıtları (ADR)

Platform bağımlılıkları ve tasarım kararları `.github/docs/adr/` dizininde belgelenir:

- **ADR-001**: VS Code + GitHub Copilot platform sınırları, `applyTo` kısıtlaması, dosya sahipliği konvansiyonu, token bütçesi danışmanlık niteliği

---

## SSS

### Q: xN parametresi olmadan da agent'ları kullanabilir miyim?

**A**: Evet. `/architect` komutuyla doğrudan PrincipalAlpha'ya görev atayabilirsiniz. Veya Copilot Chat'te agent picker'dan istediğiniz agent'ı seçebilirsiniz (Orchestrator `user-invokable: true`).

### Q: Kaç adet x parametresi verilebilir?

**A**: Maksimum x10 (10 agent). Sabit dağılımlar x3, x5, x7 ve x10 için optimize edilmiştir. x10 üzeri değerler için ek agent tanım dosyaları gerekir. Diğer değerler (x2, x4, x6, x8, x9) oransal dağılım kullanır.

### Q: Agent'lar birbirinin dosyalarını düzenleyebilir mi?

**A**: Hayır. `AGENTS.md` kuralları bunu yasaklar. Her agent yalnızca kendisine atanan dosyalar üzerinde çalışır.

### Q: Analyst ve Lead Analyst neden dosya düzenleyemiyor?

**A**: Maliyet optimizasyonu ve güvenlik. Gemini 3 Flash ve Gemini 3.1 Pro düşük maliyetli modellerdir, hatalı düzenleme riski daha yüksektir. Bu nedenle salt okunur modda çalışırlar. Analyst çıktıları Lead Analyst tarafından, Lead Analyst çıktıları ise kodlama agent'ları tarafından kullanılır.

### Q: Review zinciri kaç tur sürer?

**A**: Maksimum 2 düzeltme turu. Sonrasında üst tier görevi devralır.

### Q: Bu boilerplate'i farklı projelere nasıl taşırım?

**A**: `.github/` dizinini, `AGENTS.md` dosyasını ve `.vscode/settings.json`'ı hedef projeye kopyalayın. **Project Context Discovery (PCD)** özelliği sayesinde agent'lar otomatik olarak projenin kendi `README.md`, diğer `.md` dosyaları ve `docs/` klasörünü tarar. **Prompt Enrichment Protocol (PEP)** ise geliştirme başlamadan önce otomatik olarak soru sorarak gereksinimleri netleştirir. Projenin kuralları, mimarisi ve konvansiyonları otomatik olarak sistem bağlamına dahil edilir — ek yapılandırma gerekmez.

### Q: Hangi VS Code sürümü gerekli?

**A**: VS Code 1.109+ ve aktif Copilot/Copilot Chat aboneliği gereklidir.

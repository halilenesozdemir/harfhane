# Refaktör Planı — v4.0.0

> **Oluşturma Tarihi**: 2026-02-23
> **Mod**: x10 (2 Principal + 2 Staff Eng + 2 MidCoder + 1 Lead Analyst + 3 Analyst)
> **Hedef**: Tüm analiz bulgularını çözmek ve sistemi 10/10 olgunluk skoruna ulaştırmak.
> **Mevcut Skor**: 7.3/10 → **Hedef Skor**: 10/10

---

## Faz 1 — P0 Kritik Düzeltmeler (6 görev)

### TASK-001: Review Zinciri — Principal'dan MidCoder Referansını Kaldır

**Bulgu**: C-1 — Principal agent dosyaları ve `tier1-principal.instructions.md`, MidCoder'ı doğrudan review ediyor. Kanonik zincir: T2→T1.5→T1.
**Etkilenen Dosyalar**:

- [x] `.github/agents/principal-alpha.agent.md` — description ve body'den "MidCoder" referansını kaldır
- [x] `.github/agents/principal-beta.agent.md` — description ve body'den "MidCoder" referansını kaldır
- [x] `.github/instructions/tier1-principal.instructions.md` — "Review MidCoder outputs" → "Review Staff Engineer outputs" olarak güncelle

**Değişiklik Detayı**:

- Description: `review of MidCoder outputs` → `review of Staff Engineer outputs`
- Body Responsibilities #2: `Review and approve/fix Staff Engineer (T1.5) and MidCoder (T2) outputs` → `Review and approve/fix Staff Engineer (T1.5) outputs`
- YAML `agents` listesinden MidCoder'ları çıkar (I-1 ile birlikte)
- `tier1-principal.instructions.md`: "Review MidCoder outputs using the checklist" → "Review Staff Engineer outputs using the checklist"

---

### TASK-002: Review Zinciri — MidCoder'dan Analyst Review Sorumluluğunu Kaldır

**Bulgu**: C-2 — MidCoder agent dosyaları ve `tier2-mid.instructions.md`, Analyst'i review ediyor. Kanonik zincir: T3→T2.5.
**Etkilenen Dosyalar**:

- [x] `.github/agents/mid-coder-alpha.agent.md` — "Analyst Review" sorumluluğunu kaldır
- [x] `.github/agents/mid-coder-beta.agent.md` — "Analyst Review" sorumluluğunu kaldır
- [x] `.github/instructions/tier2-mid.instructions.md` — "Review Analyst outputs" ifadesini kaldır/güncelle

**Değişiklik Detayı**:

- Responsibilities #4'ü kaldır veya "Self-Review" ile değiştir
- `tier2-mid.instructions.md` Review Responsibilities bölümünü güncelle: Analyst review yerine self-review ve kalite kontrol vurgusu

---

### TASK-003: Sayısal Eşikleri Standartlaştır — Fonksiyon Uzunluğu

**Bulgu**: C-3 — Fonksiyon uzunluğu 20 vs 30 satır tutarsızlığı.
**Karar**: Tek standart = **20 satır**.
**Etkilenen Dosyalar**:

- [x] `.github/skills/implementation/SKILL.md` — Checklist'teki "30 lines" → "20 lines"
- [x] `.github/skills/code-review/SKILL.md` — "Long Method: 30+ line function" → "Long Method: 20+ line function"
- [x] `.github/skills/pr-standards/SKILL.md` — "max 20 lines for clean code, max 30 for implementation" → "max 20 lines"

---

### TASK-004: Sayısal Eşikleri Standartlaştır — Cyclomatic Complexity

**Bulgu**: C-4 — Cyclomatic complexity ≤8 vs >10 tutarsızlığı.
**Karar**: Tek standart = **≤ 8**.
**Etkilenen Dosyalar**:

- [x] `.github/skills/code-review/SKILL.md` — Minor checklist'teki "Cyclomatic complexity > 10?" → "Cyclomatic complexity > 8?"

---

### TASK-005: Sayısal Eşikleri Standartlaştır — Dosya/Komponent Satır Limiti

**Bulgu**: C-5 — 250 vs 300 satır tutarsızlığı.
**Karar**: Tek standart = **250 satır** (komponentler dahil).
**Etkilenen Dosyalar**:

- [x] `.github/skills/frontend-development/SKILL.md` — "Maximum 300 lines per component" → "Maximum 250 lines per component"
- [x] `.github/skills/pr-standards/SKILL.md` — "max 250-300 lines" → "max 250 lines"

---

### TASK-006: Git Tracking Çelişkisini Çöz

**Bulgu**: C-6 — `session-memory.instructions.md` "session'lar Git'te takip edilmeli" derken `.gitignore` hariç tutuyor.
**Karar**: Session dosyaları `.gitignore`'da kalacak (mevcut davranış korunacak). Instructions dosyasındaki yanıltıcı ifade düzeltilecek.
**Etkilenen Dosyalar**:

- [x] `.github/instructions/session-memory.instructions.md` — "Session files are tracked by Git" ifadesini session dosyalarının yerel kalacağını belirtecek şekilde güncelle

---

## Faz 2 — P1 Önemli Düzeltmeler (7 görev)

### TASK-007: Principal YAML Agents Listesinden MidCoder'ları Çıkar

**Bulgu**: I-1 — Principal'ın `agents` YAML listesinde MidCoder var.
**Etkilenen Dosyalar**:

- [x] `.github/agents/principal-alpha.agent.md` — `agents` listesinden MidCoderAlpha, MidCoderBeta'yı kaldır
- [x] `.github/agents/principal-beta.agent.md` — `agents` listesinden MidCoderAlpha, MidCoderBeta'yı kaldır

---

### TASK-008: Safety Guard Hook'una Eksik Araçları Ekle

**Bulgu**: I-2 — `multi_replace_string_in_file` hook kapsamında değil.
**Etkilenen Dosyalar**:

- [x] `.github/hooks/safety-guard.json` — tools listesine `multi_replace_string_in_file` ve `edit_notebook_file` ekle

---

### TASK-009: Backend Development Skill'ini Agent Dosyalarına Ekle

**Bulgu**: I-3 — `backend-development/SKILL.md` hiçbir agent dosyasında referans edilmiyor.
**Etkilenen Dosyalar**:

- [x] `.github/agents/principal-alpha.agent.md` — Tier-Specific Skills listesine backend-development ekle
- [x] `.github/agents/principal-beta.agent.md` — Tier-Specific Skills listesine backend-development ekle
- [x] `.github/agents/staff-engineer-alpha.agent.md` — Tier-Specific Skills listesine backend-development ekle
- [x] `.github/agents/staff-engineer-beta.agent.md` — Tier-Specific Skills listesine backend-development ekle
- [x] `.github/agents/mid-coder-alpha.agent.md` — Tier-Specific Skills listesine backend-development ekle
- [x] `.github/agents/mid-coder-beta.agent.md` — Tier-Specific Skills listesine backend-development ekle

---

### TASK-010: Clean-Code Skill Kapsam Tanımını Düzelt

**Bulgu**: I-4 — "Tier 1 and Tier 2" ifadesi T1.5'i dışlıyor.
**Etkilenen Dosyalar**:

- [x] `.github/skills/clean-code/SKILL.md` — "Tier 1 and Tier 2" → "Tier 1, Tier 1.5, and Tier 2"

**Ek**: `implementation/SKILL.md` tanımını da genişlet: "Used by Tier 2 (MidCoder)" → "Used by Tier 1.5 (Staff Engineer) and Tier 2 (MidCoder)"

---

### TASK-011: Alpha Varyant Agent'lara Dosya Sahipliği Kuralı Ekle

**Bulgu**: I-5 — Beta varyantlarında var, Alpha'larda yok.
**Etkilenen Dosyalar**:

- [x] `.github/agents/principal-alpha.agent.md` — Working Principles'a dosya sahipliği kuralı ekle
- [x] `.github/agents/staff-engineer-alpha.agent.md` — Working Principles'a dosya sahipliği kuralı ekle
- [x] `.github/agents/mid-coder-alpha.agent.md` — Working Principles'a dosya sahipliği kuralı ekle

---

### TASK-012: StaffEngineerAlpha'ya Output Format Şablonu Ekle

**Bulgu**: I-6 — Beta'da var, Alpha'da yok.
**Etkilenen Dosyalar**:

- [x] `.github/agents/staff-engineer-alpha.agent.md` — StaffEngineerBeta ile aynı output format şablonunu ekle

---

### TASK-013: copilot-instructions.md'yi v4.0.0'a Güncelle

**Bulgu**: I-7 — Backend skill, metrikler ve file ownership referansları eksik.
**Etkilenen Dosyalar**:

- [x] `.github/copilot-instructions.md` — Eksik bölümleri ekle: File Ownership, Metrics, Backend Development Skill

---

## Faz 3 — P2 İyileştirmeler (9 görev)

### TASK-014: Context-Loading Tablosuna Eksik Skill'leri Ekle

**Bulgu**: S-1 — Task type tablosunda testing-standards ve pr-standards eksik.
**Etkilenen Dosyalar**:

- [x] `.github/instructions/context-loading.instructions.md` — Frontend UI ve Backend API satırlarına `testing-standards, pr-standards` ekle

---

### TASK-015: PR Standards Çift Standart İfadesini Düzelt

**Bulgu**: S-2 — "max 20 for clean code, max 30 for implementation" çift standart.
**Not**: TASK-003'te zaten düzeltilecek (bağımlılık). Bu görev tamamlanmış sayılır.

- [x] TASK-003 tarafından kapsanıyor.

---

### TASK-016: Delegation Rules x4 Edge Case Açıklaması

**Bulgu**: S-3 — x4 boundary constraint override belirtilmemiş.
**Etkilenen Dosyalar**:

- [x] `.github/instructions/delegation-rules.instructions.md` — Edge Case Handling bölümüne açıklama notu ekle

---

### TASK-017: Archive Format Şablonunu Standartlaştır

**Bulgu**: S-4 — `archive.md` ile `session-memory.instructions.md` arasında format farkı.
**Etkilenen Dosyalar**:

- [x] `.github/memory/history/archive.md` — Format şablonunu `session-memory.instructions.md` ile uyumlu hale getir (session-id dahil et)

---

### TASK-018: Token Usage Nested Code Fence Düzelt

**Bulgu**: S-5 — Nested code fence render sorunu.
**Etkilenen Dosyalar**:

- [x] `.github/metrics/token-usage.md` — Dış code fence'i kaldır, tek seviye code fence kullan

---

### TASK-019: Hook Log'larına Timezone Ekle

**Bulgu**: S-6 — `date` komutunda timezone bilgisi yok.
**Etkilenen Dosyalar**:

- [x] `.github/hooks/agent-lifecycle.json` — `date -u` (UTC) kullan
- [x] `.github/hooks/safety-guard.json` — `date -u` (UTC) kullan

---

### TASK-020: Active Plan'a Dependency Graph Ekle

**Bulgu**: S-7 — Spesifikasyonda zorunlu olan Dependency Graph bölümü eksik.
**Etkilenen Dosyalar**:

- [x] `.github/todo/active-plan.md` — Yeni plan (PLAN-003) olarak güncelle

---

### TASK-021: Test Dosya Adlandırma Kuralını Standartlaştır

**Bulgu**: S-8 — `.spec.tsx` vs `.test.tsx` çift convention.
**Karar**: Tek standart = `.spec.tsx` (primary convention).
**Etkilenen Dosyalar**:

- [x] `.github/skills/testing-standards/SKILL.md` — `__tests__/` klasöründeki `.test.tsx` örneklerini `.spec.tsx` olarak değiştir, tek convention belirt. Ayrıca `@vitest/coverage-c8` → `@vitest/coverage-v8` güncelle

---

### TASK-022: E2E ve Backend Testing Bölümü Ekle

**Bulgu**: S-9 — E2E testing ve backend testing guidance eksik.
**Etkilenen Dosyalar**:

- [x] `.github/skills/testing-standards/SKILL.md` — E2E Testing bölümü ekle, Backend Testing referansı ekle

---

## Faz 4 — Token Optimizasyonu (5 görev)

### TASK-023: Instruction Dosyalarında Tekrar Eden İçeriği Azalt

**Hedef**: Tier-specific instruction dosyaları (`tier1-principal`, `tier1-5-staff-engineer`, `tier2-mid`) `shared-base.instructions.md`'deki kuralları tekrar ediyor. DRY prensibi uygulanacak.
**Etkilenen Dosyalar**:

- [x] `.github/instructions/tier1-principal.instructions.md` — Tekrar eden kuralları `shared-base` referansıyla değiştir
- [x] `.github/instructions/tier1-5-staff-engineer.instructions.md` — Sayısal limitleri kaldır, `clean-code` skill referansı ver
- [x] `.github/instructions/tier2-mid.instructions.md` — Sayısal limitleri kaldır, `clean-code` skill referansı ver

**Token Tasarrufu**: ~2K token/session (3 dosya × ~700 tekrar eden token)

---

### TASK-024: Skill Dosyalarının Token Bütçe Etiketlerini Ekle

**Hedef**: Her skill dosyasının başına tahmini token maliyeti eklemek, context-loading kararlarını hızlandırır.
**Etkilenen Dosyalar**:

- [x] `.github/skills/*/SKILL.md` — YAML frontmatter'a `estimated-tokens` alanı ekle

**Token Tasarrufu**: Orchestrator gereksiz skill yüklemesini önler → ~3-5K/session

---

### TASK-025: Context-Loading Kurallarına Strict Budget Enforcement Ekle

**Hedef**: Agent'ların context budget'ını aşmasını önlemek için hard limit ekle.
**Etkilenen Dosyalar**:

- [x] `.github/instructions/context-loading.instructions.md` — "Context Budget" bölümüne "STRICT: Exceeding budget is forbidden" kuralı ekle

---

### TASK-026: Orchestrator'a Token Raporlama Şablonu Ekle

**Hedef**: Her task sonunda Orchestrator'ın token kullanımını sistematik raporlaması.
**Etkilenen Dosyalar**:

- [x] `.github/agents/orchestrator.agent.md` — Output Format'a "Token Usage Summary" bölümü ekle

---

### TASK-027: Skill Overlap Azaltma — Implementation/Testing Çapraz Referans

**Hedef**: `implementation/SKILL.md`'deki test bölümü `testing-standards` ile örtüşüyor. Referans vererek kısalt.
**Etkilenen Dosyalar**:

- [x] `.github/skills/implementation/SKILL.md` — Test bölümünü kısalt, `testing-standards/SKILL.md`'ye referans ver

---

## Faz 5 — Delegasyon Sistemi İyileştirmeleri (5 görev)

### TASK-028: Orchestrator Task Assignment'a Skill Budget Kontrolü Ekle

**Hedef**: Orchestrator her agent'a görev atarken, yüklenecek skill sayısını context budget ile sınırlasın.
**Etkilenen Dosyalar**:

- [x] `.github/agents/orchestrator.agent.md` — Step 3'e skill budget kontrolü ekle

---

### TASK-029: Tier Instruction Dosyalarına ne zaman escalate etme rehberi ekle

**Hedef**: Alt tier agent'ların hangi durumlarda üst tier'a escalate etmesi gerektiğini netleştir.
**Etkilenen Dosyalar**:

- [x] `.github/instructions/tier2-mid.instructions.md` — "When to Escalate" bölümü ekle
- [x] `.github/instructions/tier1-5-staff-engineer.instructions.md` — "When to Escalate" bölümü ekle

---

### TASK-030: Review Chain Bypass Koruması Ekle

**Hedef**: Review zincirinin bypass edilmesini önleyen açık kurallar.
**Etkilenen Dosyalar**:

- [x] `.github/instructions/review-chain.instructions.md` — "Chain Integrity Rules" bölümü ekle

---

### TASK-031: Delegation Rules'a Optimal Task Sizing Rehberi Ekle

**Hedef**: Orchestrator'un görev bölme kararlarını iyileştirmek.
**Etkilenen Dosyalar**:

- [x] `.github/instructions/delegation-rules.instructions.md` — "Optimal Task Sizing" bölümü ekle

---

### TASK-032: Active Plan'ı PLAN-003 Olarak Güncelle

**Hedef**: Bu refaktör planını active-plan.md'ye yaz.
**Etkilenen Dosyalar**:

- [x] `.github/todo/active-plan.md` — PLAN-003 olarak bu planı yaz

---

## Özet

| Faz                            | Görev Sayısı | Tahmini Token | Öncelik |
| ------------------------------ | ------------ | ------------- | ------- |
| Faz 1 — P0 Kritik              | 6            | ~8K           | Acil    |
| Faz 2 — P1 Önemli              | 7            | ~10K          | Yüksek  |
| Faz 3 — P2 İyileştirme         | 9            | ~12K          | Orta    |
| Faz 4 — Token Optimizasyonu    | 5            | ~8K           | Yüksek  |
| Faz 5 — Delegasyon İyileştirme | 5            | ~6K           | Orta    |
| **Toplam**                     | **32**       | **~44K**      | —       |

---

## Bağımlılık Grafiği

```
TASK-001 ─┐
TASK-002 ─┤
TASK-007 ─┘──→ Review zinciri tamamen tutarlı hale gelir

TASK-003 ─┐
TASK-004 ─┤──→ Sayısal eşikler tek değere standardize olur
TASK-005 ─┘

TASK-006 ──→ Session stratejisi netleşir

TASK-008 ──→ Güvenlik kör noktası kapanır
TASK-009 ──→ Backend skill erişilebilir olur
TASK-010 ──→ Scope doğruluğu sağlanır
TASK-011, TASK-012 ──→ Alpha/Beta simetrisi sağlanır
TASK-013 ──→ copilot-instructions güncel olur

TASK-023 ──→ TASK-024 ──→ TASK-025 (token zinciri)
TASK-026 ──→ TASK-028 (raporlama zinciri)
TASK-029 ──→ TASK-030 (escalation zinciri)
TASK-032 ──→ Son güncelleme
```

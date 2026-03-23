# Project Rules — Nurdle

> Nurdle: Risale-i Nur külliyatındaki kelimelerle oynanan Türkçe Wordle oyunu.
> Bu dosya Claude Code ve tüm subagent'lar tarafından okunur ve tüm kurallar bağlayıcıdır.

---

## Project Overview

**Current Phase: Faz 2** — Custom Word Lists + Admin Panel

| Faz   | Odak                               | Durum      |
| ----- | ---------------------------------- | ---------- |
| Faz 1 | Monorepo + Hono Backend + D1       | Tamamlandı |
| Faz 2 | Custom Word Lists + Admin Paneli   | Geliştirme |
| Faz 3 | Kullanıcı Hesapları + Ticari Model | Roadmap    |

---

## Monorepo Structure

```
nurdle/
├── apps/
│   ├── frontend/     # React 19 + Vite + TypeScript
│   │   └── CLAUDE.md # Frontend-specific context
│   └── backend/      # Hono + Cloudflare Workers
│       └── CLAUDE.md # Backend-specific context
├── packages/
│   └── shared/       # Ortak TypeScript types
├── .claude/
│   ├── settings.json       # Permissions + hooks (project)
│   ├── settings.local.json # Local overrides (gitignored)
│   ├── skills/             # Auto-loaded Claude Code skills (L2)
│   │   ├── clean-code/
│   │   ├── code-review/
│   │   ├── code-architecture/
│   │   ├── analysis/
│   │   ├── frontend-development/
│   │   ├── backend-development/
│   │   ├── implementation/
│   │   ├── testing-standards/
│   │   ├── commit-standards/
│   │   └── pr-standards/
│   └── agents/             # Callable subagents (L4)
│       ├── orchestrator.md
│       ├── principal-alpha.md
│       ├── principal-beta.md
│       ├── staff-engineer-alpha.md
│       ├── staff-engineer-beta.md
│       ├── mid-coder-alpha.md
│       ├── mid-coder-beta.md
│       ├── lead-analyst.md
│       ├── analyst-alpha.md
│       ├── analyst-beta.md
│       └── analyst-gamma.md
├── .github/
│   ├── memory/       # Session ve karar hafızası
│   ├── metrics/      # Token ve performans takibi
│   └── todo/         # Aktif plan takibi
├── AGENTS.md
├── CLAUDE.md
└── package.json      # pnpm workspaces root
```

---

## 4-Katmanlı Zeka Mimarisi

| Katman | Kaynak | Açıklama |
| ------ | ------ | -------- |
| **L1** | `CLAUDE.md` (hiyerarşik) | Kalıcı bağlam ve kurallar |
| **L2** | `.claude/skills/*/SKILL.md` | Auto-triggered yetenekler |
| **L3** | `.claude/settings.json` hooks | Otomasyon ve güvenlik kapıları |
| **L4** | `.claude/agents/*.md` | İzole bağlamlı alt uzmanlar |

**CLAUDE.md hiyerarşisi** (üstten alta okunur, alttaki ekleme yapar):
1. `~/.claude/CLAUDE.md` — Global kullanıcı tercihleri
2. `CLAUDE.md` — Proje kuralları (bu dosya)
3. `apps/frontend/CLAUDE.md` — Frontend-spesifik context
4. `apps/backend/CLAUDE.md` — Backend-spesifik context

---

## Prompt Enrichment Protocol (PEP)

Non-trivial görevlerde (yeni feature, multi-file değişiklik, mimari karar, DB şema değişikliği) uygulanır.

**PEP'i atla:** Tek satır fix, typo, "hemen yap" komutu, `/resume` devamı.

**PEP'i uygula:**

1. Prompt'u analiz et — net gereksinimler, örtük varsayımlar, bilgi boşlukları
2. 3-5 hedefli soru sor (scope, davranış, teknik karar)
3. Onaylı plan üret — task breakdown, etkilenen dosyalar
4. Onay alındıktan sonra implement et

---

## Code Hygiene — Mutlak Kurallar

Bu kurallar tüm dosyalarda ihlal edilemez. Hiçbir istisna yoktur.

### Yasak Olanlar

- **Yorum yok**: Kod self-documenting olmalı. `//`, `/* */`, TODO, FIXME, commented-out code yasak.
- **Console yok**: `console.log`, `console.warn`, `console.error` ve her türlü `console.*` yasak.
- **Debug artifact yok**: `debugger`, hardcoded test değerleri, `any` tipi yasak.
- **`any` tipi yok**: TypeScript strict mode. `unknown` kullan ve type guard ile daralt.

### Naming Conventions

| Element            | Kural                      | Örnek                  |
| ------------------ | -------------------------- | ---------------------- |
| Dosyalar           | `kebab-case`               | `word-service.ts`      |
| Değişken/Fonksiyon | `camelCase`                | `getUserById`          |
| Class/Interface    | `PascalCase`               | `WordService`          |
| Sabitler           | `UPPER_SNAKE_CASE`         | `MAX_WORD_LENGTH`      |
| Boolean            | `is`/`has`/`should` prefix | `isActive`, `hasDaily` |
| Event handler      | `handle` prefix            | `handleSubmit`         |

**İsim kalitesi:**

- Intention-revealing: isim ne yaptığını söylemeli, nasıl değil.
- Kısaltma yok: `button` değil `btn`, `response` değil `res`.
- Generic isim yok: `data`, `info`, `item`, `temp`, `val` yasak.

### Fonksiyon Kuralları

- Max **20 satır** (tip tanımları hariç).
- Max **3 parametre** — fazlası için options object kullan.
- Max **2 nesting seviyesi** — early return pattern kullan.
- Bir fonksiyon, bir iş. İsimde "and" varsa böl.

### Dosya Kuralları

- Max **250 satır** per dosya.
- Bir dosya, bir kavram: bir component, bir service, bir hook.
- Circular dependency yasak.
- Wildcard import (`import * as`) yasak.

### DRY — Rule of Three

| Tekrar | Karar |
|--------|-------|
| İlk kullanım | Doğrudan implement et (YAGNI) |
| İkinci benzer kullanım | Fark et, ama henüz soyutlama |
| Üçüncü benzer kullanım | **Soyutla** — shared util/helper çıkar |

Erken soyutlama yapma — yanlış abstraction, kod tekrarından daha pahalıdır.

### Kod Kalite Checklist

Herhangi bir kod gönderiminden önce:

- [ ] Yorum yok (self-documenting naming)
- [ ] `console.*` yok
- [ ] `debugger` yok
- [ ] `any` tipi yok
- [ ] Commented-out code yok
- [ ] Magic number yok (named constant kullan)
- [ ] Max 2 nesting seviyesi
- [ ] Fonksiyonlar max 20 satır
- [ ] Dosyalar max 250 satır
- [ ] Tüm error'lar handle edilmiş
- [ ] DRY — duplicate logic yok

---

## Frontend Development

### Stack

- **React 19** + **Vite 7** + **TypeScript 5** (strict mode)
- **Tailwind CSS 3.x** — utility-first, no CSS-in-JS
- **TanStack Query v5** — server state management
- **Lucide React** — icons only, no emojis in UI

### Proje Kuralları

- Emoji yasak: frontend code, template, user-facing text. Lucide icon veya düz metin kullan.
- Tüm `<button>`, `<a>`, `onClick` elementleri `cursor-pointer` class'ına sahip olmalı.
- TypeScript strict mode zorunlu. `any` ve `@ts-ignore` yasak.
- Component props için explicit interface tanımı zorunlu (`ComponentNameProps`).
- Tüm tipler `src/types/index.ts` (frontend) veya `packages/shared/src/index.ts` (shared).
- Custom hook'lar `src/hooks/` altında, `use*.ts` ile adlandırılmış.

### TypeScript / JS Patterns

**Modern syntax:**
- `const` tercih et, `let` sadece gerektiğinde. `var` yasak.
- `structuredClone()` ile deep copy, spread sadece shallow için.
- Optional chaining max **3 seviye**. Daha derinse yeniden yapılandır.
- `readonly` değişmemesi gereken property'ler için.
- `as const` literal type'lar için, `satisfies` tip doğrulaması için.
- `interface` object shape için, `type` union/intersection için.

**State modeling — discriminated union kullan:**

```typescript
// ✅
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// ❌ optional property karmaşası
interface BadState<T> { isLoading?: boolean; data?: T; error?: Error; }
```

**Import sırası:**

```typescript
// 1. Framework
import { useState, useCallback } from 'react';
// 2. Third-party
import { useQuery } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
// 3. Internal
import { listWords } from '../../lib/api';
// 4. Relative + types
import { WordCard } from './components/word-card';
import type { WordProps } from './types';
```

### Hooks Kullanım Kılavuzu

| Hook | Ne zaman | Kural |
|------|----------|-------|
| `useState` | Basit local state | Minimal tut — derive et |
| `useReducer` | 3+ ilişkili state, complex logic | Discriminated union action |
| `useMemo` | Expensive computation | Profiler doğruladığında kullan |
| `useCallback` | Memoized child'a stable ref geçiliyor | Inline event handler için gerekmez |
| `useRef` | DOM erişimi, render tetiklemeyen mutable değer | Render'a etki eden state için kullanma |
| `useEffect` | External sistem sync | Derived state veya event-driven logic için değil |

### React Patterns

**Component declaration:**

- `function` keyword kullan, `const` arrow function değil.
- Component dosyaları PascalCase, diğerleri kebab-case.
- Props'lar camelCase — snake_case veya PascalCase yasak.

**JSX:**

- JSX içinde inline function tanımlama. Logic dışarıda.
- `div` wrapper gerekmiyorsa `<>...</>` Fragment kullan.
- Dynamic list'te index `key` olarak kullanma.
- `else` olmayan conditional rendering'de `&&` kullan, ternary değil.
- String prop'larda curly brace gerekmez: `heading="good"`, `heading={"bad"}` değil.
- Çok koşul için map pattern kullan, tekrarlı if/ternary değil.

```typescript
// ✅ Map pattern
const lengthLabels: Record<number, string> = { 4: '4 harf', 5: '5 harf', 6: '6 harf' };

// ❌ Tekrarlı if
if (length === 4) label = '4 harf';
if (length === 5) label = '5 harf';
```

```typescript
// Dogru
{
  message && <p className={errorClasses}>{message}</p>;
}

// Yanlis
{
  message ? <p className={errorClasses}>{message}</p> : <></>;
}
```

**State management:**

1. Local state önce — `useState` / `useReducer`.
2. Sibling'ler aynı state'e ihtiyaç duyuyorsa lift up.
3. Low-frequency global state için Context (theme, auth).
4. Server state için TanStack Query — client state'te duplicate etme.

**TanStack Query:**

- Data transformation `select` içinde olmalı, component'te değil.
- `isFetching` / `isLoading` query hook'tan — ayrı loading state oluşturma.

**Performance:**

- `React.memo()` sadece profiler doğruladığında.
- Route boundary'de `React.lazy()` + `Suspense`.
- JSX props'ta inline object/array/function oluşturma (trivial hariç).
- 50+ item listeler virtualize edilmeli.

### i18n & Copywriting

- Tüm user-facing text doğru Türkçe karakter kullanmalı: ç, ş, ğ, ı, ö, ü, İ, Ş, Ç, Ğ, Ö, Ü.
  - "Hakkimizda" değil "Hakkımızda", "Giris" değil "Giriş".
- UX writer gibi yaz: özlü, net, action-oriented.
- Türkçe: samimi ama saygılı ton.

### Tailwind Style Kuralları

- **Hardcoded hex yasak** — Tailwind config token'ları veya CSS variable'ları kullan (`bg-bg-primary`, `text-text-secondary`).
- **Inline style yasak** — zorunlu ise nedeni dokümante et.
- **`!important` yasak** — zorunlu ise nedeni dokümante et.
- **Responsive için Tailwind prefix** kullan (`sm:`, `md:`, `lg:`), `isMobile` boolean ile state yönetimi değil.
- **Arbitrary value** (`w-[123px]`) kullanımını minimize et — Tailwind token ile çözülemeyen durumlar için.
- `classNames()` / `cn()` sadece dinamik class'lar için — tek statik class için gerekmez.

### Accessibility (a11y)

- Interactive elementler keyboard accessible olmalı.
- Semantic HTML kullan: `<button>`, `<nav>`, `<main>`, `<section>` — `<div onClick>` yasak.
- Resimler `alt` text'e sahip olmalı. Dekoratif resimler `alt=""`.
- Form alanları `<label>` ile ilişkilendirilmeli, gerekli `aria-*` attribute'ları eklenmeli.
- Focus state'leri tüm interactive elementlerde görünür olmalı.
- Renk kontrastı WCAG AA: normal text ≥ 4.5:1.

### SEO

- Doğru heading hierarchy (`h1` → `h2` → `h3`).
- `<title>` ve `<meta description>` her route için.
- Resimler `alt` ve `loading="lazy"` ile.
- Semantic HTML tag'ları (`<article>`, `<header>`, `<footer>`, vb.).

---

## Backend Development

### Stack

- **Hono** — TypeScript HTTP framework on Cloudflare Workers
- **Cloudflare D1** (SQLite) — word lists, game metadata, user data (Faz 3)
- **Cloudflare R2** — custom word list file storage (Faz 2)
- **Wrangler** — local dev and deployment
- **Vitest** + `@cloudflare/vitest-pool-workers` — testing

### Architecture (Layered)

```
Routes (HTTP layer)
  → Services (business logic)
    → Repositories (data access / D1 queries)
```

Route'lar D1'e doğrudan dokunmaz. Tüm DB erişimi repository üzerinden.

### API Conventions

- Base path: `/api/`
- RESTful resource naming: `/api/words`, `/api/words/daily`, `/api/words/:id`
- Success response: `{ data: T }`
- Error response: `{ error: { code, message } }`
- HTTP status codes: 200, 201, 400, 401, 404, 409, 422, 500

### Backend Kuralları

- **SOLID**: Her module/route/service tek bir şey yapar.
- **TDD zorunlu**: Test önce yaz, sonra implement et.
- **Test yapısı**: `apps/backend/tests/` altında `src/` yapısını yansıtır.
- **Validation**: Tüm input Zod ile route seviyesinde validate edilir (`@hono/zod-validator`). Schema'lar `src/schemas/` altında.
- **Error handling**: Typed error class'ları kullan. Internal error'ları client'a gösterme. Structured `ApiError` response döndür.
- **Database**: Tüm şema değişiklikleri `apps/backend/migrations/` altında numbered migration dosyaları ile.
- **Secrets**: Hardcode etme. Wrangler bindings ve `.dev.vars` kullan.

### Service Layer

- Domain başına bir service: `WordService`, `AdminService`.
- Service method'ları focused: bir iş operasyonu per method.
- Input validation service boundary'de.

### Error Handling

- Her `catch` bloğu anlamlı bir aksiyon alır (log, transform, rethrow) — sadece birini seç.
- Boş `catch` bloğu yasak. Sadece rethrow da yeterli değil — try-catch'i kaldır.
- Domain-specific error class'ları, generic `Error` değil.
- Internal error detayları production'da client'a expose edilmez.
- Exception'ları control flow için kullanma.

**Result type pattern (opsiyonel, pure fonksiyonlar için):**

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function parseConfig(raw: string): Result<Config> {
  try {
    return { ok: true, value: JSON.parse(raw) as Config };
  } catch (e) {
    return { ok: false, error: new Error(`Invalid config: ${String(e)}`) };
  }
}
```

---

## Database (Cloudflare D1)

### Schema (Güncel)

```sql
CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  meaning TEXT NOT NULL,
  context TEXT,
  category TEXT CHECK(category IN ('isim', 'sıfat', 'fiil')),
  length INTEGER NOT NULL DEFAULT 5,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE daily_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE RESTRICT,
  date TEXT NOT NULL,
  length INTEGER NOT NULL DEFAULT 5,
  UNIQUE(date, length)
);

CREATE TABLE word_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  word_length INTEGER NOT NULL DEFAULT 5,
  is_public INTEGER DEFAULT 0,
  has_daily INTEGER DEFAULT 0,
  owner_user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE word_list_words (
  list_id INTEGER NOT NULL REFERENCES word_lists(id),
  word_id INTEGER NOT NULL REFERENCES words(id),
  PRIMARY KEY (list_id, word_id)
);
```

### DB Kuralları

- Word'leri asla silme — `is_active = 0` ile deaktive et.
- `daily_words` günlük oyunu yönetir. Tarih formatı: `YYYY-MM-DD`.
- `daily_words` tablosunda `UNIQUE(date, length)` — aynı tarih+uzunluk kombinasyonu tek bir kelime taşıyabilir.
- Scheduling UPSERT kullanır: `ON CONFLICT(date, length) DO UPDATE SET word_id = excluded.word_id`.
- Tüm D1 şema değişiklikleri migration dosyası gerektirir.

---

## Testing Standards

### Proje Test Stack

| Tool                               | Amaç                   |
| ---------------------------------- | ---------------------- |
| **Vitest**                         | Test runner            |
| `@cloudflare/vitest-pool-workers`  | D1/Workers environment |
| `apps/backend/tests/helpers/db.ts` | Shared schema + seed   |

### Test Yapısı

```
apps/backend/tests/
├── helpers/
│   └── db.ts          # Shared schema + seed
├── repositories/      # src/ yapısını yansıtır
├── routes/
└── services/
```

### TDD Zorunluluğu

Her route, service ve repository için:

1. Test yaz
2. Implement et
3. Test'i geç

### Test Naming

```typescript
describe("WordService", () => {
  it("should return daily word for given date");
  it("should throw NOT_FOUND when no word scheduled");
  it("should return random word with correct length");
});
```

- Format: `should [beklenen davranış] [koşul varsa when koşul]`
- Dil: **English** — test isimlerinde Türkçe kullanma.

### Backend Test Checklist

- [ ] Service method'ları — happy path ve error case'ler
- [ ] Route endpoint'ler — status code ve response shape
- [ ] Input validation — malformed request'leri reddet
- [ ] Authentication kontrolleri
- [ ] Error propagation — domain error'ları HTTP status code'lara map edilmeli

### Frontend Test Patterns

**AAA (Arrange-Act-Assert) zorunlu:**

```typescript
it('should call onSubmit when form is valid', () => {
  // Arrange
  const onSubmit = vi.fn();
  render(<MyForm onSubmit={onSubmit} />);
  // Act
  fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
  // Assert
  expect(onSubmit).toHaveBeenCalledTimes(1);
});
```

**Test organizasyonu:**

```typescript
describe('ComponentName', () => {
  describe('Rendering', () => {});
  describe('User Interactions', () => {});
  describe('Loading / Error States', () => {});
  describe('Accessibility', () => {});
});
```

**Provider gerektiren component'ler için renderWithProviders helper:**

```typescript
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};
```

**Test factory — mock data için:**

```typescript
const createMockWord = (overrides = {}): AdminWord => ({
  id: 1, word: 'KELIME', meaning: 'Test anlam', ...overrides,
});
```

**E2E'de element seçimi:** `data-testid` kullan, CSS class'ına bağımlı olma.

**Coverage hedefleri:**

| Kapsam | Minimum |
|--------|---------|
| Genel | 80% |
| Critical fonksiyonlar | 90% |
| UI component'leri | 85% |
| Utility'ler | 95% |

---

## Shared Package (`packages/shared`)

- Frontend ile backend arasında paylaşılan tüm tipler burada.
- Key types: `WordEntry`, `WordData`, `DailyWordResponse`, `ApiError`, `GameResult`
- Frontend import: `@nurdle/shared`
- Backend import: `@nurdle/shared`

---

## PR Standards

### Boyut Limitleri

| Metrik | Limit | Aşılırsa |
|--------|-------|----------|
| Toplam satır | 500 | Küçük PR'lara böl |
| Değişen dosya | 15 | Bölmeyi değerlendir |
| Commit sayısı | 10 | İlişkili commit'leri squash et |

### PR Checklist

- [ ] Kod hatasız derleniyor
- [ ] `console.*`, `debugger`, commented-out code yok
- [ ] Naming convention'lar uygulanmış
- [ ] Fonksiyon/dosya boyut limitleri aşılmamış
- [ ] Unit test'ler yazılmış, coverage ≥ 80%
- [ ] Mevcut testler geçiyor
- [ ] Responsive tasarım kontrol edildi (mobil + masaüstü)
- [ ] Accessibility kontrol edildi (klavye nav, ARIA, kontrast)
- [ ] Commit mesajları standarda uygun
- [ ] PR 500 satır limitinde

### Dependency Politikası

- Yeni third-party kütüphane eklemeden önce mevcut stack ile çözülemeyeceğini doğrula.
- Yeni dependency eklenmesi gerekiyorsa PR description'da gerekçeyi dokümante et.
- Native API yeterliyse kütüphane ekleme.

### Review Kuralları (Author)

- Önce self-review yap.
- Review sırasında force-push yapma — fixup commit ekle.
- Merge öncesi fixup commit'leri squash et.

---

## Commit Standards

Her commit bu formata uymalı:

```
<type>(<scope>): <subject>

<body>
```

### Commit Types

| Type       | Kullanım                                              |
| ---------- | ----------------------------------------------------- |
| `feat`     | Yeni özellik                                          |
| `fix`      | Bug fix                                               |
| `refactor` | Davranış değişikliği olmayan kod yeniden yapılandırma |
| `style`    | Formatting, minor değişiklikler (logic değişmez)      |
| `chore`    | Dependency güncellemesi, maintenance                  |
| `docs`     | Dokümantasyon                                         |
| `test`     | Test ekleme veya değiştirme                           |

### Subject Line Kuralları

- Lowercase ile başlar (tipten sonra).
- Max **50 karakter**.
- Imperative mood kullan.
- Nokta ile bitme.
- Scope: değiştirilen dosya yolu.

```
feat(admin/DailyScheduler.tsx): add inline word replace UX
fix(repositories/admin-repository.ts): include length in daily word insert
refactor(services/word-service.ts): extract date formatting helper
```

### Kurallar

- Commit başına bir logical değişiklik — feature + fix + refactor karıştırma.
- Her commit bağımsız olarak build edilebilir olmalı.
- WIP commit yok — push öncesi squash veya amend et.
- Generated dosyalar (`node_modules`, `dist`, `.wrangler`) commit'e dahil etme.

---

## Code Architecture Checklist

### SOLID

| Prensip | Kural | İhlal İşareti |
|---------|-------|---------------|
| **SRP** | Bir module/fonksiyonun tek bir değişme sebebi olmalı | Fonksiyon adında "and" var |
| **OCP** | Extension'a açık, modification'a kapalı | Yeni feature eski kodu değiştiriyor |
| **LSP** | Alt tip, üst tip yerine geçebilmeli | Override, davranış kontratını kırıyor |
| **ISP** | Client, kullanmadığı method'a bağımlı olmamalı | Büyük interface boş implementasyonlara neden oluyor |
| **DIP** | Soyutlamalara bağımlı ol, concrete'e değil | Dependency doğrudan new ile instantiate ediliyor |

### Mimari Kurallar

- Readable önce yaz, sonra ölç, sonra optimize et. Premature optimization yasak.
- Yeni proje monolith olarak başlar. Microservice kararı gerçek load/team data'sına dayanır.
- Performance vs readability: hot path profiler ile tespit edilir.

### Checklist

Her kod çıktısında:

- [ ] Single responsibility — dosya/fonksiyon tek bir şey mi yapıyor?
- [ ] Dependency direction — inner layer'lar outer'a bağımlı değil mi?
- [ ] Error boundary — hata case'leri handle ediliyor mu?
- [ ] Testability — unit test yazılabilir mi?
- [ ] Cohesion — birlikte değişen şeyler birlikte mi duruyor?
- [ ] Coupling — modüller arası bağımlılık minimal mi?
- [ ] İsimler intent'i açıkça ifade ediyor mu?

---

## Code Review Severity Levels

| Seviye             | Aksiyon                                                 |
| ------------------ | ------------------------------------------------------- |
| Critical (Blocker) | Güvenlik, data loss, breaking change — merge'i engeller |
| Major              | Logic error, performance, error handling — düzeltilmeli |
| Minor              | Naming, style — önerilir                                |
| Suggestion         | Opsiyonel iyileştirme                                   |

**Kritik kontroller:**

- SQL injection, XSS, hardcoded secret var mı?
- Null reference, undefined access riski var mı?
- Mevcut API/interface kontratı kırılıyor mu?
- N+1 query, memory leak var mı?

---

## Cloudflare Deployment

### Frontend → Cloudflare Pages

- Build: `VITE_API_URL=https://api.harfhane.app/api pnpm --filter @nurdle/frontend run build`
- Deploy: `CLOUDFLARE_API_TOKEN=... pnpm --filter @nurdle/frontend exec wrangler pages deploy dist --project-name nurdle`

### Backend → Cloudflare Workers

- Deploy: `CLOUDFLARE_API_TOKEN=... pnpm --filter @nurdle/backend run deploy`
- Entry: `apps/backend/src/index.ts`
- Worker domain: `api.harfhane.app`

---

## Package Manager

- **pnpm workspaces** — her zaman `pnpm` kullan, `npm` veya `yarn` asla.
- Root workspace scripts: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test`
- Filter: `pnpm --filter @nurdle/frontend run dev`

---

## Slash Commands

`.claude/commands/` içinde tanımlı. `/command` yazarak çağır.

| Komut | Açıklama |
|-------|----------|
| `/commit` | Staged değişiklerden Conventional Commit üret |
| `/review [dosya]` | Kod incelemesi — staged veya belirtilen dosya |
| `/pr` | GitHub Pull Request oluştur |
| `/test [pattern]` | Backend testlerini çalıştır ve özetle |
| `/check` | Tam quality gate: typecheck + test + clean-code |
| `/deploy [frontend\|backend\|both]` | Cloudflare deploy |
| `/plan <feature>` | RIPER protokolüyle feature planı |

---

## MCP Servers (Önerilen Kurulum)

MCP server'lar Claude'u dış araçlara bağlar. Manuel kurulum gerekir:

```bash
claude mcp add github -- npx -y @modelcontextprotocol/server-github
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /Users/halilenesozdemir/Desktop/dev/nurdle
```

| MCP | Amaç | Kurulum |
|-----|------|---------|
| `github` | PR/issue okuma, repo bilgisi | `@modelcontextprotocol/server-github` |
| `filesystem` | Gelişmiş dosya işlemleri | `@modelcontextprotocol/server-filesystem` |
| `playwright` | Browser test otomasyonu | `@playwright/mcp` |

Kurulum sonrası `claude mcp list` ile doğrula.

---

## Multi-Agent System

Prompt sonuna `xN` ekle. Agent'lar `.claude/agents/*.md` içinde tanımlı.

| Parametre | Ne zaman | Agent sayısı |
|-----------|----------|-------------|
| (yok) | Küçük fix, tek dosya | Sadece Orchestrator |
| `x3` | Tek feature, test + implement | 3 agent |
| `x5` | Orta feature, birden fazla dosya | 5 agent |
| `x7` | Büyük feature, backend+frontend+test | 7 agent |
| `x10` | Major refactor, mimari değişiklik | 10 agent |

**Agent dosyaları:** `.claude/agents/` — Claude Code tarafından otomatik yüklenir.
**Skill dosyaları:** `.claude/skills/` — description'a göre otomatik tetiklenir.
**Hooks:** `.claude/settings.json` — PostToolUse prettier çalıştırır.

`.github/agents/` ve `.github/skills/` artık legacy — aktif değil.

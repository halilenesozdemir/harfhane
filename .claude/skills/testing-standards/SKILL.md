---
name: Testing Standards
description: Activated when writing tests, adding test coverage, or working with Vitest and @cloudflare/vitest-pool-workers. Covers AAA pattern, test naming (should X when Y), coverage targets, and test organization. TDD is mandatory.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Testing Standards Skill

## Stack

| Tool | Purpose |
| ---- | ------- |
| **Vitest** | Test runner |
| **@cloudflare/vitest-pool-workers** | D1/Workers environment |
| **React Testing Library** | Component testing (frontend) |
| **@vitest/coverage-v8** | Coverage reporting |

## Test Location

```
apps/backend/tests/
├── helpers/
│   └── db.ts          # shared schema + seed
├── repositories/      # mirrors src/
├── routes/
└── services/
```

---

## TDD — Mandatory

1. Write the test.
2. Implement to make it pass.
3. Refactor if needed.

---

## Coverage Targets

| Scope | Minimum |
| ----- | ------- |
| Overall | 80% |
| Critical functions | 90% |
| UI Components | 85% |
| Utilities | 95% |

---

## AAA Pattern

Every test follows Arrange-Act-Assert:

```typescript
describe("WordService", () => {
  it("should return daily word for given date", async () => {
    const repository = createMockRepository();
    const service = new WordService(repository);

    const result = await service.getDailyWord("2026-01-01", 5);

    expect(result.word).toBe("NURLU");
    expect(result.length).toBe(5);
  });
});
```

---

## Test Naming

- Format: `should [expected behavior] when [condition]`
- Language: **English only** — no Turkish in test names.

```typescript
it("should return daily word for given date");
it("should throw NOT_FOUND when no word scheduled");
it("should return random word with correct length");
it("should validate word against word list");
it("should reject word shorter than minimum length");
```

---

## Test Organization

```typescript
describe("ComponentName", () => {
  describe("Rendering", () => {});
  describe("User Interactions", () => {});
  describe("Loading / Error States", () => {});
  describe("Accessibility", () => {});
});
```

---

## Backend Test Patterns

### Service Layer

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("WordService", () => {
  let wordService: WordService;
  let mockRepository: MockWordRepository;

  beforeEach(() => {
    mockRepository = createMockWordRepository();
    wordService = new WordService(mockRepository);
  });

  describe("getDailyWord", () => {
    it("should return word when found", async () => {
      mockRepository.getDailyWord.mockResolvedValue(createMockWord());
      const result = await wordService.getDailyWord("2026-01-01", 5);
      expect(result).toEqual(createMockWord());
    });

    it("should throw NotFoundError when no word scheduled", async () => {
      mockRepository.getDailyWord.mockResolvedValue(null);
      await expect(wordService.getDailyWord("2026-01-01", 5)).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Route Endpoint

```typescript
describe("GET /api/words/daily", () => {
  it("should return 200 with word data", async () => {
    const response = await app.request("/api/words/daily?date=2026-01-01&length=5");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty("word");
  });

  it("should return 400 when date is missing", async () => {
    const response = await app.request("/api/words/daily");
    expect(response.status).toBe(400);
  });
});
```

---

## Frontend Test Patterns

### Component with Providers

```typescript
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};
```

### Test Factory

```typescript
const createMockWord = (overrides = {}): WordEntry => ({
  id: 1,
  word: "NURLU",
  meaning: "Test anlam",
  length: 5,
  ...overrides,
});
```

### Element Selection

- Use `data-testid` attributes — never CSS classes.
- Use `screen.getByRole()` for semantic elements.

---

## Backend Test Checklist

- [ ] Service methods — happy path and error cases
- [ ] Route endpoints — status code and response shape
- [ ] Input validation — malformed requests rejected
- [ ] Authentication checks
- [ ] Error propagation — domain errors map to HTTP status codes

## Frontend Test Checklist

### Component

- [ ] Renders with default props
- [ ] User interactions (clicks, input changes)
- [ ] Loading, error, and empty states
- [ ] Accessibility attributes

### Hook

- [ ] Initial state
- [ ] State updates
- [ ] Error handling

---
name: Backend Development
description: Activated for Hono, Cloudflare Workers, D1 database, and API endpoint tasks in apps/backend/. Covers RESTful conventions, layered architecture (Routes→Services→Repositories), Zod validation, and D1-specific patterns.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Backend Development Skill

## Stack

- Hono — TypeScript HTTP framework on Cloudflare Workers
- Cloudflare D1 (SQLite) — word lists, game metadata
- Wrangler — local dev and deployment
- Vitest + @cloudflare/vitest-pool-workers — testing

## Architecture

```
Routes (HTTP layer)
  → Services (business logic)
    → Repositories (data access / D1 queries)
```

Routes never touch D1 directly. All DB access goes through repository.

---

## API Conventions

- Base path: `/api/`
- RESTful resource naming: `/api/words`, `/api/words/daily`, `/api/words/:id`
- Success response: `{ data: T }`
- Error response: `{ error: { code, message } }`
- HTTP status codes: 200, 201, 400, 401, 404, 409, 422, 500

### HTTP Status Codes

| Code | Usage |
| ---- | ----- |
| 200 | Successful read or update |
| 201 | Successful creation |
| 400 | Validation error, malformed input |
| 401 | Unauthenticated |
| 403 | Unauthorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate, state issue) |
| 422 | Unprocessable entity |
| 500 | Internal server error |

---

## Critical: Turkish Uppercase

NEVER use `.toUpperCase()` for Turkish strings.

```typescript
// ❌ WRONG — "i" becomes "I" not "İ"
word.toUpperCase()

// ✅ CORRECT — use normalizeWord() from utils/normalize.ts
import { normalizeWord } from "../utils/normalize";
normalizeWord(word)
```

---

## D1-Specific Patterns

```typescript
// ❌ WRONG — D1 exec() does NOT support multi-statement SQL
await db.exec(`
  INSERT INTO words (word) VALUES ('test');
  INSERT INTO daily_words (word_id) VALUES (1);
`);

// ✅ CORRECT — prepare().run() per statement
await db.prepare("INSERT INTO words (word) VALUES (?)").bind("test").run();
await db.prepare("INSERT INTO daily_words (word_id) VALUES (?)").bind(1).run();
```

- Words are NEVER deleted — set `is_active = 0` instead.
- `daily_words` UNIQUE(date, length) — use UPSERT: `ON CONFLICT(date, length) DO UPDATE SET word_id = excluded.word_id`.
- All schema changes require numbered migration file in `migrations/`.

---

## Validation

All input validated with Zod at route level (`@hono/zod-validator`).
Schemas live in `src/schemas/`.

```typescript
import { zValidator } from "@hono/zod-validator";
import { wordQuerySchema } from "../schemas/word-schemas";

app.get("/words/daily", zValidator("query", wordQuerySchema), async (c) => {
  const { date, length } = c.req.valid("query");
  const word = await wordService.getDailyWord(date, length);
  return c.json({ data: word });
});
```

- Query validation errors → 400 BAD_REQUEST
- Body validation errors → 422 VALIDATION_ERROR

---

## Error Handling

```typescript
class NotFoundError extends Error {
  readonly code = "NOT_FOUND";
  constructor(resource: string) {
    super(`${resource} not found`);
  }
}

class ValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
  }
}
```

- Typed error classes, not generic `Error`.
- Internal error details never exposed to client in production.
- Empty `catch` blocks forbidden.
- Every `catch` does one thing: log, transform, or rethrow.

---

## Repository Pattern

```typescript
export class WordRepository {
  constructor(private readonly db: D1Database) {}

  async getDailyWord(date: string, length: number): Promise<WordEntry | null> {
    const result = await this.db
      .prepare(
        `SELECT w.* FROM words w
         JOIN daily_words dw ON w.id = dw.word_id
         WHERE dw.date = ? AND dw.length = ? AND w.is_active = 1`
      )
      .bind(date, length)
      .first<WordEntry>();
    return result ?? null;
  }
}
```

---

## Service Layer

- Domain per service: `WordService`, `AdminService`.
- One business operation per method.
- Input validation at service boundary.

---

## Authentication

- JWT: short-lived access tokens (15-30 min).
- Never store sensitive data in JWT payload.
- Auth middleware validates token, attaches user to context.
- RBAC guards protect admin routes.

---

## TDD — Mandatory

1. Write test first.
2. Implement to pass the test.
3. Verify test passes.

Test structure mirrors src/:
```
tests/
├── repositories/
├── services/
└── routes/
```

---

## Backend Checklist

- [ ] All endpoints return consistent `{ data: T }` or `{ error: {...} }` format
- [ ] Input validation on every mutation endpoint
- [ ] Auth and authorization applied to protected routes
- [ ] Error handling returns appropriate HTTP status codes
- [ ] D1 queries use prepare().bind().run() — never exec() for multi-statements
- [ ] Turkish strings use normalizeWord() — never .toUpperCase()
- [ ] Words deactivated (is_active=0) not deleted
- [ ] Schema changes have migration file
- [ ] No hardcoded secrets — use wrangler bindings or .dev.vars
- [ ] Unit tests written (TDD)

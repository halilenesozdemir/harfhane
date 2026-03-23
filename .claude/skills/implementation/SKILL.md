---
name: Implementation
description: Activated when writing new code, implementing features, or scaffolding structures. Covers coding standards, patterns, error handling, and test writing for all tiers. Apply alongside clean-code skill.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash
---

# Implementation Skill

## Coding Standards

1. **Function Length**: Maximum 20 lines. Extract if longer.
2. **File Length**: Maximum 250 lines. Split if longer.
3. **Nesting Depth**: Maximum 2 levels. Use early return if deeper.
4. **Parameter Count**: Maximum 3. Wrap in options object if more.
5. **Cyclomatic Complexity**: Maximum 8 per function.

```typescript
// ✅ Early return, clear naming
function getUserDisplayName(user: User | null): string {
  if (!user) return "Anonymous";
  if (user.nickname) return user.nickname;
  return `${user.firstName} ${user.lastName}`;
}

// ❌ Deep nesting, any type
function getName(u: any): string {
  if (u) {
    if (u.nickname) { return u.nickname; }
    else { return u.firstName + " " + u.lastName; }
  } else { return "Anonymous"; }
}
```

---

## Import Ordering

```typescript
// 1. Framework/Library
import { useState, useEffect } from "react";
// 2. Third-party
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
// 3. Internal absolute
import { WordService } from "../services/word-service";
// 4. Relative
import { WordCard } from "./components/word-card";
import type { WordProps } from "./types";
```

---

## Error Handling

### Result Type Pattern

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

### Domain Error Classes

```typescript
class ValidationError extends Error {
  constructor(
    public readonly field: string,
    public readonly constraint: string,
  ) {
    super(`Validation failed: ${field} — ${constraint}`);
    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {
  constructor(public readonly resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}
```

### Try-Catch Rules

- In catch: log, transform, or rethrow — pick one only.
- Empty catch is forbidden.
- If only rethrowing, remove the try-catch entirely.

---

## Common Patterns

### Repository Pattern

```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(entity: Omit<T, "id">): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
}
```

### Factory Pattern

```typescript
function createSender(type: "email" | "sms"): NotificationSender {
  const senders: Record<string, NotificationSender> = {
    email: new EmailSender(),
    sms: new SmsSender(),
  };
  const sender = senders[type];
  if (!sender) throw new Error(`Unknown type: ${type}`);
  return sender;
}
```

---

## Test Writing Guide

### AAA Pattern (Arrange-Act-Assert)

```typescript
describe("WordService", () => {
  describe("getDailyWord", () => {
    it("should return daily word for given date", async () => {
      const repository = createMockRepository();
      const service = new WordService(repository);

      const result = await service.getDailyWord("2026-01-01", 5);

      expect(result).toEqual(createMockWord());
    });

    it("should throw NotFoundError when no word scheduled", async () => {
      const repository = createMockRepository({ returnNull: true });
      const service = new WordService(repository);

      await expect(service.getDailyWord("2026-01-01", 5)).rejects.toThrow(NotFoundError);
    });
  });
});
```

- Format: `should [expected behavior] when [condition]`
- Language: **English only** — no Turkish in test names.

### What to Test

| Test | Do NOT Test |
| ---- | ----------- |
| Business logic | Framework internals |
| Edge cases | Getter/setter |
| Error paths | Third-party library |
| Public API | Private methods |

---

## Task Completion Checklist

- [ ] Code compiles / runs?
- [ ] Naming conventions followed?
- [ ] Error handling included?
- [ ] No `console.log` / `debugger`?
- [ ] Imports organized?
- [ ] Functions ≤20 lines?
- [ ] Files ≤250 lines?
- [ ] Tests written?

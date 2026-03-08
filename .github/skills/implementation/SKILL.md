---
name: Implementation
description: >
  Skill for coding, implementation, and development tasks.
  Used by Tier 1 (Principal), Tier 1.5 (Staff Engineer), and Tier 2 (MidCoder) agents.
  Provides guidance on coding standards, patterns, error handling, and testing.
estimated-tokens: 3000
---

# Implementation Skill

## Usage

This skill is used by Principal (Tier 1), Staff Engineer (Tier 1.5), and MidCoder (Tier 2) agents for the following tasks:

- Function and module implementation
- Utility / helper function development
- Boilerplate code generation
- Bug fixes and small refactoring
- Unit test development

---

## Coding Standards

### General Rules

1. **Function Length**: Maximum 20 lines. Extract if longer.
2. **File Length**: Maximum 250 lines. Split into modules if longer.
3. **Nesting Depth**: Maximum 2 levels. Fix with early return if deeper.
4. **Parameter Count**: Maximum 3. Wrap in an options object if more.
5. **Cyclomatic Complexity**: Maximum 8 per function.

### TypeScript / JavaScript

```typescript
// ✅ Good: Early return, clear naming
function getUserDisplayName(user: User | null): string {
  if (!user) return "Anonymous";
  if (user.nickname) return user.nickname;
  return `${user.firstName} ${user.lastName}`;
}

// ❌ Bad: Deep nesting, unclear naming
function getName(u: any): string {
  if (u) {
    if (u.nickname) {
      return u.nickname;
    } else {
      return u.firstName + " " + u.lastName;
    }
  } else {
    return "Anonymous";
  }
}
```

### Import Ordering

```typescript
// 1. Framework/Library imports
import React from "react";
import { useState, useEffect } from "react";

// 2. Third-party imports
import axios from "axios";
import { z } from "zod";

// 3. Internal absolute imports
import { UserService } from "@/services/user-service";
import { Button } from "@/shared/components";

// 4. Relative imports
import { UserCard } from "./components/user-card";
import { useUserData } from "./hooks/use-user-data";
import type { UserProps } from "./types";
```

---

## Error Handling Guide

### Pattern: Result Type

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function parseConfig(raw: string): Result<Config> {
  try {
    const parsed = JSON.parse(raw);
    return { ok: true, value: parsed as Config };
  } catch (e) {
    return { ok: false, error: new Error(`Invalid config: ${e}`) };
  }
}
```

### Pattern: Error Boundary

```typescript
// Domain-specific error classes
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
  constructor(
    public readonly resource: string,
    public readonly id: string,
  ) {
    super(`${resource} not found: ${id}`);
    this.name = "NotFoundError";
  }
}
```

### Try-Catch Rules

- **What to do in catch**: Log, transform, rethrow — pick one.
- **Empty catch is forbidden**: At minimum, log it.
- **Specific catch**: Filter by error type when possible.

---

## Common Patterns

### Factory Pattern

```typescript
interface NotificationSender {
  send(message: string, recipient: string): Promise<void>;
}

function createNotificationSender(
  type: "email" | "sms" | "push",
): NotificationSender {
  const senders: Record<string, NotificationSender> = {
    email: new EmailSender(),
    sms: new SmsSender(),
    push: new PushSender(),
  };

  const sender = senders[type];
  if (!sender) throw new Error(`Unknown notification type: ${type}`);
  return sender;
}
```

### Repository Pattern

```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(entity: Omit<T, "id">): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
```

### Composition over Inheritance

```typescript
const withTracing = <T extends (...args: unknown[]) => unknown>(fn: T): T => {
  return ((...args: Parameters<T>) => {
    const result = fn(...args);
    return result;
  }) as T;
};
```

---

## Test Writing Guide

> **Full testing standards**: See `testing-standards/SKILL.md` for comprehensive test patterns, component testing, hook testing, mocking strategies, E2E, and backend testing standards.

### Test Structure: AAA (Arrange-Act-Assert)

```typescript
describe("UserService", () => {
  describe("createUser", () => {
    it("should create a user with valid data", async () => {
      // Arrange
      const userData = { name: "John", email: "john@test.com" };
      const repo = createMockRepo();

      // Act
      const user = await createUser(userData, repo);

      // Assert
      expect(user.name).toBe("John");
      expect(user.id).toBeDefined();
    });

    it("should throw ValidationError for invalid email", async () => {
      // Arrange
      const userData = { name: "John", email: "invalid" };

      // Act & Assert
      await expect(createUser(userData)).rejects.toThrow(ValidationError);
    });
  });
});
```

### Test Naming

- `should [expected behavior] when [condition]`
- Turkish is not used — test names are always in English.

### What Should Be Tested?

| Yes            | No                               |
| -------------- | -------------------------------- |
| Business logic | Framework internals              |
| Edge cases     | Getter/setter                    |
| Error paths    | Third-party library              |
| Public API     | Private method (test indirectly) |

---

## Task Completion Standard

MidCoder agents verify the following at the end of every task:

- [ ] Does the code compile / run?
- [ ] Does it follow naming conventions?
- [ ] Is error handling included?
- [ ] Have unnecessary console.log / debug code been removed?
- [ ] Are imports organized?
- [ ] Do functions stay within 20 lines?

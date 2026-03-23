---
name: Clean Code
description: Activated for ALL coding tasks. Enforces no-comments, no-console, no-any, max 20-line functions, max 250-line files, DRY principles, and SOLID patterns. Mandatory for every file that produces code.
allowed-tools: Read, Grep, Glob
---

# Clean Code Skill

## Scope

Mandatory for every agent that produces code (T1, T1.5, T2). Applied to ALL coding tasks without exception.

---

## Core Principles

### SOLID

| Principle | Rule | Violation Sign |
| --- | --- | --- |
| **SRP** | A module/function has exactly one reason to change | Function does more than its name suggests |
| **OCP** | Open for extension, closed for modification | Adding a feature requires changing existing code |
| **LSP** | Subtypes are substitutable for their base types | Overridden method changes behavior contract |
| **ISP** | No client depends on methods it doesn't use | Large interface forces empty implementations |
| **DIP** | Depend on abstractions, not concretions | Direct instantiation of dependencies |

### DRY — Rule of Three

| Usage | Decision |
|-------|----------|
| First | Direct implementation (YAGNI) |
| Second | Notice it, don't abstract yet |
| Third | Abstract — shared util/helper |

### KISS

- Choose the simplest correct solution.
- Readable code beats compact code.
- If a junior can't understand it in 30 seconds, simplify.

### YAGNI

- Never add functionality "just in case."
- No speculative abstractions or config options.
- Build for today's requirements.

---

## Strict Code Hygiene — NEVER Violate

### No Comments

```typescript
// ❌ FORBIDDEN
// This function calculates the total price
function calculateTotalPrice(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ CORRECT — self-documenting, no comments
function calculateTotalPrice(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

- No inline comments (`//`), no block comments (`/* */`).
- No TODO, FIXME, HACK comments.
- No commented-out code.

### No Console

- No `console.log`, `console.warn`, `console.error`, `console.debug`, `console.info`.
- No `console.table`, `console.time`, `console.trace`.
- No `alert()`, `confirm()`, `prompt()` in production.

### No Debug Artifacts

- No `debugger` statements.
- No hardcoded test values or placeholder strings.
- No `any` type — use `unknown` and narrow with type guards.

---

## Naming Conventions

| Element | Convention | Example |
| --- | --- | --- |
| Files | `kebab-case` | `user-service.ts` |
| Variables/Functions | `camelCase` | `getUserById` |
| Classes/Interfaces | `PascalCase` | `UserService` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Booleans | `is`/`has`/`should` prefix | `isActive`, `hasPermission` |
| Event handlers | `handle` prefix | `handleSubmit`, `handleClick` |

**Naming quality:**
- Intention-revealing: name tells what it does, not how.
- No abbreviations: `button` not `btn`, `response` not `res`.
- No generic names: `data`, `info`, `item`, `temp`, `val` forbidden.
- Consistent vocabulary: pick one term and use it everywhere.

---

## Function Rules

- Maximum **20 lines** per function (excluding type definitions).
- Maximum **3 parameters** — use options object for more.
- Maximum **2 nesting levels** — use early returns.
- One function, one job. If "and" appears in the name, split it.

```typescript
// ✅ Early return pattern
function getDiscount(user: User): number {
  if (!user.isPremium) return 0;
  if (user.membershipYears < 1) return 5;
  if (user.membershipYears < 5) return 10;
  return 15;
}

// ❌ Deep nesting — forbidden
function getDiscount(user: User): number {
  if (user.isPremium) {
    if (user.membershipYears >= 5) { return 15; }
    else if (user.membershipYears >= 1) { return 10; }
    else { return 5; }
  } else { return 0; }
}
```

---

## Error Handling

- Every `catch` block performs a meaningful action (log, transform, or rethrow — pick one).
- Empty `catch` blocks are forbidden.
- Use domain-specific error classes, not generic `Error`.
- Never use exceptions for control flow.

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

---

## File Structure

- Maximum **250 lines** per file.
- One concept per file — one component, one service, one hook.
- No circular dependencies.
- No wildcard imports (`import * as`).
- Group imports: framework → third-party → internal → relative.

---

## Code Quality Checklist

- [ ] No comments (self-documenting naming)
- [ ] No `console.*`
- [ ] No `debugger`
- [ ] No `any` type
- [ ] No commented-out code
- [ ] No magic numbers (use named constants)
- [ ] Max 2 nesting levels
- [ ] Functions max 20 lines
- [ ] Files max 250 lines
- [ ] All errors handled
- [ ] Naming is intention-revealing
- [ ] No abbreviations
- [ ] DRY — no duplicated logic
- [ ] Single responsibility per function/file

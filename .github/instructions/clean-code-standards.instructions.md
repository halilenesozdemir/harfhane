---
applyTo: "**"
---

# Clean Code & Development Standards — Mandatory Instructions

## Scope

These rules are **non-negotiable** and apply to ALL code produced by ANY agent in ANY coding task.
Violation of these rules is treated as a 🔴 Critical review finding.

---

## Absolute Prohibitions

### 1. No Comments in Code

- **ZERO tolerance** for inline comments (`//`), block comments (`/* */`), or JSDoc on implementation.
- No TODO, FIXME, HACK, XXX, or any other annotation comments.
- No commented-out code — ever. Use version control.
- Code must be **self-documenting** through clear, intention-revealing naming.
- **Only exception**: JSDoc/TSDoc on **public API interfaces** (exported types/interfaces only).

### 2. No Console Statements

- **ZERO tolerance** for any `console.*` method in produced code:
  - `console.log`, `console.warn`, `console.error`, `console.debug`
  - `console.info`, `console.table`, `console.time`, `console.trace`
- No `alert()`, `confirm()`, `prompt()` calls.
- Use a structured logging service for operational logging needs.

### 3. No Debug Artifacts

- No `debugger` statements.
- No hardcoded test values or mock data in production code.
- No `any` type in TypeScript — use `unknown` with type narrowing.
- No `@ts-ignore` or `@ts-expect-error` without a documented issue reference.

---

## Mandatory Standards

### Software Principles

Every piece of code must adhere to:

- **SOLID** — Single responsibility, open-closed, Liskov substitution, interface segregation, dependency inversion.
- **DRY** — No duplicated logic. Abstract only after 3+ occurrences (Rule of Three).
- **KISS** — Simplest correct solution wins. No over-engineering.
- **YAGNI** — Build only what is needed now. No speculative features.

### Code Structure

- Functions: **maximum 20 lines**, **maximum 3 parameters**, **maximum 2 nesting levels**.
- Files: **maximum 250 lines**, **one concept per file**.
- Cyclomatic complexity: **≤ 8 per function**.
- Use early returns to reduce nesting.

### Naming

- Intention-revealing names — no abbreviations (`button` not `btn`).
- No generic names (`data`, `info`, `temp`, `val`, `item`).
- Booleans prefixed with `is`, `has`, `should`.
- Event handlers prefixed with `handle`.
- Files in `kebab-case`, variables in `camelCase`, classes in `PascalCase`, constants in `UPPER_SNAKE_CASE`.

### Error Handling

- Every `catch` block performs a meaningful action.
- Empty catch blocks are **forbidden**.
- Use domain-specific error classes.
- Never use exceptions for control flow.

---

## Mandatory Skills

### Always Mandatory (Every Coding Task)

1. **`clean-code`** (`.github/skills/clean-code/SKILL.md`) — Code hygiene, naming, structure rules.

### Conditionally Mandatory (Task-Type Specific)

2. **`frontend-development`** (`.github/skills/frontend-development/SKILL.md`) — Required for any frontend/React/Ant Design work. Skipped for backend-only tasks.

These skills are not optional references — they are **binding rules** when their condition applies.

---

## Enforcement

- Every code review (both Principal → Staff Engineer and MidCoder self-review) MUST check for violations.
- Any violation of the "Absolute Prohibitions" section is an automatic 🔴 Critical finding.
- Code containing comments, console statements, or debug artifacts will be **rejected** immediately.

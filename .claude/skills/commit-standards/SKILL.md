---
name: Commit Standards
description: Activated when creating git commits or writing commit messages. Enforces Conventional Commits format with type(scope): subject. Types include feat, fix, refactor, style, chore, docs, test.
allowed-tools: Read, Bash
---

# Commit Standards Skill

## Format

```
<type>(<scope>): <subject>

<body>
```

---

## Commit Types

| Type | Usage |
| ---- | ----- |
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `style` | Minor formatting changes (no logic change) |
| `chore` | Dependency updates, maintenance |
| `docs` | Documentation changes |
| `test` | Adding or modifying tests |

---

## Subject Line Rules

- Lowercase after the colon.
- Maximum **50 characters**.
- Imperative mood.
- Do NOT end with a period.
- Scope = file path relative to source root.

```
feat(admin/DailyScheduler.tsx): add inline word replace UX
fix(repositories/admin-repository.ts): include length in daily insert
refactor(services/word-service.ts): extract date formatting helper
test(repositories/word-repository.ts): add edge case for empty schedule
```

---

## Body

- Explain **why** and **how**.
- One blank line between subject and body.
- Bullet points for multiple changes.

```
feat(routes/words.ts): add word length filter to random endpoint

- Added optional length query parameter to GET /api/words/random.
- Defaults to 5 if not provided.
- Validates length is between 4 and 6.
```

---

## Rules

1. One logical change per commit — never mix features, fixes, and refactors.
2. Each commit independently buildable.
3. Language: **English** (Conventional Commits standard).
4. No WIP commits — squash or amend before pushing.
5. Never commit: `node_modules`, `dist`, `.wrangler`, `.env*`.
6. Never amend published commits — create a new one.

---

## Examples

```
feat(routes/lists.ts): add public word list endpoint

- GET /api/lists/:slug returns public list with words.
- Returns 404 for private or nonexistent lists.
- Zod validation on slug param.

fix(utils/normalize.ts): handle null input in normalizeWord

refactor(services/word-service.ts): extract daily word lookup

test(services/word-service.ts): add test for length mismatch case

chore: update @hono/zod-validator to 0.4.1
```

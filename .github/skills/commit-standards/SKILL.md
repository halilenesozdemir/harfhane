---
name: Commit Standards
description: >
  Commit message format, conventional commit types, and commit hygiene standards.
  Used by all coding agents (Tier 1, Tier 1.5, Tier 2) to ensure consistent
  version control practices across the team.
estimated-tokens: 2000
---

# Commit Standards Skill

## Scope

This skill defines the commit message format and conventions for all agents that produce code.
Every commit must follow these standards — non-compliant commits are rejected.

---

## Commit Types

| Type         | Usage                                                         |
| ------------ | ------------------------------------------------------------- |
| `feat`       | New feature added                                             |
| `feat!!`     | Critical feature or development requiring special attention   |
| `fix`        | Bug fix (include repro steps, expected vs actual)             |
| `add`        | Non-feature addition to existing code                         |
| `refactor`   | Code restructuring without behavior change                    |
| `redesign`   | UI/UX revision                                                |
| `style`      | Minor formatting/punctuation changes (no logic change)        |
| `chore`      | Dependency updates or non-critical maintenance                |
| `docs`       | Documentation changes                                         |
| `test`       | Adding or modifying tests                                     |

---

## Commit Message Format

### Structure

```

<type>(<scope>): <subject>

<body>

<footer>
```

### 1. Subject Line (Header)

- Start with lowercase after the colon.
- Maximum **50 characters**.
- Use imperative mood.
- Do NOT end with a period.
- Include the file path as scope.

```
feat(Home/index.tsx): Banner module development
fix(Login/index.tsx): Fix incorrect counter value
add(Home/index.tsx): Add new utility function
refactor(UserService/index.ts): Restructure validation logic
```

### 2. Body (Description)

- Provide detailed explanation of **why** and **how**.
- Leave one blank line between subject and body.
- Use bullet points for multiple changes.

```
feat(Home/index.tsx): Banner module development

- Banner module developed and integrated into homepage.
- Responsive design applied for mobile devices.
- Related documentation updated.
```

### 3. Footer

- Include ticket or PR references.

```
feat(Home/index.tsx): Banner module development

- Banner module developed and integrated into homepage.
- Responsive design applied for mobile devices.

Refs: #1234
```

### 4. Single-Line Format (for small changes)

When subject, body, and footer can be combined:

```
fix(Home/index.tsx): Fix click counter returning wrong value #0001
```

---

## Scope Convention

The scope should reference the **file path** relative to the source root to validate which files were changed.

```
feat(Home/index.tsx)      — New feature in Home component
fix(Login/index.tsx)       — Bug fix in Login component
refactor(UserService.ts)   — Refactoring service layer
style(Header/style.scss)   — Style-only changes
test(User.spec.ts)         — Test changes
```

---

## Rules

1. **One logical change per commit** — do not mix features, fixes, and refactors.
2. **Atomic commits** — each commit should be independently buildable.
3. **Language**: Commit messages are in **English** (Conventional Commits format).
4. **No WIP commits** — squash or amend before pushing.
5. **Reference tickets** in footer when applicable.
6. **Do NOT commit** generated files, `node_modules`, `dist`, or build artifacts.

---

## Examples

### Feature Commit

```
feat(Dashboard/index.tsx): Add real-time notification widget

- Integrated WebSocket connection for live updates.
- Added notification badge with unread count.
- Implemented auto-dismiss after 5 seconds.

Refs: #456
```

### Bug Fix Commit

```
fix(Auth/login-form.tsx): Fix form submission on Enter key

- Form was not submitting when user pressed Enter.
- Added onKeyDown handler to trigger form submission.
- Added unit test for keyboard interaction.

Refs: #789
```

### Refactor Commit

```
refactor(UserService.ts): Extract validation into separate module

- Moved validation logic to user-validation.ts.
- Reduced UserService from 280 to 150 lines.
- No behavior change — all existing tests pass.
```

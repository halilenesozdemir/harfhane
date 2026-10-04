---
name: Code Architecture
description: Activated when designing system architecture, planning module structure, or making technology decisions. Covers SOLID principles, dependency direction, layered architecture, and ADR format.
allowed-tools: Read, Grep, Glob
---

# Code Architecture Skill

## Usage

Used by Principal-level agents for:
- Project architecture design and evaluation
- Code structure organization and refactoring decisions
- Technical debt analysis
- Technology selection and trade-off analysis

---

## Architecture Patterns

### Layered Architecture (Harfhane Backend)

```
Routes (HTTP layer)
  → Services (business logic)
    → Repositories (data access / D1 queries)
```

Each layer depends only on the layer directly below it. Routes never touch D1 directly.

### Hexagonal Architecture (Ports & Adapters)

```
[Driving Adapters] → [Ports] → [Core Domain] ← [Ports] ← [Driven Adapters]
```

- Core domain has no framework dependencies.
- Ports are interfaces. Adapters are port implementations — swappable.

### Feature-Based Modular Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   └── dashboard/
├── shared/
│   ├── components/
│   ├── utils/
│   └── types/
└── core/
    ├── config/
    └── http/
```

---

## SOLID Application Guide

### SRP — Single Responsibility

- A module has only one reason to change.
- Test: "What does this do?" answerable in one sentence.
- Anti-pattern: God class, utility dumping ground.

### OCP — Open/Closed

- Open for extension, closed for modification.
- Use strategy pattern, composition over inheritance.
- Adding new behavior should not require modifying existing code.

### LSP — Liskov Substitution

- Subtypes must substitute for their base types.
- No unexpected exceptions, no strengthening preconditions.

### ISP — Interface Segregation

- Clients don't depend on interfaces they don't use.
- Split large interfaces into smaller, role-specific ones.

### DIP — Dependency Inversion

- High-level modules don't depend on low-level modules.
- Both depend on abstractions.
- Constructor injection preferred.

---

## Scalability Decisions

### When to Abstact?

| Situation | Decision |
| --- | --- |
| First usage | Direct implementation (YAGNI) |
| Second similar usage | Notice it, don't abstract yet |
| Third similar usage | Abstract — Rule of Three |

### Performance vs Readability

- Write readable code first, then measure, then optimize.
- Premature optimization is forbidden.
- Hot paths identified through profiling only.

### Monolith-First

- New projects start as a monolith.
- Modular decomposition after domain boundaries become clear.
- Microservice decisions based on load and team size data.

---

## Architectural Decision Record (ADR)

```markdown
### ADR-{number}: {Decision Title}

**Status**: Accepted | Rejected | Modified
**Context**: [Situation that necessitated the decision]
**Decision**: [Decision taken]
**Alternatives**:
1. [Alternative 1] — [Pros / Cons]
2. [Alternative 2] — [Pros / Cons]
**Consequences**: [Impact of the decision]
```

---

## Code Structure Checklist

- [ ] Single responsibility — file/function does only one thing?
- [ ] Dependency direction — inner layers don't depend on outer ones?
- [ ] Interface usage — concrete dependencies abstracted?
- [ ] Error boundaries — error cases handled?
- [ ] Naming — names clearly express intent?
- [ ] Testability — code is unit-testable?
- [ ] Cohesion — things that change together are kept together?
- [ ] Coupling — inter-module dependency minimal?

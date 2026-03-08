---
name: Code Architecture
description: >
  Skill specialized in software architecture, system design, and code structure.
  Used by Tier 1 (Principal) agents. Provides guidance on architecture patterns, SOLID principles,
  scalability, and developer experience.
estimated-tokens: 2000
---

# Code Architecture Skill

## Usage

This skill is used by Principal-level agents for the following tasks:

- Project architecture design and evaluation
- Code structure organization and refactoring decisions
- Technical debt analysis and resolution strategies
- Technology selection and trade-off analysis

---

## Architecture Patterns

### Layered Architecture

```
Presentation → Application → Domain → Infrastructure
```

- Each layer can only depend on the layer directly below it.
- The Domain layer carries no external dependencies.
- Infrastructure details (DB, API, file system) reside in the outermost layer.

### Hexagonal Architecture (Ports & Adapters)

```
[Driving Adapters] → [Ports] → [Core Domain] ← [Ports] ← [Driven Adapters]
```

- Core domain business logic has no framework dependencies.
- Ports are defined as interfaces.
- Adapters are port implementations — they are swappable.

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
│       └── ...
├── shared/
│   ├── components/
│   ├── utils/
│   └── types/
└── core/
    ├── config/
    ├── http/
    └── store/
```

---

## SOLID Principles — Application Guide

### Single Responsibility Principle (SRP)

- A module should have only one reason to change.
- **Test**: The question "What does this class/function do?" should be answerable in a single sentence.
- **Anti-pattern**: God class, utility dumping ground.

### Open/Closed Principle (OCP)

- Behavior should be open for extension, closed for modification.
- Strategy pattern, plugin architecture, composition over inheritance.
- **Test**: Adding a new business rule should not require modifying existing code.

### Liskov Substitution Principle (LSP)

- Subtypes must be substitutable for their base types.
- Throwing unexpected exceptions, strengthening preconditions, or weakening postconditions is forbidden.

### Interface Segregation Principle (ISP)

- Clients should not be forced to depend on interfaces they do not use.
- Large interfaces are split into smaller, role-specific interfaces.

### Dependency Inversion Principle (DIP)

- High-level modules should not depend on low-level modules.
- Both levels should depend on abstractions.
- Constructor injection is preferred.

---

## Scalability Decisions

### When to Add Abstraction?

| Situation            | Decision                         |
| -------------------- | -------------------------------- |
| First usage          | Direct implementation (YAGNI)    |
| Second similar usage | Notice it but don't abstract yet |
| Third similar usage  | Abstract it (Rule of Three)      |

### Performance vs Readability

- Write readable code first, then measure, then optimize.
- Premature optimization is forbidden.
- Hot paths are identified through profiling.

### Monolith-First Approach

- New projects start as a monolith.
- Modular decomposition is done once domain boundaries become clear.
- Microservice decisions are made based on load and team size data.

---

## Decision Framework

The following template is used for every architectural decision:

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

Principal agents verify the following for every code output:

- [ ] Single responsibility — does the file/function do only one thing?
- [ ] Dependency direction — inner layers don't depend on outer ones?
- [ ] Interface usage — are concrete dependencies abstracted?
- [ ] Error boundaries — are error cases handled properly?
- [ ] Naming — do names clearly express intent?
- [ ] Testability — is the code unit-testable?
- [ ] Cohesion — are things that change together kept together?
- [ ] Coupling — is inter-module dependency minimal?

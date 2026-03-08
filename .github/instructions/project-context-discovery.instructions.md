---
applyTo: "**"
---

# Project Context Discovery (PCD)

Automatically discover and apply the host project's documentation as system context. This rule ensures the delegation system adapts to any project it is placed into.

---

## Purpose

When this boilerplate is copied into a project, agents must treat the project's existing documentation as authoritative context. Project-specific rules, architecture decisions, coding conventions, and domain knowledge found in these documents guide all development work.

---

## Discovery Protocol

### Step 1 — Scan Sources

At the start of every task session, agents scan the following sources in order. **Missing sources are silently skipped** — agents proceed with whatever documentation exists.

| Priority | Source | Pattern | Description |
|----------|--------|---------|-------------|
| 1 | Root README | `README.md` | Primary project documentation — architecture, setup, conventions |
| 2 | Root markdown files | `*.md` (root directory) | Contributing guides, coding standards, API docs |
| 3 | Docs folder | `docs/**/*.md` (max 3 levels deep) | Extended documentation, design docs, specs |
| 4 | Docs folder (non-md) | `docs/**/*.{txt,rst,adoc}` (max 3 levels deep) | Alternative documentation formats |

> **Edge Case**: If no `README.md` exists, skip to Priority 2. If no `docs/` folder exists, skip Priorities 3-4. Agents never fail due to missing project documentation — the system gracefully degrades to boilerplate defaults only.

### Step 2 — Exclude Boilerplate Files

The following files belong to the delegation system itself and are **not** treated as project context:

- `AGENTS.md` — Delegation system rules (already loaded separately)
- `CHANGELOG.md` — Delegation system changelog
- `LICENSE` — License file
- `USAGE.md` — Delegation system usage guide
- `.github/**` — All delegation system internals

### Step 3 — Extract Context

From each discovered document, agents extract:

- **Project rules**: Coding standards, naming conventions, style guides
- **Architecture**: System design, module structure, dependency rules
- **Domain knowledge**: Business logic, terminology, entity relationships
- **API contracts**: Endpoint definitions, data models, integration points
- **Development workflow**: Branch strategy, CI/CD, deployment procedures

---

## Priority Hierarchy

When project documentation conflicts with boilerplate rules, the following priority applies:

```
Level 1 (Highest): Boilerplate Structural Rules
  └─ Tier hierarchy, review chain, file ownership, agent permissions
  └─ These NEVER change regardless of project context

Level 2: Project-Specific Rules
  └─ Coding standards, naming conventions, architecture patterns
  └─ Framework/library choices, API design patterns
  └─ These OVERRIDE boilerplate coding defaults

Level 3 (Lowest): Boilerplate Coding Defaults
  └─ Default naming conventions, default error handling patterns
  └─ These apply ONLY when the project has no specific guidance
```

### Conflict Resolution Examples

| Scenario | Resolution |
|----------|-----------|
| Project README says "use tabs" but clean-code skill says "use spaces" | Project rule wins — use tabs |
| Project docs define a custom error handling pattern | Project pattern wins — follow it |
| Project docs say "skip code review" | Boilerplate wins — review chain is structural |
| Project docs say "all agents can edit all files" | Boilerplate wins — file ownership is structural |
| Project README defines REST API naming conventions | Project rule wins — apply to all API work |
| Project has no naming convention docs | Boilerplate defaults apply (camelCase, kebab-case, etc.) |
| Project README says "add JSDoc to all functions" | Project rule wins — this overrides boilerplate's "no comments" default for project-specific style |

### Structural vs Coding Rule Boundary

The following boilerplate rules are **structural** (Level 1 — never overridden by project docs):

- Tier hierarchy and agent permissions (which agent can do what)
- Review chain (who reviews whom, max 2 rounds)
- File ownership and conflict prevention
- Agent communication protocol (all communication through Orchestrator)
- Session memory lifecycle
- Token budget and context loading limits
- System validation rules

The following are **coding defaults** (Level 3 — overridable by project docs):

- Naming conventions (camelCase, kebab-case, PascalCase)
- Code commenting rules (no-comments default)
- Error handling patterns
- File/function length limits
- Import ordering
- Default framework preferences

### Intra-Project Conflict Resolution

When project documents conflict with each other (e.g., README says "use tabs" but CONTRIBUTING.md says "use spaces"), the **source priority order** from Step 1 applies:

1. `README.md` takes precedence over other root `.md` files
2. Root `.md` files take precedence over `docs/` folder documents
3. Within the same priority level, the more specific/recent document wins
4. If unresolvable, the agent reports the conflict and the Orchestrator decides

---

## Agent Obligations

### All Agents (Every Tier)

1. **Read project context** before starting any task.
2. **Cite project docs** when making decisions based on them (e.g., "Per README.md Section 3...").
3. **Report conflicts** between project rules and boilerplate rules in the task report.
4. **Never assume** — if project documentation is ambiguous, escalate to the Orchestrator.

### Orchestrator

1. **Trigger PCD scan** at session start (Step 0 of Operating Protocol).
2. **Distribute context** — include relevant project documentation references in task assignments.
3. **Resolve conflicts** — when agents report PCD conflicts, determine which rule applies using the Priority Hierarchy.

### Coding Agents (T1, T1.5, T2)

1. **Follow project conventions** for all code they write (naming, structure, patterns).
2. **Match existing patterns** — if the project uses a specific style, continue it.
3. **Check project docs** before introducing new patterns or dependencies.

### Analysis Agents (T2.5, T3)

1. **Include project context** in analysis scope — reference project docs in findings.
2. **Validate against project rules** — check if existing code follows project documentation.
3. **Surface gaps** — report undocumented areas that should have project documentation.

---

## Context Loading Integration

PCD context counts **within** the agent's existing context budget (see `context-loading.instructions.md`). PCD files consume context file slots — they are not additive.

### PCD Context Budget

> **Canonical Source**: The budget table below is the authoritative reference. Other files that reproduce this table must match these values exactly.

| Agent Tier | Max PCD Files | Max PCD Tokens |
|------------|--------------|----------------|
| T1 Principal | 5 | 8K |
| T1.5 Staff Eng | 4 | 6K |
| T2 MidCoder | 3 | 4K |
| T2.5 Lead Analyst | 3 | 4K |
| T3 Analyst | 2 | 3K |

### Budget Strategy

1. **Read first (if exists)**: Root `README.md` — highest priority, always within budget. If missing, skip.
2. **Selective loading**: Read additional docs only if relevant to the current task.
3. **Summarize large docs**: If a project doc exceeds the tier's PCD token budget, extract only the sections relevant to the task.
4. **Cache across tasks**: Within a session, PCD context is discovered once and reused. If a coding agent modifies a project doc during the session, PCD cache is invalidated and re-scanned on the next task.

---

## Orchestrator Task Assignment Enhancement

When assigning tasks with PCD active, the Orchestrator includes project context references:

```markdown
**Agent**: StaffEngineerAlpha
**Task**: Implement user authentication
**Load Skills**: clean-code, backend-development, implementation
**Project Context**: README.md (Section: Authentication), docs/api-design.md
**Project Rules**: Follow REST conventions from docs/api-design.md
```

---

## Validation

PCD activation is verified by System Validation Rule 8 (see `system-validation.instructions.md`).

### Self-Check

Agents verify PCD compliance by answering:

1. Did I read the project's README.md before starting?
2. Am I following project-specific conventions where they exist?
3. Did I cite project documentation in my decisions?
4. Did I report any conflicts between project and boilerplate rules?

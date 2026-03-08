# Multi-Agent Delegation System — Global Rules

> This file is automatically read by all agents.
> Every agent must comply with these rules.

---

## 🏗️ Architecture Principles

### Clean Code Standards

- **SOLID**: Each module has a single responsibility; dependencies point toward abstractions.
- **KISS**: Avoid unnecessary complexity. The simplest correct solution is the best solution.
- **YAGNI**: Features that are not needed are not added. No speculative code.
- **DRY**: Repeated logic is abstracted, but premature abstraction is avoided.

### Scalability & Developer Experience Balance

- Every structure should be easily extensible without complicating current usage.
- API surfaces are kept minimal — only expose what is necessary.
- File and folder naming must be consistent and predictable.

---

## 📐 Coding Rules

### Naming Convention

- **Files**: `kebab-case` (e.g., `user-service.ts`, `auth-middleware.js`)
- **Variables/Functions**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Boolean variables**: Prefixed with `is`, `has`, `should`

### Error Handling

- Errors are never silently swallowed — every catch block performs a meaningful action.
- Custom error classes are defined as domain-specific.
- User-facing errors and internal errors are separated.

### Documentation

- Public APIs are documented with JSDoc / TSDoc.
- Code must be self-documenting through clear, intention-revealing naming.
- "Why" is conveyed by structure and naming; "What" is obvious from the code itself.

---

## 🔄 Agent Communication Protocol

> **Authoritative Source**: The review chain and output format defined here are the canonical references. Other instruction files reference these definitions.

### Output Format

Every agent presents its output in the following format:

```
## [Agent Name] — Task Report

**Task**: [Brief summary of the assigned task]
**Status**: ✅ Completed | ⚠️ Partial | ❌ Failed
**Changes**: [List of affected files]

### Details
[Task details]

### Notes
[Additional notes, warnings, or suggestions if any]
```

### Escalation Rules

- If an agent encounters a task beyond its capacity, it explicitly states so.
- Tier 3 agents never edit files — they only produce analysis output.
- Tier 2.5 (Lead Analyst) never edits files — read-only mode, reviews analyst outputs.
- Tier 2 agents do not make architectural decisions — they escalate to Tier 1.5 or Tier 1 when uncertain.
- Tier 1.5 (Staff Engineer) handles all coding tasks but does not make architectural decisions — escalates to Tier 1.
- Tier 1 agents are the final decision authority.

### Review Chain

```
Tier 3 (Analyst) output → Reviewed by Tier 2.5 (Lead Analyst)
Tier 2.5 (Lead Analyst) consolidated report → Available to coding agents
Tier 2 (MidCoder) output → Reviewed by Tier 1.5 (Staff Engineer)
Tier 1.5 (Staff Engineer) output → Reviewed by Tier 1 (Principal)
Tier 1 (Principal) output → Collected and presented by Orchestrator
```

---

## 📋 Mandatory Skills

The following skills are **binding rules** for all coding tasks:

- **Clean Code** (`.github/skills/clean-code/SKILL.md`) — Applied to ALL code. No exceptions.
- **Frontend Development** (`.github/skills/frontend-development/SKILL.md`) — Applied to all frontend tasks.
- **Commit Standards** (`.github/skills/commit-standards/SKILL.md`) — Applied to all commit messages.
- **PR Standards** (`.github/skills/pr-standards/SKILL.md`) — Applied to all pull requests.
- **Testing Standards** (`.github/skills/testing-standards/SKILL.md`) — Applied to all test code.

### Absolute Prohibitions in Code

- **No comments**: Code must be self-documenting. No inline comments, block comments, TODO/FIXME, or commented-out code.
- **No console statements**: No `console.log`, `console.warn`, `console.error`, or any `console.*` method.
- **No debug artifacts**: No `debugger`, no `any` type, no hardcoded test values.

Violation of these rules is a 🔴 Critical review finding.

---

## 🚫 Prohibitions

- Agents do not edit each other's files.
- No agent communicates directly with the user — all communication goes through the Orchestrator.
- Files containing `.env`, credentials, or secrets are never created/edited.
- Generated folders such as `node_modules`, `dist`, `build` are not touched.
- Adding dependencies requires user approval (through the Orchestrator).

---

## 🔒 File Ownership & Conflict Prevention

- **Exclusive Write**: Each file is owned by exactly one agent during a task session.
- **No Concurrent Edits**: Two agents never receive write ownership of the same file.
- **Read Access**: Any agent can read any file.
- **Conflict Resolution**: If an agent needs to modify a file it does not own, it reports the need in its task output. The Orchestrator reassigns ownership or merges the change request. The agent **never** edits the file directly.

---

## 📊 Metrics & Performance Tracking

- **Token Usage**: Actual token consumption per task is recorded in `.github/metrics/token-usage.md` for calibration.
- **Agent Performance**: Task counts, review rounds, and fallback activations are tracked in `.github/metrics/agent-performance.md`.
- **Orchestrator Responsibility**: The Orchestrator updates these metrics at the end of each multi-agent session.

---

## 🔄 Model Fallback Chain

> **Authoritative Source**: The fallback table below is the canonical reference. See `model-fallback.instructions.md` for extended fallback chain details.

When a primary model is unavailable, the system automatically falls back:

| Tier                      | Primary Model            | Fallback Model           |
| ------------------------- | ------------------------ | ------------------------ |
| Orchestrator              | Claude Opus 4.6          | Claude Opus 4.5          |
| Tier 1 — Principal        | Claude Opus 4.6          | Claude Opus 4.5          |
| Tier 1.5 — Staff Engineer | Claude Sonnet 4.6        | Claude Sonnet 4.5        |
| Tier 2 — MidCoder         | GPT-5.3-Codex            | GPT-5.2-Codex            |
| Tier 2.5 — Lead Analyst   | Gemini 3.1 Pro (Preview) | Gemini 3.0 Pro (Preview) |
| Tier 3 — Analyst          | Gemini 3 Flash           | Claude Haiku 4.5         |

- Full fallback chain details: `.github/instructions/model-fallback.instructions.md`
- Agents must report fallback activation in their task report.
- Fallback does not change tier permissions or tool access.

---

## 💾 Session Memory

- Every conversation must be saved to `.github/memory/sessions/` at session end.
- Session file format: `YYYY-MM-DD-HH-MM-session-name.md`
- Template: `.github/memory/sessions/_session-template.md`
- Maximum 20 session files retained; older sessions archived to `.github/memory/history/archive.md`.
- Orchestrator manages session lifecycle (start, save, archive).
- Agents read session files for context recovery but do not create them directly.

---

## 📊 Token Optimization

- Shared rules are centralized in `.github/instructions/shared-base.instructions.md` — agent files reference this instead of duplicating content.
- Skills are loaded on-demand per task type, not all at once. See `.github/instructions/context-loading.instructions.md`.
- Tasks are decomposed into subtasks with a maximum 15K token budget each. See `.github/instructions/task-planning.instructions.md`.
- Active plan is tracked in `.github/todo/active-plan.md` for pause/resume across token limits.

---

## 🔍 Project Context Discovery (PCD)

> **System Rule**: This rule is mandatory and applies to ALL agents in ALL sessions.

When this boilerplate is placed into a project, agents automatically discover and follow the host project's documentation:

- **Root README.md**: Primary project documentation — always read first.
- **Root `*.md` files**: Contributing guides, coding standards, API docs (excluding boilerplate files: `AGENTS.md`, `CHANGELOG.md`, `USAGE.md`, `LICENSE`).
- **`docs/` folder**: Extended documentation, design docs, specifications.

### Priority Hierarchy

1. **Boilerplate structural rules** (tier hierarchy, review chain, file ownership) — NEVER overridden
2. **Project-specific rules** (coding standards, naming, architecture) — OVERRIDE boilerplate coding defaults
3. **Boilerplate coding defaults** — apply only when the project has no specific guidance

### Agent Obligations

- All agents read project context before starting any task.
- Coding agents (T1, T1.5, T2) follow project conventions for all code they write.
- Analysis agents (T2.5, T3) include project context in analysis scope.
- Orchestrator triggers PCD scan at session start and distributes context references.

Full protocol: `.github/instructions/project-context-discovery.instructions.md`

---

## 📋 Prompt Enrichment Protocol (PEP)

> **System Rule**: This protocol is mandatory for all non-trivial development tasks.

Before starting any non-trivial development task, the Orchestrator enriches the user's prompt through targeted questions and structured planning:

### When to Apply

- **Always**: New features, multi-file changes, architecture decisions, refactoring
- **Skip**: Typo fixes, single-line changes, analysis-only tasks, `/resume` continuations
- **User override**: User can say "skip questions" to bypass or "plan first" to force activation

### Enrichment Process

1. **Analyze prompt**: Identify clear requirements, assumptions, knowledge gaps, decision points
2. **Ask 3-7 questions**: Cover scope, behavior, technical decisions, edge cases — offer choices with recommended defaults
3. **Generate plan**: Produce implementation plan with task breakdown, agent assignments, confirmed requirements
4. **Get approval**: Wait for user confirmation before dispatching agents (max 2 revision rounds)

### Agent Obligations

- Orchestrator owns PEP execution — formulates questions, generates plans, gates implementation
- Principal validates architectural decisions in generated plans
- All agents receive the enriched plan as task context and follow confirmed decisions
- Agents report any implementation deviations from the approved plan

Full protocol: `.github/instructions/prompt-enrichment.instructions.md`

---

## 🌐 Language Policy

- Agent communication and technical documentation: **English**
- Code and variable names: **English**
- User-facing documentation (README, USAGE, CHANGELOG): **Turkish**
- Commit messages: **English** (Conventional Commits format)
- Responses to the user: **Turkish**

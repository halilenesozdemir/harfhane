# Multi-Agent Delegation System — Global Rules

> This file is automatically read by Claude Code and all subagents it spawns.
> Every agent must comply with these rules.
> Claude Code context: agents are spawned via the `Agent` tool with `subagent_type: "general-purpose"`.

---

## Project Context

**Harfhane** — Türkçe günlük kelime oyunu: günlük ve sınırsız mod, düello, turnuva, XP ve rozet.

| Layer      | Technology                                                  |
| ---------- | ----------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS 3, TanStack Query  |
| Backend    | Hono, TypeScript, Cloudflare Workers                        |
| Database   | Cloudflare D1 (SQLite)                                      |
| Storage    | Cloudflare R2                                               |
| CI/CD      | GitHub Actions                                              |

Full project documentation: `README.md`, `CLAUDE.md`.
Plans live in `docs/plans/`, decisions in `docs/decisions/`, deliberately deferred work in `docs/backlog.md`.

---

## Invariants

Rules that must not be broken. Each has a reason; changing one needs an ADR in `docs/decisions/`.

1. **Model proposes, code enforces.** A word reaches players only when `status = 'approved'` and `family_safe = 1`. The database enforces this with a CHECK and the `daily_words_require_active_word` trigger. Never drop or bypass them to make data fit. *Why:* AI-generated Turkish content can be wrong or unsuitable for families.
2. **One schema source.** The schema lives only in `apps/backend/db/migrations/`. Tests apply those files through `readD1Migrations`; never hand-write tables in tests. *Why:* the old test schema drifted from production.
3. **No TDK data.** Do not scrape or import from `sozluk.gov.tr`, and do not copy TDK definitions. Every word row records `source` and `license`. *Why:* TDK does not permit its word list to be extracted.
4. **Production needs the owner.** Never write to, migrate or delete a remote D1 database without explicit owner approval in the current session. Backups go to `~/Backups/harfhane/`, never into the repo. *Why:* writes are irreversible, and backups contain personal data.
5. **Theme = token set.** Components use `--hh-*` tokens through Tailwind classes (`bg-correct`, `text-correct-fg`, `shadow-depth-*`); no raw hex in components. *Why:* paid themes must work by swapping tokens only.
6. **No "Wordle" in product names or titles.** Use "Türkçe kelime oyunu". *Why:* trademark risk.
7. **Brand is Harfhane.** Links point to `harfhane.app`; the legacy name is never reintroduced.
8. **No ads at launch.** Ads may only be rewarded, opt-in, filtered and behind a remote flag. *Why:* family-friendly product promise (`docs/decisions/2026-10-04-monetization-no-ads-at-launch.md`).
9. **Deploy workflows list their own file** in `paths` and keep `workflow_dispatch`. *Why:* otherwise a CI-only fix never redeploys.
10. **Daily content never runs out.** At least 90 days of approved daily words per active length; a schedule-health check warns before the runway ends. *Why:* the 5-letter schedule silently ran out on 2026-08-26.

---

## Architecture Principles

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

## Coding Rules

### Naming Convention

- **Files**: `kebab-case` (e.g., `word-service.ts`, `auth-middleware.ts`)
- **Variables/Functions**: `camelCase`
- **Classes/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Boolean variables**: Prefixed with `is`, `has`, `should`

### Error Handling

- Errors are never silently swallowed — every catch block performs a meaningful action.
- Custom error classes are defined as domain-specific.
- User-facing errors and internal errors are separated.

### Absolute Prohibitions in Code

- **No comments**: Code must be self-documenting. No inline comments, block comments, TODO/FIXME, or commented-out code.
- **No console statements**: No `console.log`, `console.warn`, `console.error`, or any `console.*` method.
- **No debug artifacts**: No `debugger`, no `any` type, no hardcoded test values.

Violation of these rules is a Critical review finding.

---

## Agent Communication Protocol

> Claude Code spawns subagents via the `Agent` tool. This file defines the roles and boundaries of each tier.

### Output Format

Every agent presents its output in the following format:

```
## [Agent Name] — Task Report

**Task**: [Brief summary of the assigned task]
**Status**: Completed | Partial | Failed
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

## Agent Tiers & Models (Claude Code)

Models follow the owner's global policy (`~/.claude/CLAUDE.md` → Orchestration): Opus for rare judgment-heavy work, Sonnet as the default sub-agent (coding, research, reviews), Haiku for mechanical work, Fable never as a sub-agent. Agent files set the model with an alias in their frontmatter (`model: opus | sonnet | haiku`), never a pinned version.

| Tier                      | Model  | Role                                         |
| ------------------------- | ------ | -------------------------------------------- |
| Orchestrator              | opus   | Coordination, task distribution, PEP         |
| Tier 1 — Principal        | opus   | Architecture, review, final authority        |
| Tier 1.5 — Staff Engineer | sonnet | All coding tasks, Staff Engineer review      |
| Tier 2 — MidCoder         | sonnet | Simple coding, boilerplate, unit tests       |
| Tier 2.5 — Lead Analyst   | sonnet | Analyst output review, consolidation         |
| Tier 3 — Analyst          | sonnet | Analysis, documentation, research, read-only |

### Delegation Parameter (xN)

Append `xN` to the end of any prompt to activate multi-agent mode:

| Parameter | Principal (T1) | Staff Eng (T1.5) | MidCoder (T2) | Lead Analyst (T2.5) | Analyst (T3) |
| --------- | -------------- | ---------------- | ------------- | ------------------- | ------------ |
| `x3`      | 1              | 1                | —             | —                   | 1            |
| `x5`      | 1              | 1                | 1             | 1                   | 1            |
| `x7`      | 1              | 2                | 1             | 1                   | 2            |
| `x10`     | 2              | 2                | 2             | 1                   | 3            |

No parameter → single agent (Orchestrator handles directly or delegates to single best-fit tier).

---

## Mandatory Skills

The following skills are **binding rules** for all coding tasks. Skills live in `.claude/skills/` and are auto-triggered by Claude Code based on their descriptions.

- **Clean Code** (`.claude/skills/clean-code/SKILL.md`) — Applied to ALL code. No exceptions.
- **Frontend Development** (`.claude/skills/frontend-development/SKILL.md`) — Applied to all frontend tasks.
- **Backend Development** (`.claude/skills/backend-development/SKILL.md`) — Applied to all backend/API tasks.
- **Commit Standards** (`.claude/skills/commit-standards/SKILL.md`) — Applied to all commit messages.
- **PR Standards** (`.claude/skills/pr-standards/SKILL.md`) — Applied to all pull requests.
- **Testing Standards** (`.claude/skills/testing-standards/SKILL.md`) — Applied to all test code.
- **RIPER Workflow** (`.claude/skills/riper-workflow/SKILL.md`) — Applied to all non-trivial features and architectural decisions.

---

## Prohibitions

- Agents do not edit each other's files.
- No agent communicates directly with the user — all communication goes through the Orchestrator.
- Files containing `.env`, credentials, or secrets are never created/edited.
- Generated folders such as `node_modules`, `dist`, `build`, `.wrangler` are not touched.
- Adding dependencies requires user approval (through the Orchestrator).

---

## File Ownership & Conflict Prevention

- **Exclusive Write**: Each file is owned by exactly one agent during a task session.
- **No Concurrent Edits**: Two agents never receive write ownership of the same file.
- **Read Access**: Any agent can read any file.
- **Conflict Resolution**: If an agent needs to modify a file it does not own, it reports the need in its task output. The Orchestrator reassigns ownership or merges the change request. The agent **never** edits the file directly.

---

## Memory & Plans

- **Plans**: `docs/plans/` — one file per unit of work; progress is read from git, not tracked in the plan.
- **Decisions**: `docs/decisions/` (ADRs). **Deferred work**: `docs/backlog.md` — half-done work is written here before a session ends.
- **Session memory**: the second-brain bridge (`~/.claude/settings.json` hooks) loads context at SessionStart and records it at Stop/PreCompact/SessionEnd. Agents never hand-write session files.
- **Recent work**: `git log` is the source of truth for what changed.
- Retired 2026-10-05: `.github/memory`, `.github/todo`, `.github/metrics` — archived under `docs/archive/github-2026-10-05/`.

---

## Project Context Discovery (PCD)

> **System Rule**: This rule is mandatory and applies to ALL agents in ALL sessions.

At session start, agents automatically discover and follow the host project's documentation:

- **Root README.md**: Primary project documentation — always read first.
- **Root `*.md` files**: Contributing guides, coding standards, API docs (excluding: `AGENTS.md`, `CHANGELOG.md`, `USAGE.md`, `LICENSE`).
- **`docs/` folder**: Extended documentation, design docs, specifications.

### Priority Hierarchy

1. **Boilerplate structural rules** (tier hierarchy, review chain, file ownership) — NEVER overridden
2. **Project-specific rules** (`CLAUDE.md`, `products.md`) — OVERRIDE boilerplate coding defaults
3. **Boilerplate coding defaults** — apply only when the project has no specific guidance

---

## Prompt Enrichment Protocol (PEP)

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

---

## Language Policy

- Agent communication and technical documentation: **English**
- Code and variable names: **English**
- User-facing documentation (README, USAGE, CHANGELOG): **Turkish**
- Commit messages: **English** (Conventional Commits format)
- Responses to the user: **Turkish**

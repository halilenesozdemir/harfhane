---
applyTo: "**"
---

# Dynamic Context Loading

Load only the skills and context needed for the current task. This reduces token consumption significantly.

## Conditional Skill Loading Rules

### Task Type Detection

Before reading any skill file, determine the task type:

| Task Type    | Required Skills | Skip | Phase-Loaded† |
| ------------ | --------------- | ---- | ------------- |
| Frontend UI  | clean-code, frontend-development, implementation, code-review, testing-standards | code-architecture, analysis, backend-development | commit-standards, pr-standards |
| Backend API  | clean-code, backend-development, implementation, code-review, testing-standards | frontend-development, code-architecture, analysis | commit-standards, pr-standards |
| Architecture | clean-code, code-architecture, code-review, backend-development | implementation, frontend-development, analysis, testing-standards | commit-standards, pr-standards |
| Analysis     | analysis | clean-code, code-architecture, code-review, backend-development, implementation, frontend-development, testing-standards, commit-standards, pr-standards | — |
| Review       | code-review, clean-code, commit-standards, pr-standards | code-architecture, frontend-development, backend-development, analysis, implementation, testing-standards | — |
| Testing      | testing-standards, clean-code, implementation | code-architecture, analysis, frontend-development, backend-development, code-review, commit-standards, pr-standards | — |
| PR/Commit    | commit-standards, pr-standards, clean-code, code-review | code-architecture, analysis, frontend-development, backend-development, implementation, testing-standards | — |

> **† Phase-Loaded**: Skills loaded only during the commit/PR phase, not during active development. They do not count against the skill budget during the coding phase.

### Context Budget

| Agent Tier        | Max Skills to Load | Max Context Files |
| ----------------- | ------------------ | ----------------- |
| T1 Principal      | 5                  | 10                |
| T1.5 Staff Eng    | 5                  | 8                 |
| T2 MidCoder       | 4                  | 6                 |
| T2.5 Lead Analyst | 3                  | 5                 |
| T3 Analyst        | 2                  | 4                 |

**STRICT**: Exceeding the context budget is forbidden. If a task requires more skills than the budget allows, the agent must request Orchestrator guidance to prioritize which skills to load. Loading skills outside the assigned tier capability is never permitted.

### Budget Exceeded Protocol

If an agent detects it needs more skills than its budget allows:

1. **STOP** — do not load additional skills beyond the budget.
2. **Report** the conflict in the task output with the list of needed vs available skills.
3. **Orchestrator reassigns**: either splits the task into smaller subtasks or elevates to a higher-tier agent with a larger budget.

## Orchestrator Task Assignment Enhancement

When the Orchestrator assigns a task, it specifies which skills to load:

```markdown
**Agent**: StaffEngineerAlpha
**Task**: Implement login form component
**Load Skills**: clean-code, frontend-development, testing-standards
**Skip Skills**: code-architecture, analysis, commit-standards, pr-standards
```

## Progressive Loading Strategy

1. **Always load first**: `shared-base.instructions.md` (auto-included via `applyTo: "**"`)
2. **Project Context Discovery**: Scan and load host project documentation (`README.md`, root `*.md` files, `docs/` folder) per `project-context-discovery.instructions.md` PCD Context Budget
3. **Load on demand**: Tier-specific skills based on task type
4. **Never pre-load**: Skills outside the agent's tier capability

## Project Context Loading (PCD)

Project Context Discovery runs before skill loading and counts **within** the existing context budget (PCD files consume context file slots, not additive). See `project-context-discovery.instructions.md` for full protocol.

> **Canonical Source**: The PCD budget table in `project-context-discovery.instructions.md` is the authoritative reference. The table below is a convenience copy.

| Agent Tier | Max PCD Files | Max PCD Tokens |
|------------|--------------|----------------|
| T1 Principal | 5 | 8K |
| T1.5 Staff Eng | 4 | 6K |
| T2 MidCoder | 3 | 4K |
| T2.5 Lead Analyst | 3 | 4K |
| T3 Analyst | 2 | 3K |

## Session Context Loading

- Read `.github/memory/sessions/` only when continuing previous work
- Read `.github/todo/active-plan.md` only when `/resume` is invoked or task references ongoing work
- Skip session context for fresh, standalone tasks

## Known Limitation: applyTo Scope

All instruction files use `applyTo: "**"` which means they are included in every Copilot Chat interaction regardless of which agent is active. This is a VS Code Copilot platform constraint — `applyTo` targets workspace file patterns, not agent identity.

### Impact

- Every agent session loads all 17 instruction files (~40-52K tokens of overhead).
- Tier-specific instructions (e.g., T1 Principal rules) are visible to all agents, not just T1.
- The 15K subtask token budget (from task-planning) does not account for this overhead.

### Mitigation

1. **Orchestrator specifies skills per task**: The Orchestrator's task assignment explicitly lists which skills to load and which to skip, keeping per-task skill loading within budget.
2. **Instruction files are kept concise**: Tier-specific instruction files should contain only role definition and expectations unique to that tier. Shared rules live in `shared-base.instructions.md`.
3. **Agent files contain tier-specific context**: The `.agent.md` files are only loaded when that specific agent is invoked, making them the preferred location for detailed tier-specific guidance.

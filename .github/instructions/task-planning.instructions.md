---
applyTo: "**"
---

# Token-Aware Task Planning

Break tasks into token-budgeted subtasks to enable pause/resume workflows and efficient token usage.

## Token Cost Estimation Matrix

| Task Type                       | Estimated Tokens | Max Files | Tier    | Confidence |
| ------------------------------- | ---------------- | --------- | ------- | ---------- |
| Codebase analysis               | 2K–5K            | 1 report  | T3      | 🟢 High    |
| Dependency audit                | 2K–4K            | 1 report  | T3      | 🟢 High    |
| Simple coding (utility, config) | 5K–10K           | 1–2 files | T2      | 🟡 Medium  |
| Component scaffolding           | 8K–15K           | 2–4 files | T2      | 🟡 Medium  |
| Complex feature implementation  | 15K–30K          | 3–7 files | T1.5    | 🟡 Medium  |
| Architecture design + ADR       | 10K–20K          | 1–5 files | T1      | 🟡 Medium  |
| Code review                     | 3K–8K            | —         | T1/T1.5 | 🟢 High    |
| Test writing                    | 5K–12K           | 1–3 files | T1.5/T2 | 🟡 Medium  |
| Backend API endpoint            | 5K–12K           | 1–3 files | T1.5/T2 | 🟡 Medium  |
| Database schema/migration       | 3K–8K            | 1–2 files | T1.5    | 🟡 Medium  |
| Prompt enrichment (PEP)         | 1K–5K            | —         | Orch.   | 🟡 Medium  |

## Token Calibration Protocol

Estimates in the matrix above are initial baselines. To improve accuracy over time:

1. **Record actual usage**: After each task, Orchestrator records the actual token count in `.github/metrics/token-usage.md`.
2. **Compare estimate vs actual**: If actual deviates > 30% from estimate, flag it.
3. **Adjust baselines quarterly**: Review `.github/metrics/token-usage.md` and update the matrix ranges.
4. **Per-project factors**: Large codebases inflate context-reading tokens. Apply a multiplier:
   - Small project (< 50 files): 1.0x
   - Medium project (50–200 files): 1.3x
   - Large project (200+ files): 1.6x

## Task Decomposition Rules

1. **Max budget per subtask**: 15K tokens. Larger tasks must be split.
2. **Atomic subtasks**: Each subtask should produce a verifiable output.
3. **Dependency graph**: Identify which subtasks depend on others.
4. **Parallel groups**: Group independent subtasks for parallel execution.

### Budget Scope Clarification

The 15K token budget per subtask refers to **work tokens** — the agent's reasoning, tool calls, and output generation. It does **not** include:

- **Platform overhead** (~30–40K tokens): System prompts, instruction files, skill definitions loaded via `applyTo: "**"`.
- **Context loading**: Session files, active plan, referenced source files.

Practical guideline: A subtask budgeted at 15K work tokens may consume 45–55K total tokens when platform context is included. The estimation matrix targets work tokens only.

## Planning Protocol

When the Orchestrator receives a task:

1. Estimate total token cost using the matrix above.
2. If total > 30K tokens, split into phases.
3. Write the plan to `.github/todo/active-plan.md`.
4. Create individual task files in `.github/todo/` for each subtask.
5. Include dependency information and priority ordering.

## Active Plan Format

The file `.github/todo/active-plan.md` tracks the current work:

```markdown
---
plan-id: PLAN-{NNN}
created: {ISO date}
status: active | paused | completed
total-tasks: {N}
completed-tasks: {N}
estimated-remaining-tokens: {N}K
---

## Active Plan: {Plan Title}

### Progress

- [x] TASK-001: {title} (T3, ~3K tokens) ✅
- [x] TASK-002: {title} (T2, ~8K tokens) ✅
- [ ] TASK-003: {title} (T1.5, ~15K tokens) ⏳ in-progress
- [ ] TASK-004: {title} (T1, ~10K tokens)
- [ ] TASK-005: {title} (T1.5, ~12K tokens)

### Dependency Graph

TASK-001 → TASK-003
TASK-002 → TASK-003
TASK-003 → TASK-004, TASK-005

### Resume Point

Last completed: TASK-002
Next up: TASK-003 (assigned to StaffEngineerAlpha)
Context needed: Read TASK-001 and TASK-002 outputs first
```

## Token Limit Warning

When the Orchestrator detects token budget is running low:

1. Save all progress to `.github/todo/active-plan.md`.
2. Mark in-progress tasks with their current state.
3. Write a resume summary so the next session can continue seamlessly.
4. Notify the user: "Token budget approaching limit. Progress saved to `.github/todo/active-plan.md`. Use `/resume` to continue."

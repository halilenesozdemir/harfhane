---
name: resume
description: "Resume previous work from where it was left off. Reads active plan and session history."
agent: Orchestrator
argument-hint: "Optional: specific task ID to resume (e.g., TASK-003)"
---

# /resume — Continue Previous Work

Resume work from the last saved state. Reads the active plan and session history to determine what to do next.

## Usage

```
/resume                  → Resume the active plan from where it stopped
/resume TASK-003         → Resume a specific task
```

## Steps

1. Read `.github/todo/active-plan.md` to find pending tasks.
2. Read the most recent session file from `.github/memory/sessions/`.
3. Determine the next task based on dependency graph and priority.
4. Display the resume summary to the user:
   - What was completed in the previous session
   - What remains to be done
   - Estimated token cost for remaining work
5. Ask for confirmation, then begin executing the next task.

## Resume Summary Format

```markdown
## Resume Summary

**Previous Session**: {date} — {mode}
**Last Completed**: TASK-{NNN} ({title})
**Remaining Tasks**: {N} tasks, ~{N}K estimated tokens

### Pending Tasks

| ID       | Title | Tier | Est. Tokens | Dependencies             |
| -------- | ----- | ---- | ----------- | ------------------------ |
| TASK-003 | ...   | T1.5 | ~15K        | TASK-001 ✅, TASK-002 ✅ |

### Recommended Next Action

Start with **TASK-{NNN}** — all dependencies are satisfied.
```

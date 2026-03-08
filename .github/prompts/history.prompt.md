---
name: history
description: "View session history and past conversations. Helps new developers understand project context."
agent: Orchestrator
argument-hint: "Optional: number of sessions to show (default: 3)"
---

# /history — Session History

View past session summaries, decisions, and changes.

## Usage

```
/history           → Show last 3 sessions
/history 5         → Show last 5 sessions
/history all       → Show all session summaries
```

## Steps

1. Read session files from `.github/memory/sessions/` (sorted by date, newest first).
2. Read `.github/memory/history/archive.md` for older sessions (if requested).
3. Present a consolidated timeline.

## Output Format

```markdown
## Session History

### Most Recent: {date} — {mode} — {status}

**Summary**: {session summary}
**Decisions**: {key decisions}
**Changes**: {N} files modified
**Open Items**: {N} pending

---

### {date} — {mode} — {status}

**Summary**: {session summary}
**Changes**: {N} files modified

---

### {date} — {mode} — {status}

**Summary**: {session summary}
**Changes**: {N} files modified
```

## Use Cases

- **New developer onboarding**: Understand what has been done and what's pending.
- **Context recovery**: After a break, quickly catch up on project state.
- **Decision audit**: Review past architectural and technical decisions.

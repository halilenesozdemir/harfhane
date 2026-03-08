---
applyTo: "**"
---

# Session Memory & Chat History

Persist session state and conversation history so developers can resume work across sessions and new team members can understand project history.

## Session Lifecycle

### Session Start

1. Check `.github/memory/sessions/` for the most recent session file.
2. If an active session exists, load its context summary.
3. If no active session, create a new session file.

### During Session

1. After each significant interaction, update the active session file.
2. Record decisions made, files changed, and open items.
3. Keep the chat log concise — summarize rather than verbatim capture.

### Session End

1. Mark the session status as `completed` or `interrupted`.
2. Write a final summary with actionable next steps.
3. List all open items for the next session.

## Session File Format

Session files are stored in `.github/memory/sessions/` with the naming convention:
`YYYY-MM-DD-HH-MM-session-name.md`

```markdown
---
session-id: { UUID or sequential }
date: { YYYY-MM-DD }
developer: { optional identifier }
mode: single | x3 | x5 | x7 | x10
status: active | completed | interrupted
agents-used: [list of agent names]
total-tasks: { N }
completed-tasks: { N }
---

## Session Summary

{2-3 sentence high-level summary of what was accomplished}

## Decisions Made

| Decision   | Rationale | Agent         |
| ---------- | --------- | ------------- |
| {decision} | {why}     | {who decided} |

## Changes Made

| File   | Action                   | Agent        |
| ------ | ------------------------ | ------------ |
| {path} | created/modified/deleted | {agent name} |

## Open Items

- [ ] {Pending task or follow-up}
- [ ] {Unresolved question}

## Key Context for Next Session

{Critical information the next developer needs to know to continue effectively}

## Chat Log (Condensed)

### [{HH:MM}] User

{Summarized request}

### [{HH:MM}] Orchestrator

{Summarized response/action taken}
```

## Agent Access to History

- **Orchestrator**: Reads the last 3 session files at session start for continuity.
- **Principal**: Reads relevant sessions when making architectural decisions.
- **Other agents**: Access session history only when explicitly directed by Orchestrator.

## History Retention Policy

- Keep the last **20 session files** in `.github/memory/sessions/`.
- Older sessions are archived into `.github/memory/history/archive.md`.
- Session files are excluded from Git via `.gitignore` to keep local developer context private. Use the archiving protocol to preserve important decisions long-term.

### Git Tracking Model

| Artifact | Git-Tracked | Rationale |
|----------|:-----------:|-----------|
| `active-plan.md` | ✅ Yes | Team-wide visibility of ongoing work |
| `_template.md` files | ✅ Yes | Template availability for all developers |
| `archive.md` | ✅ Yes | Long-term decision preservation |
| Session files | ❌ No | Local developer context privacy |
| `agent-activity.log` | ❌ No | Local runtime data |

Developers cloning the repository will have access to the active plan and archived summaries but not to session history. This is intentional — session data may contain local context that is not universally relevant.

## Automatic Archiving Protocol

When the session count in `.github/memory/sessions/` exceeds 20:

### Step 1 — Identify Archive Candidates

1. Sort session files by date (oldest first).
2. Select all files beyond the 20-file limit.

### Step 2 — Generate Archive Summaries

For each candidate session, extract and write to `archive.md`:

```markdown
### {session-id} — {date}

**Mode**: {mode} | **Status**: {status} | **Tasks**: {completed}/{total}

{2-3 sentence summary from Session Summary section}

**Key decisions**: {comma-separated list from Decisions Made table}
**Files changed**: {count of files from Changes Made table}
```

### Step 3 — Remove Archived Sessions

1. After summary is appended to `archive.md`, delete the original session file.
2. Commit the archive update and deletion together.

### Step 4 — Orchestrator Responsibility

- Orchestrator checks session count at every **Session Start Protocol**.
- If count > 20, archiving runs **before** any new task begins.
- Archiving is logged in the current session's Chat Log.

## New Developer Onboarding

When a new developer starts working:

1. Read `.github/memory/sessions/` — last 3 sessions for recent context.
2. Read `.github/todo/active-plan.md` — ongoing work status.
3. Read `AGENTS.md` — system rules and conventions.
4. The system provides a coherent picture of where the project stands.

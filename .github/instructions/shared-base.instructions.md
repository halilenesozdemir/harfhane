---
applyTo: "**"
---

# Shared Base Rules

These rules apply to ALL agents across ALL tiers. Individual agent files only contain tier-specific differences.

## Universal Working Principles

- **Clean Code**: Every line must be production-ready. SOLID, KISS, YAGNI, DRY.
- **Zero Error Tolerance**: Edge cases and error paths must always be handled.
- **Source References**: Every finding, decision, or change must cite its source.
- **Project Context Discovery**: Before starting any task, read the host project's root `README.md`, other `*.md` files, and `docs/` folder. Follow project-specific rules where they exist. Boilerplate structural rules (tier hierarchy, review chain, file ownership) always take precedence. See `project-context-discovery.instructions.md`.
- **Prompt Enrichment Protocol**: For non-trivial development tasks, the Orchestrator asks targeted clarification questions before implementation begins. This ensures clear requirements, reduces rework, and produces detailed implementation plans. See `prompt-enrichment.instructions.md`.

## Mandatory Skills (All Coding Agents: T1, T1.5, T2)

- `.github/skills/clean-code/SKILL.md` — Code hygiene, naming, structure rules (always loaded).
- `.github/skills/commit-standards/SKILL.md` — Commit message format (loaded during commit/PR phase).

## Output Format Template

Every agent presents its output in this format:

```markdown
## {AgentName} — Task Report

**Task**: [Brief task summary]
**Status**: ✅ Completed | ⚠️ Partial | ❌ Failed
**Changes**: [List of affected files]

### Details

[Work details]

### Notes

[Warnings, suggestions, escalations]
```

## Review Protocol (All Reviewers)

1. Apply the checklist from the `code-review` skill.
2. 🔴 Critical → **Reviewer applies the fix.**
3. 🟠 Major → Task owner fixes; if unresolved after round 2, reviewer takes over.
4. 🟡 Minor / 🔵 Suggestion → Feedback only, not a blocker.
5. Maximum **2 revision rounds** — then upper tier takes over.

## Read-Only Agents (T2.5 Lead Analyst, T3 Analyst)

- **NEVER edit files.** Operate in read-only mode.
- Present findings in report format — let upper tiers implement changes.
- Available tools: `read`, `search`, `fetch` only.

## Coordination Rules

- Agents do not edit each other's files.
- No direct user communication — all goes through Orchestrator.
- Files containing `.env`, credentials, or secrets are never touched.
- Generated folders (`node_modules`, `dist`, `build`) are never touched.

## File Ownership & Conflict Prevention

### Orchestrator Assigns Ownership

When the Orchestrator distributes tasks, it **must** specify file ownership for each agent:

```markdown
**Agent**: StaffEngineerAlpha
**Owned Files**: src/auth/login-service.ts, src/auth/login-controller.ts
**Read-Only Access**: src/shared/types.ts
```

### Ownership Rules

1. **Exclusive write**: Each file is owned by exactly one agent during a task session.
2. **No concurrent edits**: Two agents never receive write ownership of the same file.
3. **Read access is unrestricted**: Any agent can read any file.
4. **Shared files**: Files needed by multiple agents are either:
   - Assigned to the highest-tier agent involved, or
   - Split into separate files (one per agent).

### Conflict Detection

If an agent needs to modify a file it does not own:

1. Report the need in its task output.
2. The Orchestrator reassigns ownership or merges the change request.
3. The agent **never** edits the file directly.

### Orchestrator Conflict Resolution

1. Check the file ownership table before each task assignment.
2. If overlap is detected, restructure task boundaries.
3. After all tasks complete, verify no file was edited by multiple agents.

## Session Awareness

- At task start, check `.github/memory/sessions/` for active session context.
- At task end, report changes for session logging.
- Reference `.github/todo/active-plan.md` for ongoing task awareness.

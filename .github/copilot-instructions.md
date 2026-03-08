# Copilot Global Instructions — Agent Delegation Boilerplate

> This file is automatically included with every Copilot Chat request.

## Project Context

This workspace is the **Multi-Agent Delegation System** boilerplate. It is an orchestration system that organizes multiple AI agents as a team, distributing tasks based on cost and competency.

## System Architecture

### Agent Tiers

| Tier                    | Model                    | Role                                    | Cost   |
| ----------------------- | ------------------------ | --------------------------------------- | ------ |
| Orchestrator            | Claude Opus 4.6          | Coordination, task distribution         | High   |
| Tier 1 — Principal      | Claude Opus 4.6          | Architecture, review, final authority   | High   |
| Tier 1.5 — Staff Eng    | Claude Sonnet 4.6        | All coding tasks, Staff Engineer review | High   |
| Tier 2 — MidCoder       | GPT-5.3-Codex            | Simple coding, boilerplate              | Medium |
| Tier 2.5 — Lead Analyst | Gemini 3.1 Pro (Preview) | Analyst output review, consolidation    | Low    |
| Tier 3 — Analyst        | Gemini 3 Flash           | Analysis, documentation, research       | Low    |

### Delegation Parameter

The user activates multi-agent mode by appending the `xN` parameter to the end of the prompt:

- `x10` → 2 Principal + 2 Staff Eng + 2 MidCoder + 1 Lead Analyst + 3 Analyst
- `x7` → 1 Principal + 2 Staff Eng + 1 MidCoder + 1 Lead Analyst + 2 Analyst
- `x5` → 1 Principal + 1 Staff Eng + 1 MidCoder + 1 Lead Analyst + 1 Analyst
- `x3` → 1 Principal + 1 Staff Eng + 1 Analyst
- No parameter → Single agent (default model) operation

### Review Chain

- Analyst outputs → Reviewed by Lead Analyst
- MidCoder outputs → Reviewed by Staff Engineer
- Staff Engineer outputs → Reviewed by Principal

## Operating Rules

1. All agents comply with the rules in `AGENTS.md`.
2. Each agent uses its own skill files.
3. File editing permission belongs only to Tier 1, Tier 1.5, and Tier 2.
4. Tier 2.5 and Tier 3 operate in read-only mode.
5. Code quality standard: Principal-level clean code.
6. **Project Context Discovery (PCD)**: Agents automatically scan the host project's root `README.md`, other `*.md` files, and `docs/` folder. These documents are treated as system context — all development follows project-specific rules. See `project-context-discovery.instructions.md`.
7. **Prompt Enrichment Protocol (PEP)**: For non-trivial tasks, the Orchestrator asks targeted clarification questions before implementation. This enriches the prompt, produces detailed implementation plans, and reduces rework. See `prompt-enrichment.instructions.md`.

## Model Fallback

Each agent has an automatic fallback model activated when the primary model is unavailable:

| Tier              | Primary           | Fallback          |
| ----------------- | ----------------- | ----------------- |
| Orchestrator / T1 | Claude Opus 4.6   | Claude Opus 4.5   |
| T1.5 Staff Eng    | Claude Sonnet 4.6 | Claude Sonnet 4.5 |
| T2 MidCoder       | GPT-5.3-Codex     | GPT-5.2-Codex     |
| T2.5 Lead Analyst | Gemini 3.1 Pro (Preview) | Gemini 3.0 Pro (Preview) |
| T3 Analyst        | Gemini 3 Flash    | Claude Haiku 4.5  |

Fallback does not change agent permissions or tier capabilities.

## File Ownership

- Each file is owned by exactly one agent during a task session.
- No concurrent edits — two agents never write to the same file.
- Orchestrator assigns ownership at task distribution time.
- Conflicts resolved by reassigning ownership or restructuring task boundaries.

## Metrics & Performance Tracking

- Token usage per task recorded in `.github/metrics/token-usage.md`.
- Agent performance tracked in `.github/metrics/agent-performance.md`.
- Orchestrator updates metrics at end of each multi-agent session.

## Token Optimization

- Shared rules centralized in `shared-base.instructions.md` — agents reference instead of duplicating.
- Skills loaded on-demand per task type via `context-loading.instructions.md`.
- Tasks decomposed into subtasks with max 15K token budget via `task-planning.instructions.md`.
- Active plan tracked in `.github/todo/active-plan.md` for pause/resume across token limits.

## Session Memory

- Conversations saved to `.github/memory/sessions/` at session end.
- Template: `.github/memory/sessions/_session-template.md`
- Max 20 sessions retained; older archived to `.github/memory/history/archive.md`.
- Orchestrator manages session lifecycle; agents read for context recovery.
- `/resume` command restores last session context and active plan.
- `/history` command lists recent sessions for onboarding.

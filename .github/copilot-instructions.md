# Claude Code — Global Instructions

> This file is automatically read by Claude Code at session start.
> It replaces the previous GitHub Copilot configuration.
> For full agent system rules, see `AGENTS.md` and `CLAUDE.md`.

## Project

**Nurdle** — Risale-i Nur külliyatındaki kelimelerle oynanan Türkçe Wordle oyunu.

Full stack: React 19 (frontend) + Hono on Cloudflare Workers (backend) + D1 (database) + R2 (storage).

## System Architecture

### Agent Tiers (Claude Code)

| Tier                      | Model             | Role                                         | Cost   |
| ------------------------- | ----------------- | -------------------------------------------- | ------ |
| Orchestrator              | claude-opus-4-6   | Coordination, task distribution, PEP         | High   |
| Tier 1 — Principal        | claude-opus-4-6   | Architecture, review, final authority        | High   |
| Tier 1.5 — Staff Engineer | claude-sonnet-4-6 | All coding tasks, Staff Engineer review      | Medium |
| Tier 2 — MidCoder         | claude-sonnet-4-6 | Simple coding, boilerplate, unit tests       | Medium |
| Tier 2.5 — Lead Analyst   | claude-haiku-4-5  | Analyst output review, consolidation         | Low    |
| Tier 3 — Analyst          | claude-haiku-4-5  | Analysis, documentation, research, read-only | Low    |

### Delegation Parameter

Append `xN` to any prompt to activate multi-agent mode:

- `x10` → 2 Principal + 2 Staff Eng + 2 MidCoder + 1 Lead Analyst + 3 Analyst
- `x7` → 1 Principal + 2 Staff Eng + 1 MidCoder + 1 Lead Analyst + 2 Analyst
- `x5` → 1 Principal + 1 Staff Eng + 1 MidCoder + 1 Lead Analyst + 1 Analyst
- `x3` → 1 Principal + 1 Staff Eng + 1 Analyst
- No parameter → Single agent (Orchestrator handles directly)

### Review Chain

```
Analyst → Lead Analyst → (coding agents receive consolidated report)
MidCoder → Staff Engineer → Principal
```

## Operating Rules

1. All agents comply with the rules in `AGENTS.md` and `CLAUDE.md`.
2. Each agent uses its own skill files from `.github/skills/`.
3. File editing permission: Tier 1, Tier 1.5, Tier 2 only.
4. Tier 2.5 and Tier 3 are read-only.
5. **Project Context Discovery (PCD)**: At session start, read `README.md`, `CLAUDE.md`, `products.md`. See `.github/instructions/project-context-discovery.instructions.md`.
6. **Prompt Enrichment Protocol (PEP)**: For non-trivial tasks, ask clarifying questions before implementation. See `.github/instructions/prompt-enrichment.instructions.md`.

## Model Fallback

| Tier              | Primary           | Fallback          |
| ----------------- | ----------------- | ----------------- |
| Orchestrator / T1 | claude-opus-4-6   | claude-opus-4-5   |
| T1.5 / T2         | claude-sonnet-4-6 | claude-sonnet-4-5 |
| T2.5 / T3         | claude-haiku-4-5  | claude-sonnet-4-6 |

Fallback does not change agent permissions or tier capabilities.

## Token Optimization

- Shared rules: `.github/instructions/shared-base.instructions.md`
- Skills loaded on-demand: `.github/instructions/context-loading.instructions.md`
- Max subtask budget: 15K tokens — see `.github/instructions/task-planning.instructions.md`
- Active plan: `.github/todo/active-plan.md`

## Session Memory

- Sessions saved to `.github/memory/sessions/` at session end.
- Template: `.github/memory/sessions/_session-template.md`
- Max 20 sessions; older archived to `.github/memory/history/archive.md`.
- `/resume` → restores last session context and active plan.
- `/history` → lists recent sessions for onboarding.

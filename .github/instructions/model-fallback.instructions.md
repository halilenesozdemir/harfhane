---
applyTo: "**"
---

# Model Fallback Chain

> All agents in this system run on Claude models via Claude Code.
> No third-party model integrations (no GPT, no Gemini).

When a primary model is unavailable, the system automatically falls back to the next model in the chain.

## Fallback Table

| Tier              | Primary           | Fallback          | Last Resort       |
| ----------------- | ----------------- | ----------------- | ----------------- |
| Orchestrator      | claude-opus-4-6   | claude-opus-4-5   | claude-sonnet-4-6 |
| T1 Principal      | claude-opus-4-6   | claude-opus-4-5   | claude-sonnet-4-6 |
| T1.5 Staff Eng    | claude-sonnet-4-6 | claude-sonnet-4-5 | claude-haiku-4-5  |
| T2 MidCoder       | claude-sonnet-4-6 | claude-sonnet-4-5 | claude-haiku-4-5  |
| T2.5 Lead Analyst | claude-haiku-4-5  | claude-sonnet-4-6 | claude-sonnet-4-5 |
| T3 Analyst        | claude-haiku-4-5  | claude-sonnet-4-6 | claude-sonnet-4-5 |

## Model Reference IDs

Use these exact model IDs when spawning subagents via the Claude Code `Agent` tool:

| Model             | ID                             |
| ----------------- | ------------------------------ |
| Claude Opus 4.6   | `claude-opus-4-6`              |
| Claude Opus 4.5   | `claude-opus-4-5`              |
| Claude Sonnet 4.6 | `claude-sonnet-4-6`            |
| Claude Sonnet 4.5 | `claude-sonnet-4-5`            |
| Claude Haiku 4.5  | `claude-haiku-4-5-20251001`    |

## Fallback Rules

1. **Capability preservation**: Fallback models must support the same tool set as the primary.
2. **Tier integrity**: A fallback never changes the agent's tier or permissions.
3. **Transparent reporting**: When fallback activates, Orchestrator includes it in the task summary.
4. **No upward fallback**: A Tier 3 agent never falls back to a Tier 1 model. Cost boundaries are respected.
5. **Read-only constraint preserved**: T2.5 and T3 remain read-only regardless of fallback model.

## Orchestrator Reporting

When any agent runs on a fallback model, the Orchestrator must include a `### Model Status` section in the task summary:

```markdown
### Model Status

| Agent        | Expected Model    | Actual Model      | Reason              |
| ------------ | ----------------- | ----------------- | ------------------- |
| AnalystAlpha | claude-haiku-4-5  | claude-sonnet-4-6 | Primary unavailable |
```

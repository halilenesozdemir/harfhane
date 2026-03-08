---
applyTo: "**"
---

# Model Fallback Chain

When a primary model is unavailable, the system automatically falls back to the next model in the chain.

## Fallback Table

| Tier              | Primary                  | Fallback (YAML)          | Last Resort           |
| ----------------- | ------------------------ | ------------------------ | --------------------- |
| Orchestrator      | Claude Opus 4.6          | Claude Opus 4.5          | —                     |
| T1 Principal      | Claude Opus 4.6          | Claude Opus 4.5          | —                     |
| T1.5 Staff Eng    | Claude Sonnet 4.6        | Claude Sonnet 4.5        | —                     |
| T2 MidCoder       | GPT-5.3-Codex            | GPT-5.2-Codex            | —                     |
| T2.5 Lead Analyst | Gemini 3.1 Pro (Preview) | Gemini 3.0 Pro (Preview) | —                     |
| T3 Analyst        | Gemini 3 Flash           | Claude Haiku 4.5         | Auto (best available) |

## Multi-Level Fallback for Analyst Tier

Analyst agents have a deeper fallback chain because they use the cheapest models which may have higher unavailability rates:

```
Gemini 3 Flash (primary)
  └─► Claude Haiku 4.5 (YAML modelFallback)
       └─► Auto: system selects best available model
```

When Auto mode activates, the system selects the most cost-effective available model while maintaining read-only constraints.

## Fallback Rules

1. **Capability preservation**: Fallback models must support the same tool set as the primary.
2. **Tier integrity**: A fallback never changes the agent's tier or permissions.
3. **Transparent reporting**: When fallback activates, Orchestrator includes it in the task summary.
4. **No upward fallback**: A Tier 3 agent never falls back to a Tier 1 model. Cost boundaries are respected.

## Orchestrator Reporting

When any agent runs on a fallback model, the Orchestrator must include a `### Model Status` section in the task summary:

```markdown
### Model Status

| Agent        | Expected Model | Actual Model     | Reason              |
| ------------ | -------------- | ---------------- | ------------------- |
| AnalystAlpha | Gemini 3 Flash | Claude Haiku 4.5 | Primary unavailable |
```

---
name: status
description: "Show current delegation status and agent workloads."
agent: Orchestrator
argument-hint: ""
---

# /status — Delegation Status

Show the status of the current multi-agent session.

## Output

```markdown
## Delegation Status

**Mode**: x{N} | Single Agent
**Active Agents**: {list}

### Agent Statuses

| Agent | Tier | Task | Status      | Last Updated |
| ----- | ---- | ---- | ----------- | ------------ |
| ...   | ...  | ...  | ⏳/✅/⚠️/❌ | ...          |

### Review Chain

| Source | Reviewer | Status   |
| ------ | -------- | -------- |
| ...    | ...      | ⏳/✅/⚠️ |

### Cost Summary

- Tier 1 — Principal ($$$$$): {n} tasks
- Tier 1.5 — Staff Engineer ($$$$): {n} tasks
- Tier 2 — MidCoder ($$$): {n} tasks
- Tier 2.5 — Lead Analyst ($$): {n} tasks
- Tier 3 — Analyst ($): {n} tasks
```

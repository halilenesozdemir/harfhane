---
last-updated: 2026-02-24
calibration-version: 2
total-records: 6
---

# Token Usage Log

Records actual token consumption per task for calibration of the estimation matrix in `task-planning.instructions.md`.

## Format

| Date       | Task Type               | Tier | Estimated | Actual | Deviation | Agent       | Session   |
| ---------- | ----------------------- | ---- | --------- | ------ | --------- | ----------- | --------- |
| YYYY-MM-DD | {task type from matrix} | T{n} | {N}K      | {N}K   | +/-{N}%   | {AgentName} | {plan-id} |

## Records

| Date       | Task Type               | Tier | Estimated | Actual | Deviation | Agent          | Session   |
| ---------- | ----------------------- | ---- | --------- | ------ | --------- | -------------- | --------- |
| 2026-02-24 | Codebase analysis       | T3   | 3K        | 4K     | +33%      | AnalystAlpha   | PLAN-001  |
| 2026-02-24 | Codebase analysis       | T3   | 3K        | 3K     | 0%        | AnalystBeta    | PLAN-001  |
| 2026-02-24 | Codebase analysis       | T3   | 3K        | 4K     | +33%      | AnalystGamma   | PLAN-001  |
| 2026-02-24 | Code review             | T2.5 | 5K        | 6K     | +20%      | LeadAnalyst    | PLAN-001  |
| 2026-02-24 | Architecture design     | T1   | 10K       | 8K     | -20%      | PrincipalAlpha | PLAN-001  |
| 2026-02-24 | Code review             | T1   | 8K        | 7K     | -13%      | PrincipalBeta  | PLAN-001  |

## Calibration Summary

### Current Multiplier

- **Project size**: Small (< 50 files) → 1.0x

### Deviation Alerts

- ⚠️ **2026-02-24 AnalystAlpha**: Codebase analysis estimated 3K, actual 4K (+33%). Exceeds 30% threshold. Consider adjusting T3 analysis baseline to 3K–5K.
- ⚠️ **2026-02-24 AnalystGamma**: Codebase analysis estimated 3K, actual 4K (+33%). Same pattern as AnalystAlpha — T3 analysis tasks consistently run ~33% over estimate.

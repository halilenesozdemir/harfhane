---
last-updated: 2026-02-24
tracking-version: 1
---

# Agent Performance Metrics

Tracks agent success rates, review efficiency, cost distribution, and fallback activations.

## Agent Task Metrics

| Agent              | Tier | Tasks Assigned | Completed | Failed | Avg Review Rounds | Fallback Used |
| ------------------ | ---- | -------------- | --------- | ------ | ----------------- | ------------- |
| PrincipalAlpha     | T1   | 1              | 1         | 0      | —                 | No            |
| PrincipalBeta      | T1   | 1              | 1         | 0      | —                 | No            |
| StaffEngineerAlpha | T1.5 | 0              | 0         | 0      | —                 | No            |
| StaffEngineerBeta  | T1.5 | 0              | 0         | 0      | —                 | No            |
| MidCoderAlpha      | T2   | 0              | 0         | 0      | —                 | No            |
| MidCoderBeta       | T2   | 0              | 0         | 0      | —                 | No            |
| LeadAnalyst        | T2.5 | 1              | 1         | 0      | 1.0               | No            |
| AnalystAlpha       | T3   | 1              | 1         | 0      | —                 | No            |
| AnalystBeta        | T3   | 1              | 1         | 0      | —                 | No            |
| AnalystGamma       | T3   | 1              | 1         | 0      | —                 | No            |

## Cost Distribution

| Tier | Tasks | Estimated Cost | Percentage | Notes |
| ---- | ----- | -------------- | ---------- | ----- |
| T1   | 2     | $$$$$          | 64%        | Highest per-task cost |
| T1.5 | 0     | —              | 0%         | No coding tasks in analysis session |
| T2   | 0     | —              | 0%         | No coding tasks in analysis session |
| T2.5 | 1     | $$             | 14%        | Lead Analyst consolidation |
| T3   | 3     | $              | 22%        | 3 parallel analysts |

> Percentages reflect relative cost share of active agents only. T1.5 and T2 were idle (analysis-only session).

## Review Efficiency

| Review Pair           | Reviews Done | Approved (Round 1) | Approved (Round 2) | Rejected |
| --------------------- | ------------ | ------------------ | ------------------ | -------- |
| Principal → Staff     | 0            | 0                  | 0                  | 0        |
| Staff → MidCoder      | 0            | 0                  | 0                  | 0        |
| LeadAnalyst → Analyst | 1            | 1                  | 0                  | 0        |

## Fallback Activations

| Date | Agent | Expected Model | Actual Model | Reason |
| ---- | ----- | -------------- | ------------ | ------ |

_No fallback activations recorded._

## Recording Instructions

The Orchestrator updates this file at the end of each multi-agent session:

1. Increment task counts per agent.
2. Record review round averages.
3. Log any fallback activations.
4. Update cost distribution percentages.

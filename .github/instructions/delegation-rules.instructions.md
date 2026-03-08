---
applyTo: "**"
---

# Delegation Rules

## xN Parameter Distribution Table

The `xN` parameter appended to the end of the user's prompt determines the number of agents and tier distribution.

### Fixed Distributions

> **Canonical Source**: The table below is the authoritative reference for x3, x5, x7, and x10 distributions. The Edge Case Handling section defines additional fixed distributions for x2 and x4. The dynamic formula applies only to values not covered by either table. When the formula and any fixed table conflict, the table wins.

| Parameter | Total | T1 Principal | T1.5 Staff Eng | T2 MidCoder | T2.5 Lead Analyst | T3 Analyst |
| --------- | ----- | ------------ | -------------- | ----------- | ----------------- | ---------- |
| `x3`      | 3     | 1            | 1              | 0           | 0                 | 1          |
| `x5`      | 5     | 1            | 1              | 1           | 1                 | 1          |
| `x7`      | 7     | 1            | 2              | 1           | 1                 | 2          |
| `x10`     | 10    | 2            | 2              | 2           | 1                 | 3          |

### Dynamic Distribution (values other than x3, x5, x7, x10)

Proportional distribution for N value:

- **Tier 1 (Principal)**: ~15% (always at least 1)
- **Tier 1.5 (Staff Engineer)**: ~20% (always at least 1)
- **Tier 2 (MidCoder)**: ~20% (always at least 1 when N >= 5)
- **Tier 2.5 (Lead Analyst)**: ~10% (always at least 1 when N >= 5)
- **Tier 3 (Analyst)**: ~35% (remainder)

Example: `x8` → 1 Principal + 2 Staff Eng + 2 MidCoder + 1 Lead Analyst + 2 Analyst

### Distribution Validation Rules

#### Boundary Constraints

| Tier              | Minimum           | Maximum                    |
| ----------------- | ----------------- | -------------------------- |
| T1 Principal      | 1                 | round(max(1, N × 0.20))   |
| T1.5 Staff Eng    | 1                 | round(max(1, N × 0.25))   |
| T2 MidCoder       | 0 (N<5) / 1 (N≥5) | round(max(1, N × 0.25))   |
| T2.5 Lead Analyst | 0 (N<5) / 1 (N≥5) | 1                          |
| T3 Analyst        | 1                 | remainder                  |

#### Edge Case Handling

| Input  | Resolution                                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `x1`   | Single agent mode — no multi-agent                                                                                         |
| `x2`   | 1 Principal + 1 Analyst                                                                                                    |
| `x4`   | **Canonical**: 1 Principal + 1 Staff Eng + 1 MidCoder + 1 Analyst (no Lead Analyst — analyst output is reviewed by Staff Engineer, the next higher available tier). The dynamic formula may produce a different result; this table wins. |
| N > 10 | Cap at x10 — warn user that current agent definitions support max 10 agents (2P + 2SE + 2MC + 1LA + 3A). Values above x10 require additional agent file definitions. |
| N = 0  | Ignore — treat as no parameter                                                                                             |
| N < 0  | Ignore — treat as no parameter                                                                                             |

#### Validation Formula

```
T1  = max(1, round(N × 0.15))
T1.5 = max(1, round(N × 0.20))
T2  = N >= 5 ? max(1, round(N × 0.20)) : 0
T2.5 = N >= 5 ? 1 : 0
T3  = N - T1 - T1.5 - T2 - T2.5

Assertion: T1 + T1.5 + T2 + T2.5 + T3 == N
```

#### Distribution Examples

| xN    | T1  | T1.5 | T2  | T2.5 | T3  | Total |
| ----- | --- | ---- | --- | ---- | --- | ----- |
| `x4`  | 1   | 1    | 1   | 0    | 1   | 4     |
| `x6`  | 1   | 1    | 1   | 1    | 2   | 6     |
| `x8`  | 1   | 2    | 2   | 1    | 2   | 8     |
| `x9`  | 1   | 2    | 2   | 1    | 3   | 9     |
| `x10` | 2   | 2    | 2   | 1    | 3   | 10    |

### Without Parameter

If the `xN` parameter is not provided, multi-agent mode is **not activated**.
Standard operation with a single agent (default model — Claude Opus 4.6).

---

## Cost Optimization

### Tier Cost Comparison

| Tier     | Model                    | Relative Cost | Capability                              |
| -------- | ------------------------ | ------------- | --------------------------------------- |
| Tier 1   | Claude Opus 4.6          | $$$$$         | Architecture, review, final authority   |
| Tier 1.5 | Claude Sonnet 4.6        | $$$$          | All coding tasks, Staff Engineer review |
| Tier 2   | GPT-5.3-Codex            | $$$           | Simple coding, boilerplate              |
| Tier 2.5 | Gemini 3.1 Pro (Preview) | $$            | Analyst output review, consolidation    |
| Tier 3   | Gemini 3 Flash           | $             | Analysis, research, documentation       |

### Distribution Principles

1. **Cost-sensitive tasks go down**: Analysis, research, doc reading → Tier 3
2. **Productive tasks go to the middle**: Simple coding, utility, test → Tier 2
3. **Complex coding goes to Staff Engineer**: Feature implementation, complex logic → Tier 1.5
4. **Critical decisions go up**: Architecture, final review → Tier 1
5. **Analysis review goes to Lead Analyst**: Analyst output consolidation → Tier 2.5
6. **Repetitive tasks go down**: Multi-file generation with similar structure → Tier 2/3

### Task Assignment Matrix

| Task Type                      | Assigned Tier | Rationale                               |
| ------------------------------ | ------------- | --------------------------------------- |
| Architecture design            | Tier 1        | Critical decision, high-level knowledge |
| Final code review              | Tier 1        | Quality gate, final authority           |
| Complex feature implementation | Tier 1.5      | Primary coding agent                    |
| Complex algorithm              | Tier 1.5      | High accuracy coding                    |
| API endpoint implementation    | Tier 2        | Templated work, medium complexity       |
| Utility function               | Tier 2        | Simple, repetitive                      |
| Component scaffolding          | Tier 2        | Boilerplate generation                  |
| Analyst output review          | Tier 2.5      | Lead Analyst consolidation              |
| Dependency analysis            | Tier 3        | Research, read-only                     |
| Codebase mapping               | Tier 3        | Analysis, read-only                     |
| Document reading/summarizing   | Tier 3        | Low complexity                          |
| Test scenario generation       | Tier 3        | Analysis-based                          |
| Performance profiling          | Tier 3        | Research                                |
| Code review (Tier 2 output)    | Tier 1.5      | Staff Engineer reviews MidCoder         |
| Code review (Tier 1.5 output)  | Tier 1        | Principal reviews Staff Engineer        |
| Code review (Tier 3 output)    | Tier 2.5      | Lead Analyst reviews Analyst            |

---

## Orchestrator Behavior Rules

### Task Division

1. Analyze the incoming prompt — what sub-tasks can it be divided into?
2. Evaluate the complexity of each sub-task.
3. Determine the tier according to the task assignment matrix.
4. Run independent tasks in parallel, dependent tasks sequentially.

### Agent Selection

- In `x10` mode with 2 Principals, distribute architecture tasks evenly between them.
- In `x7`/`x10` mode with 2 Staff Engineers, distribute coding tasks evenly between them.
- In `x5` mode with 1 Principal, all Tier 1 tasks go to that agent.
- Lead Analyst is always a single agent — no parallel Lead Analysts.
- Balance workload when assigning tasks to agents within the same tier.

### Result Collection

1. Collect results when all agents have completed their tasks.
2. Start the review chain — from bottom to top.
3. Present the final output to the user once all reviews are completed.
4. Summarize what each agent did in the output (transparency).

### Optimal Task Sizing

- Each sub-task should target a **single deliverable** (one file, one module, one report).
- If a sub-task requires editing more than 3 files, consider splitting it further.
- Analysis tasks: scope to one concern (e.g., "dependency audit" not "full codebase analysis").
- Coding tasks: scope to one feature or one module boundary.
- If estimated token cost exceeds 15K for a sub-task, the Orchestrator must split before assigning.

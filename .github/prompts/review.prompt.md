---
name: review
description: "Manual review chain trigger. Submits current outputs to the review chain."
agent: Orchestrator
argument-hint: "File/module to review (optional)"
---

# /review — Review Chain

Submit current outputs or specified files to the review chain.

## Usage

```
/review                    → Review all recent outputs
/review src/auth/          → Review the specified directory
/review user-service.ts    → Review the specified file
```

## Steps

1. Determine the review scope.
2. Assign Tier 3 (Analyst) outputs to Tier 2.5 (Lead Analyst) for review.
3. Assign Tier 2 (MidCoder) outputs to Tier 1.5 (Staff Engineer) for review.
4. Assign Tier 1.5 (Staff Engineer) outputs to Tier 1 (Principal) for review.
5. Collect review reports from all tiers.
6. Notify the relevant agent of items requiring corrections.
7. Present the final review summary to the user.

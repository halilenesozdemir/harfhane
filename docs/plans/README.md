# Plans

One file per feature: `YYYY-MM-DD-NNN-<type>-<topic>-plan.md` (`type`: feat, refactor, infra).

A plan is the contract for a unit of work. Progress is not tracked here; read it from git.

## Template

```markdown
---
title: <title>
type: feat | refactor | infra
date: YYYY-MM-DD
status: draft | approved | done | dropped
---

# <title>

## Goal
One paragraph: what changes for the player and why.

## Requirements
- R1. <observable behavior>
- R2. ...

## Acceptance examples
- AE1 (R1). Given <state>, when <action>, then <result>.

## Key technical decisions
- KTD1. <decision> — <reason>. Link an ADR in `docs/decisions/` when the decision outlives this plan.

## Scope boundaries
- Out of scope: ...

## Units
- U1. <smallest shippable step> (R1, R2)
- U2. ...
```

Commit messages reference units where useful, e.g. `feat(mobile): U3 daily mode screen`.

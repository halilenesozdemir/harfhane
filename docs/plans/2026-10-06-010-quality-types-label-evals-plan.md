---
title: Type strictness and label evals
type: quality
date: 2026-10-06
status: approved
---

# Type strictness and label evals

## Goal
Constraints-first factory (owner decision 2026-10-06): move more mistakes from review to the
compiler, and measure the model step of the word pipeline before its output reaches players. The
unlimited pool has no owner review, so its labels need a measured quality gate (Invariant 1:
model proposes, code enforces).

Research: `docs/research/2026-10-06-mattpocock-factory.md`,
`docs/research/2026-10-06-engineering-standards.md`.

## Requirements
- R1. Every workspace compiles with `strict`, `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes` (backend and frontend already have the first two; mobile and
  shared do not).
- R2. `@total-typescript/ts-reset` is applied in every TypeScript workspace.
- R3. `packages/shared` exports branded types `WordLength` and `TurkeyDate`; a plain `number` or a
  UTC date string cannot be passed where they are expected without going through a parser.
- R4. Model-written word labels are scored against an owner-reviewed golden set before they are
  used. The scorer reports precision and recall for `accept`, and recall for every reject reason
  that protects families (`sensitive`, `proper_noun`, `foreign`).
- R5. Importing a model-labelled unlimited batch is blocked when the batch's eval on the golden set
  is below the thresholds (`LABEL_ACCEPT_PRECISION_MIN = 0.95`, `LABEL_SENSITIVE_RECALL_MIN = 0.98`).
- R6. Implementers list the ambiguities they resolved, and how, in the PR body (`unit.md`).

## Acceptance examples
- AE1 (R1). Given `const first = letters[0]` in shared code, typecheck fails until the possible
  `undefined` is handled.
- AE2 (R3). Given `getDailyWord(db, '2026-10-06', 5)` where the date is a raw string, typecheck
  fails; `parseTurkeyDate('2026-10-06')` makes it compile.
- AE3 (R4). Given labels that accept one of the golden set's `sensitive` rejects, the eval reports
  sensitive recall below 1.0 and names the word id (not the word).
- AE4 (R5). Given an eval with accept precision 0.90, the unlimited import script exits 1 and writes
  no CSV.

## Key technical decisions
- KTD1. Golden set: the 600 owner-reviewed 5-letter decisions in `data/words/review/labels-5.jsonl`
  (346 accept, 254 reject with reasons). Split deterministically: a fixed half calibrates prompts,
  the other half is the held-out eval set. Add 4- and 6-letter golden sets as the owner reviews them.
- KTD2. The eval is a deterministic Python script in `scripts/words/` (no new runtime dependency;
  Evalite is the TypeScript reference but the pipeline is Python). Model calls are outside the
  eval: it scores a labels file, so it runs in CI without API keys.
- KTD3. Flags land one workspace per PR, starting with `packages/shared` (smallest), so the
  fallout stays reviewable; fixes are behaviour-preserving and covered by existing tests.
- KTD4. Branded types live in `packages/shared/src/types/` with one parser each; apps migrate at
  their boundaries (route input, storage read), not everywhere at once.

## Units
File ownership: A owns tsconfig files and type-only fixes per workspace; B owns
`packages/shared/src/types/**` and call sites; C owns `scripts/words/**`; D owns
`.claude/commands/unit.md`.

- U1 (A). `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` + ts-reset in
  `packages/shared`. (R1, R2, AE1)
- U2 (A, after U1). Same for backend and frontend (the missing flag + ts-reset). (R1, R2)
- U3 (A, after U2). Same for mobile. (R1, R2) Deferred until after the first release (owner decision 2026-10-11, `docs/backlog.md`).
- U4 (B, after U1). Branded `WordLength` / `TurkeyDate` with parsers; backend and shared boundaries
  first. (R3, AE2)
- U5 (C). `scripts/words/eval_labels.py` + tests: golden split, metrics, thresholds, report with
  word ids only. (R4, AE3)
- U6 (C, after U5). Unlimited import path refuses batches below the thresholds. (R5, AE4)
- U7 (D). `unit.md`: list resolved ambiguities in the PR body. (R6)

## Not in this plan
Calling a model from CI, and prompt tuning itself; adopting Matt Pocock's skills repo wholesale
(ideas only, adopted unit by unit). Extracting the factory into a reusable template waits until
Harfhane is stable (owner decision 2026-10-06; `docs/backlog.md`).

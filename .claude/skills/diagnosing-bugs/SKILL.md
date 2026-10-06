---
name: diagnosing-bugs
description: Diagnosis loop for hard Harfhane bugs and regressions. Use when something is broken, throwing, failing, flaky or slow, and before any third fix attempt.
---

# Diagnosing bugs

Adapted from Matt Pocock's `diagnosing-bugs` skill (MIT, github.com/mattpocock/skills @ 4588b32).

Read `GLOSSARY.md` and the ADRs in `docs/decisions/` for the area first. Redact every secret in
commands and output (`<REDACTED>`); never print `ADMIN_SECRET`, tokens or `.env` values.

## 1. Build a feedback loop (the whole skill)
Get one command that goes red on this bug before reading code for theories. In order of preference:
a failing test at the seam that reaches the bug (Vitest, Workers pool, jest-expo, `python -m
unittest`); a `curl` against `wrangler dev --local`; a Playwright script; a replayed payload; a
throwaway harness; a property loop (fast-check, many runs) for "sometimes wrong"; `git bisect run`
between a good and a bad commit; a differential run (old vs new build). Never use `--remote`.

Tighten it: seconds not minutes, pinned time (`vi.setSystemTime`, Turkey day), seeded randomness,
exact symptom asserted. For flaky bugs, raise the reproduction rate until it is debuggable.

Done when you have run the command at least once, shown its (redacted) output, and it is
red-capable, deterministic, fast and runnable without a human. If you cannot build one, stop and
report what you tried and what access or artifact you need. No loop, no hypotheses.

## 2. Reproduce and minimise
Confirm it is the reported symptom, not a nearby one. Cut inputs, data and steps one at a time
until every remaining element is needed for the failure.

## 3. Hypothesise
Write 3–5 ranked, falsifiable hypotheses: "If X is the cause, changing Y makes it disappear."
Put them in the report or PR so the main loop can re-rank with context it has.

## 4. Instrument
One variable per probe. Tag temporary logs `[DEBUG-<4 chars>]`; there is no `console.*` in
production code, so every tagged line must be gone before commit. For performance, measure a
baseline first.

## 5. Fix with a regression test
Turn the minimal repro into a failing test at a seam that exercises the real call path, watch it
fail, fix, watch it pass, rerun the original loop. Name it `should <behavior> when <condition>`.
If no correct seam exists, that is a finding: record it in `docs/backlog.md`.

## 6. Clean up
Original loop green; regression test passes; `grep` finds no `[DEBUG-`; throwaway files deleted;
the confirmed hypothesis is stated in the commit or PR body. Same error twice means change
approach; after three re-plans or with an unclear root cause, stop and report.

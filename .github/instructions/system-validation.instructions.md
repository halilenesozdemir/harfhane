---
applyTo: "**"
---

# System Validation Rules

Agent-verifiable integrity rules that supersede the former bash linter (`scripts/validate-system.sh`). When the Orchestrator or any Principal needs to validate system integrity, they follow these rules manually using read/search tools instead of running a script.

---

## Rule 1 — Version Consistency

The version string must be identical across three files.

| File | Location | Format |
|------|----------|--------|
| `README.md` | Line 1 | `vX.Y.Z` |
| `USAGE.md` | Header (first 5 lines) | `X.Y.Z` |
| `CHANGELOG.md` | First `## [X.Y.Z]` entry | `X.Y.Z` |

**Verification:** Read line 1 of each file, extract the version token, normalize to `vX.Y.Z` format, and compare. PASS if all three match. FAIL with mismatched values.

---

## Rule 2 — File Counts

The repository must contain a minimum number of files in each category.

| Directory | Pattern | Minimum |
|-----------|---------|---------|
| `.github/agents/` | `*.agent.md` | 8 |
| `.github/instructions/` | `*.instructions.md` | 17 |
| `.github/skills/*/` | `SKILL.md` (in subdirectories) | 8 |
| `.github/hooks/` | `*.json` | 2 |

**Verification:** List files in each directory matching the pattern, count, and compare against the minimum. PASS if all counts meet or exceed their minimum. FAIL with actual vs. expected counts.

---

## Rule 3 — No Forbidden xN References

No references to multipliers x11 or higher may appear in `.github/instructions/` files.

**Search pattern:** `x1[1-9]|x[2-9][0-9]`

**Scope:** All `*.instructions.md` files in `.github/instructions/`.

**Excluded matches (not violations):**

- Lines that are headings (start with `#`)
- Lines containing `prohibited`, `CHANGELOG`, `changelog`, `edge case`, `Edge Case`, or `diminishing`

**Verification:** Search all instruction files for the pattern. Filter out matches on excluded lines. PASS if zero violations remain. FAIL with file, line number, and content of each violation.

---

## Rule 4 — Code Fences

No 4+ backtick code fences in any SKILL.md file. Only standard 3-backtick fences are allowed.

**Search pattern:** Four or more consecutive backtick characters (regex: `` `{4,} ``).

**Scope:** All `.github/skills/*/SKILL.md` files.

**Verification:** Search each SKILL.md for the pattern. PASS if no matches. FAIL with file and line number of each violation.

---

## Rule 5 — Unicode Integrity

No Unicode replacement characters (U+FFFD, `�`) in `AGENTS.md`.

**Search pattern:** The byte sequence `\xEF\xBF\xBD` or the rendered character `�`.

**Scope:** `AGENTS.md` at the repository root.

**Verification:** Read `AGENTS.md` and search for the replacement character. PASS if zero occurrences. FAIL with the count and affected line numbers.

---

## Rule 6 — Hook Parity

In `.github/hooks/safety-guard.json`, the edit-related tools listed under `PreToolUse` events must exactly match those under `PostToolUse` events.

**Edit-related tools:** Any tool name containing `edit`, `create`, `replace`, or `write` (case-insensitive).

**Verification:** Parse the hook JSON. Collect edit-related tool names from `PreToolUse` entries into a set and from `PostToolUse` entries into another set. PASS if the sets are identical. FAIL with the symmetric difference.

---

## Rule 7 — Model Consistency

Each agent file's YAML `model` and `modelFallback` fields must match the canonical model table below. Strip any ` (copilot)` suffix from YAML values before comparison.

### Canonical Model Table

| Agent | Primary Model | Fallback Model |
|-------|--------------|----------------|
| orchestrator | Claude Opus 4.6 | Claude Opus 4.5 |
| principal-alpha | Claude Opus 4.6 | Claude Opus 4.5 |
| principal-beta | Claude Opus 4.6 | Claude Opus 4.5 |
| staff-engineer-alpha | Claude Sonnet 4.6 | Claude Sonnet 4.5 |
| staff-engineer-beta | Claude Sonnet 4.6 | Claude Sonnet 4.5 |
| mid-coder-alpha | GPT-5.3-Codex | GPT-5.2-Codex |
| mid-coder-beta | GPT-5.3-Codex | GPT-5.2-Codex |
| lead-analyst | Gemini 3.1 Pro (Preview) | Gemini 3.0 Pro (Preview) |
| analyst-alpha | Gemini 3 Flash | Claude Haiku 4.5 |
| analyst-beta | Gemini 3 Flash | Claude Haiku 4.5 |
| analyst-gamma | Gemini 3 Flash | Claude Haiku 4.5 |

### Constraints

- The `model` and `modelFallback` values must never be identical for the same agent.
- YAML values may carry a ` (copilot)` suffix; strip it before comparing against this table.

**Verification:**

1. For each agent in the table, read `.github/agents/<agent>.agent.md`.
2. Extract `model` and `modelFallback` YAML fields. Strip ` (copilot)` suffix.
3. Compare against the canonical table row.
4. Verify `model` ≠ `modelFallback` (pre-strip values).

PASS if all agents match and no identical model/fallback pairs exist. FAIL with the agent name and mismatched values.

---

## Validation Protocol

### When to Validate

- After every version bump
- After adding or removing an agent
- After modifying any file in `.github/hooks/`
- After modifying `project-context-discovery.instructions.md`
- After modifying `prompt-enrichment.instructions.md`

### Who Validates

| Role | Obligation |
|------|-----------|
| Orchestrator | Mandatory — run all 9 rules at session end |
| Principal | Optional — spot-check any subset of rules |

### Report Format

Present results as a numbered list. Each rule gets one line.

```
1. Version Consistency: PASS — v4.2.0 across all files
2. File Counts: PASS — Agents=11, Instructions=17, Skills=10, Hooks=2
3. No Forbidden xN References: PASS
4. Code Fences: PASS
5. Unicode Integrity: PASS
6. Hook Parity: PASS
7. Model Consistency: PASS
8. PCD File: PASS — All 4 required sections present
9. PEP File: PASS — All 4 required sections present

Summary: 9/9 PASS
```

For failures, append the details inline:

```
6. Hook Parity: FAIL — PreToolUse has {edit_file} but PostToolUse is missing it

Summary: 8/9 PASS, 1 FAIL
```

---

## Rule 8 — Project Context Discovery File

The PCD instruction file must exist and contain required sections.

**Required file:** `.github/instructions/project-context-discovery.instructions.md`

**Required sections** (search for exact headings):

- `## Discovery Protocol`
- `## Priority Hierarchy`
- `## Agent Obligations`
- `## Context Loading Integration`

**Verification:** Read the PCD file. Confirm it exists and all four section headings are present. PASS if file exists and all headings found. FAIL with missing file or missing headings.

---

## Rule 9 — Prompt Enrichment Protocol File

The PEP instruction file must exist and contain required sections.

**Required file:** `.github/instructions/prompt-enrichment.instructions.md`

**Required sections** (search for exact headings):

- `## When to Apply PEP`
- `## Question Categories`
- `## Enrichment Process`
- `## Orchestrator Integration`

**Verification:** Read the PEP file. Confirm it exists and all four section headings are present. PASS if file exists and all headings found. FAIL with missing file or missing headings.

---

## New Agent Validation

After a new agent is scaffolded, re-run the following rules to verify integration:

| Rule | Purpose |
|------|---------|
| Rule 2 — File Counts | Confirm the new agent file increments the agent count |
| Rule 7 — Model Consistency | Confirm the new agent has correct model and fallback assignments |

Update the canonical model table in this file when adding a new agent.

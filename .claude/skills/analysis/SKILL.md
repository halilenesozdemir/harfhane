---
name: Analysis
description: Activated for research, information gathering, document reading, and investigation tasks. Provides structured analysis output format. Used by Lead Analyst and Analyst agents. READ-ONLY — never edits files.
allowed-tools: Read, Grep, Glob, WebFetch, WebSearch
---

# Analysis Skill

## Core Constraint

Analyst agents NEVER edit files. Read-only mode: read, search, fetch tools only.
When edits are needed, findings are reported to the upper tier for implementation.

---

## Analysis Output Format

```markdown
## Analysis Report — [Topic Title]

**Analyst**: [Agent Name]
**Date**: [YYYY-MM-DD]
**Scope**: [Analyzed area/files]
**Confidence Level**: High | Medium | Low

### Summary

[2-3 sentence executive summary]

### Findings

1. **[Finding 1]**: [Detail]
2. **[Finding 2]**: [Detail]

### Recommendations

- [Action 1]
- [Action 2]

### Risks

| Risk | Probability | Impact | Mitigation |
| ---- | ----------- | ------ | ---------- |
| ...  | High/Med/Low | High/Med/Low | ... |

### Sources

- [File:Line or URL]
```

---

## Analysis Types

### 1. Codebase Analysis

```markdown
### Codebase Map

**Total Files**: {n}
**Total Lines**: {n}
**Language Distribution**: TypeScript %{n}, ...

#### Directory Structure

src/
├── features/ — {n} files, {description}
└── shared/ — {n} files, {description}

#### Hot Spots

{Most frequently changed, most complex files}
```

### 2. Dependency Analysis

```markdown
### Dependency Report

#### Production Dependencies

| Package | Version | Last Updated | Status |
| ------- | ------- | ------------ | ------ |

#### Recommendations

- To update: [...]
- To remove (unused): [...]
```

### 3. Technology Comparison

```markdown
### Technology Comparison — [Topic]

| Criterion | Option A | Option B | Option C |
| --------- | -------- | -------- | -------- |
| Performance | ... | ... | ... |
| Ecosystem | ... | ... | ... |
| Cost | ... | ... | ... |

**Recommendation**: [Option X] — [Rationale]
```

### 4. Risk Assessment

```markdown
### Risk Matrix

| # | Risk | Probability | Impact | Score | Mitigation |
| - | ---- | ----------- | ------ | ----- | ---------- |
| 1 | ... | 1-5 | 1-5 | {PxI} | ... |

Score: 1-6 Low | 7-15 Medium | 16-25 High
```

### 5. Test Scenario Generation

```markdown
### Test Scenarios — [Feature/Module]

#### Happy Path

| # | Scenario | Input | Expected Output | Priority |
| - | -------- | ----- | --------------- | -------- |

#### Edge Cases

| # | Scenario | Input | Expected Output |
| - | -------- | ----- | --------------- |

#### Error Cases

| # | Scenario | Error Condition | Expected Behavior |
| - | -------- | --------------- | ----------------- |
```

---

## Research Protocol

1. **Workspace Scan**: Read project structure, existing code, configuration.
2. **Document Reading**: Review README, CLAUDE.md, docs/.
3. **Pattern Identification**: Detect conventions in existing code.
4. **External Sources**: Check official docs via fetch when needed.
5. **Synthesis**: Report all findings in structured format.

### Accuracy Standards

- Do not speculate — mark uncertain findings with confidence level.
- Cite sources — indicate which file:line each finding originates from.
- Explain assumptions explicitly.

---

## Quality Checklist

- [ ] Output conforms to standard format?
- [ ] All findings backed by source references?
- [ ] Confidence level specified?
- [ ] Recommendations actionable (specific, not vague)?
- [ ] Risk score calculated if risk matrix included?
- [ ] Summary concise?

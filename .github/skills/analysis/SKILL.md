---
name: Analysis
description: >
  Analysis, research, document reading, and information gathering skill.
  Used by Tier 2.5 (Lead Analyst) and Tier 3 (Analyst) agents. Provides guidance on structured analysis
  outputs, research formats, and risk assessment.
estimated-tokens: 3000
---

# Analysis Skill

## Usage

This skill is used by Lead Analyst (Tier 2.5) and Analyst (Tier 3) agents for the following tasks:

- Codebase analysis and mapping
- Dependency analysis (dependency audit)
- Document reading and summarization
- Technology research and comparison
- Risk assessment
- Test scenario generation
- Performance analysis

---

## ⚠️ Core Constraint

> **Analyst agents NEVER edit files.**
> They operate in read-only mode: `read`, `search`, `fetch` tools are used.
> When edits are needed, findings are reported to the upper tier.

---

## Analysis Output Format

Every analysis report is presented in the following structure:

```markdown
## Analysis Report — [Topic Title]

**Analyst**: [Agent Name]
**Date**: [YYYY-MM-DD]
**Scope**: [Analyzed area/files]
**Confidence Level**: 🟢 High | 🟡 Medium | 🔴 Low

### Summary

[2-3 sentence executive summary]

### Findings

1. **[Finding 1]**: [Detail]
2. **[Finding 2]**: [Detail]

### Recommendations

- [Action recommendation 1]
- [Action recommendation 2]

### Risks

| Risk | Probability     | Impact          | Mitigation |
| ---- | --------------- | --------------- | ---------- |
| ...  | High/Medium/Low | High/Medium/Low | ...        |

### Sources

- [Reference 1]
- [Reference 2]
```

---

## Analysis Types and Templates

### 1. Codebase Analysis

```markdown
### Codebase Map

**Total Files**: {n}
**Total Lines**: {n}
**Language Distribution**: TypeScript %{n}, JavaScript %{n}, ...

#### Directory Structure

\`\`\`
src/
├── features/ — {n} files, {description}
├── shared/ — {n} files, {description}
└── core/ — {n} files, {description}
\`\`\`

#### Module Dependency Graph

{Which module depends on which}

#### Hot Spots

{Most frequently changed, most complex files}
```

### 2. Dependency Analysis

```markdown
### Dependency Report

#### Production Dependencies

| Package | Version | Last Updated | CVE | Status   |
| ------- | ------- | ------------ | --- | -------- |
| ...     | ...     | ...          | ... | ✅/⚠️/❌ |

#### Dev Dependencies

| Package | Version | Purpose |
| ------- | ------- | ------- |

#### Recommendations

- To update: [...]
- To remove (unused): [...]
- Alternative suggestions: [...]
```

### 3. Technology Comparison

```markdown
### Technology Comparison — [Topic]

| Criterion      | Option A | Option B | Option C |
| -------------- | -------- | -------- | -------- |
| Performance    | ...      | ...      | ...      |
| Learning Curve | ...      | ...      | ...      |
| Ecosystem      | ...      | ...      | ...      |
| Community      | ...      | ...      | ...      |
| Cost           | ...      | ...      | ...      |

**Recommendation**: [Option X] — [Rationale]
```

### 4. Risk Assessment

```markdown
### Risk Matrix

| #   | Risk | Probability | Impact | Score | Mitigation |
| --- | ---- | ----------- | ------ | ----- | ---------- |
| 1   | ...  | 1-5         | 1-5    | {PxI} | ...        |

**Risk Score Calculation**: Probability × Impact

- 🟢 1-6: Low risk — monitor
- 🟡 7-15: Medium risk — make a plan
- 🔴 16-25: High risk — take immediate action
```

### 5. Test Scenario Generation

```markdown
### Test Scenarios — [Feature/Module]

#### Happy Path

| #   | Scenario | Input | Expected Output | Priority |
| --- | -------- | ----- | --------------- | -------- |
| 1   | ...      | ...   | ...             | P0/P1/P2 |

#### Edge Cases

| #   | Scenario | Input | Expected Output |
| --- | -------- | ----- | --------------- |

#### Error Cases

| #   | Scenario | Error Condition | Expected Behavior |
| --- | -------- | --------------- | ----------------- |
```

---

## Research Protocol

### Information Gathering Steps

1. **Workspace Scan**: Read the project structure, existing code, and configuration.
2. **Document Reading**: Review README, CHANGELOG, and inline comments.
3. **Pattern Identification**: Detect patterns and conventions used in the existing code.
4. **External Sources** (if available): Check official documentation or API references via `fetch`.
5. **Synthesis**: Report all findings in a structured format.

### Accuracy Standards

- **Do not speculate** — mark uncertain findings with a confidence level.
- **Cite sources** — indicate which file/line each finding originates from.
- **Explain assumptions** — e.g., "Since file X does not exist, Y was assumed."

---

## Quality Control

Analyst agents ensure the following in every output:

- [ ] Does the output conform to the standard format?
- [ ] Are all findings backed by source references?
- [ ] Is the confidence level specified?
- [ ] Are recommendations actionable? (specific, not vague)
- [ ] If a risk assessment is included, has the score been calculated?
- [ ] Is there no unnecessary detail, and is the summary concise enough?

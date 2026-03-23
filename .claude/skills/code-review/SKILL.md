---
name: Code Review
description: Activated when reviewing, auditing, or checking code quality. Provides systematic review checklists and severity levels (Critical/Major/Minor/Suggestion). Use for self-review before any code submission.
allowed-tools: Read, Grep, Glob
---

# Code Review Skill

## Review Process

### Step 1: Initial Scan

- Understand the purpose of the change.
- Identify file structure and affected areas.
- Check scope — are there out-of-scope changes?

### Step 2: Detailed Review

- Apply the checklist below in order.
- Mark each item as PASS / FAIL / N/A.

### Step 3: Feedback

- Report findings in standard format.
- Assign severity levels.
- Suggest or apply fixes if necessary.

---

## Review Checklist

### Critical (Blocker)

- [ ] **Security**: SQL injection, XSS, CSRF, or hardcoded secret?
- [ ] **Data Loss**: Situation that could lead to data loss?
- [ ] **Breaking Change**: Existing API/interface contract broken?
- [ ] **Runtime Error**: Null reference, undefined access, or type mismatch risk?

### Major

- [ ] **Logic Error**: Business logic implemented correctly?
- [ ] **Error Handling**: Edge cases and error conditions handled?
- [ ] **Performance**: Unnecessary loops, N+1 queries, or memory leaks?
- [ ] **Concurrency**: Race condition or deadlock risk?

### Minor

- [ ] **Naming**: Names clear, consistent, and expressive of intent?
- [ ] **DRY**: Duplicated code? Opportunity for abstraction?
- [ ] **Complexity**: Function/class too complex? (Cyclomatic complexity > 8?)
- [ ] **SOLID**: Any principles being violated?

### Suggestion

- [ ] **Readability**: Can readability be improved?
- [ ] **Test**: Is new code covered by tests?
- [ ] **Consistency**: Conforms to project style guide?

---

## Severity Levels

| Level | Action | Description |
| --- | --- | --- |
| Critical | Merge blocker | Security, data loss, breaking change |
| Major | Must be fixed | Logic error, performance, error handling |
| Minor | Recommended | Style, naming, simple improvement |
| Suggestion | Optional | Future refactoring |

---

## Feedback Format

```markdown
## Review Report — [File/Task Name]

**Reviewer**: [Agent Name]
**Reviewed**: [Reviewed Agent Name]
**Result**: Approved | Revision Required | Rejected

### Findings

#### Critical

- [File:Line] — Description
  **Suggestion**: ...

#### Major

- [File:Line] — Description

#### Minor

- [File:Line] — Description

#### Suggestion

- [File:Line] — Description

### Summary

- Critical: {n} | Major: {n} | Minor: {n} | Suggestion: {n}
- **Decision**: [Approve / Request revision / Reject]
```

---

## Code Smell Catalog

### Structural

| Smell | Symptom | Resolution |
| --- | --- | --- |
| God Class | 300+ lines, 10+ methods | Extract class, apply SRP |
| Feature Envy | Excessive use of another class's data | Move method |
| Shotgun Surgery | N files change for one change | Consolidate |
| Primitive Obsession | Domain concepts as string/number | Create Value Object |

### Behavioral

| Smell | Symptom | Resolution |
| --- | --- | --- |
| Long Method | 20+ line function | Extract method |
| Long Parameter List | 4+ parameters | Parameter Object |
| Dead Code | Unused code | Delete it |

---

## Tier-Specific Review Rules

### Principal → Staff Engineer

- Architecture decision sound and consistent with project patterns?
- Production-quality standards met?
- Edge cases and error paths handled?
- Commit and PR standards followed?

### Staff Engineer → MidCoder

- Code compiles and runs correctly?
- SOLID principles applied?
- Error handling sufficient?
- Naming conventions consistent?
- Complexity levels acceptable (functions ≤20 lines, files ≤250 lines)?
- Security vulnerabilities absent?

### Lead Analyst → Analyst

- Analysis report format conforms to standards?
- Findings backed by source references (file, line)?
- Confidence levels appropriate for evidence?
- Recommendations specific and actionable?

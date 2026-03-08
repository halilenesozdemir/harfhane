---
name: Code Review
description: >
  Code review, quality assurance, and review chain management skill.
  Used by Tier 1 (Principal), Tier 1.5 (Staff Engineer), Tier 2 (MidCoder), and Tier 2.5 (Lead Analyst) agents.
  Provides systematic review checklists, code smell detection, and feedback formats.
estimated-tokens: 2500
---

# Code Review Skill

## Usage

This skill is used by agents in the review chain:

- **Principal (T1)**: Reviews Staff Engineer outputs
- **Staff Engineer (T1.5)**: Reviews MidCoder outputs
- **Lead Analyst (T2.5)**: Reviews Analyst outputs
- **MidCoder (T2)**: Can use for self-review
- All tiers can use it for self-review of their own code

---

## Review Process

### Step 1: Initial Scan (Skim)

- Understand the purpose of the change.
- Identify file structure and affected areas.
- Check scope appropriateness — are there any out-of-scope changes?

### Step 2: Detailed Review

- Apply the checklist below in order.
- Mark each item as PASS / FAIL / N/A.

### Step 3: Feedback

- Report your findings in the standard format.
- Assign severity levels.
- Suggest or apply fixes if necessary.

---

## Review Checklist

### 🔴 Critical (Blocker)

- [ ] **Security**: Is there SQL injection, XSS, CSRF, or a hardcoded secret?
- [ ] **Data Loss**: Is there a situation that could lead to data loss?
- [ ] **Breaking Change**: Is an existing API/interface contract being broken?
- [ ] **Runtime Error**: Is there a null reference, undefined access, or type mismatch risk?

### 🟠 Major

- [ ] **Logic Error**: Is the business logic implemented correctly?
- [ ] **Error Handling**: Are edge cases and error conditions handled?
- [ ] **Performance**: Are there unnecessary loops, N+1 queries, or memory leaks?
- [ ] **Concurrency**: Is there a race condition or deadlock risk?

### 🟡 Minor

- [ ] **Naming**: Are names clear, consistent, and expressive of intent?
- [ ] **DRY**: Is there duplicated code? Opportunity for abstraction?
- [ ] **Complexity**: Is the function/class too complex? (Cyclomatic complexity > 8?)
- [ ] **SOLID**: Are any principles being violated?

### 🔵 Suggestion (Nice-to-have)

- [ ] **Readability**: Can code readability be improved?
- [ ] **Documentation**: Is there sufficient JSDoc for public API interfaces?
- [ ] **Test**: Is new code covered by tests?
- [ ] **Consistency**: Does it conform to the project style guide?

---

## Severity Levels

| Level      | Emoji | Action             | Description                                |
| ---------- | ----- | ------------------ | ------------------------------------------ |
| Critical   | 🔴    | Merge blocker      | Security, data loss, breaking change       |
| Major      | 🟠    | Must be fixed      | Logic error, performance, error handling   |
| Minor      | 🟡    | Recommended to fix | Style, naming, simple improvement          |
| Suggestion | 🔵    | Optional           | Improvement suggestion, future refactoring |

---

## Feedback Format

Review output is presented in the following format:

```markdown
## Review Report — [File/Task Name]

**Reviewer**: [Agent Name]
**Reviewed**: [Reviewed Agent Name]
**Result**: ✅ Approved | ⚠️ Revision Required | ❌ Rejected

### Findings

#### 🔴 Critical

- [File:Line] — Description
  **Suggestion**: ...

#### 🟠 Major

- [File:Line] — Description
  **Suggestion**: ...

#### 🟡 Minor

- [File:Line] — Description

#### 🔵 Suggestion

- [File:Line] — Description

### Summary

- Critical: {n} | Major: {n} | Minor: {n} | Suggestion: {n}
- **Decision**: [Approve / Request revision / Reject]
```

---

## Code Smell Catalog

### Structural Smells

| Smell               | Symptom                                         | Resolution                     |
| ------------------- | ----------------------------------------------- | ------------------------------ |
| God Class           | 300+ lines, 10+ methods                         | Extract class, apply SRP       |
| Feature Envy        | Excessive use of another class's data           | Move method to the right class |
| Shotgun Surgery     | Updating N files for a single change            | Consolidate related code       |
| Primitive Obsession | Representing domain concepts with string/number | Create Value Object            |

### Behavioral Smells

| Smell               | Symptom                               | Resolution                 |
| ------------------- | ------------------------------------- | -------------------------- |
| Long Method         | 20+ line function                     | Extract method             |
| Long Parameter List | 4+ parameters                         | Parameter Object / Builder |
| Divergent Change    | A class changes for different reasons | Extract class              |
| Dead Code           | Unused code                           | Delete it                  |

---

## Tier-Specific Review Rules

### Principal → Staff Engineer Review

- Verify the architecture decision is sound and consistent with project patterns
- Ensure production-quality standards are met
- Check edge cases and error paths are handled
- Evaluate overall design consistency
- Verify commit and PR standards are followed

### Staff Engineer → MidCoder Review

- Verify the code compiles and runs correctly
- Check SOLID principles are applied
- Evaluate error handling sufficiency
- Verify naming convention consistency
- Assess complexity levels (functions ≤20 lines, files ≤250 lines)
- Detect security vulnerabilities

### Lead Analyst → Analyst Review

- Verify analysis report format conforms to standards
- Confirm findings are backed by source references (file, line, URL)
- Validate confidence levels are appropriate for evidence
- Check recommendations are specific and actionable
- Assess scope coverage sufficiency
- Cross-reference findings across multiple analyst reports for consistency

---
name: PR Standards
description: Activated when creating pull requests or preparing code for review. Enforces 500-line limit, 15-file limit, PR description template, and self-review checklist before submission.
allowed-tools: Read, Bash
---

# PR Standards Skill

## PR Size Limits

| Metric | Limit | Action if Exceeded |
| ------ | ----- | ------------------ |
| Total Lines | 500 | Split into smaller PRs |
| Files Changed | 15 | Evaluate splitting |
| Commits | 10 | Squash related commits |

---

## PR Description Template

```markdown
## Summary

- [What was added/changed/fixed and why]
- [Technical approach]
- [Any trade-offs or decisions]

## Changed Files

- [List of affected files and what changed]

## Test Plan

1. [Step to test the change]
2. [Edge case to verify]
3. [Expected result]

## References

- [Links to relevant issues, docs, or decisions]
```

---

## PR Checklist

### Code Quality

- [ ] Code compiles and runs without errors.
- [ ] No `console.*`, `debugger`, or debug artifacts.
- [ ] No commented-out code.
- [ ] Naming conventions followed.
- [ ] Functions ≤20 lines, files ≤250 lines.

### Testing

- [ ] Unit tests written for new/changed code.
- [ ] Test coverage ≥80%.
- [ ] All existing tests pass.

### Nurdle-Specific

- [ ] Responsive design verified (mobile + desktop).
- [ ] Accessibility checked (keyboard nav, ARIA, contrast).
- [ ] Turkish characters correct in all user-facing text.
- [ ] No hardcoded hex colors — Tailwind tokens used.
- [ ] All interactive elements have `cursor-pointer`.
- [ ] No emojis in UI — Lucide icons only.
- [ ] D1 schema changes have migration file.
- [ ] Commit messages follow Conventional Commits format.

### Standards

- [ ] PR size ≤500 lines.
- [ ] No new third-party libraries without justification in PR description.
- [ ] Self-review performed before requesting review.

---

## Review Guidelines

### For Authors

1. Self-review your PR before requesting review.
2. Respond to all review comments.
3. Do not force-push during review — add fixup commits.
4. Squash fixup commits before merge.

### For Reviewers

1. Apply code-review skill checklist.
2. Check consistency with existing codebase patterns.
3. Verify Turkish character correctness in user-facing strings.

---

## Dependency Policy

- New third-party library requires justification in PR description.
- Verify mevcut stack cannot solve the problem first.
- Native API sufficient → no new library.

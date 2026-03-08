---
name: PR Standards
description: >
  Pull request format, size limits, description template, and review readiness
  standards. Used by all coding agents (Tier 1, Tier 1.5, Tier 2) to ensure
  consistent and reviewable pull requests.
estimated-tokens: 2000
---

# PR Standards Skill

## Scope

This skill defines pull request standards for all agents that produce code.
Every PR must follow these guidelines — non-compliant PRs are sent back for revision.

---

## PR Size Limits

| Metric           | Limit  | Action if Exceeded                      |
| ---------------- | ------ | --------------------------------------- |
| **Total Lines**  | 500    | Decline and request splitting           |
| **Files Changed**| 15     | Consider splitting into smaller PRs     |
| **Commits**      | 10     | Squash related commits                  |

PRs exceeding 500 lines will be **declined** and the author will be asked to split them into smaller, focused PRs.

---

## PR Description Template

Every PR must include the following sections:

```markdown
## Project

- [Project name: e.g., MayaCore, SolMaya, etc.]

## Before & After Screenshots

- [Screenshot 1 — before]
- [Screenshot 2 — after]
- [Visual explanation of the change]

## Changed Page/Component

- [Exact location of the change]

## Affected Pages/Components

- [List of other components or pages impacted by this change]

## Detailed Description

[Comprehensive explanation of the PR. Example:]

- What was added/changed/fixed and why.
- Technical approach taken.
- Any trade-offs or decisions made.

## References

- [Links to documentation, Stack Overflow answers, or design specs that informed the implementation]

## Test Information

[Suggested test scenario for reviewers:]

1. Navigate to [page/component].
2. Perform [action].
3. Verify [expected result].
4. Test edge case: [description].
```

---

## PR Checklist

Before submitting a PR, verify:

### Code Quality

- [ ] Code compiles and runs without errors.
- [ ] No `console.log`, `debugger`, or debug artifacts.
- [ ] No commented-out code.
- [ ] Naming conventions followed consistently.
- [ ] Functions within size limits (max 20 lines).
- [ ] Files within size limits (max 250 lines).

### Testing

- [ ] Unit tests written for new/changed code.
- [ ] Test coverage meets minimum threshold (80%).
- [ ] Storybook stories created for new UI components.
- [ ] All existing tests pass.

### Frontend Specific

- [ ] Responsive design verified (mobile + desktop).
- [ ] Accessibility standards met (keyboard nav, ARIA labels, contrast).
- [ ] SEO requirements addressed (meta tags, semantic HTML, alt text).
- [ ] Performance checked (no unnecessary re-renders, lazy loading applied).
- [ ] Lighthouse scores acceptable (mobile + web).

### Standards

- [ ] Commit messages follow commit standards.
- [ ] PR size within 500-line limit.
- [ ] No new third-party libraries added without Architectural Committee approval.
- [ ] Feature-based folder structure maintained.

---

## PR Review Guidelines

### For Reviewers

1. Check the PR description is complete and follows the template.
2. Verify screenshots match the described changes.
3. Run the test scenarios described in the PR.
4. Apply the code review checklist from the `code-review` skill.
5. Check for consistency with existing codebase patterns.

### For Authors

1. Self-review your PR before requesting review.
2. Respond to all review comments.
3. Do not force-push during review — add fixup commits instead.
4. Squash fixup commits before merge.

---

## Third-Party Library Policy

- **New third-party libraries require Architectural Committee approval.**
- Before proposing a new library, check if an existing library already solves the problem.
- Avoid unnecessary library imports — use native APIs when sufficient.
- Document the justification for any new dependency.

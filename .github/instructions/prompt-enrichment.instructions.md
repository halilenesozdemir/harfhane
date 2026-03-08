---
applyTo: "**"
---

# Prompt Enrichment Protocol (PEP)

Before starting any development task, enrich the user's prompt through targeted questions and structured planning. This ensures clarity, reduces rework, and produces higher-quality deliverables.

---

## Purpose

Vague or incomplete prompts lead to misaligned implementations, wasted tokens, and revision cycles. PEP addresses this by:

1. Identifying ambiguities and missing requirements before any code is written
2. Asking the user targeted questions to fill knowledge gaps
3. Producing a detailed implementation plan that the user can review and approve
4. Starting development only after the plan is confirmed

---

## When to Apply PEP

### Always Apply (Non-Trivial Tasks)

PEP is mandatory for tasks that involve:

- Creating new features, modules, or components
- Architectural changes or refactoring
- Multi-file modifications
- API design or database schema changes
- Any task estimated at > 5K tokens

### Skip PEP (Trivial Tasks)

PEP is skipped for tasks that are:

- Single-line fixes (typos, syntax errors, import corrections)
- Direct questions that need answers, not code changes
- Explicitly marked as "quick fix" or "just do it" by the user
- Continuation of an already-approved plan (via `/resume`)
- Analysis-only tasks (no code changes)

### User Override

- User can explicitly skip PEP by saying "skip questions" or "just implement"
- User can request PEP for any task by saying "plan first" or "ask me questions"
- PEP applies based on task complexity, regardless of whether multi-agent mode (xN) is active

---

## Question Categories

When enriching a prompt, the Orchestrator asks questions from relevant categories. Not all categories apply to every task — select only what is needed.

> **Note**: PEP templates below are structural examples in English. When presenting to the user, follow the Language Policy from `AGENTS.md` (user-facing content in the project's designated language).

### 1. Scope & Boundaries

Clarify what is included and excluded from the task.

| Question Type | Example |
|---------------|---------|
| Feature boundaries | "Should this login form include 'forgot password' functionality, or just basic email/password?" |
| Integration scope | "Should this connect to an existing API, or do we also need to create the backend endpoints?" |
| Platform scope | "Is this for web only, or should it also support mobile responsive?" |

### 2. Behavioral Requirements

Clarify how the feature should behave in specific scenarios.

| Question Type | Example |
|---------------|---------|
| Default values | "What should the default sort order be — newest first or alphabetical?" |
| Limits & thresholds | "Should the file upload have a size limit? If so, what maximum?" |
| Error scenarios | "When the API call fails, should we show an error message, retry automatically, or both?" |
| Edge cases | "What happens when the user submits an empty form? Disable the button or show validation errors?" |

### 3. Technical Decisions

Clarify implementation choices when multiple valid approaches exist.

| Question Type | Example |
|---------------|---------|
| Architecture pattern | "Should we use a service layer pattern or direct repository access for this module?" |
| State management | "Should this component use local state, context, or a global store?" |
| Data model | "Should 'categories' be a separate entity with a relation, or an enum field on the item?" |
| Authentication | "Should this endpoint be public, require basic auth, or full JWT validation?" |

### 4. UI/UX Preferences

Clarify visual and interaction design choices (for frontend tasks).

| Question Type | Example |
|---------------|---------|
| Layout | "Should the settings page use tabs, accordion, or a single scrollable form?" |
| Component library | "Should we use Ant Design components or custom-styled elements?" |
| Feedback patterns | "After saving, should we show a toast notification, inline success message, or redirect?" |

### 5. Testing & Quality

Clarify testing expectations.

| Question Type | Example |
|---------------|---------|
| Coverage scope | "Should we write unit tests, integration tests, or both for this module?" |
| Test scenarios | "Any specific edge cases you want tested beyond the happy path?" |
| Performance | "Are there specific performance targets (e.g., page load < 2s, API response < 200ms)?" |

### 6. Project Context Alignment

Clarify alignment with existing project patterns. Use PCD discoveries from Step 0 as input for these questions.

| Question Type | Example |
|---------------|---------|
| Pattern consistency | "The existing codebase uses Repository pattern. Should the new module follow the same pattern?" |
| Naming alignment | "The project uses 'User' entity. Should we name the new related entity 'UserProfile' or 'Profile'?" |
| Dependency check | "The project uses Axios for HTTP. Should we continue with Axios or switch to Fetch for this module?" |

### 7. Security & Compliance

Clarify security requirements that affect architecture (for tasks involving auth, data, or external APIs).

| Question Type | Example |
|---------------|---------|
| Auth strategy | "Should this endpoint require JWT validation, API key, or be public?" |
| Data privacy | "Does this feature handle PII? Should we add data masking or encryption?" |
| Input validation | "What input sanitization strategy — allow-list, deny-list, or framework defaults?" |

---

## Enrichment Process

### Step 1 — Prompt Analysis

The Orchestrator reads the user's prompt and identifies:

- **Clear requirements**: What is explicitly stated and unambiguous
- **Implicit assumptions**: What the prompt implies but doesn't state
- **Knowledge gaps**: What information is missing to start implementation
- **Decision points**: Where multiple valid approaches exist
- **PCD context**: Incorporate PCD discoveries from Step 0 — use project patterns, conventions, and architecture to inform question formulation

### Step 2 — Question Formulation

Based on the analysis, formulate **3-7 targeted questions** (not more):

- **Prioritize**: Ask the most impactful questions first — those that affect architecture or scope
- **Be specific**: "Should X use Y or Z?" is better than "How should X work?"
- **Offer choices**: When possible, present options with a recommended default
- **Group logically**: Organize questions by category for clarity
- **Avoid obvious**: Don't ask questions the prompt already answers

### Step 3 — User Interaction

Present questions to the user in a structured format:

```markdown
## 📋 Prompt Enrichment — Clarification Questions

Before starting implementation, I'd like to clarify a few points:

### Scope
1. [Question with options]

### Behavior  
2. [Question with options]
3. [Question with options]

### Technical
4. [Question with recommended option]

> 💡 You can answer all at once, or say "skip questions" to proceed with defaults.
```

### Step 4 — Plan Generation

After receiving answers, generate a detailed implementation plan:

```markdown
## 📐 Implementation Plan

### Overview
[2-3 sentence summary of what will be built]

### Requirements (Confirmed)
- [Requirement 1 — from original prompt]
- [Requirement 2 — from user answers]
- [Requirement 3 — from user answers]

### Technical Approach
- **Architecture**: [Pattern/approach chosen]
- **Key Decisions**: [Based on user answers]

### Task Breakdown
| # | Task | Tier | Est. Tokens | Files |
|---|------|------|-------------|-------|
| 1 | [Task] | T1.5 | ~8K | file1, file2 |
| 2 | [Task] | T2 | ~5K | file3 |

> Agent assignments in the task breakdown are preliminary. Final agent selection occurs at Step 2 (xN Distribution) and Step 3 (Task Division).

### Assumptions
- [Any remaining assumptions not covered by questions]

> ✅ Approve this plan to start implementation, or suggest changes.
```

### Step 5 — Approval Gate

- **User approves**: Proceed to implementation (Task Division step in Orchestrator protocol)
- **User requests changes**: Update the plan and re-present
- **User says "just do it"**: Skip further discussion, proceed with current plan
- **Maximum 2 revision rounds** on the plan — after that, proceed with the latest version

> PEP's max 2 revision rounds are independent of the review chain's max 2 revision rounds.

---

## Default Behavior & Edge Cases

### When PEP is Skipped

When the user skips PEP (via "skip questions", "just do it", or trivial task classification), the Orchestrator proceeds with the most conservative interpretation:
- Smallest scope consistent with the prompt
- Simplest architecture pattern consistent with existing codebase patterns (per PCD)
- No optional features unless explicitly mentioned

### Unanswered Questions

If the user provides a new prompt without answering PEP questions, the Orchestrator treats the previous task as abandoned and runs PEP on the new prompt.

### Partial Answers

If the user answers some questions but not others, the Orchestrator:
1. Generates the implementation plan using provided answers
2. Explicitly marks unanswered items as assumptions in the plan
3. The approval step serves as the user's opportunity to correct wrong assumptions

### Trivial-to-Complex Escalation

If an agent discovers during implementation that a skipped-PEP task is significantly more complex than initially assessed (requires multi-file changes, architectural decisions), the agent reports an escalation. The Orchestrator MAY retroactively invoke PEP before continuing.

---

## Orchestrator Integration

PEP is executed as **Step 1.5** in the Orchestrator's Operating Protocol, between Prompt Analysis (Step 1) and xN Distribution (Step 2). The approved PEP plan is authoritative input for Step 3 (Task Division) — the Orchestrator uses the plan's task breakdown as the basis for assignments. Any deviations from the approved plan must be noted in the task summary.

```
Step 0: Session & Plan Check + PCD
Step 1: Prompt Analysis (detect xN, assess complexity)
Step 1.5: Prompt Enrichment Protocol ← NEW
  → If trivial task: skip, go to Step 2
  → If non-trivial: ask questions → get answers → generate plan → get approval
Step 2: xN Distribution
Step 3: Task Division and Assignment
...
```

---

## Agent Responsibilities

### Orchestrator

- **Owns PEP execution**: Only the Orchestrator runs the enrichment process
- **Asks questions**: Formulates and presents questions to the user
- **Generates plan**: Produces the implementation plan based on answers
- **Gates implementation**: Does not dispatch agents until plan is approved

### Principal (T1)

- **Reviews plan quality**: If the Orchestrator generates a plan, the Principal validates architectural decisions before execution
- **Escalation target**: If PEP reveals architectural complexity, the Principal provides guidance

### Lead Analyst (T2.5)

- **Reviews analysis scope**: Validates the analysis portions and Analyst assignments within PEP plans for coverage adequacy

### All Other Agents

- **Follow the plan**: All agents receive the enriched, approved plan as their task context
- **Reference decisions**: When implementing, cite specific plan decisions (e.g., "Per Plan Item 3...")
- **Report deviations**: If implementation requires deviating from the plan, report immediately

---

## Quality Criteria for Questions

Good PEP questions meet these criteria:

| Criterion | ✅ Good | ❌ Bad |
|-----------|---------|--------|
| Specific | "Should login support OAuth or just email/password?" | "How should login work?" |
| Actionable | "Should we cache API responses? (Recommended: yes, 5-min TTL)" | "What about caching?" |
| Non-obvious | "Should deleted items be soft-deleted or permanently removed?" | "Should we handle errors?" |
| Bounded | "Pick a state management approach: Context API, Zustand, or Redux" | "What state management should we use?" |
| Relevant | Asked only when it affects implementation | Asked about features not in scope |

---

## Token Impact

PEP adds a small token overhead but significantly reduces rework tokens:

| Aspect | Without PEP | With PEP |
|--------|-------------|----------|
| Initial prompt clarity | Low-Medium | High |
| Implementation rework | 20-40% waste | < 5% waste |
| Review revision rounds | ~2 rounds avg | ~1 round avg |
| Total token efficiency | Baseline | ~30% improvement (estimated — subject to calibration via `.github/metrics/token-usage.md`) |

Estimated PEP overhead: **1K–5K tokens** per session (question formulation + plan generation + potential revision rounds). PEP tokens are consumed by the Orchestrator and are not counted against individual subtask budgets (15K max).

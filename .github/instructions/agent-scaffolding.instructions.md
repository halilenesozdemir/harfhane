---
applyTo: "**"
---

# Agent Scaffolding Rules

Portable, declarative guide for any coding agent (T1, T1.5, T2) to create a new agent. Supersedes the former `scripts/create-agent.sh` bash script with security-friendly instructions that work in any environment.

## 1. Naming Convention

Agent names **must** be kebab-case, matching the pattern `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`.

**PascalCase conversion**: split on hyphens, capitalize each segment's first letter, concatenate.
`security-auditor` → `SecurityAuditor`, `data-pipeline` → `DataPipeline`

**File paths**:

- Agent file: `.github/agents/{agent-name}.agent.md`
- Instructions file: `.github/instructions/{tier-prefix}-{agent-name}.instructions.md`

**Tier prefix mapping**:

| Tier | Prefix |
|------|--------|
| t1 | tier1 |
| t1.5 | tier1-5 |
| t2 | tier2 |
| t2.5 | tier2-5 |
| t3 | tier3 |

## 2. Tier Configuration Matrix

| Property | T1 (Principal) | T1.5 (Staff Eng) | T2 (MidCoder) | T2.5 (Lead Analyst) | T3 (Analyst) |
|----------|----------------|-------------------|---------------|---------------------|--------------|
| Description | Tier 1 Principal Agent | Tier 1.5 Staff Engineer Agent | Tier 2 MidCoder Agent | Tier 2.5 Lead Analyst Agent | Tier 3 Analyst Agent |
| Model | Claude Opus 4.6 (copilot) | Claude Sonnet 4.6 (copilot) | GPT-5.3-Codex (copilot) | Gemini 3.1 Pro (Preview) (copilot) | Gemini 3 Flash (copilot) |
| Fallback | Claude Opus 4.5 (copilot) | Claude Sonnet 4.5 (copilot) | GPT-5.2-Codex (copilot) | Gemini 3.0 Pro (Preview) (copilot) | Claude Haiku 4.5 (copilot) |
| Tools | edit, search, read, fetch, agent | edit, search, read, fetch | edit, search, read | read, search, fetch | read, search, fetch |
| Edit Permission | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Read-only | ❌ Read-only |
| Can Review | ✅ Staff Eng outputs | ✅ MidCoder outputs | Self-review only | ✅ Analyst outputs | ❌ No |

## 3. Agent File Template

Create `.github/agents/{agent-name}.agent.md` with this exact structure. Replace all `{placeholder}` values using the Tier Configuration Matrix.

```markdown
---
name: {PascalCaseName}
description: >
  {TierDescription} — {agent-specific description}
user-invokable: false
tools:
  - {tool1}
  - {tool2}
model: "{Model}"
modelFallback: "{Fallback}"
agents: []
---

# {PascalCaseName} — {TierDescription}

## Role Definition

{Define specific role and responsibilities}

## Skills

{Tier-appropriate skill references from Section 4}

## Tool Access

{Tool descriptions from the tool description table below}

## File Ownership

{Tier-appropriate ownership rule from Section 7}
```

**Tool description values** (use verbatim in the Tool Access section):

| Tool | Write Tiers (T1, T1.5, T2) | Read-only Tiers (T2.5, T3) |
|------|----------------------------|----------------------------|
| edit | File creation and editing | N/A |
| search | Codebase search and navigation | Codebase search and navigation (read-only) |
| read | File reading | File reading (read-only) |
| fetch | External resource access | External resource access |
| agent | Running sub-agents (delegation) — T1 only | N/A |

## 4. Skills by Tier

| Tier | Skills |
|------|--------|
| T1 | clean-code, code-architecture, code-review, implementation, frontend-development, backend-development, commit-standards, pr-standards, testing-standards |
| T1.5 | clean-code, implementation, code-review, frontend-development, backend-development, commit-standards, pr-standards, testing-standards |
| T2 | clean-code, implementation, code-review, frontend-development, backend-development, commit-standards, pr-standards, testing-standards |
| T2.5 | clean-code, analysis, code-review |
| T3 | analysis |

Reference each skill as: `.github/skills/{skill-name}/SKILL.md`

## 5. Instructions File Template

Create `.github/instructions/{tier-prefix}-{agent-name}.instructions.md` with this exact structure:

```markdown
---
applyTo: "**"
---

# {TierDescription} — {PascalCaseName} Instructions

## Role Definition

{Define the detailed role and behavioral instructions for this agent.}

## Expectations

{Define expectations for this agent's tier.}

## Skills (Capability Map)

{List skills from Section 4 as markdown references:}
- `.github/skills/{skill-name}/SKILL.md` — {brief purpose}

## Tool Access

{Tool descriptions matching the agent file — see Section 3 tool table.}

## Output Expectations

{Define expected output format for this agent.}

> **Shared rules**: See `shared-base.instructions.md` for universal working principles, output format, and file ownership rules that apply to all tiers.
```

## 6. Post-Creation Checklist

After creating both files, the creating agent **must** complete every applicable step:

1. Add the new agent to `orchestrator.agent.md` → `agents` list (customAgents section).
2. Add the new agent to `AGENTS.md` → the relevant tier table.
3. Update `delegation-rules.instructions.md` → distribution tables if the tier distribution changes.
4. For T1 agents: populate `agents: [...]` in the YAML frontmatter with sub-agent references.
5. Run system validation rules — verify file counts (Check 2) and model consistency (Check 7).
6. Update `USAGE.md` and `README.md` if the total agent count or available capabilities change.

## 7. File Ownership Rules by Tier

| Tiers | Rule |
|-------|------|
| T1, T1.5, T2 | Only edit files assigned to you by the Orchestrator. Report conflicts rather than editing unowned files. |
| T2.5, T3 | Read-only access. You can NEVER edit files. Present findings in report format for upper tiers to implement. |

## 8. Validation Guards

Before writing any file, the creating agent must verify:

- The agent name matches `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`.
- Neither the agent file nor the instructions file already exists.
- The tier value is one of: `t1`, `t1.5`, `t2`, `t2.5`, `t3`.
- The `.github/agents/` and `.github/instructions/` directories exist.

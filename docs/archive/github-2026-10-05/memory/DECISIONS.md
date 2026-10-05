# Architectural Decisions — Harfhane

> Log of key architectural and technical decisions. Add new entries at the top.

---

## 2026-03-23 — Claude Code Infrastructure Migration

**Decision**: Migrate all AI infrastructure from `.github/` to `.claude/` directory.

**Context**: Skills, agents, and hooks were in `.github/skills/`, `.github/agents/`, `.github/hooks/` — GitHub Copilot format. Claude Code reads from `.claude/` only.

**Alternatives considered**:
- Keep dual-location (both `.github/` and `.claude/`) — rejected, creates drift risk
- Use only CLAUDE.md without skills/agents — rejected, loses auto-activation and subagent delegation

**Outcome**: Full migration to `.claude/` with proper Claude Code frontmatter. `.github/` retains only memory, metrics, and todo tracking.

**Files affected**: All `.claude/skills/*/SKILL.md`, `.claude/agents/*.md`, `.claude/settings.json`, `.claude/commands/*.md`

---

## 2026-03-23 — 4-Layer Intelligence Architecture

**Decision**: Adopt 4-layer Claude Code intelligence model.

**Layers**:
- L1: CLAUDE.md hierarchy (global → root → app-specific)
- L2: `.claude/skills/` — auto-triggered context injection
- L3: `.claude/settings.json` — hooks (PreToolUse safety, PostToolUse prettier + typecheck)
- L4: `.claude/agents/` — subagent delegation for complex tasks

**Context**: Project serves as a "lab" — all best practices implemented here become the starter template for future projects.

---

## 2026-03-23 — Multi-Agent Tier System (xN)

**Decision**: Implement 6-tier multi-agent system with xN suffixes.

**Tiers**: Orchestrator (Opus) → Principal T1 (Opus) → Staff Engineer T1.5 (Sonnet) → MidCoder T2 (Sonnet) → Lead Analyst T2.5 (Sonnet) → Analyst T3 (Haiku)

**Distribution**: x3=3 agents, x5=5, x7=7, x10=10

**Circuit breaker**: Stop after 2 repeated failures, escalate after 3 re-plan cycles, split if 10+ files change.

---

## 2026-01-01 — Cloudflare D1 for Database

**Decision**: Use Cloudflare D1 (SQLite) instead of PostgreSQL/PlanetScale.

**Context**: App runs entirely on Cloudflare Workers edge. D1 is the native Workers DB — no connection pooling complexity, no cold start latency for external DB connections.

**Constraint discovered**: D1 `exec()` does NOT support multi-statement SQL. All queries must use `prepare().run()` per statement.

---

## 2026-01-01 — Turkish Uppercase Normalization

**Decision**: Never use native `.toUpperCase()` for Turkish text. Always use `normalizeWord()`.

**Context**: `"i".toUpperCase()` → `"I"` in JS (English default). Correct Turkish: `"i"` → `"İ"`, `"ı"` → `"I"`. This caused word matching bugs.

**Implementation**: `apps/backend/src/utils/normalize.ts` (backend), `apps/frontend/src/utils/gameLogic.ts` normalizeChar (frontend).

---

## 2026-01-01 — pnpm Workspaces Monorepo

**Decision**: Single monorepo with pnpm workspaces over separate repos.

**Packages**: `@harfhane/frontend`, `@harfhane/backend`, `@harfhane/shared`

**Reason**: Shared TypeScript types between frontend and backend without publishing to npm. Single `pnpm typecheck` catches cross-package type errors.

# Matt Pocock research — ideas for the Harfhane factory

## Question
What does Matt Pocock (github.com/mattpocock; Total TypeScript, AI Hero) publish — repos,
articles, skills — that could improve a constrained LLM-agent "software factory" (Sonnet
implementers in worktrees, Opus reviewer with fresh context, main loop merges after CI), where the
owner wants robustness provable without reading the code (tests, acceptance tests, mutation
testing, metrics)? Read first (read-only): `AGENTS.md`, `CLAUDE.md`, `.claude/agents/*.md`,
`.claude/commands/unit.md`, `docs/plans/2026-10-06-009-test-e2e-quality-gates-plan.md`,
`docs/research/2026-10-06-engineering-standards.md`.

Harfhane's existing plan (009) already adopted much of the general-industry trust-stack: Stryker
mutation testing (scoped to `packages/shared`), fast-check property tests, axe a11y, knip,
dependency-cruiser, a traceability script from acceptance examples to test names. This note focuses
on what is specifically Matt Pocock's and not already covered by that plan.

## Repos

| Repo | What it does | License | Maintenance | Adoption | Confidence |
| --- | --- | --- | --- | --- | --- |
| `mattpocock/evalite` (github.com/mattpocock/evalite, evalite.dev) | TypeScript-native, local-first LLM eval runner built on Vitest: terminal UI, watch mode, tracing, custom scorers, threshold-based CI failure, `traceAISDKModel` for Vercel AI SDK integration. v1 (beta) ships ~10 built-in scorers; works with `autoevals` (Levenshtein, Factuality, etc.) | Open source (MIT per general repo convention; not independently re-verified this session) | Active — v1 preview shipped 2026, ~1.5k GitHub stars / 87 forks at last check | Moderate — niche but growing in the TS/AI-SDK niche | Medium (star/fork counts from secondary summarizers, not GitHub API directly) |
| `mattpocock/skills` ("Skills For Real Engineers") | MIT-licensed catalog of agent skills as `SKILL.md` files for Claude Code/Codex/other agents: `grill-me`/`grill-with-docs` (requirement alignment), `tdd` (red-green-refactor loop), `to-spec`/`to-tickets` (spec→trackable units with declared dependencies), `diagnosing-bugs`, `code-review`, `improve-codebase-architecture`, `handoff`, `teach`, `writing-for-agents`. Install via `npx skills@latest add mattpocock/skills` or as a Claude Code plugin | MIT | Very active — went from 0 to #1 trending on GitHub within 24h in 2026, reported star counts range from ~22k (day 1) to ~58.5k (independent blog) to one WebFetch summary claiming 277k/23.2k forks — **the 277k figure is almost certainly wrong/hallucinated by the fetch summarizer and should not be relied on** | High and fast-growing in the Claude Code agent community | Low-Medium on exact numbers; Medium on existence/structure/license |
| `mattpocock/ts-reset` | "CSS reset for TypeScript" — improves built-in lib types for common JS APIs (e.g. `.json()`, `Array.includes`, `Object.entries`) without touching `tsconfig` strictness flags | MIT | Active, last push reported Apr 2026 | High — 8.5k stars / 138 forks | Medium |
| `@total-typescript/tsconfig` (npm package backing totaltypescript.com/tsconfig-cheat-sheet) | Opinionated strict `tsconfig.json` presets (bundles, strictness, not-strict variants) including `noUncheckedIndexedAccess` | MIT (typical for his packages; not independently re-verified) | Active, referenced across his current site | High — widely cited as "the" TS strictness reference | Medium |
| `mattpocock/sandcastle` (referenced via AI Hero talks, e.g. ai.engineer "AI coding workflow") | TypeScript library/demo for coordinating multiple coding agents across isolated Git worktrees: separate implementer (Sonnet) / reviewer (Opus) roles, dependency-aware task graph for parallel execution | Not confirmed this session (unverified license/repo URL — only found via talk descriptions, not a direct repo fetch) | Unknown | Unknown — appears demo/workshop-stage, not a widely-adopted package | Low — could not directly verify the repo; treat as unverified |

## Practices (published articles/talks/newsletters — evidence vs. opinion separated)

- **TDD as the agent feedback loop** (AI Hero `/tdd` skill, talk material). *Claim, stated as fact
  by Pocock, not independently measured here*: red-green-refactor is "the most reliable feedback
  loop in software development" for decades, and applies unchanged to agents — write a failing
  test first, then minimum code to pass, then refactor without breaking it. This maps directly onto
  Harfhane's own `/unit` step 4 ("Önce birimin davranışını tanımlayan test, sonra kod") — Harfhane
  already does this; Pocock's `/tdd` skill is a more codified, reusable version of the same idea.
- **"The rate of feedback is your speed limit"** (attributed principle from his workshop material).
  *Opinion, stated as a maxim, not a measured study*: a feedback command given to an agent must (a)
  assert the exact symptom, (b) be deterministic, (c) run in seconds, (d) be runnable by the agent
  without a human. This is a sharper, more general version of what Harfhane's commit gate already
  tries to be (typecheck/lint/test on every staged commit) — his framing suggests auditing gate
  *speed* and *determinism* specifically, not just gate existence.
- **Requirement alignment before code ("grilling")**: `/grill-me` / `/grill-with-docs` skills are an
  adversarial-questioning step before an agent starts implementing, meant to surface
  under-specified requirements. *This is his own design pattern, not evidence from a study.*
  Conceptually close to Harfhane's `/unit` step 1 ("belirsizse sor") but more structured — a
  dedicated interrogation pass rather than an ad hoc "ask if unclear."
- **Spec-to-tickets with declared dependencies** (`to-spec`, `to-tickets`, `wayfinder` skills):
  breaking a plan into dependency-aware units so independent ones can run in parallel. *Design
  pattern, not evidence.* This is structurally identical to Harfhane's plan-unit + file-ownership
  table (U1–U8 in the 009 plan) — Harfhane already does the core of this; his skills formalize it as
  a reusable agent-callable step rather than a human-written plan section.
- **Parallel agents + role separation + worktree sandboxing** (Sandcastle demo, AI Hero talks):
  implementer (Sonnet) and reviewer (Opus) as distinct agents, coordinated across isolated Git
  worktrees. *This is essentially Harfhane's existing three-agent setup* (`analyst`/`implementer`
  sonnet, `reviewer` opus, worktrees under `../harfhane-wt/`) — strong convergent validation that
  the current architecture matches current best practice in this niche, not a new idea to adopt.
- **Type-level constraints / "make illegal states unrepresentable"**: widely cited TS community
  principle (also associated with Yaron Minsky/F# origin, popularized further by others like Chris
  Krycho) that Pocock teaches in Total TypeScript — discriminated unions to model valid states only,
  branded types to stop mixing up primitives (e.g., a `UserId` vs a raw `string`), validating once
  at a boundary so downstream code can trust the type without re-checking. *Pedagogical content, not
  a controlled study*, but it is a direct, concrete lever for an LLM-written codebase: it converts a
  class of runtime bug into a compile error the agent cannot ship.
- **Strict tsconfig as a non-negotiable default**: his TSConfig Cheat Sheet / `@total-typescript/tsconfig`
  package packages `strict: true` plus the flags it leaves out — `noUncheckedIndexedAccess`
  (undefined-safety on array/object index access) and, per TypeScript's own docs (not confirmed as
  something Pocock specifically wrote about this session), `exactOptionalPropertyTypes`
  (distinguishes "key absent" from "key present but undefined"). *The flags themselves are
  TypeScript-official; his contribution is bundling and evangelizing them as defaults everyone
  should turn on, not inventing them.*
- **ts-reset as a zero-cost type-safety layer**: improves stdlib types (e.g. `.json()` returning
  `unknown` instead of `any`, array `.includes()` accepting only the element type) without changing
  `tsconfig` strictness — this is additive, not a strictness-flag substitute.
- **LLM output needs a programmatic eval, not read-and-vibe-check** (Evalite's whole premise):
  his tool exists specifically to put a scored, CI-gatable, reproducible test around LLM-produced
  output (useful wherever an LLM's output must be judged before it reaches users) — this is the same
  principle already embodied in Harfhane's Invariant 1 (word must be `approved` + `family_safe`,
  DB-enforced) and in `docs/research/2026-10-06-engineering-standards.md`'s "deterministic check
  before LLM output reaches users" section, applied one level earlier: at the *labelling* step
  itself (`scripts/words`), not only at the publish gate.

## Proposals for Harfhane (impact × effort, mapped to files)

| # | Impact | Effort | Proposal | Files |
| - | - | - | - | - |
| 1 | High | Low | Adopt `@total-typescript/tsconfig` (or just the two flags) as the base config — add `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` to the shared/root tsconfig. Both directly target bugs an LLM agent is likely to introduce (unchecked array/object lookups; optional fields silently accepting `undefined`) | `tsconfig.base.json` (or equivalent root config), each app's `tsconfig.json` extending it; run `pnpm typecheck` and fix fallout before merging — budget real effort for fallout even though the flag flip itself is a one-line change |
| 2 | Medium-High | Low | Add `ts-reset` as a dev dependency for its stdlib type improvements (e.g. safer `JSON.parse`/`.json()`, `Array.includes`) — zero behavior change, pure type-safety gain, no tsconfig fallout risk unlike #1 | root `package.json` (devDependency) + one `import '@total-typescript/ts-reset'` side-effect import per app entrypoint |
| 3 | High | Medium | Add an **eval harness for the word-labelling LLM step** in `scripts/words` (Evalite or a smaller bespoke Vitest-based scorer, following Evalite's pattern even if not the package itself): score labelling runs against a held-out labelled set, fail CI if accuracy/safety-scorer drops below a baseline. This extends Invariant 1's "model proposes, code enforces" pattern one step earlier — from "is this word safe to publish" to "is this word safe to even propose," closing a gap neither plan 009 nor the engineering-standards research addresses (both cover publish-time gates, not labelling-time evals) | `scripts/words/*` (new eval script + baseline fixture), CI step gating on `scripts/words/**` changes (parallel to the existing Stryker `packages/shared/**` path-filter pattern) |
| 4 | Medium | Low | Introduce branded types for `WordLength` and any Turkey-date value crossing module boundaries (e.g. `type WordLength = Brand<number, "WordLength">`, `type TurkeyDate = Brand<string, "TurkeyDate">`), validated once at the boundary (DB read, API input) so `packages/shared` consumers can't accidentally pass a raw `number`/`string` where a validated one is required | `packages/shared/src/**` (new brand helper + type defs), call sites in `apps/backend` repositories/services that currently pass raw `number`/`string` for length or date |
| 5 | Medium | Low | Formalize a `/unit`-equivalent of Pocock's `grill-me`: before an `implementer` agent starts, require it to list ambiguities it found in the plan unit and either resolve them from the plan or stop and ask — `.claude/commands/unit.md` step 1 already says "belirsizse sor" but doesn't require the agent to *enumerate* what it checked. Making the check explicit (a short list in the PR body) turns "I checked" into something the reviewer or owner can audit without reading the code | `.claude/commands/unit.md` (step 1: require a short "ambiguities checked" list), PR body template in step 6 |
| 6 | Low-Medium | Low | Consider `mattpocock/skills`' `diagnosing-bugs` and `code-review` skill structure as a template for tightening the `reviewer` agent's prompt (currently a short paragraph in `.claude/agents/reviewer.md`) — his skills externalize a repeatable checklist/procedure rather than relying on a short prose instruction; Harfhane could do the same without adopting the whole skills package | `.claude/agents/reviewer.md` (expand into a more structured checklist, possibly as a referenced `.claude/skills/*.md` if the harness supports it) |
| 7 | Low | Low | Evaluate Evalite itself (not just the pattern) only if/when an LLM-authored feature grows beyond word labelling (e.g. hint generation, definitions) — not urgent today since `scripts/words` is the only LLM-authored-content path found in the context read for this task | n/a — decision only, revisit later |

Proposals 1 and 2 are cheapest and lowest-risk; start there. Proposal 3 is the highest-impact genuinely new idea from this research (not already in plan 009 or the engineering-standards doc) because it closes the one gap in the existing "deterministic check before LLM output reaches users" principle — the labelling step itself.

## Unverified

- `mattpocock/sandcastle` — could not directly confirm the repo URL, license, or current state; only
  found via talk/workshop descriptions (ai.engineer "AI coding workflow"). Treat the
  parallel-agent-coordination tool claim as a description of a talk demo, not a confirmed shipped
  package.
- Star/fork counts across all repos came from secondary aggregator sites (ossinsight.io, gittrend.io,
  star-history.com, independent blogs), not a direct GitHub API call — directionally trustworthy but
  not re-verified against `api.github.com` this session. The `mattpocock/skills` star count is
  especially inconsistent across sources (22k / 58.5k / an apparently-wrong 277k from one summarizer)
  — use GitHub directly before citing a specific number.
- Exact license text for `evalite` and `sandcastle` not independently opened and read (inferred as
  MIT from Pocock's other projects' convention, not confirmed per-repo).
- Did not find a specific Pocock tweet/post explicitly recommending `exactOptionalPropertyTypes`
  (only general TypeScript documentation); his tsconfig cheat sheet's exact current flag list was not
  fetched directly, only described via secondary summary — verify directly at
  totaltypescript.com/tsconfig-cheat-sheet before citing which flags it currently includes.
- "Make illegal states unrepresentable" is a term with broader origin (commonly traced to Yaron
  Minsky and popularized further by others such as Chris Krycho) — Pocock teaches and popularizes it
  in Total TypeScript but is not its originator; this session did not confirm his exact wording or a
  specific canonical article by him stating it.

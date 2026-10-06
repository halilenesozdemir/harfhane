# Engineering standards research — Harfhane factory

## Question

For a pnpm monorepo (Hono/Workers/D1 backend, React 19/Vite PWA frontend, Expo Android mobile,
`packages/shared` game logic, Python word pipeline) where almost all code is LLM-written
(Sonnet implementer, Opus reviewer, main loop merges after CI + review): which reference repos,
library choices, and trust-raising practices should the factory adopt, and what are the concrete,
file-mapped proposals?

## Reference repos

| Repo | License | Confidence | What's good | What to copy |
| --- | --- | --- | --- | --- |
| `cwackerfuss/react-wordle` (original Reactle) | MIT at time of writing, but **DMCA-removed by NYT** along with 1,900+ forks (gfinityesports.com) | Medium | Clean component split (Grid/CurrentRow/Cell), documented approach for swapping word lists per language | Study the component boundary (board state vs. keyboard vs. toast), **do not fork or copy source/assets** — the takedown is direct evidence for Invariant 6 (no "Wordle" branding) and argues for treating even clone *code* as high legal risk, not just the name. Reimplement ideas from scratch. |
| Wordle Türkçe (Fatih Kadir Akın, `f.github.io/wordle-tr`) | Unknown/unverified — could not confirm a public repo or license in this session | Low | Precedent that a ~4,000-word 5-letter Turkish list is viable; practical notes on Turkish keyboard handling | Nothing to reuse directly (license unconfirmed, word source unclear — also check against Invariant 3, no TDK data); useful only as evidence that Turkish word supply at this size has shipped before |
| `G4brym/authentication-using-d1-example` | Unverified in this session (check on GitHub before reuse) | Low-Medium | Hono + D1 auth patterns, uses `workers-qb` query builder and Chanfana for OpenAPI | If auth/session work comes up, read for the Hono+D1 binding pattern; verify license before lifting code |
| Cloudflare's own "Workers Best Practices" guide (developers.cloudflare.com changelog 2026-02-15) | Cloudflare docs, not a repo | High | Canonical guidance: pin compatibility_date, use bindings not fetch for same-account services, avoid module-level mutable state (isolate reuse bug class) | Worth a one-time read-through against `apps/backend/wrangler.toml` and `src/` for the mutable-state pitfall specifically — this is a real Workers footgun LLM agents are likely to introduce (e.g. caching in a module-level `let`) |

**Gap / unverified:** I did not find a widely-recognized, actively maintained, well-tested
**Expo/React Native** Wordle-style game repo worth studying for architecture (the matches were
small/unmaintained student or clone projects). Likewise no authoritative "exemplary Hono + D1"
flagship project emerged beyond the official best-practices doc and a few small examples. Treat
this whole section as thin; if reference-repo mining matters enough, a dedicated `analyst`
research pass against GitHub's search API (stars, recent commits, test coverage) would do better
than web search.

## Libraries

| Library | Current status (2026) | Recommendation | Why |
| --- | --- | --- | --- |
| Maestro (Expo Android e2e) | Native EAS Workflows integration since ~April 2026; ~30 min setup vs 4-8h for Detox; YAML tests, works with Hermes/New Architecture without config (codersera.com, reactnativerelay.com) | **Add**, prefer over Detox | Lower setup/maintenance cost fits a factory with no dedicated QA; EAS Workflows fit matters since mobile is Expo-managed |
| Detox | Faster execution and tighter native-code sync on mature projects, but steep initial setup | **Skip for now** | Not worth the setup cost until e2e matters more than it does today (mobile CI has no e2e job per `ci.yml`) |
| Playwright + `@axe-core/playwright` | Actively maintained; runs real browser DOM scan, WCAG 2.2 machine-detectable rules (qaskills.sh, thoughtworks radar) | **Add** to `apps/frontend/e2e` | Frontend already has Playwright in CI (`ci.yml` e2e job); axe adds automated a11y checks (missing labels, contrast, ARIA, headings) essentially for free — directly serves the "accessibility" ask in Harfhane's design-token invariant (#5) |
| Stryker (mutation testing, TS + Vitest) | v10.0.0 shipped Aug 2026 (Node 22, experimental TS7); vitest-runner plugin active, last repo push May 2026, package published ~15 days before this research (dev.snyk.io, nevercodealone.de) | **Add, scoped** | Actively maintained and vitest-native; see Trust practices below for scope (don't run it on everything) |
| fast-check (property-based testing) | ~10M+ weekly downloads, actively released (v4.8.0 2026-05), integrates with Vitest (npmtrends, bestofjs) | **Add** for `packages/shared` | Game logic (`normalizeWord`, guess evaluation, scoring) is exactly the kind of pure, invariant-rich code property testing is built for; Turkish normalization edge cases (i/İ/ı/I) are a natural property-test target |
| zod schema sharing vs Hono RPC client | Hono RPC (`hc`) gives type-safe client/server without codegen by exporting the server's route type; backend already uses `@hono/zod-validator` + zod (package.json) | **Add Hono RPC client to frontend**, keep zod at the route boundary | Removes a whole class of "frontend assumed a response shape the backend changed" bugs without introducing tRPC/ts-rest as a new dependency; zod already does runtime validation server-side, RPC adds compile-time safety client-side for free |
| dependency-cruiser vs eslint-plugin-boundaries | dependency-cruiser: CI-time, visualizable, catches orphans/circular deps; eslint-plugin-boundaries: editor-time red squiggles, faster feedback loop; commonly used together (xebia.com) | **Add dependency-cruiser in CI**, skip eslint-plugin-boundaries for now | One tool is enough for a project this size; CI-time enforcement of the `routes → services → repositories` layering rule (already stated in `apps/backend/CLAUDE.md`) is higher leverage than editor-time since the actual authors are LLM agents, not humans watching squiggles |
| knip | Standard 2026 recommendation for dead-code/dead-dependency detection in TS monorepos, used by TanStack/Vercel-scale repos (knip.dev via search) | **Add** | LLM agents leave orphaned exports/files behind more than humans do (nobody "just knows" what's unused); cheap CI check |
| Renovate vs Dependabot | Renovate: 90+ ecosystems, built-in automerge + grouping, regex managers for CI/Dockerfiles; Dependabot: GitHub-native, simpler, needs extra workflow for automerge (tianpan.co, vulert.com) | **Keep Dependabot for now, reconsider Renovate only if grouping noise becomes a problem** | Harfhane is GitHub-only and small; Dependabot's simplicity avoids adding a Renovate config surface the LLM agents would also need to maintain. Revisit if dependency PR volume becomes a tax on the 3-open-PR limit (AGENTS.md) |
| Changesets | Designed for npm publishing; usable for private packages via config but adds overhead with no publishing need (vercel.com/academy, infinum.com) | **Skip** | None of Harfhane's packages (`shared`, `ui-tokens`) publish to a registry; versioning is already handled by git history + Conventional Commits. Changesets would be ceremony without a consumer |

## Trust practices for LLM-generated code

- **Mutation testing over coverage thresholds** (evidence, arxiv.org/abs/2506.02954 and related
  2026 work): test suites with 100% line coverage have been measured at as low as 4% mutation
  score — i.e., coverage proves code ran, not that assertions would catch a wrong change. This is
  the single strongest evidence-backed argument for adding Stryker, but it should gate **core
  logic only** (`packages/shared`, scoring/XP calculations) — running mutation testing over the
  whole monorepo (React components, Workers routes) is slow and mutation operators for UI code are
  low-value. *Opinion, mine:* a mutation-score gate on `packages/shared` is worth more than raising
  the (unspecified) existing coverage threshold anywhere else.
- **Property-based tests for core logic** (fast-check): directly targets the failure mode this
  factory already hit once — Turkish casing bugs (`AGENTS.md` "Rules agents here have broken
  before"). A property test asserting `normalizeWord(x) === normalizeWord(normalizeWord(x))`
  (idempotence) and `normalizeChar` round-trips for the full Turkish alphabet would have caught the
  known class of bug by construction, not by someone remembering to test İ/I by hand.
- **Requirement-to-test traceability**: no direct evidence found this session (unverified), but the
  repo's own convention — `should <behavior> when <condition>` test names (CLAUDE.md) plus plan
  units with acceptance criteria (`/unit` flow references "birimin requirement ve KTD'leri") —
  already gives traceability by name/structure. The gap is that nothing in CI *checks* that a test
  name references the unit's KTD id; this is opinion, not evidence, but cheap to add (a grep-based
  CI step, see Proposals).
- **Contract tests**: the Hono RPC proposal above functions as a lightweight contract test by
  construction (TS compile fails on drift) — cheaper than a separate contract-test suite for a repo
  this size.
- **Golden/snapshot tests**: appropriate for the word pipeline (`scripts/words`) output and for
  generated UI tokens (`packages/ui-tokens`, which already has a drift test per CLAUDE.md) — this
  is an existing good practice, not a gap.
- **Deterministic check before LLM output reaches users**: Invariant 1 (word must be
  `status='approved'` and `family_safe=1`, enforced by DB trigger) is already exactly this pattern
  applied to the one place an LLM's judgment (word suitability) reaches players. No further action
  needed there; it's a model worth repeating if any other LLM-authored content (e.g., hints,
  definitions) reaches players later.
- **Reviewer checklists / fresh-context review**: the `reviewer` agent (Opus, never saw the diff's
  authoring context) matches the pattern GitHub and Google engineering blogs describe as "second
  pair of eyes without anchoring bias" — *opinion/pattern-matching on general SWE practice, not a
  specific cited study found this session*.
- **Small-PR limits**: AGENTS.md already caps at 500 lines / 15 files / 10 commits and ≤3 parallel
  implementer PRs. This matches general industry guidance that review quality (human or LLM) drops
  sharply past ~400 lines (commonly cited, e.g. SmartBear's Cisco code-review study) — *evidence
  exists for this in general literature; I did not re-verify the specific study this session, so
  mark as recalled-not-re-checked*.
- **Flaky-test policy**: not found explicitly in `AGENTS.md`/`CLAUDE.md`/`ci.yml` — this is a real
  gap for a CI pipeline gating auto-deploy (see Proposals).
- **ADRs**: already required for Invariant changes (AGENTS.md) — good existing practice, no gap.

## Proposals (impact × effort)

| # | Impact | Effort | Proposal | File to change |
| - | - | - | - | - |
| 1 | High | Low | Add `@axe-core/playwright` a11y assertions to the existing e2e suite | `apps/frontend/e2e/*.spec.ts`, `apps/frontend/package.json` (devDependency) |
| 2 | High | Medium | Add property tests for `normalizeWord`/`normalizeChar` and guess-evaluation logic using fast-check | `packages/shared/package.json` (devDependency), `packages/shared/src/**/*.test.ts` |
| 3 | High | Medium | Add Stryker mutation-score gate scoped to `packages/shared` only, as a separate CI job (not blocking on every PR path, only when `packages/shared/**` changes) | new `packages/shared/stryker.config.mjs`, `.github/workflows/ci.yml` (new job with a `paths` filter), `AGENTS.md` ("Done means" — add mutation score to evidence expected for shared-logic PRs) |
| 4 | Medium | Low | Add `knip` as a CI check for dead files/exports/deps | root `package.json` (`"deadcode": "knip"` script + devDependency), `.github/workflows/ci.yml` `check` job |
| 5 | Medium | Medium | Add `dependency-cruiser` to enforce backend's documented `routes → services → repositories` layering and ban `packages/shared` → app imports | `apps/backend/.dependency-cruiser.cjs`, root `.dependency-cruiser.cjs` for cross-package rules, `.github/workflows/ci.yml` |
| 6 | Medium | Low | Add Hono RPC client (`hc`) to frontend for type-safe backend calls, replacing hand-typed fetch wrappers where present | `apps/frontend/src/api/*`, `apps/backend/src/index.ts` (export `AppType`) |
| 7 | Medium | Low | Explicit flaky-test policy: a test that fails intermittently gets quarantined (skip + backlog entry), never silently retried | `AGENTS.md` (new line under Invariants or a "Flaky tests" subsection), `docs/backlog.md` template note |
| 8 | Low-Medium | Low | Add a CI grep check that every new/changed test file's `describe`/`it` names reference the plan unit's acceptance-criteria id (KTD) when the PR touches `docs/plans/` | `.githooks/pre-commit` or a new `.github/workflows/ci.yml` step, `.claude/commands/unit.md` (require KTD id in test names) |
| 9 | Low | Low | Add Maestro to mobile for a minimal smoke e2e (launch app, play one round) once mobile ships beyond current scope; not urgent since `ci.yml` has no mobile e2e job today | `apps/mobile/.maestro/*.yaml`, `.github/workflows/ci.yml` (new `mobile-e2e` job), `apps/mobile/CLAUDE.md` |
| 10 | Low | Low | Keep Dependabot, skip Changesets, skip eslint-plugin-boundaries — no file change, just confirms current state is correct | none (status quo) |

Proposals 1, 4, and 7 are the cheapest and least speculative; start there. Proposal 3 (Stryker) has
the strongest evidence behind it but the highest setup/runtime cost — scope it tightly as written
or it will become a CI tax the implementer agents route around.

## Unverified

- No confirmed license or public repo for the Turkish Wordle clone (`f.github.io/wordle-tr`) —
  could not locate its source in this session; treat any claim about its code as unconfirmed.
- Did not find a strong, actively-maintained Expo/React Native reference game repo; the reference-
  repo section for mobile architecture is weak and would benefit from a targeted GitHub-search pass
  (stars/last-commit/test-presence filters) rather than general web search.
- `G4brym/authentication-using-d1-example` license and current maintenance activity not directly
  confirmed — read on GitHub before reusing any pattern from it.
- The "review quality drops past ~400 lines" claim is recalled from general industry discussion,
  not re-verified against a primary source this session.
- Requirement-to-test traceability enforcement: no case study found demonstrating measured impact;
  the proposal (#8) is reasoned from the gap, not from cited evidence.
- Did not independently verify current Stryker/vitest-runner compatibility against this repo's
  exact Vitest 3.x version — package.json shows `vitest": "^3.1.0"`/`^3.2.4"` across workspaces;
  confirm compatibility before adding the dependency.

# Harfhane — Invariants and Agents

## Invariants

Changing any of these needs an ADR in `docs/decisions/`.

1. **Model proposes, code enforces.** A word reaches players, or is scheduled as a daily word, only when `status = 'approved'` and `family_safe = 1`. The database enforces this with a CHECK and the `daily_words_require_active_word` trigger; never drop or bypass them to make data fit. *Why:* AI-generated Turkish content can be wrong or unsuitable for families.
2. **One schema source.** The schema lives only in `apps/backend/db/migrations/`. Tests apply those files through `readD1Migrations`; never hand-write tables in tests. *Why:* the old test schema drifted from production.
3. **No TDK data.** Do not scrape or import from `sozluk.gov.tr` and do not copy TDK definitions. Every word row records `source` and `license`. *Why:* TDK does not permit its word list to be extracted.
4. **Production needs the owner.** Never write to, migrate or delete a remote D1 database without explicit owner approval in the current session. Backups go to `~/Backups/harfhane/`, never into the repo. *Why:* writes are irreversible and backups contain personal data.
5. **Theme = token set.** Components use `--hh-*` tokens through Tailwind classes (`bg-correct`, `text-correct-fg`, `shadow-depth-*`) on web and `useTheme()` on mobile; no raw hex in components. *Why:* paid themes must work by swapping tokens only.
6. **No "Wordle" in product names or titles.** Use "Türkçe kelime oyunu". *Why:* trademark risk.
7. **Brand is Harfhane.** Links point to `harfhane.app`; the legacy name is never reintroduced.
8. **No ads at launch.** Ads may only be rewarded, opt-in, filtered and behind a remote flag. *Why:* family-friendly product promise (`docs/decisions/2026-10-04-monetization-no-ads-at-launch.md`).
9. **Deploy workflows list their own file** in `paths` and keep `workflow_dispatch`. *Why:* otherwise a CI-only fix never redeploys.
10. **Daily content never runs out.** At least 90 days of approved daily words per active length; a schedule-health check warns before the runway ends. *Why:* the 5-letter schedule silently ran out on 2026-08-26.

## Constraints first

The owner does not read code. A change is trusted only through tests that would fail on a broken version (mutation-checked), acceptance examples tagged in test names, and the environment checklist in `docs/guides/review-checklist.md`.

## Agents

Three agents in `.claude/agents/`; the main loop owns planning, integration and merging.

| Agent | Model | Job |
| ----- | ----- | --- |
| `analyst` | sonnet | Read-only research and codebase mapping; returns findings with `path:line` evidence. |
| `implementer` | sonnet | Ships one plan unit through `/unit` in its own worktree; stops at a draft PR. |
| `reviewer` | opus | Fresh context, never saw the implementation; asks "where does this break?" against the Invariants. |

Two open PRs never touch the same file; each plan names the files its parallel units own. At most three implementation PRs are open per area (backend, web, mobile, scripts); docs-only PRs and PRs labelled `parked` (waiting on the owner or a cutover) do not count. A PR whose review is clean merges the same day; otherwise it is brought up to date with `main` before more work lands on it. Removals run one after another. Adding a dependency, changing settings files, remote D1 writes and store or account steps need the owner.

GitHub Actions minutes are a monthly budget (October 2026 used it up in ten days). CI skips draft PRs, so review fixes go into a draft; `gh pr ready` runs once the reviewer's findings are fixed, right before merging. Batch fixes into one push instead of pushing each commit.

## Testing

Flaky-test policy: a test that fails intermittently is quarantined with a `docs/backlog.md` entry
and fixed or deleted within a week; tests are never silently retried to green.

## Owner autonomy

The owner has approved merging without asking once CI is green and the `reviewer` found nothing real (or its findings are fixed). Merging to `main` deploys web and backend; that is accepted. Everything in Invariant 4 and the line above still needs the owner. Plans with `status: approved` do not need another round of questions; unclear requirements do. An owner decision is written into the affected plan or `docs/roadmap.md` in the same session; memory only points to it.

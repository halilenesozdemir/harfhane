# Review checklist: what tests cannot see

Tests run against the newest schema, stubbed APIs and fresh state. Production does not. Every
review (and every implementer before opening a PR) walks this list and says in the PR body which
items apply.

## Deploy and order
- Merging to `main` deploys the backend and web. Does this change work against what is live right
  now: the database `DB` actually points at (`apps/backend/wrangler.toml`), its applied migrations,
  and the Worker vars? If not, the PR is labelled `parked` and says what must land first.
- Does it need a migration? Is the migration applied remotely before the code that uses it deploys
  (Invariant 4: the owner applies remote migrations)?
- Stacked PRs: is the merge order written in the PR body?

## Data
- Real data differs from fixtures: empty tables, legacy rows (`source = 'user'`), missing columns,
  Turkish characters, duplicates, very long lists. Which of these could reach this code?
- Can the change schedule, show or leak something it should not (future answers, unapproved or
  unlimited-pool words as daily answers, Invariant 1)?

## Clients
- Old web tabs and installed Android builds keep running old code. Do they still work against the
  new API? Removed fields, renamed routes and stricter validation break them.
- Saved local state (localStorage, AsyncStorage) from an older version: is it read safely?

## Failure paths
- What happens when the network, D1 or a cron step fails? Is the error visible (log, alert) or
  swallowed?
- Can it be rolled back by reverting the merge? If not (migrations, remote writes), the PR says how.

## Secrets and config
- No secret in code, logs or test fixtures; new vars are documented and set in `wrangler.toml` or as
  secrets.

## Local gates
- A PR that changes `packages/shared/src` without a mutation score in its body (Plan 009 KTD4, R10)
  is a finding. `apps/backend/src/{services,repositories}` is not wired yet — see `docs/backlog.md`
  ("Plan 009 U6: backend Stryker mutation testing not wired") — so a backend-only PR has nothing to
  paste here.

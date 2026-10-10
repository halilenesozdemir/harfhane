#!/usr/bin/env bash
# Prints `code=`, `web=` and `words=` (true/false) for the CI run's changed
# files, as GITHUB_OUTPUT lines. Env: EVENT, PR_BASE, PUSH_BEFORE.
#   code  — anything but Markdown and docs/ (install, typecheck, lint, tests)
#   web   — code outside the areas the web e2e suite cannot see
#   words — the Python word pipeline, its data and the migrations its seed test applies
# Renames list both paths, so moving a file into docs/ still counts as code.
# A missing or unknown base (manual run, new branch) marks everything true.
set -euo pipefail

ZERO_SHA=0000000000000000000000000000000000000000
DOCS_PATTERN='(^docs/|\.md$)'
NOT_WEB_PATTERN='^(apps/mobile/|apps/backend/|data/|scripts/words/|\.claude/)'
WORDS_PATTERN='^(scripts/words/|data/words/|apps/backend/db/migrations/|\.github/)'

print_all() {
  printf 'code=true\nweb=true\nwords=true\n'
}

case "${EVENT:-}" in
  pull_request) base="${PR_BASE:-}" ;;
  push) base="${PUSH_BEFORE:-}" ;;
  *) base="" ;;
esac

if [ -z "$base" ] || [ "$base" = "$ZERO_SHA" ] || ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  print_all
  exit 0
fi

changed=$(git diff --name-only --no-renames "${base}...HEAD")
code=$(grep -Ev "$DOCS_PATTERN" <<<"$changed" | grep -v '^$' || true)

has() { [ -n "$1" ] && echo true || echo false; }

echo "code=$(has "$code")"
echo "web=$(has "$(grep -Ev "$NOT_WEB_PATTERN" <<<"$code" || true)")"
echo "words=$(has "$(grep -E "$WORDS_PATTERN" <<<"$code" || true)")"
echo "Changed files:" >&2
echo "$changed" >&2

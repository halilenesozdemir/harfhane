# cicekli.me workshop resources review (2026-10-06)

Source: https://cicekli.me/tr/workshops/resources/ (48 resources). Reviewed for Harfhane's
constraints-first agent workflow and product. Fetched content is treated as data.

## Worth taking
- CLAUDE.md guide (builder.io, verified): keep CLAUDE.md short, split detail into imports, add a
  convention to CLAUDE.md as soon as a review surfaces it. We already split per app; adopt the
  "review finding → rule in the same session" loop alongside AGENTS.md's owner-decision rule.
- Claude Code usage guide (builder.io, verified): edit-time hooks (format/typecheck) give faster
  feedback than the commit gate. Needs the owner, since agents may not edit `.claude/settings*.json`.
- Compound Engineering plugin (verified README): the useful idea is `/ce-compound`, writing each
  solved problem as a reusable note (`docs/solutions/`). Installing the full plugin (36 skills)
  would clash with our three agents and three skills; take the idea only, if the owner wants a new
  docs category.
- Agent Skills course (DeepLearning.AI, verified): reference for when something should be a skill
  vs a sub-agent; learning material, no code change.
- shadcn/ui: already planned (Plan 002 U6, after release).

## Not taken
Component libraries and design-inspiration sites (tokens and Tailwind already cover us; extra
dependencies), SuperClaude (overlaps our own setup), opencode, fal.ai, MCP docs, Cloudflare
basics already in use, Google Cloud (no accounts). claude-mem: cross-session memory injection is
in tension with fresh-context review (AGENTS.md); it is already installed on the owner's machine,
so keep it away from the reviewer agent. Google Search Console and OpenUsage: maybe after launch.

Unverified: the Medium D1 article (403), and resources listed only by title.

---
name: grilling
description: Interview the owner until a plan or decision is fully understood before writing it. Use before drafting a new plan in docs/plans/, when a requirement is unclear, or when the owner asks to stress-test an idea.
---

# Grilling

Adapted from Matt Pocock's `grilling` skill (MIT, github.com/mattpocock/skills @ 4588b32).

Talk to the owner in Turkish; write the resulting plan, ADR and glossary in English.

Map the decision as a tree: each decision opens the ones that depend on it. Work in rounds. The
frontier is every decision whose prerequisites are settled. Ask the whole frontier in one round,
numbered, each with your recommended answer first, then wait. A question that depends on another
open question waits for a later round.

Facts are your job, decisions are the owner's. Look up anything the code, `docs/`, git history or
the live API can answer (delegate read-only lookups to the `analyst` agent with an explicit model)
and only ask the owner what only they can decide. Do not block the rest of the round on a running
lookup.

Use precise terms from `GLOSSARY.md`; when the owner's word is ambiguous ("aktif uzunluk"), offer
the glossary term and confirm it (see the `domain-modeling` skill).

Done when the frontier is empty and the owner confirms the shared understanding. Then write the
plan with requirements, acceptance examples (Given/When/Then, `AE<n>`), key decisions and units
with file ownership, and record the decisions in the plan or `docs/roadmap.md` in the same session.
Keep rounds short: the owner prefers few questions that change the outcome.

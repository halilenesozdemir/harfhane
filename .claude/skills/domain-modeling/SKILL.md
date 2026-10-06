---
name: domain-modeling
description: Keep Harfhane's domain language precise. Use when a plan, ADR, test name or discussion uses a term that is vague, overloaded, or conflicts with GLOSSARY.md, and when recording a hard-to-reverse decision.
---

# Domain modeling

Adapted from Matt Pocock's `domain-modeling` skill (MIT, github.com/mattpocock/skills @ 4588b32).

`GLOSSARY.md` at the repo root holds Harfhane's terms. It is a glossary only: no implementation
details, no specs.

- When a term conflicts with the glossary, say so at once and ask which is meant.
- When a term is vague, propose the precise glossary term. Example: "active length" was used for
  both scheduled and playable lengths; the glossary separates them.
- Test the term with a concrete scenario (a hidden length, a word in both pools, the 21:00 UTC
  Turkey-day boundary) and check the code agrees.
- When a term is settled, update `GLOSSARY.md` right away: **Term**: one or two sentences on what it
  is; `_Avoid_:` the rejected synonyms. Only Harfhane-specific terms.
- Offer an ADR in `docs/decisions/` only when the decision is hard to reverse, surprising without
  context, and a real trade-off. Changing an Invariant always needs one.

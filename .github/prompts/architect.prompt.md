---
name: architect
description: "Assign an architecture task directly to the Principal agent. Single agent mode."
agent: PrincipalAlpha
argument-hint: "Architecture task description"
---

# /architect — Direct Architecture Task

Assign an architecture task directly to PrincipalAlpha without needing the xN parameter.

## Usage

```
/architect Set up hexagonal architecture for the project
/architect Design the domain model for the auth module
/architect Refactor the API layer
```

## When to Use

> **⚠️ Orchestrator Bypass**: This prompt sends tasks directly to PrincipalAlpha, bypassing the Orchestrator. This is an intentional design choice for single-agent architecture work. The Orchestrator's delegation overhead is unnecessary when only one Principal-level task is needed. No xN parameter should be used with this prompt.

- When you only need architectural work without multi-agent involvement.
- When you want to quickly run a Principal-level task.
- When you want to skip the Orchestrator overhead.

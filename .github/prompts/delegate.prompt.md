---
name: delegate
description: "Multi-agent delegation command. Specify agent count by appending the xN parameter to the end of the prompt."
agent: Orchestrator
argument-hint: "Task description xN (e.g., Create user module x7)"
---

# /delegate — Multi-Agent Delegation

Delegate the user's request to the multi-agent team.

## Usage

```
/delegate [task description] x[agent count]
```

## Examples

```
/delegate Create auth module, add JWT authentication x7
/delegate Write API endpoints x5
/delegate Analyze project structure x3
/delegate Fix this bug  (no xN → single agent)
```

## Steps

1. Detect the `xN` parameter at the end of the prompt.
2. Determine the agents according to the distribution table.
3. Divide the task into sub-tasks.
4. Delegate each sub-task to the agent in the appropriate tier.
5. Collect results and run the review chain.
6. Present the final output to the user.

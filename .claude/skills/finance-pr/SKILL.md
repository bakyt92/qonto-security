---
name: finance-pr
description: Review an AI-proposed Qonto financial action BEFORE it reaches Qonto approval.
---

# Finance PR — review before money moves

Use this skill when a user asks to pay, approve, or "prepare" a supplier invoice.

## Workflow

1. **Observe** (Qonto MCP, read-only) — collect Qonto evidence
2. **Prepare** (immutable Finance PR, no mutation) — build the hashed PR
3. **Act** (only after explicit approval) — revalidate and reach Qonto

Writes are disabled by default.
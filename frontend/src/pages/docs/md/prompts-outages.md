---
title: 'Outage Prompts'
slug: 'prompts-outages'
---

# Outage prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository and run its own tests.
Use this guide when diagnosing an incident so the fix and a record land in the outage catalog.
See the [Outage Catalog](/docs/outages) for schema details and prior incidents.

> **TL;DR**
>
> 1. Investigate the failure and implement a fix.
> 2. Add `outages/YYYY-MM-DD-<slug>.json` matching [`outages/schema.json`](../../../../outages/schema.json).
> 3. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository.

PURPOSE:
Diagnose an outage, implement a fix, and document it.

CONTEXT:
- Review existing records under `/outages` for similar failures.
- After resolving, add `outages/YYYY-MM-DD-<slug>.json` matching [`outages/schema.json`](../../../../outages/schema.json).
- Keep behaviour intact, add tests, and update documentation.

REQUEST:
1. Apply the fix with appropriate tests.
2. Commit the outage entry and related docs.
3. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.

OUTPUT:
A pull request referencing the new outage record and passing checks.
```

---
title: 'Outage Prompts'
slug: 'prompts-outages'
---

# Outage prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository and run its own tests.
Use this guide alongside [Codex Prompts](/docs/prompts-codex) so every fix ships with a matching
record in the outage catalog.
To keep the prompt docs evolving, see the [Codex meta prompt](/docs/prompts-codex-meta);
if templates drift, refresh them with the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader).
For failing GitHub Actions runs, use the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Investigate the failure and implement a fix.
> 2. Add [`outages/YYYY-MM-DD-<slug>.json`][outage-dir]
>    matching [`outages/schema.json`][outage-schema].
> 3. Run `npm run lint`, `npm run type-check`, `npm run build`, and
>    `npm run test:ci`.
> 4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
> 5. Use an emoji-prefixed commit message.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository.

PURPOSE:
Diagnose an outage, implement a fix, and document it.

CONTEXT:
- Review existing records under [`outages`][outage-dir] for similar failures.
- After resolving, add [`outages/YYYY-MM-DD-<slug>.json`][outage-dir]
  matching [`outages/schema.json`][outage-schema].
- Keep behaviour intact, add tests, and update documentation.

REQUEST:
1. Apply the fix with appropriate tests.
2. Commit the outage entry and related docs.
3. Run `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm run test:ci`.
4. Run `git diff --cached | ./scripts/scan-secrets.py` and ensure no secrets.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request referencing the new outage record and passing checks.
```

[outage-dir]: https://github.com/democratizedspace/dspace/tree/main/outages
[outage-schema]: https://github.com/democratizedspace/dspace/blob/main/outages/schema.json

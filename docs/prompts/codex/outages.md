# Outage prompts for the DSPACE repo

Codex is a sandboxed engineering agent that can open this repository and run tests.
Use this guide alongside [Codex Prompts](baseline.md) so every fix ships with a matching
record in the outage catalog. The in-game docs index (`frontend/src/pages/docs/md/prompts-codex.md`) links back here so
these operational details stay canonical.
To keep these prompt docs evolving, consult the [Codex meta prompt](meta.md);
if templates drift, refresh them with the [Codex Prompt Upgrader](upgrader.md).
For failing GitHub Actions runs, use the [Codex CI-failure fix prompt](ci-fix.md).

> **TL;DR**
>
> 1. Investigate the failure and implement a fix.
> 2. Add [`outages/YYYY-MM-DD-<slug>.json`][outage-dir]
>    matching [`outages/schema.json`][outage-schema].
>    Ensure these links and the filename pattern stay current.
> 3. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
>    `npm run test:ci`.
> 4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
> 5. Use an emoji-prefixed commit message.
> 6. Record follow-up tasks (e.g., issues, monitoring) in the `references` array.
>    If the outage introduces a new category, update `outages/schema.json` accordingly.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository.

PURPOSE:
Diagnose an outage, implement a fix, and document it.

CONTEXT:
- Review existing records under [`outages`][outage-dir] for similar failures.
- After resolving, add [`outages/YYYY-MM-DD-<slug>.json`][outage-dir]
  matching [`outages/schema.json`][outage-schema].
- Keep behavior intact, add tests, and update documentation.

REQUEST:
1. Apply the fix with appropriate tests.
2. Commit the outage entry and related docs.
3. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm run test:ci`.
4. Run `git diff --cached | ./scripts/scan-secrets.py` and ensure no secrets.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request referencing the new outage record and passing checks.
```

[outage-dir]: https://github.com/democratizedspace/dspace/tree/main/outages
[outage-schema]: https://github.com/democratizedspace/dspace/blob/main/outages/schema.json

## Upgrader Prompt

Type: evergreen

Use this prompt to keep outage-handling guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Confirm outage schema links and filename patterns are still correct.
2. Add guidance for new outage categories or follow-up steps.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the outage prompt doc with passing checks.
```

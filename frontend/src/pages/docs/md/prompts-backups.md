---
title: 'Backup Prompts'
slug: 'prompts-backups'
---

# Backup prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run tests, and submit a
ready-made PR — but only if given a clear, file-scoped prompt. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when working on [Backups](/docs/backups) features or docs. To
keep these templates evolving, see the [Codex meta prompt](/docs/prompts-codex-meta). If they drift,
refresh them with the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing GitHub
Actions runs, use the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Limit changes to backup-related files or docs.
> 2. Preserve existing backup formats and import/export paths.
> 3. Update tests when behavior changes.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ripsecrets`.
> 6. Commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` pass before
committing.

USER:
1. Modify backup-related code or docs (`frontend/src/pages/docs/md/backups.md` or backup modules).
2. Keep game save and custom content export formats stable.
3. Add or update tests covering backup flows.
4. Run `git diff --cached | ripsecrets` before committing.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with the backup improvement and passing checks.
```

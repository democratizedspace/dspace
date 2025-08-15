---
title: 'Documentation Prompts'
slug: 'prompts-docs'
---

# Documentation prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run tests, and send a
ready-made PR—but only if you give it a clear, file-scoped prompt. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when updating markdown or JSDoc so instructions stay current
and consistent. To keep the prompt docs evolving, see the
[Codex meta prompt](/docs/prompts-codex-meta). If these templates drift, refresh them with the
[Codex Prompt Upgrader](/docs/prompts-codex-upgrader).

> **TL;DR**
>
> 1. Limit changes to the relevant docs.
> 2. Fix outdated wording, links, or formatting.
> 3. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` pass before
committing.

USER:
1. Edit or add docs under `frontend/src/pages/docs/md`.
2. Correct stale guidance, links, or formatting.
3. If adding a new prompt doc, link it from `prompts-codex.md` and `/docs/index`.
4. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.

OUTPUT:
A pull request with refreshed documentation and passing checks.
```

---
title: 'Refactor Prompts'
slug: 'prompts-refactors'
---

# Refactor prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository and submit a ready-made PR—but
only if you give it a clear, file-scoped prompt. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when refactoring code. To keep the prompt docs evolving, see the
[Codex meta prompt](/docs/prompts-codex-meta). If these templates drift, refresh them with the
[Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing GitHub Actions runs, use the
[Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Change internals without altering behaviour.
> 2. Keep commits small and reversible.
> 3. Include before/after benchmarks if performance might change.
> 4. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`,
>    `npm run build`, and `npm run test:ci`.
> 5. Run `git diff --cached | ./scripts/scan-secrets.py` and commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Refactor code in the specified files without changing behaviour.
2. Add benchmarks if performance could regress.
3. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
4. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with the refactor and passing checks.
```

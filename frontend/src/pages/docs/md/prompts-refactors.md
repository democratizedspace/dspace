---
title: 'Refactor Prompts'
slug: 'prompts-refactors'
---

# Refactor prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository and submit
a ready-made PR—but only if you provide a clear, file-scoped prompt. Use this
guide alongside [Codex Prompts](/docs/prompts-codex) when refactoring code. To
keep the prompt docs evolving, see the [Codex meta prompt](/docs/prompts-codex-meta).
If these templates drift, refresh them with the
[Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing GitHub Actions
runs, use the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Change internal structure without altering behavior.
> 2. Avoid mixing refactors with new features or fixes.
> 3. Keep commits small and reversible.
> 4. Follow repository code style: run Prettier, honor ESLint rules, and keep lines ≤100 chars.
> 5. Include before-and-after benchmarks if performance could change.
> 6. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 7. Run `git diff --cached | ./scripts/scan-secrets.py` and commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Refactor code in the specified files without changing behavior.
2. Avoid mixing refactors with feature additions or bug fixes.
3. Add benchmarks if performance could regress.
4. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with the refactor and all checks passing.
```

## Code style and commit granularity

-   Use Prettier and `npm run lint` to enforce the repository's 100-character line limit and
    ESLint rules.
-   Keep commits focused and reversible; avoid bundling unrelated changes.
-   When touching performance-sensitive code, capture before-and-after benchmarks.

## Upgrader Prompt

Type: evergreen

Use this prompt to keep refactor guidelines current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Reaffirm code style rules and commit granularity tips.
2. Mention when to include benchmarks for performance-sensitive changes.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the refactor prompt doc with passing checks.
```

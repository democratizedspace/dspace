---
title: 'Vitest Test Prompts'
slug: 'prompts-vitest'
---

# Vitest test prompts for the _dspace_ repo

Use this template to add unit tests with [Vitest](https://vitest.dev). Lean on it when
new features or bug fixes need coverage. Treat the prompt as living documentation and
refresh it using other `prompts-*.md` files for inspiration. Use this guide alongside
[Codex Prompts](/docs/prompts-codex). To keep the prompt docs evolving, see the
[Codex meta prompt](/docs/prompts-codex-meta); if templates drift, refresh them with
the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing GitHub Actions runs,
use the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Choose a module or component that lacks unit tests or needs better coverage.
> 2. Add or update a Vitest spec under `frontend/__tests__/` or `tests/`.
> 3. Keep tests deterministic and focused on behavior.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py` and commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Identify an untested or under-tested module.
2. Write or refine a Vitest unit test in `frontend/__tests__/` or `tests/`.
3. Run the commands above and `git diff --cached | ./scripts/scan-secrets.py` before committing.
4. Use an emoji-prefixed commit message.

OUTPUT:
A pull request adding the tests with all checks green.
```

## Upgrader Prompt

Type: evergreen

Use this prompt to keep unit test guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Verify test file locations and naming conventions match current structure.
2. Note new Vitest flags or coverage requirements.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the Vitest prompt doc with passing checks.
```

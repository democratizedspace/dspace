---
title: 'Test Prompts'
slug: 'prompts-tests'
---

# Test prompts for the _dspace_ repo

Codex can write or update tests when given a tight, file-scoped brief.
Use this guide alongside [Codex Prompts](/docs/prompts-codex) when modifying
Vitest suites or adding Playwright coverage. Keep prompts short so the agent
spends tokens running checks instead of reading prose.

> **TL;DR**
>
> 1. Limit changes to the relevant test files.
> 2. Provide runnable examples; code blocks should compile with `ts-node`.
> 3. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 4. Scan staged changes for secrets and commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Add or update tests under `frontend/__tests__` or `backend/tests`.
2. Ensure new tests cover edge cases and clearly name assertions.
3. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
4. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with the required test changes and passing checks.
```

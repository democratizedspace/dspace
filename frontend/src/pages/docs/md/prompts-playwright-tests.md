---
title: 'Playwright Test Prompts'
slug: 'prompts-playwright-tests'
---

# Playwright test prompts for the _dspace_ repo

Use this template to add end-to-end coverage for journeys listed in
[User journeys](/docs/user-journeys).

> **TL;DR**
>
> 1. Pick a journey marked "No" in `user-journeys.md`.
> 2. Add a Playwright test under `frontend/e2e`.
> 3. Update `user-journeys.md` to mark it covered.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`
>    and commit with an emoji.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and
`npm run test:ci` pass before committing.

USER:
1. Choose an uncovered journey from `frontend/src/pages/docs/md/user-journeys.md`.
2. Implement a Playwright test in `frontend/e2e/` for that journey.
3. Update the coverage table in `user-journeys.md`.
4. Run `git diff --cached | ./scripts/scan-secrets.py`.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request adding the test and documentation with all checks green.
```

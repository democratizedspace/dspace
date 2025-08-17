---
title: 'Playwright Test Prompts'
slug: 'prompts-playwright-tests'
---

# Playwright test prompts for the _dspace_ repo

Use this template to add end-to-end coverage for journeys listed in
[User journeys](/docs/user-journeys). While working, review the existing
journeys for inaccuracies or misunderstandings and expand the list as new
features land. Treat this prompt as living documentation—periodically refine
it using other `prompts-*.md` files for inspiration.

> **TL;DR**
>
> 1. Review `user-journeys.md`, correcting errors or outdated steps.
> 2. Pick a journey marked "No" or add new journeys as needed.
> 3. Add a Playwright test under `frontend/e2e`.
> 4. Update `user-journeys.md` to reflect coverage and fixes.
> 5. Iterate on this prompt when improvements surface.
> 6. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 7. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`
>    and commit with an emoji.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and
`npm run test:ci` pass before committing.

USER:
1. Audit `frontend/src/pages/docs/md/user-journeys.md` for mistakes and
   propose fixes or additional journeys.
2. Select an uncovered or newly added journey and implement a Playwright test
   in `frontend/e2e/`.
3. Update the coverage table and any corrected steps in `user-journeys.md`.
4. Improve this prompt if clearer guidance emerges.
5. Run `git diff --cached | ./scripts/scan-secrets.py`.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request adding the test, doc updates, and any prompt refinements with all
checks green.
```

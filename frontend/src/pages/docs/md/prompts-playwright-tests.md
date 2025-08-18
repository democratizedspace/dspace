---
title: 'Playwright Test Prompts'
slug: 'prompts-playwright-tests'
---

# Playwright test prompts for the _dspace_ repo

Use this template to add end-to-end coverage for journeys listed in
[User journeys](/docs/user-journeys). While working, review the existing
journeys for inaccuracies or misunderstandings and expand the list as new
features land. Treat this prompt as living documentation—periodically refine
it using other `prompts-*.md` files for inspiration. Use this guide alongside
[Codex Prompts](/docs/prompts-codex). To keep the prompt docs evolving, see the
[Codex meta prompt](/docs/prompts-codex-meta); if templates drift, refresh them
with the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing
GitHub Actions runs, use the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Review `user-journeys.md`, correcting errors or outdated steps.
> 2. Pick a journey marked "No" or add new journeys as needed.
> 3. If a placeholder exists under `frontend/e2e/backlog`, promote it to
>    `frontend/e2e` with `git mv`; otherwise add a new Playwright test.
> 4. Update `user-journeys.md` to reflect coverage and fixes.
> 5. Run `npx playwright install chromium` if browsers are missing.
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
   in `frontend/e2e/`. If a matching placeholder exists in
   `frontend/e2e/backlog`, move it with `git mv` before editing.
3. Update the coverage table and any corrected steps in `user-journeys.md`.
4. Improve this prompt if clearer guidance emerges.
5. Run `git diff --cached | ./scripts/scan-secrets.py`.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request adding the test, doc updates, and any prompt refinements with all
checks green.
```

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
> 1. Review `user-journeys.md`, correcting mistakes and keeping the coverage
>    table sorted alphabetically.
> 2. For journeys lacking tests, create a placeholder spec under
>    `frontend/e2e/backlog` using `test.describe.skip` so incomplete tests
>    don't run.
> 3. If a placeholder exists, move it to `frontend/e2e` with `git mv` and
>    implement the Playwright test; otherwise add a new test file.
> 4. Run the new test locally with `npm run test:e2e` or
>    `npx playwright test <file>`.
> 5. Update `user-journeys.md` with coverage status and any fixes.
> 6. Run `npx playwright install chromium` if browsers are missing.
> 7. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`,
>    `npm run build`, and `npm run test:ci`.
> 8. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`
>    and commit with an emoji.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`,
`npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Audit `frontend/src/pages/docs/md/user-journeys.md` for mistakes and
   propose fixes or additional journeys.
2. For journeys lacking tests, add a `test.describe.skip` placeholder under
   `frontend/e2e/backlog`.
3. Select an uncovered or newly added journey and implement a Playwright test
   in `frontend/e2e/`. If a matching placeholder exists in
   `frontend/e2e/backlog`, move it with `git mv` before editing.
4. Update the coverage table and any corrected steps in `user-journeys.md`,
   keeping it alphabetized.
5. Run the new test with `npm run test:e2e` or `npx playwright test <file>`.
6. Improve this prompt if clearer guidance emerges.
7. Run `git diff --cached | ./scripts/scan-secrets.py`.
8. Use an emoji-prefixed commit message.

OUTPUT:
A pull request adding the test, doc updates, and any prompt refinements with all
checks green.
```

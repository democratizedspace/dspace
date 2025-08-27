---
title: 'Playwright Test Prompts'
slug: 'prompts-playwright-tests'
---

# Playwright test prompts for the _dspace_ repo

Use this template to add end-to-end coverage for journeys listed in
[User journeys](/docs/user-journeys) using
[Playwright](https://playwright.dev/). While working, review the existing
journeys for inaccuracies or gaps/misunderstandings and expand the list as new
features land. Tests should assert visible UI content to verify that pages render
correctly. Treat this prompt as living documentation—periodically refine it using
other `prompts-*.md` files for inspiration. Use this guide alongside
[Codex Prompts](/docs/prompts-codex). To keep the prompt docs evolving, see the
[Codex meta prompt](/docs/prompts-codex-meta); if templates drift, refresh them
with the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing GitHub
Actions runs, use the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Review `frontend/src/pages/docs/md/user-journeys.md`, correcting mistakes
>    and keeping the coverage table sorted alphabetically.
> 2. Check if an existing Playwright test already covers the journey to avoid
>    duplicates.
> 3. For journeys lacking tests, ensure a placeholder spec exists under
>    `frontend/e2e/backlog`; create one if missing, and remove placeholders
>    once real coverage lands.
> 4. If a placeholder exists, move it to `frontend/e2e` with `git mv` and
>    implement the Playwright test; otherwise add a new test file.
> 5. Write assertions against visible page content to ensure the UI renders as
>    expected.
> 6. Use `waitForHydration(page)` after navigation so Svelte components are
>    fully loaded before assertions.
> 7. For authentication flows, confirm tokens persist in `localStorage` and can
>    be cleared without network access.
> 8. Update `user-journeys.md` with coverage status, test file path, and any
>    fixes, keeping the table alphabetized. Verify apparent 404s aren't missing
>    routes; if a page should exist, add a stub instead of asserting a 404.
> 9. Run `npx playwright install chromium` if browsers are missing.
> 10. Run `npm run lint`, `npm run type-check`, `npm run build`, and
>     `npm run test:ci`.
> 11. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`
>     and commit with an emoji.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Audit `frontend/src/pages/docs/md/user-journeys.md` for mistakes and
   propose fixes or additional journeys.
2. Select an uncovered or newly added journey and implement a Playwright test
   in `frontend/e2e/`, asserting visible UI content. If a matching placeholder
   exists in `frontend/e2e/backlog`, move it with `git mv` before editing;
   otherwise create the test file.
3. Update the coverage table in `frontend/src/pages/docs/md/user-journeys.md`
   with the new test path and any corrected steps, keeping it alphabetized.
4. Improve this prompt if clearer guidance emerges.
5. Run `git diff --cached | ./scripts/scan-secrets.py`.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request adding the test, doc updates, and any prompt refinements with all
checks green.
```

## Upgrader Prompt

Type: evergreen

Use this prompt to keep Playwright test guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Ensure user-journey links and Playwright version notes are current.
2. Document new flags or helpers for running tests headlessly in CI.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the Playwright test prompt doc with passing checks.
```

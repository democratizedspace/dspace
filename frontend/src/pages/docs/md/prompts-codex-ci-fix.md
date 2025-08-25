---
title: 'Codex CI-Failure Fix Prompt'
slug: 'prompts-codex-ci-fix'
---

# OpenAI Codex CI-Failure Fix Prompt

Use this drop-in snippet whenever a GitHub Actions run for
**democratizedspace/dspace** fails. It guides Codex to diagnose the failure and
return a pull request that keeps the main branch green. For baseline
conventions, see [Codex Prompts](/docs/prompts-codex). To evolve the prompt
docs, see the [Codex meta prompt](/docs/prompts-codex-meta).

If this prompt ever drifts, consult the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader)
to refresh it before use. For guidance on logging incidents, see the
[Outage prompts](/docs/prompts-outages) and review the
[Outages](/docs/outages) catalog to avoid repeats.

> **Human setup**
>
> 1. Optional: paste a failing job URL on the first line of a new ChatGPT
>    message.
> 2. Hit <kbd>Enter</kbd> twice so two blank lines follow (whether or not you
>    provided a URL).
> 3. Copy the block below, paste it after the blanks, then send the message in
>    **Code** mode.

```text
SYSTEM:
You are an automated contributor for the democratizedspace/dspace repository.

PURPOSE:
Diagnose a failed CI run and make it pass.

CONTEXT:
- If a failed job URL is provided, fetch the logs and identify the first real
  error.
- If no URL is given, inspect the codebase to reproduce the failure:
  * Examine `.github/workflows/` to learn which checks run in CI.
    * Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` locally.
  * Study project docs to understand how to run the test suite and emulate the
    GitHub Actions environment.
- Consult existing outage entries in `/outages` for similar symptoms.
- Constraints:
  * Keep existing behaviour intact.
  * Follow `AGENTS.md` and project style.
  * Add or update tests proving the fix.
  * Update documentation when necessary.
  * After fixing, append a bullet to the "Lessons learned" section of
    `frontend/src/pages/docs/md/prompts-codex-ci-fix.md` summarizing the cause
    and remedy.
  * Record the incident in `/outages/YYYY-MM-DD-<slug>.json` using
    `outages/schema.json`.

REQUEST:
1. Explain in the pull-request body why the failure occurred (or would occur).
2. Commit the minimal changes needed to fix it. Before committing, run
   `git diff --cached | ./scripts/scan-secrets.py` and ensure no secrets. Use an
   emoji-prefixed commit message.
3. Create `outages/YYYY-MM-DD-<slug>.json` describing the incident.
4. Push to a branch named `codex/ci-fix/<short-description>`.
5. Open a pull request that leaves all CI checks green.

OUTPUT:
A GitHub pull request URL. Include a summary of the root cause and evidence that
the commands above now succeed.
```

Copy this file forward whenever CI fails so future fixes stay consistent.

## Lessons learned

> Agents: append a bullet after each successful fix.

-   2025-03-?? – prompt no longer requires a failing job URL; agents must inspect
    workflows and run local checks when none is provided.
-   2025-08-09 – JSON parse failures in `generated/processes.json` and an outdated
    generated map broke type-check and build; ensure data files stay valid and
    regenerate artifacts.
-   2025-08-09 – `pnpm` must be installed before Node caching; place `pnpm/action-setup`
    ahead of `actions/setup-node` to prevent missing executable errors.
-   2025-08-09 – Passing an extra `--port` to the dev server made Astro fall back to port 3000;
    rely on the script's configured port so test waits succeed.
-   2025-08-09 – Playwright tests received `ERR_CONNECTION_REFUSED` when the workflow's dev
    server step exited early; start a preview server with `--host 0.0.0.0` and wait on it so
    the frontend stays reachable.
-   2025-08-09 – Installing only Chromium left Firefox and WebKit missing; install all
    browsers with `playwright install --with-deps` and print the preview log on failure for
    easier debugging.
-   2025-08-10 – `__dirname` in an ES module test and a nested Chip wrapper hid the
    Cloud Sync upload button; derive paths with `import.meta.url` and use a plain container so
    Playwright can locate the control.
-   2025-08-10 – Playwright's dev server exited between grouped runs; switching the webServer
    command to `npm run preview` keeps a stable server for E2E tests.
-   2025-08-10 – `npm run test:ci` was undefined, breaking CI instructions; add a script
    alias that runs `test:pr` with `SKIP_E2E` to keep checks green.
-   2025-08-10 – `listMissingImages` treated URLs with query strings as missing files; strip
    query and hash parts before checking so coverage tests don't flag valid assets.
-   2025-08-10 – `checkPatchCoverage.cjs` assumed `origin/main`; detect the origin's HEAD branch
    so patch coverage checks work on repositories where the default branch is `v3`.
-   2025-08-11 – `openai` v3 pulled a vulnerable `axios`; upgrade to v5 to fix the
    dependency audit.
-   2025-08-11 – Introduced a structured outage catalog under `/outages` so agents
    can recall past incidents.
-   2025-08-12 – `listMissingImages` flagged remote URLs as missing assets; skip `http` and
    `https` paths so coverage checks ignore external images.
-   2025-08-12 – `.npmrc`'s `packageManager` key made npm warn; drop the file and
    set `packageManager` in `package.json` to keep installs quiet.
-   2025-08-12 – `listMissingImages` flagged data URIs and protocol-relative sources as missing;
    ignore `data:` and `//` URLs so coverage checks only test local assets.
-   2025-08-14 – `new-quests.md` fell behind after new quests were added; run `npm run new-quests:update`
    and commit the refreshed file.
-   2025-08-14 – `npm test` in `frontend` ran zero unit tests; add a minimal sanity test so CI verifies the frontend harness.
-   2025-08-14 – E2E tests failed when Playwright browsers were missing; ensure `npx --prefix frontend`
    `playwright install --with-deps` runs before grouped tests.
-   2025-08-14 – missing Jest `testMatch` in `frontend/package.json` let a coverage check fail; add a
    pattern so E2E tests detect all Jest files.
-   2025-08-25 – E2E coverage flagged nine orphaned specs; add them to `run-test-groups.mjs` to keep
    grouped tests in sync.
-   2025-08-25 – `checkPatchCoverage.cjs` assumed an `origin` remote; detect the local HEAD and skip
    `origin` when it is absent.
-   2025-08-25 – ESLint failed to load @typescript-eslint plugins when frontend dev dependencies were missing; install frontend packages before linting.
-   2025-08-25 – shallow checkout hid `origin/v3`, making coverage tests fail; fetch with
    `fetch-depth: 0` so scripts can compare against the default branch.

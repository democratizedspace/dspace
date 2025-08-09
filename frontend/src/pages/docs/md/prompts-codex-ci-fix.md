---
title: 'Codex CI-Failure Fix Prompt'
slug: 'prompts-codex-ci-fix'
---

# OpenAI Codex CI-Failure Fix Prompt

Use this drop-in snippet whenever a GitHub Actions run for
**democratizedspace/dspace** fails. It guides Codex to diagnose the failure and
return a pull request that keeps the main branch green.

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
  * Run `npm run lint`, `npm run type-check`, `npm run build`, and
    `npm run test:ci` locally.
  * Study project docs to understand how to run the test suite and emulate the
    GitHub Actions environment.
- Constraints:
  * Keep existing behaviour intact.
  * Follow `AGENTS.md` and project style.
  * Add or update tests proving the fix.
  * Update documentation when necessary.
  * After fixing, append a bullet to the "Lessons learned" section of
    `frontend/src/pages/docs/md/prompts-codex-ci-fix.md` summarizing the cause
    and remedy.

REQUEST:
1. Explain in the pull-request body why the failure occurred (or would occur).
2. Commit the minimal changes needed to fix it.
3. Push to a branch named `codex/ci-fix/<short-description>`.
4. Open a pull request that leaves all CI checks green.

OUTPUT:
A GitHub pull request URL. Include a summary of the root cause and evidence that
the commands above now succeed.
```

Copy this file forward whenever CI fails so future fixes stay consistent.

## Lessons learned

> Agents: append a bullet after each successful fix.

-   2025-03-?? – prompt no longer requires a failing job URL; agents must inspect
    workflows and run local checks when none is provided.
-   2025-08-09 – JSON parse failures in `processes.json` and an outdated
    generated map broke type-check and build; ensure data files stay valid and
    regenerate artifacts.
-   2025-08-09 – `pnpm` must be installed before Node caching; place `pnpm/action-setup`
    ahead of `actions/setup-node` to prevent missing executable errors.

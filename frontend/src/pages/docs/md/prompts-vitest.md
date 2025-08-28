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

Vitest looks for `*.test.ts` files in `tests/`, `backend/`, and `scripts/tests/`. The
`frontend/__tests__` directory is handled by Jest and excluded from Vitest runs. Coverage
uses the V8 provider with reports in `frontend/coverage`, and the root script sets
`--testTimeout 20000` to accommodate slower tests.

> **TL;DR**
>
> 1. Choose a module or component that lacks unit tests or needs better coverage.
> 2. Add a Vitest spec in `tests/`, `backend/`, or `scripts/tests/` using the `.test.ts` suffix.
> 3. Keep tests deterministic and focused on behavior.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py` and
>    commit with an emoji prefix.

Root Vitest specs live in `tests/**/*.test.ts`, `scripts/tests/**/*.test.ts`, and
`backend/**/*.test.ts`. Frontend component tests sit in `frontend/__tests__` and usually
end with `.test.js`. Align any new test files with these locations and naming conventions.

For coverage, run `npm run coverage`. This invokes `vitest run --coverage` using the V8
provider and writes reports to `frontend/coverage`.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`
pass before committing.

USER:
1. Identify an untested or under-tested module.
2. Write or refine a Vitest unit test in `tests/`, `backend/`, or `scripts/tests/`
   with a `.test.ts` name.
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
1. Confirm root specs stay in `tests/**/*.test.ts`, `scripts/tests/**/*.test.ts`, and
   `backend/**/*.test.ts`, while frontend specs use `frontend/__tests__/*.test.js`.
2. Note any new Vitest flags (e.g. `--testTimeout 20000`) or coverage expectations
   (`npm run coverage` writes reports to `frontend/coverage`).
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the Vitest prompt doc with passing checks.
```

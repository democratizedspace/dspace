---
title: 'Codex Prompts'
slug: 'prompts-codex'
---

# Writing great Codex prompts for the _dspace_ repo

Codex (Web + CLI) is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready‑made PR — but only if you give it a clear,
file‑scoped prompt. This document stores the baseline instructions used when
invoking Codex on DSPACE and should evolve alongside the project.

For task-specific templates see [Quest prompts](prompts-quests.md),
[Item prompts](prompts-items.md), [Process prompts](prompts-processes.md),
[NPC prompts](prompts-npcs.md), [Outage prompts](prompts-outages.md),
[Backup prompts](prompts-backups.md), [Monitoring prompts](prompts-monitoring.md),
[Audit prompts](prompts-audit.md), [Secret scanning prompts](prompts-secrets.md),
[Docs prompts](prompts-docs.md),
[Playwright test prompts](prompts-playwright-tests.md),
[Vitest test prompts](prompts-vitest.md), [Frontend prompts](prompts-frontend.md),
[Backend prompts](prompts-backend.md), [Refactor prompts](prompts-refactors.md), and
[Accessibility prompts](prompts-accessibility.md).
For specialized workflows use the [Codex CI-failure fix prompt](prompts-codex-ci-fix.md),
the [Codex merge conflict prompt](prompts-codex-merge-conflicts.md), the
[Codex meta prompt](prompts-codex-meta.md), and the
[Codex Prompt Upgrader](prompts-codex-upgrader.md).

> **TL;DR**
>
> 1. Scope the task to one or two files.
> 2. Say **exactly** what output you expect (tests, docs, etc.).
> 3. Stop talking when the spec is complete. Codex treats _all_ remaining text as
>    mandatory instructions.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py` and
>    commit with an emoji prefix.

---

## Related prompt guides

-   [Item Prompts](prompts-items.md)
-   [Process Prompts](prompts-processes.md)
-   [Quest Prompts](prompts-quests.md)
-   [NPC Prompts](prompts-npcs.md)
-   [Outage Prompts](prompts-outages.md)
-   [Backup Prompts](prompts-backups.md)
-   [Monitoring Prompts](prompts-monitoring.md)
-   [Audit Prompts](prompts-audit.md)
-   [Secret Scanning Prompts](prompts-secrets.md)
-   [Docs Prompts](prompts-docs.md)
-   [Docs cross-link prompt](prompts-docs.md#cross-link-check-prompt)
-   [Docs proofreading prompt](prompts-docs.md#proofreading-prompt)
-   [Backend Prompts](prompts-backend.md)
-   [Frontend Prompts](prompts-frontend.md)
-   [Accessibility Prompts](prompts-accessibility.md)
-   [Playwright Test Prompts](prompts-playwright-tests.md)
-   [Vitest Test Prompts](prompts-vitest.md)
-   [Refactor Prompts](prompts-refactors.md)
-   [Codex CI-Failure Fix Prompt](prompts-codex-ci-fix.md)
-   [Codex Merge Conflict Prompt](prompts-codex-merge-conflicts.md)
-   [Codex Meta Prompt](prompts-codex-meta.md)
-   [Codex Prompt Upgrader](prompts-codex-upgrader.md)

---

## 1. Quick start (Web vs CLI)

| Use‑case       | Codex Web (ChatGPT sidebar) | Codex CLI                                  |
| -------------- | --------------------------- | ------------------------------------------ |
| Ad‑hoc feature | “Code” button, attach repo  | `codex "add buy‑button to ProcessView"`    |
| Ask a question | “Ask” button                | `codex exec "explain utils/time.ts"`       |
| CI automation  | –                           | `codex exec --full-auto "npm run test:ci"` |

See the [OpenAI CLI repository][openai-cli] for more flags.

---

## 2. Prompt ingredients

| Ingredient           | Why it matters                                                                      |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Add sort dropdown to Item page”).                    |
| **Files to touch**   | Limits search space → faster & cheaper.                                             |
| **Constraints**      | Coding style, a11y, perf, etc.                                                      |
| **Acceptance check** | e.g. `npm run lint`, `npm run type-check`, `npm run build`, `npm run test:ci` pass. |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt‑level rules short and concrete.

---

## 3. Reusable template

```text
You are working in democratizedspace/dspace.

GOAL: <one sentence>.

FILES OF INTEREST
- <path/to/File1>   ← brief hint
- <path/to/File2>

REQUIREMENTS
1. …
2. …
3. …
4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
5. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
6. Use an emoji-prefixed commit message.

OUTPUT
A pull request with the required changes and tests.
```

## Implementation Prompt

Use this template when you want Codex to automatically clear items from the
[September&nbsp;1,&nbsp;2025 changelog](changelog/20250901.md). Tasks are
tracked with Markdown checkboxes and an emoji status:

-   `- [ ]` – work not started
-   `- [x]` or `- [x] <emoji>` – implemented but not fully vetted
-   `- [x] ✅` – implemented before robustness checks; replace with `💯` once verified
-   `- [x] 💯` – thoroughly tested and reviewed

Codex should pick a single entry that is either unchecked or checked without a
💯 (for example, entries marked with ✅) and implement it completely. After all
tests pass, update that row so the line ends with `💯`. When possible, also
promote any previously completed rows lacking the 💯 emoji by swapping `✅` for
`💯`.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Choose one item
from `frontend/src/pages/docs/md/changelog/20250901.md` that is either `[ ]` or
`[x]` without 💯 (including those marked with ✅). Implement it fully, completing
any sub-tasks. Provide all code, tests and documentation required. Follow
`AGENTS.md` and ensure `npm run lint`, `npm run type-check`,
`npm run build`, and `npm run test:ci` all pass before committing. If Playwright browsers are
missing run `npx playwright install chromium` or use `SKIP_E2E=1 npm run test:ci`.

USER:
1. Follow the steps above.
2. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
3. After verifying the implementation, mark the corresponding changelog line
   with `💯`, replacing any `✅` or other emoji.
4. Replace any remaining `✅` entries in the changelog with `💯` once they meet
   the robustness standard.
5. Use an emoji-prefixed commit message.
6. Document new functionality as needed.

OUTPUT:
A pull request implementing the chosen item with all tests green. Summarize the
completed task and test results in the PR body.
```

## Upgrade Prompt

Use this prompt to refine DSPACE's own prompt documentation. For a template
dedicated to evolving the prompt guides themselves, see the
[Codex meta prompt](prompts-codex-meta.md).

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check`,
`npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Pick one or more prompt docs under `frontend/src/pages/docs/md/` (for example,
   `prompts-items.md`).
2. Fix outdated instructions, links or formatting.
3. If you add a new prompt, link it from `prompts-codex.md` and the docs index.
4. Run the checks above.
5. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with the improved prompt doc and passing checks.
```

## Prompt Upgrader

Use this meta prompt when the Codex templates need refreshing. It keeps our
guidance current—the machine that builds the machine. See the standalone
[Codex Prompt Upgrader](prompts-codex-upgrader.md) for the full template.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check`,
`npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Audit `frontend/src/pages/docs/md/prompts-*` for stale guidance or missing
   cross-links.
2. Update prompt templates, including this file, to reflect current practices.
3. Link new prompt files from `prompts-codex.md` and the docs index.
4. Propagate related changes across docs.
5. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Run the checks above.

OUTPUT:
A pull request refreshing the Codex prompt docs with passing checks.
```

[openai-cli]: https://github.com/openai/openai-cli

## Upgrader Prompt

Type: evergreen

Use this prompt to keep baseline Codex prompt guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Update references to new or renamed prompt docs.
2. Confirm default template reflects current lint, test, and commit standards.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the baseline Codex prompt doc with passing checks.
```

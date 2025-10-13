# Writing great Codex prompts for the _dspace_ repo

Codex (Web + CLI) is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready‑made PR — but only if you give it a clear,
file‑scoped prompt. This document stores the baseline instructions used when
invoking Codex on DSPACE and should evolve alongside the project.

For task-specific templates see [Quest prompts](quests.md),
[Item prompts](items.md), [Process prompts](processes.md),
[NPC prompts](npcs.md), [Outage prompts](outages.md),
[Backup prompts](backups.md), [Monitoring prompts](monitoring.md),
[Audit prompts](audit.md), [Secret scanning prompts](secrets.md),
[Docs prompts](docs.md),
[Playwright test prompts](playwright-tests.md),
[Vitest test prompts](vitest.md), [Frontend prompts](frontend.md), [Chat UI prompts](chat-ui.md),
[Backend prompts](backend.md), [Refactor prompts](refactors.md),
[Implementation prompt](implement.md),
[Accessibility prompts](accessibility.md), and the
[Structural polish playbook](polish.md).
For specialized workflows use the [Codex CI-failure fix prompt](ci-fix.md),
the [Codex merge conflict prompt](merge-conflicts.md), the
[Codex meta prompt](meta.md), and the
[Codex Prompt Upgrader](upgrader.md).
When adding a new prompt doc, link it here and in
[the docs index](../index.astro).

> **TL;DR**
>
> 1. Scope the task to one or two files.
> 2. Say **exactly** what output you expect (tests, docs, etc.).
> 3. Stop talking when the spec is complete. Codex treats _all_ remaining text as
>    mandatory instructions.
> 4. Use `rg` for file searches; avoid `ls -R` or `grep -R`.
> 5. Link new prompt guides from this page and `frontend/src/pages/docs/index.astro`.
> 6. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
>    `npm run test:ci`.
> 7. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py` and
>    commit with an emoji prefix.

---

## Related prompt guides

- [Item Prompts](items.md)
- [Process Prompts](processes.md)
- [Quest Prompts](quests.md)
- [NPC Prompts](npcs.md)
- [Outage Prompts](outages.md)
- [Backup Prompts](backups.md)
- [Monitoring Prompts](monitoring.md)
- [Audit Prompts](audit.md)
- [Secret Scanning Prompts](secrets.md)
- [Docs Prompts](docs.md)
- [Docs cross-link prompt](docs.md#cross-link-check-prompt)
- [Docs proofreading prompt](docs.md#proofreading-prompt)
- [Backend Prompts](backend.md)
- [Frontend Prompts](frontend.md)
- [Accessibility Prompts](accessibility.md)
- [Playwright Test Prompts](playwright-tests.md)
- [Vitest Test Prompts](vitest.md)
- [Refactor Prompts](refactors.md)
- [Implementation Prompt](implement.md)
- [Structural polish playbook](polish.md)
- [Codex CI-Failure Fix Prompt](ci-fix.md)
- [Codex Merge Conflict Prompt](merge-conflicts.md)
- [Codex Meta Prompt](meta.md)
- [Codex Prompt Upgrader](upgrader.md)

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

| Ingredient           | Why it matters                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Add sort dropdown to Item page”).                                          |
| **Files to touch**   | Limits search space → faster & cheaper.                                                                   |
| **Constraints**      | Coding style, a11y, perf, etc.                                                                            |
| **Acceptance check** | `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`,<br>`npm run test:ci` all pass. |

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
1. Scope the task to one or two files.
2. Say exactly what output you expect (tests, docs, etc.).
3. Stop talking when the spec is complete. Codex treats all remaining text as mandatory instructions.
4. Use `rg` for file searches; avoid `ls -R` or `grep -R`.
5. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
6. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
7. Use an emoji-prefixed commit message.

OUTPUT
A pull request with the required changes and tests.
```

## Implementation prompt

Looking for an evergreen way to ship promised functionality? Use the dedicated
[implement prompt guide](implement.md). It instructs Codex to gather eligible
TODOs, unchecked checklists, and other promises, pick one at random, and ship it
with full test coverage and documentation updates.

## Upgrade Prompt

Use this prompt to refine DSPACE's own prompt documentation. For a template
dedicated to evolving the prompt guides themselves, see the
[Codex meta prompt](meta.md).

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run audit:ci`, `npm run lint`,
`npm run type-check`, `npm run build`, and `npm run test:ci`
pass before committing.

USER:
1. Pick one or more prompt docs under `frontend/src/pages/docs/md/` (for example,
   `items.md`).
2. Use `rg` for file searches; avoid `ls -R` or `grep -R`.
3. Fix outdated instructions, links or formatting.
4. If you add a new prompt, link it from `baseline.md` and the docs index.
5. Run the checks above.
6. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
7. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with the improved prompt doc and passing checks.
```

## Prompt Upgrader

Use this meta prompt when the Codex templates need refreshing. It keeps our
guidance current—the machine that builds the machine. See the standalone
[Codex Prompt Upgrader](upgrader.md) for the full template.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run audit:ci`, `npm run lint`,
`npm run type-check`, `npm run build`, and `npm run test:ci`
pass before committing.

USER:
1. Audit `docs/prompts/codex/*.md` for stale guidance or missing cross-links.
2. Use `rg` for file searches; avoid `ls -R` or `grep -R`.
3. Update prompt templates, including this file, to reflect current practices.
4. Link new prompt files from this folder and refresh
   `frontend/src/pages/docs/md/prompts-codex.md`.
5. Propagate related changes across docs.
6. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
7. Run the checks above.

OUTPUT:
A pull request refreshing the Codex prompt docs with passing checks.
```

[openai-cli]: https://platform.openai.com/docs/guides/openai-cli/

## Upgrader Prompt

Type: evergreen

Use this prompt to keep baseline Codex prompt guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`,
`npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Update references to new or renamed prompt docs.
2. Use `rg` for file searches; avoid `ls -R` or `grep -R`.
3. Confirm default template reflects current lint, test, and commit standards.
4. Run the checks above.
5. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
6. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the baseline Codex prompt doc with passing checks.
```

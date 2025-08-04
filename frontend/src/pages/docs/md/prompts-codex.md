---
title: 'Codex Prompts'
slug: 'prompts-codex'
---

# Writing great Codex prompts for the _dspace_ repo (v3)

Codex (Web + CLI) is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready‑made PR — but only if you give it a clear,
file‑scoped prompt. This document stores the baseline instructions used when
invoking Codex on DSPACE and should evolve alongside the project.

> **TL;DR**  
> 1. Scope the task to one or two files.  
> 2. Say **exactly** what output you expect (diff, test, docs, etc.).  
> 3. Stop talking when the spec is complete. Codex treats _all_ remaining text as
> mandatory instructions.

---

## 1 Quick start (Web vs CLI)

| Use‑case       | Codex Web (ChatGPT sidebar) | Codex CLI                               |
| -------------- | --------------------------- | --------------------------------------- |
| Ad‑hoc feature | “Code” button, attach repo  | `codex "add buy‑button to ProcessView"` |
| Ask a question | “Ask” button                | `codex exec "explain utils/time.ts"`    |
| CI automation  | –                           | `codex exec --full-auto "run npm test"` |

See the upstream CLI reference for more flags.

---

## 2 Prompt ingredients

| Ingredient           | Why it matters                                                     |
| -------------------- | ------------------------------------------------------------------ |
| **Goal sentence**    | Gives the agent a north star (“Add sort dropdown to Item page”).   |
| **Files to touch**   | Limits search space → faster & cheaper.                            |
| **Constraints**      | Coding style, a11y, perf, etc.                                     |
| **Acceptance check** | e.g. “All `npm test` suites pass” or “Return a unified diff only”. |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt‑level rules short and concrete.

---

## 3 Reusable template

```text
You are working in democratizedspace/dspace (branch v3).

GOAL: <one sentence>.

FILES OF INTEREST
- <path/to/File1>   ← brief hint
- <path/to/File2>

REQUIREMENTS
1. …
2. …
3. …

OUTPUT
Return **only** the patch (diff) needed.
```

## Implementation Prompt

Use this template when you want Codex to automatically clear items from the
[September&nbsp;1,&nbsp;2025 changelog](/docs/changelog/20250901). Tasks are
tracked with Markdown checkboxes and an emoji status:

-   `- [ ]` – work not started
-   `- [x]` or `- [x] <emoji>` – implemented but not fully vetted
-   `- [x] 💯` – thoroughly tested and reviewed

Codex should pick a single entry that is either unchecked or checked without a
💯 and implement it completely. After all tests pass, update that row so the line
ends with `💯`. When possible, also promote any previously completed rows lacking
the 💯 emoji.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Choose one item
from `frontend/src/pages/docs/md/changelog/20250901.md` that is either `[ ]` or
`[x]` without 💯. Implement it fully, completing any sub-tasks. Provide all code,
tests and documentation required. Follow `AGENTS.md` and ensure `npm run lint`,
`npm run type-check`, `npm run build`, and `SKIP_E2E=1 npm run test:pr` all pass
before committing. If Playwright browsers are missing run `npx playwright
install chromium`.

USER:
1. Follow the steps above.
2. After verifying the implementation, mark the corresponding changelog line
   with `💯` (replacing any other emoji).
3. Document new functionality as needed.

OUTPUT:
A pull request implementing the chosen item with all tests green. Summarize the
completed task and test results in the PR body.
```

## Upgrade Prompt

Use this prompt to refine DSPACE's own prompt documentation.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check` and `npm run build`
pass before committing.

USER:
1. Pick one prompt doc under `frontend/src/pages/docs/md/` (for example,
   `prompts-items.md`).
2. Fix outdated instructions, links or formatting.
3. Run the checks above.

OUTPUT:
A pull request with the improved prompt doc and passing checks.
```

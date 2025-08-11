---
title: 'Process Prompts'
slug: 'prompts-processes'
---

# Writing great process prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready‑made PR—but only if you give it a
clear, file‑scoped prompt. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when working on processes. For
fundamental design tips see the [Process Development Guidelines](/docs/process-guidelines).

> **TL;DR**
>
> 1. Scope changes to a single process entry.
> 2. Say exactly what output you expect (diff, tests, docs).
> 3. Stop when the spec is complete. Codex treats all remaining text as
>    mandatory instructions.

---

## 1 Quick start (Web vs CLI)

-   **Add or update a process**
    -   Web: use the “Code” button and attach the repo.
    -   CLI: `codex "add process 3dprinting/solar-mount"`
-   **Ask about process data**
    -   Web: use the “Ask” button.
    -   CLI: `codex exec "explain frontend/src/pages/processes/processes.json"`
-   **Run process tests**
    -   Web: not supported yet.
    -   CLI:
        ```bash
        codex exec "npm run lint && npm run type-check && npm run build && \
        npm test -- processQuality"
        ```

See the [Codex CLI repository][codex-cli] for more flags.

---

## 2 Prompt ingredients

| Ingredient           | Why it matters                                                          |
| -------------------- | ----------------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Add lettuce seed input to hydroponics”). |
| **Files to touch**   | Limits search space → faster & cheaper.                                 |
| **Constraints**      | Coding style, a11y, process schema rules.                               |
| **Acceptance check** | e.g. “`npm test -- processQuality` passes”.                             |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt‑level rules short and concrete.

---

## 3 Reusable template

```text
You are working in democratizedspace/dspace.

GOAL: <one sentence process addition or edit>.

FILES OF INTEREST
- frontend/src/pages/processes/processes.json   ← process registry

REQUIREMENTS
1. Follow the process schema.
2. Use realistic durations and item relationships grounded in real-world timing.
3. Ensure the process is referenced by at least one quest or item; create
   missing items or quest hooks as needed.
4. Use only existing image assets; do not add new image files.
5. Run `npm run lint`, `npm run type-check` and `npm run build`.
6. Run `npm test -- processQuality` and fix any failures.
7. Run `git diff --cached | detect-secrets scan --string` and ensure no secrets.
8. Update docs or items if needed.

OUTPUT
Return **only** the patch (diff) needed.
```

## Implementation Prompt

Use this when you want Codex to automatically create or upgrade a process.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Edit or create
processes under `frontend/src/pages/processes/processes.json`. Ensure realistic
steps, durations, item references, and passing checks (`npm run lint`,
`npm run type-check`, `npm run build`, and `npm test -- processQuality`).
Verify the process links to existing quests or items, add missing registry
entries if needed, reuse existing image assets, and scan for secrets with
`git diff --cached | detect-secrets scan --string` before committing.

USER:
1. Follow the steps above.
2. Run the commands listed in the system prompt before committing.
3. Summarize the new or updated process in the PR description.
4. Use an emoji-prefixed commit message like `📝 : update process`.

OUTPUT:
A pull request implementing the process with all tests green.
```

## Upgrade prompt for existing processes

Use this prompt to refine processes and track quality as the game evolves.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository.

USER:
1. Pick a process from `frontend/src/pages/processes/processes.json` that lacks a
   `hardening` block or has a low score.
2. Improve clarity, realism and item references. Ensure durations are feasible
   and related items exist in `frontend/src/pages/inventory/json/items`.
3. When updating the `image` field, reuse an existing image URL already in the
   repository; do not introduce new or external images.
4. Update or create the process's `hardening` block, incrementing `passes`,
   refreshing the evaluator `score`, swapping the status `emoji` and appending a
   history entry with the Codex task ID, date and score. Choose the emoji based
   on:
   - 0 passes → score 0 → 🛠️ Draft
   - ≥1 pass & score ≥60 → 🌀 First polishing pass
   - ≥2 passes & score ≥75 → ✅ Meets internal quality bar
   - ≥3 passes & score ≥90 → 💯 Hardened – locked until spec change
   Example:
   "hardening": {
     "passes": 1,
     "score": 60,
     "emoji": "🌀",
     "history": [
       { "task": "codex-upgrade-2025-09-01", "date": "2025-09-01", "score": 60 }
     ]
   }
5. Run `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm test -- processQuality`. Update docs or items if needed.
6. Run `git diff --cached | detect-secrets scan --string` before committing.
7. Use an emoji-prefixed commit message like `📝 : refine process details`.

OUTPUT:
A pull request with the refined process, updated hardening block and passing tests.
```

## Additional tips for AI assistance

Modern assistants can be powerful collaborators. Keep in mind:

-   **Provide clear context** about DSPACE's educational mission and sustainability focus.
-   **Use system prompts** to guide tone and technical accuracy.
-   **Iterate on outputs** rather than expecting perfection on the first try.
-   **Fact-check technical information** since AI systems can generate plausible
    but incorrect details.

[codex-cli]: https://github.com/microsoft/Codex-CLI

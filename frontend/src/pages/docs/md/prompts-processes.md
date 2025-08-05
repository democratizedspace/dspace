---
title: 'Process Prompts'
slug: 'prompts-processes'
---

# Writing great process prompts for the _dspace_ repo (v3)

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

## 1 Quick start (Web vs CLI)

| Use‑case                | Codex Web (ChatGPT sidebar) | Codex CLI                                                          |
| ----------------------- | --------------------------- | ------------------------------------------------------------------ |
| Add or update a process | “Code” button, attach repo  | `codex "add process 3dprinting/solar-mount"`                       |
| Ask about process data  | “Ask” button                | `codex exec "explain frontend/src/pages/processes/processes.json"` |
| Run process tests       | –                           | `codex exec --full-auto "npm test -- processQuality itemQuality"`  |

See the upstream CLI reference for more flags.

---

## 2 Prompt ingredients

| Ingredient           | Why it matters                                                          |
| -------------------- | ----------------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Add lettuce seed input to hydroponics”). |
| **Files to touch**   | Limits search space → faster & cheaper.                                 |
| **Constraints**      | Coding style, a11y, process schema rules.                               |
| **Acceptance check** | e.g. “`npm test -- processQuality itemQuality` passes”.                 |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt‑level rules short and concrete.

---

## 3 Reusable template

```text
You are working in democratizedspace/dspace (branch v3).

GOAL: <one sentence process addition or edit>.

FILES OF INTEREST
- frontend/src/pages/processes/processes.json   ← process registry

REQUIREMENTS
1. Follow the process schema.
2. Use realistic durations and item relationships.
3. Ensure quests referencing this process use its ID; add or update those quests
   if necessary.
4. Use an existing image from `frontend/public/assets` for related items or
   processes; do **not** add image files to the PR.
5. Run `npm run lint`, `npm run type-check` and `npm run build`.
6. Run `npm test -- processQuality itemQuality` and fix any failures.
7. Update docs or items if needed.

OUTPUT
Return **only** the patch (diff) needed.
```

## Implementation Prompt

Use this when you want Codex to automatically create or upgrade a process.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Edit or create
processes under `frontend/src/pages/processes/processes.json`. Ensure realistic
steps, durations, item references, and passing checks (`npm run lint`, `npm run
type-check`, `npm run build`, and `npm test -- processQuality itemQuality`). Link
the process to quests that should use it and add missing references. Use
existing images from `frontend/public/assets` for any new items or processes;
do **not** commit image files.

USER:
1. Follow the steps above.
2. Update quests so they reference this process where appropriate.
3. Reuse an existing image asset; avoid adding image files.
4. Run the commands listed in the system prompt before committing.
5. Summarize the new or updated process in the PR description.

OUTPUT:
A pull request implementing the process with all tests green.
```

## Upgrade prompt for existing processes

Use this prompt to refine processes and track quality as the game evolves.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository (branch v3).

USER:
1. Pick a process from `frontend/src/pages/processes/processes.json` that lacks a
   `hardening` block or has a low score.
2. Improve clarity, realism and item references. Ensure durations are feasible
   and related items exist in `frontend/src/pages/inventory/json/items.json`.
3. Update or create the process's `hardening` block, incrementing `passes`,
   refreshing the evaluator `score`, swapping the status `emoji` and appending a
   history entry with the Codex task ID, date and score. Choose the emoji based
   on:
   - 0 passes → score 0 → 🛠️ Draft
   - ≥1 pass & score ≥60 → 🌀 First polishing pass
   - ≥2 passes & score ≥75 → ✅ Meets internal quality bar
   - ≥3 passes & score ≥90 → 💯 Hardened – locked until spec change
   Example:
   "hardening": {
     "passes": 1,
     "score": 60,
     "emoji": "🌀",
    "history": [
      { "task": "codex-upgrade-2025-09-01", "date": "2025-09-01", "score": 60 }
    ]
  }
4. Reuse an existing image asset; do **not** add image files to the PR.
5. Run `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm test -- processQuality itemQuality`. Update docs or items if needed.

OUTPUT:
A pull request with the refined process, updated hardening block and passing tests.
```

## Additional tips for AI assistance

Modern assistants can be powerful collaborators. Keep in mind:

- **Provide clear context** about DSPACE's educational mission and sustainability focus.
- **Use system prompts** to guide tone and technical accuracy.
- **Iterate on outputs** rather than expecting perfection on the first try.
- **Fact-check technical information** since AI systems can generate plausible but incorrect details.

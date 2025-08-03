---
title: 'New Quest Prompts'
slug: 'prompts-new-quests'
---

# Maintaining the new quest list for the _dspace_ repo (v3)

Codex is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready‑made PR—but only if you give it a
clear, file‑scoped prompt. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when working on the
[`new-quests-v3.md`](./new-quests-v3.md) list. This file tracks quests on
the `v3` branch that have not yet landed on `main`.

> **TL;DR**
>
> 1. Regenerate the list after adding or merging quests.
> 2. Say exactly what output you expect (diff, tests, docs).
> 3. Stop when the spec is complete. Codex treats all remaining text as
>    mandatory instructions.

---

## 1 Quick start (Web vs CLI)

| Use‑case              | Codex Web (ChatGPT sidebar) | Codex CLI                                        |
| --------------------- | --------------------------- | ------------------------------------------------ |
| Refresh quest list    | “Code” button, attach repo  | `codex exec "npm run new-quests:update"`         |
| Ask about new quests  | “Ask” button                | `codex exec "explain frontend/src/pages/docs/md/new-quests-v3.md"` |

See the upstream CLI reference for more flags.

---

## 2 Prompt ingredients

| Ingredient           | Why it matters                                                          |
| -------------------- | ----------------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Update new quest list after merge”).      |
| **Files to touch**   | Limits search space → faster & cheaper.                                 |
| **Constraints**      | Coding style, doc formatting rules.                                     |
| **Acceptance check** | e.g. “`npm run new-quests:update` and `npm test -- questCanonical questQuality` pass”. |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt‑level rules short and concrete.

---

## 3 Reusable template

```text
You are working in democratizedspace/dspace (branch v3).

GOAL: <refresh the list of quests new to v3>.

FILES OF INTEREST
- frontend/src/pages/docs/md/new-quests-v3.md   ← quest list (auto-generated)
- scripts/update-new-quests-v3.js               ← generation script

REQUIREMENTS
1. Run `npm run new-quests:update`.
2. Ensure all quests on `v3` absent from `main` appear in the list.
3. Run `npm test -- questCanonical questQuality` and fix any failures.
4. Update docs or quests if needed.

OUTPUT
Return **only** the patch (diff) needed.
```

## Implementation Prompt

Use this when you want Codex to automatically refresh the new quest list.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Update
`frontend/src/pages/docs/md/new-quests-v3.md` using the provided script so it
lists quests present on branch `v3` but missing on `main`.

USER:
1. Run `npm run new-quests:update`.
2. Run `npm test -- questCanonical questQuality`.
3. Summarize changes in the PR description.

OUTPUT:
A pull request with the refreshed list and passing tests.
```

## Additional tips for AI assistance

Modern assistants can be powerful collaborators. Keep in mind:

-   **Provide clear context** about DSPACE's educational mission and sustainability focus.
-   **Use system prompts** to guide tone and technical accuracy.
-   **Iterate on outputs** rather than expecting perfection on the first try.
-   **Fact-check technical information** since AI systems can generate plausible but incorrect details.


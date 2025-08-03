---
title: 'Item Prompts'
slug: 'prompts-items'
---

# Writing great item prompts for the _dspace_ repo (v3)

Codex is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready‑made PR—but only if you give it a
clear, file‑scoped prompt. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when working on items. For general
content rules see the [Item Development Guidelines](/docs/item-guidelines).

> **TL;DR**
>
> 1. Scope changes to a single item entry.
> 2. Say exactly what output you expect (diff, tests, docs).
> 3. Stop when the spec is complete. Codex treats all remaining text as
>    mandatory instructions.

---

## 1 Quick start (Web vs CLI)

| Use‑case              | Codex Web (ChatGPT sidebar) | Codex CLI                                                           |
| --------------------- | --------------------------- | ------------------------------------------------------------------- |
| Add or update an item | “Code” button, attach repo  | `codex "add item solar-cell-junction-box"`                          |
| Ask about item data   | “Ask” button                | `codex exec "explain frontend/src/pages/inventory/json/items.json"` |
| Run item tests        | –                           | `codex exec --full-auto "npm test -- itemValidation itemQuality"`   |

See the upstream CLI reference for more flags.

---

## 2 Prompt ingredients

| Ingredient           | Why it matters                                                      |
| -------------------- | ------------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Add price to `white PLA filament`”). |
| **Files to touch**   | Limits search space → faster & cheaper.                             |
| **Constraints**      | Coding style, a11y, item schema rules.                              |
| **Acceptance check** | e.g. “`npm test -- itemValidation itemQuality` passes”.             |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt‑level rules short and concrete.

---

## 3 Reusable template

```text
You are working in democratizedspace/dspace (branch v3).

GOAL: <one sentence item addition or edit>.

FILES OF INTEREST
- frontend/src/pages/inventory/json/items.json   ← item registry
- frontend/src/pages/inventory/jsonSchemas/item.json   ← schema

REQUIREMENTS
1. Follow the item schema.
2. Reflect real-world materials or devices.
3. Run `npm test -- itemValidation itemQuality` and fix any failures.
4. Update docs or processes if needed.

OUTPUT
Return **only** the patch (diff) needed.
```

## Implementation Prompt

Use this when you want Codex to automatically create or upgrade an item.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Edit or create
items under `frontend/src/pages/inventory/json/items.json`. Ensure realistic
details, required fields, and passing `npm test -- itemValidation itemQuality`.

USER:
1. Follow the steps above.
2. Run the item tests before committing.
3. Summarize the new or updated item in the PR description.

OUTPUT:
A pull request implementing the item with all tests green.
```

## Upgrade prompt for existing items

Apply this prompt to refine items and track quality over time.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository (branch v3).

USER:
1. Pick an item from `frontend/src/pages/inventory/json/items.json` that lacks a
   `hardening` block or has a low score.
2. Improve clarity, realism and units. Ensure prices and descriptions match
   real-world expectations and that related processes reference the item
   correctly.
3. Update or create the item's `hardening` block, incrementing `passes`,
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
4. Run `npm test -- itemValidation itemQuality processQuality` and update docs if
   needed.

OUTPUT:
A pull request with the refined item, updated hardening block and passing tests.
```

## Additional tips for AI assistance

Modern assistants can be powerful collaborators. Keep in mind:

-   **Provide clear context** about DSPACE's educational mission and sustainability focus.
-   **Use system prompts** to guide tone and technical accuracy.
-   **Iterate on outputs** rather than expecting perfection on the first try.
-   **Fact-check technical information** since AI systems can generate plausible but incorrect details.

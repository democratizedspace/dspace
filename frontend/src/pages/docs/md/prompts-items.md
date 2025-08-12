---
title: 'Item Prompts'
slug: 'prompts-items'
---

# Writing great item prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready-made PR—but only if you give it a
clear, file-scoped prompt. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when working on items. For general
content rules see the [Item Development Guidelines](/docs/item-guidelines).

> **TL;DR**
>
> 1. Scope changes to a single item entry.
> 2. Say exactly what output you expect (diff, tests, docs).
> 3. Stop when the spec is complete. Codex treats all remaining text as
>    mandatory instructions.

---

## 1 Quick start (Web vs CLI)

-   **Add or update an item**
    -   Web: use the “Code” button and attach the repo.
    -   CLI: `codex "add item solar-cell-junction-box"`
-   **Ask about item data**
    -   Web: use the “Ask” button.
    -   CLI: `codex exec "explain frontend/src/pages/inventory/json/items/*.json"`
-   **Run item tests**
    -   Web: not supported yet.
    -   CLI:
        ```bash
        codex exec "npm run lint && npm run type-check && npm run build && npm run itemValidation && npm test -- itemQuality"
        ```

See the [Codex CLI repository][codex-cli] for more flags.

---

## 2 Prompt ingredients

| Ingredient           | Why it matters                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Add price to `white PLA filament`”).                                                     |
| **Files to touch**   | Limits search space → faster & cheaper.                                                                                 |
| **Constraints**      | Coding style, a11y, item schema rules.                                                                                  |
| **Acceptance check** | `npm run lint`, `npm run type-check`, `npm run build`,<br>`npm run itemValidation`, and `npm test -- itemQuality` pass. |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt-level rules short and concrete.

---

## 3 Reusable template

```text
You are working in democratizedspace/dspace.

GOAL: <one sentence item addition or edit>.

FILES OF INTEREST
- frontend/src/pages/inventory/json/items/*  ← item registry
- frontend/src/pages/inventory/jsonSchemas/item.json   ← schema

REQUIREMENTS
1. Follow the item schema.
2. Reflect real-world materials or devices.
3. Ensure the item is referenced by at least one quest or process; update those
   files and create missing processes as needed.
4. Use only existing image assets; do not add new image files.
5. Run `npm run lint`, `npm run type-check` and `npm run build`.
6. Run `npm run itemValidation` and `npm test -- itemQuality`, fixing any failures.
7. Run `git diff --cached | detect-secrets scan --string` and ensure no secrets.
8. Use an emoji-prefixed commit message like `📝 : add price field`.
9. Update docs or processes if needed.

OUTPUT
Return **only** the patch (diff) needed.
```

## Implementation Prompt

Use this when you want Codex to automatically create or upgrade an item.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Edit or
create items under `frontend/src/pages/inventory/json/items`, choosing the
appropriate category file. Ensure realistic details, required fields, and
passing checks (`npm run lint`, `npm run type-check`, `npm run build`,
`npm run itemValidation`, and `npm test -- itemQuality`).
Verify the item appears in at least one quest or process, reuse existing image
assets, and scan for secrets with `git diff --cached | ./scripts/scan-secrets.py` before
committing. If a quest's text changes, run `npm test -- questQuality` and update the quest's
`hardening` block with a fresh evaluation score.

USER:
1. Follow the steps above.
2. Run the commands listed in the system prompt before committing, including quest quality
   checks when quests are modified.
3. Summarize the new or updated item in the PR description.
4. Use an emoji-prefixed commit message like `📝 : add price field`.

OUTPUT:
A pull request implementing the item with all tests green.
```

## Upgrade prompt for existing items

Apply this prompt to refine items and track quality over time.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository.

USER:
1. Pick an item from `frontend/src/pages/inventory/json/items` that lacks a
   `hardening` block or has a low score.
2. Improve clarity, realism and units. Ensure prices and descriptions match
   real-world expectations and that related processes reference the item
   correctly.
3. When modifying the `image` field, reuse an existing image URL already in the
   repository; do not add new or external images.
4. Update or create the item's `hardening` block, incrementing `passes`,
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
5. Run `npm run lint`, `npm run type-check`, `npm run build`, `npm run itemValidation`,
   and `npm test -- itemQuality`. Update docs if needed.
6. Run `git diff --cached | detect-secrets scan --string` before committing.
7. Use an emoji-prefixed commit message like `📝 : refine item details`.

OUTPUT:
A pull request with the refined item, updated hardening block and passing tests.
```

## Additional tips for AI assistance

Modern assistants can be powerful collaborators. Keep in mind:

-   **Provide clear context** about DSPACE's educational mission and sustainability focus.
-   **Use system prompts** to guide tone and technical accuracy.
-   **Iterate on outputs** rather than expecting perfection on the first try.
-   **Fact-check technical information** since AI systems can generate plausible
    but incorrect details.

[codex-cli]: https://github.com/microsoft/Codex-CLI

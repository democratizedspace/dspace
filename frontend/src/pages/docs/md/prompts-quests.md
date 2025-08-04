---
title: 'Quest Prompts'
slug: 'prompts-quests'
---

# Writing great quest prompts for the _dspace_ repo (v3)

Codex is a sandboxed engineering agent that can open this repository,
run its own tests, and send you a ready‑made PR—but only if you give it a
clear, file‑scoped prompt. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when working on quests. For the steps
required to share quests with the community, see the
[Quest Submission Guide](/docs/quest-submission). Comprehensive content
guidelines live in our [Content Development Guide](/docs/content-development),
which covers quests, items and processes in detail.

> **TL;DR**
>
> 1. Scope changes to a single quest file.
> 2. Say exactly what output you expect (diff, tests, docs).
> 3. Stop when the spec is complete. Codex treats all remaining text as
>    mandatory instructions.

---

## 1 Quick start (Web vs CLI)

| Use‑case              | Codex Web (ChatGPT sidebar) | Codex CLI                                                          |
| --------------------- | --------------------------- | ------------------------------------------------------------------ |
| Add or update a quest | “Code” button, attach repo  | `codex "add quest solar/led-basics"`                               |
| Ask about quest files | “Ask” button                | `codex exec "explain frontend/src/pages/quests/json/*.json"`       |
| Run quest tests       | –                           | `codex exec --full-auto "npm test -- questCanonical questQuality"` |

See the upstream CLI reference for more flags.

---

## 2 Prompt ingredients

| Ingredient           | Why it matters                                                      |
| -------------------- | ------------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Add safety step to `energy/solar`”). |
| **Files to touch**   | Limits search space → faster & cheaper.                             |
| **Constraints**      | Coding style, a11y, quest schema rules.                             |
| **Acceptance check** | e.g. “`npm test -- questCanonical questQuality` passes”.            |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep
prompt‑level rules short and concrete.

---

## 3 Reusable template

```text
You are working in democratizedspace/dspace (branch v3).

GOAL: <one sentence quest addition or edit>.

FILES OF INTEREST
- frontend/src/pages/quests/json/<quest-id>.json   ← quest definition

REQUIREMENTS
1. Follow the quest schema.
2. Reference at least one inventory item or process.
3. Run `npm run lint`, `npm run type-check` and `npm run build`.
4. Run `npm test -- questCanonical questQuality` and fix any failures.
5. Update docs or dialogue as needed.

OUTPUT
Return **only** the patch (diff) needed.
```

## Implementation Prompt

Use this when you want Codex to automatically create or upgrade a quest.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Edit or create
quests under `frontend/src/pages/quests/json`. Ensure start, middle and
completion nodes, at least one item or process reference, and passing checks
(`npm run lint`, `npm run type-check`, `npm run build`, and
`npm test -- questCanonical questQuality`).

USER:
1. Follow the steps above.
2. Run the commands listed in the system prompt before committing.
3. Summarize the new or updated quest in the PR description.

OUTPUT:
A pull request implementing the quest with all tests green.
```

## One-click random quest

Spin up a brand‑new quest in a random quest tree with this drop‑in prompt. The
hand‑crafted quests on `main` are good references for tone and structure.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository (branch v3). List
the folders under `frontend/src/pages/quests/json` and pick one at random. Use
existing quests in that tree as examples for tone and structure.

USER:
1. Create a new quest JSON in the chosen tree following the quest schema.
2. Reference at least one inventory item or process.
3. Run `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm test -- questCanonical questQuality`. Fix any failures.

OUTPUT:
Return only the diff with the new quest.
```

## Upgrade prompt for new quests

Focus on quests recently added on the `v3` branch — [see the list](/docs/new-quests-v3) —
to keep quality high as the codebase grows. This prompt uses the quest
quality tests to ensure that every technological step is represented in
the inventory (`items.json`) and process (`processes.json`) registries and
grounded in reality with components that can be replicated in real life,
while the hardening loop tracks refinement passes over time.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository (branch v3).

USER:
1. Pick a quest ID from `frontend/src/pages/quests/json` that also appears in
   `/docs/new-quests-v3`.
2. Improve clarity, safety notes and item or process references.
3. Check that every technology mentioned has a granular, real‑world entry in
   `frontend/src/pages/inventory/json/items.json` or
   `frontend/src/pages/processes/processes.json`. Add missing items or
   processes so quests stay grounded in reality and are reproducible IRL.
4. Update the quest's `hardening` block, incrementing `passes`, refreshing the
   evaluator `score`, swapping the status `emoji` and appending a history entry
   with the Codex task ID, date and score. Choose the emoji based on:
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
5. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm test --
   questCanonical questQuality itemQuality processQuality`. Update docs if
   needed.

OUTPUT:
A pull request with the refined quest, updated hardening block and passing tests.
```

## Additional tips for AI assistance

Modern assistants can be powerful collaborators. Keep in mind:

-   **Provide clear context** about DSPACE's educational mission and sustainability focus.
-   **Use system prompts** to guide tone and technical accuracy.
-   **Iterate on outputs** rather than expecting perfection on the first try.
-   **Fact-check technical information** since AI systems can generate plausible but incorrect details.

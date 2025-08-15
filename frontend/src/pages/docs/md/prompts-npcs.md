---
title: 'NPC Prompts'
slug: 'prompts-npcs'
---

# Writing great NPC prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run its own tests, and
send you a ready-made PR—but only if you give it a clear, file-scoped prompt. Use this guide
alongside [Codex Prompts](/docs/prompts-codex) when working on NPC bios or dialogue. Consult the
[NPCs guide](/docs/npcs) for voice and lore details. To keep the prompt docs evolving, see the
[Codex meta prompt](/docs/prompts-codex-meta). If these templates drift, refresh them with the
[Codex Prompt Upgrader](/docs/prompts-codex-upgrader).

> **TL;DR**
>
> 1. Scope changes to a single NPC.
> 2. Specify the expected output (tests, docs).
> 3. Stop when the spec is complete; remaining text becomes mandatory.

---

## 1. Quick start (Web vs CLI)

-   **Add or update an NPC**
    -   Web: use the “Code” button and attach the repo.
    -   CLI: `codex "update npc dChat"`
-   **Ask about NPC data**
    -   Web: use the “Ask” button.
    -   CLI: `codex exec "explain frontend/src/pages/docs/md/npcs.md"`
-   **Run checks**
    -   Web: not supported yet.
    -   CLI:
        ```bash
        codex exec "npm run lint && npm run type-check && npm run build && npm run test:ci"
        ```

See the [OpenAI CLI repository][openai-cli] for more flags.

---

## 2. Prompt ingredients

| Ingredient           | Why it matters                                                 |
| -------------------- | -------------------------------------------------------------- |
| **Goal sentence**    | Gives the agent a north star (“Add sample dialogue for Nova”). |
| **Files to touch**   | Limits search space → faster & cheaper.                        |
| **Constraints**      | Coding style, lore rules, NPC schema.                          |
| **Acceptance check** | e.g. “All tests pass”.                                         |

Codex merges those instructions with any `AGENTS.md` files it finds, so keep prompt-level rules short and concrete.

---

## 3. Reusable template

```text
You are working in democratizedspace/dspace.

GOAL: <one sentence NPC addition or edit>.

FILES OF INTEREST
- frontend/src/pages/docs/md/npcs.md ← NPC bios and dialogue

REQUIREMENTS
1. Preserve established character voice and lore.
2. Keep sample dialogue short and approachable.
3. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
4. Run `git diff --cached | ./scripts/scan-secrets.py` and ensure no secrets.
5. Update related docs if needed.

OUTPUT
A pull request with the updated NPC and passing checks.
```

## Implementation Prompt

Use this when you want Codex to automatically create or upgrade an NPC entry.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Edit `frontend/src/pages/docs/md/npcs.md`, adding or refining NPC sections. Maintain each character’s voice, keep sample dialogue realistic, and ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci` pass. Scan for secrets with `git diff --cached | ./scripts/scan-secrets.py` before committing.

USER:
1. Follow the steps above.
2. Summarize the NPC changes in the PR description.
3. Use an emoji-prefixed commit message like `📝 : – update NPC dialogue`.

OUTPUT:
A pull request with the updated NPC doc and passing tests.
```

## Upgrade prompt for existing NPCs

Use this prompt to refine NPC bios and dialogue over time.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository.

USER:
1. Pick an NPC from `frontend/src/pages/docs/md/npcs.md` that needs clearer voice or updated facts.
2. Improve characterization and ensure dialogue stays concise and in-universe.
3. Reuse existing image assets; do not add new images.
4. Cross-reference related quests or processes and update them if needed.
5. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
6. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
7. Use an emoji-prefixed commit message like `📝 : – refine NPC bio`.

OUTPUT:
A pull request with the refined NPC and passing checks.
```

## Additional tips for AI assistance

Modern assistants can be powerful collaborators. Keep in mind:

-   **Provide clear context** about DSPACE's educational mission and sustainability focus.
-   **Use system prompts** to guide tone and technical accuracy.
-   **Iterate on outputs** rather than expecting perfection on the first try.
-   **Fact-check technical information** since AI systems can generate plausible but incorrect details.

[openai-cli]: https://github.com/openai/openai-cli

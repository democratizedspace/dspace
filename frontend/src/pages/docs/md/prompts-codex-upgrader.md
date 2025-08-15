---
title: 'Codex Prompt Upgrader'
slug: 'prompts-codex-upgrader'
---

# Codex Prompt Upgrader

Use this meta prompt when the Codex templates themselves need refreshing. It keeps our
instructions current—the machine that builds the machine. When adding a new prompt,
remember to link it from `prompts-codex.md` and the docs index.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and
`README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`
all pass before committing.

USER:
1. Audit `frontend/src/pages/docs/md/prompts-*` for stale guidance or missing cross-links.
2. Update prompt templates, including `prompts-codex.md`, to reflect current practices.
3. Link new prompt files from `prompts-codex.md` and the docs index.
4. Propagate related changes across docs.
5. Run the checks above.

OUTPUT:
A pull request refreshing the Codex prompt docs with passing checks.
```

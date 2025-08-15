---
title: 'Codex Prompt Upgrader'
slug: 'prompts-codex-upgrader'
---

# Codex Prompt Upgrader

Use this meta prompt when the Codex templates themselves need refreshing. It keeps our
instructions current—the machine that builds the machine. See
[Codex Prompts](/docs/prompts-codex) for the baseline templates.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and
`README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`
all pass before committing.

USER:
1. Audit `frontend/src/pages/docs/md/prompts-*` for stale guidance or missing cross-links.
2. Update prompt templates, including `prompts-codex.md`, to reflect current practices.
3. Propagate related changes across docs.
4. Run the checks above.

OUTPUT:
A pull request refreshing the Codex prompt docs with passing checks.
```

---
title: 'Codex Meta-Upgrade Prompt'
slug: 'prompts-codex-meta'
---

# Codex Meta-Upgrade Prompt

This document captures the prompt that teaches Codex how to improve its own
prompt library. Use it when the existing upgrade prompt is insufficient or when
new prompt categories are needed.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check`, and `npm run build`
pass before committing.

USER:
1. Locate prompt documentation in `frontend/src/pages/docs/md/` that should be
   expanded or reorganized.
2. Create or revise files to guide future agents in upgrading DSPACE prompts.
3. Cross-link new docs from `prompts-codex.md`.
4. Run the checks above.

OUTPUT:
A pull request enhancing the prompt ecosystem with passing checks.
```

---
title: 'Codex Meta Prompt'
slug: 'prompts-codex-meta'
---

# Codex Meta Prompt

Use this prompt when you want Codex to upgrade DSPACE's prompt documentation so the
instructions improve themselves over time. For updating the Codex prompt templates
themselves, see the [Prompt Upgrader](/docs/prompts-codex-upgrader).

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing. Scan for secrets with
`git diff --cached | ./scripts/scan-secrets.py`.

USER:
1. Select one or more `prompts-*.md` files under `frontend/src/pages/docs/md/`.
2. Refine wording, fix links, or add new prompts when gaps appear.
3. If you introduce a new prompt, link it from `prompts-codex.md` and the docs index.
4. Use an emoji-prefixed commit message and run the checks above.

OUTPUT:
A pull request with upgraded prompt docs and passing checks.
```

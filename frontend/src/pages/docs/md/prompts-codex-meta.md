---
title: 'Codex Meta Prompt'
slug: 'prompts-codex-meta'
---

# Codex Meta Prompt

Use this prompt when you want Codex to upgrade DSPACE's prompt documentation so the
instructions improve themselves over time. Start from the baseline
[Codex Prompts](/docs/prompts-codex). If the templates themselves drift, refresh them
using the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing workflows,
see the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Select one or more `prompts-*.md` files under `frontend/src/pages/docs/md/`.
2. Refine wording, fix links, or add new prompts when gaps appear.
3. If you introduce a new prompt, link it from `prompts-codex.md` and the docs index.
4. Run the checks above.
5. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with upgraded prompt docs and passing checks.
```

## Upgrader Prompt

Type: evergreen

Use this prompt to keep meta-prompt guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Cross-link new prompt docs and prune obsolete ones.
2. Clarify cadence and scope for routine prompt maintenance.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the Codex meta prompt doc with passing checks.
```

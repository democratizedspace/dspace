---
title: 'Codex Meta Prompt'
slug: 'prompts-codex-meta'
---

# Codex Meta Prompt

Use this prompt when you want Codex to upgrade DSPACE's prompt documentation so the
instructions improve themselves over time. Start from the baseline
[Codex Prompts](/docs/prompts-codex). If the templates themselves drift, refresh them
using the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing workflows,
see the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix); for merge conflicts,
use the [Codex merge conflict prompt](/docs/prompts-codex-merge-conflicts).

Audit prompt docs monthly and after major workflow changes. This review covers all
`prompts-*.md` files under `frontend/src/pages/docs/md/`, links from `prompts-codex.md`,
and entries on the docs index. Add new prompts and remove or update deprecated ones.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Select one or more `prompts-*.md` files under `frontend/src/pages/docs/md/`.
2. Refine wording, cross-link new prompt docs, or remove obsolete ones.
3. If you introduce a new prompt, link it from `prompts-codex.md` and the docs index.
4. Review prompt docs monthly and after major workflow changes.
5. Run the checks above.
6. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
7. Use an emoji-prefixed commit message.

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
2. Confirm maintenance cadence and scope remain accurate.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the Codex meta prompt doc with passing checks.
```

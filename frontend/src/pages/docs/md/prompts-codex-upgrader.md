---
title: 'Codex Prompt Upgrader'
slug: 'prompts-codex-upgrader'
---

# Codex Prompt Upgrader

Use this meta prompt when the Codex templates themselves need refreshing. It keeps our
instructions current—the machine that builds the machine. See
[Codex Prompts](/docs/prompts-codex) for the baseline templates, the
[Codex Meta Prompt](/docs/prompts-codex-meta) for routine maintenance, and the
[Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix) for troubleshooting failing
workflows.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and
`README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`, and
`npm run test:ci` all pass before committing.

USER:
1. Audit `frontend/src/pages/docs/md/prompts-*` for stale guidance or missing cross-links.
2. Update prompt templates, including `prompts-codex.md`, to reflect current practices.
3. Link new prompt files from `prompts-codex.md` and the docs index.
4. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
5. Run the checks above.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request refreshing the Codex prompt docs with passing checks.
```

## Upgrader Prompt

Type: evergreen

Use this prompt to keep prompt-upgrader instructions current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Ensure it covers newly added prompt types and required checks.
2. Tighten language so upgrades stay precise and reversible.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the Codex Prompt Upgrader doc with passing checks.
```

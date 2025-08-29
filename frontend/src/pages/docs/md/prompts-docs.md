---
title: 'Documentation Prompts'
slug: 'prompts-docs'
---

# Documentation prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run tests, and submit a
ready-made PR — but only if given a clear, file-scoped prompt. Use this guide alongside
[Codex Prompts](prompts-codex.md) when updating Markdown or JSDoc so instructions stay
current and consistent. To keep these templates evolving, see the
[Codex meta prompt](prompts-codex-meta.md). If they drift, refresh them with the
[Codex Prompt Upgrader](prompts-codex-upgrader.md). For failing GitHub Actions runs, use the
[Codex CI-failure fix prompt](prompts-codex-ci-fix.md). When branches diverge, resolve conflicts with the
[Codex merge conflict prompt](prompts-codex-merge-conflicts.md).

> **TL;DR**
>
> 1. Limit changes to the relevant docs.
> 2. Fix outdated wording, links, or formatting.
> 3. Link new prompt docs from [`prompts-codex.md`](prompts-codex.md) and
>    `frontend/src/pages/docs/index.astro`.
> 4. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
>    `npm run test:ci`.
> 5. Scan for secrets with `git diff --cached | ./scripts/scan-secrets.py`
>    and use an emoji-prefixed commit message.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
`npm run test:ci` pass before committing.

USER:
1. Edit or add docs under `frontend/src/pages/docs/md`.
2. Correct stale guidance, links, or formatting.
3. If adding a new prompt doc, link it from `prompts-codex.md`
   and the docs index (`frontend/src/pages/docs/index.astro`).
4. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
   `npm run test:ci`.
5. Scan for secrets with `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with refreshed documentation and passing checks.
```

## Proofreading prompt

Use this to polish grammar and style without changing technical meaning.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
`npm run test:ci` pass before committing.

USER:
1. Proofread the selected docs for typos, grammar, and clarity.
2. Preserve the original intent and technical accuracy.
3. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
4. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with polished documentation and passing checks.
```

## Cross-link check prompt

Use this when adding or renaming docs to keep internal links current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`, and
`npm run test:ci` pass before committing.

USER:
1. Audit the documentation for missing or broken cross-links.
2. Update `frontend/src/pages/docs/index.astro` and related guides to reference the new pages.
3. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
4. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with updated links and passing checks.
```

## Upgrader Prompt

Type: evergreen

Use this prompt to keep documentation-writing guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Verify links to style guides and prompt docs remain valid.
2. Capture new Markdown or JSDoc conventions.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the documentation prompt doc with passing checks.
```

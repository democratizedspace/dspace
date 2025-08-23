---
title: 'Backend Prompts'
slug: 'prompts-backend'
---

# Backend prompts for the _dspace_ repo

DSPACE is mostly frontend code, but a few backend pieces support self-hosting via
[Sugarkube's Raspberry Pi cluster](https://github.com/futuroptimist/sugarkube/blob/main/docs/raspi_cluster_setup.md).
Use this guide alongside [Codex Prompts](/docs/prompts-codex) when editing
`backend/` modules. Contributions must deliver clear user value and honor
end-user privacy, dignity, and agency as outlined in
[Gabriel](https://github.com/futuroptimist/gabriel). To keep the prompt docs
evolving, see the [Codex meta prompt](/docs/prompts-codex-meta). If these
templates drift, refresh them with the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader).
For failing GitHub Actions runs, use the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Scope changes to specific `backend/` modules that enable self-hosting or other
>    substantial improvements.
> 2. Favor open-source, self-hosted services and minimize data collection;
>    obtain explicit user consent before storing or transmitting information.
> 3. Add or update tests in `backend/__tests__` when behavior changes.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
> 6. Commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Update backend files under `backend/`.
2. Prefer small, self-hosted services compatible with the Sugarkube cluster.
3. Preserve end-user privacy and agency; avoid logging or transmitting personal data.
4. Keep code idiomatic and covered by tests.
5. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with the backend change and passing checks.
```

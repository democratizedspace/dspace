---
title: 'Monitoring Prompts'
slug: 'prompts-monitoring'
---

# Monitoring prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run tests, and submit
ready-made pull requests. Use this guide alongside [Codex Prompts](/docs/prompts-codex)
when editing files under [`monitoring/`](https://github.com/democratizedspace/dspace/tree/main/monitoring)
to keep metrics, dashboards, and alerts consistent.
To keep the prompt docs evolving, see the [Codex meta prompt](/docs/prompts-codex-meta); if
these templates drift, refresh them with the
[Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing GitHub Actions runs, use the
[Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Scope changes to `monitoring/` configs or supporting scripts.
> 2. Prefer lightweight, self-hosted tools and avoid collecting personal data.
> 3. Add sample dashboards or alert rules when relevant.
> 4. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`,
>    `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
> 6. Commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`,
`npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Update monitoring configs or code under `monitoring/`.
2. Use open-source, self-hosted tools (e.g., Prometheus, Grafana) that respect user privacy.
3. Include or update sample dashboards and alerting rules when adding metrics.
4. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`,
   `npm run build`, and `npm run test:ci`.
5. Scan for secrets with `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with improved monitoring docs or configs and passing checks.
```

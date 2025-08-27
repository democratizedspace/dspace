---
title: 'Dependency Audit Prompts'
slug: 'prompts-audit'
---

# Dependency audit prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run tests, and submit
ready-made pull requests. Use this guide when updating dependencies or addressing
security vulnerabilities. To keep the prompt docs evolving, see the
[Codex meta prompt](/docs/prompts-codex-meta); if these templates drift,
refresh them with the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader).

> **TL;DR**
>
> 1. Address high or critical vulnerabilities in `package.json` or `pnpm-lock.yaml`.
> 2. Prefer minimal, well-maintained packages.
> 3. Run `npm run audit:ci`, `npm run lint`, `npm run type-check`,
>    `npm run build`, and `npm run test:ci`.
> 4. Scan staged changes with `git diff --cached | ripsecrets`.
> 5. Commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run audit:ci`, `npm run lint`, `npm run type-check`,
`npm run build`, and `npm run test:ci` pass before committing.

USER:
1. Resolve dependency vulnerabilities or update packages.
2. Confirm no high-severity issues remain with `npm run audit:ci`.
3. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
4. Scan for secrets with `git diff --cached | ripsecrets` before committing.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request that upgrades dependencies with passing checks.
```

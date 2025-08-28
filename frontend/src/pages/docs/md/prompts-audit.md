---
title: 'Dependency Audit Prompts'
slug: 'prompts-audit'
---

# Dependency audit prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run tests, and submit
ready-made pull requests. Use this guide alongside [Codex Prompts](prompts-codex.md) when
updating dependencies or addressing security vulnerabilities. To keep the prompt docs
evolving, see the [Codex meta prompt](prompts-codex-meta.md); if these templates drift,
refresh them with the [Codex Prompt Upgrader](prompts-codex-upgrader.md). For failing GitHub
Actions runs, use the [Codex CI-failure fix prompt](prompts-codex-ci-fix.md).

> **TL;DR**
>
> 1. Address high or critical vulnerabilities in `package.json`, the root `pnpm-lock.yaml`,
>    and the temporary `frontend/package-lock.json` used during audits.
> 2. Prefer minimal, well-maintained packages. `openai` versions <5 pulled a vulnerable
>    `axios`; use v5+.
> 3. Run `npm run audit:ci` (runs `npm audit --omit=dev --audit-level=high` for root and
>    frontend), `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 4. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
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
4. Scan for secrets with `git diff --cached | ./scripts/scan-secrets.py` before committing.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request that upgrades dependencies with passing checks.
```

## Upgrader Prompt

Type: evergreen

Use this prompt to keep dependency audit instructions current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Ensure audit commands and vulnerability policies match current tooling.
2. Note recent high-risk packages or lockfile locations if paths changed.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the dependency audit prompt doc with passing checks.
```

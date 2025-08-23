---
title: 'Security Prompts'
slug: 'prompts-security'
---

# Security prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run tests,
and submit ready-made pull requests. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when hardening authentication,
authorization or other security-sensitive code.
To keep the prompt docs evolving, see the
[Codex meta prompt](/docs/prompts-codex-meta); if these templates drift, refresh
them with the [Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing
GitHub Actions runs, use the [Codex CI-failure fix
prompt](/docs/prompts-codex-ci-fix).

> **TL;DR**
>
> 1. Scope changes to auth, encryption or input-validation code.
> 2. Follow least privilege and avoid storing secrets in the repo.
> 3. Add regression tests for security-sensitive paths.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build` and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
> 6. Commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Harden authentication, authorization or crypto routines under `backend/` or
   `frontend/`.
2. Follow OWASP best practices and remove dead secrets.
3. Add regression tests for new security features.
4. Run `npm run lint`, `npm run type-check`, `npm run build` and
   `npm run test:ci`.
5. Scan for secrets with `git diff --cached | ./scripts/scan-secrets.py` before
   committing.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request improving security with passing checks.
```

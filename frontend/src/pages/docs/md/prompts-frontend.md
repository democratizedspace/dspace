---
title: 'Frontend Prompts'
slug: 'prompts-frontend'
---

# Frontend prompts for the _dspace_ repo

DSPACE's UI is built with Svelte and Astro. Use this guide when working on files inside
`frontend/`, including Svelte components, pages, and styles. Changes should improve clarity,
accessibility, or performance while keeping tests green.

> **TL;DR**
>
> 1. Touch only the necessary files under `frontend/`.
> 2. Keep components accessible, responsive, and idiomatic.
> 3. Update or add tests in `frontend/__tests__` when behavior changes.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
> 6. Commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md`
and `README.md`. Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Update UI code under `frontend/`.
2. Maintain accessibility and responsive design.
3. Add or adjust tests in `frontend/__tests__` when needed.
4. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request with the frontend change and passing checks.
```

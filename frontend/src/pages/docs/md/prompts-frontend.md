---
title: 'Frontend Prompts'
slug: 'prompts-frontend'
---

# Frontend prompts for the _dspace_ repo

DSPACE's UI is built with Svelte and Astro. Codex can open this repository and run its own
tests. Use this guide alongside [Codex Prompts](prompts-codex.md) when working on files inside
`frontend/`, including Svelte components, pages, and styles. Changes should improve clarity,
accessibility, or performance while keeping tests green. For deeper accessibility guidance, see
[Accessibility prompts](prompts-accessibility.md). To keep the prompt docs evolving, see the
[Codex meta prompt](prompts-codex-meta.md). If templates drift, refresh them with the
[Codex Prompt Upgrader](prompts-codex-upgrader.md). For failing GitHub Actions runs, use the
[Codex CI-failure fix prompt](prompts-codex-ci-fix.md).

## Component paths and build tooling

-   Components live in `frontend/src/components/`, pages in `frontend/src/pages/`, and layouts in
    `frontend/src/layouts/`. Tests belong in `frontend/__tests__/`.
-   Astro uses Vite for bundling. Run `npm run dev` for local work and `npm run build` for
    production bundles.

### Hydration, accessibility, and performance

-   Astro server-renders pages and hydrates Svelte islands. Wrap browser-only logic in `onMount`
    and gate with an `isClientSide` flag.
-   Mark ready components with `data-hydrated="true"` so tests can wait before interacting.
-   Provide visible focus outlines and descriptive `aria-label` values on interactive controls.
-   Disable actions until a selection is made to avoid accidental submissions.
-   Use `loading="lazy"` for offscreen images and keep components lightweight to speed up
    hydration.

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

## Upgrader Prompt

Type: evergreen

Use this prompt to keep frontend development guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Check component paths, build tooling, and hydration notes against current setup.
2. Highlight new patterns for accessibility or performance tuning.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the frontend prompt doc with passing checks.
```

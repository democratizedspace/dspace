---
title: 'Frontend Prompts'
slug: 'prompts-frontend'
---

# Frontend prompts for the _dspace_ repo

DSPACE's UI is built with Svelte and Astro. Codex can open this repository and run its own
tests. Use this guide alongside [Codex Prompts](prompts-codex.md) when working on files inside
`frontend/`, including Svelte components, pages, and styles. Place UI pieces in
`frontend/src/components` and shared utilities in `frontend/src/lib`. Astro pages live in
`frontend/src/pages`. Hydrate Svelte components with Astro `client:` directives and run
interactive code in `onMount`; when hydration completes, set `data-hydrated="true"` on the
component root to avoid double rendering. Changes should improve clarity, accessibility, or
performance while keeping tests green. For deeper accessibility guidance, see
[Accessibility prompts](prompts-accessibility.md). To keep the prompt docs evolving, see the
[Codex meta prompt](prompts-codex-meta.md). If templates drift, refresh them with the
[Codex Prompt Upgrader](prompts-codex-upgrader.md). For failing GitHub Actions runs, use the
[Codex CI-failure fix prompt](prompts-codex-ci-fix.md).

## Current setup

-   **Component paths** – Astro wrappers live in `frontend/src/components`, Svelte UI in
    `frontend/src/components/svelte`, and shared widgets under `frontend/src/lib/components`.
-   **Build tooling** – Astro uses Vite under the hood. Run `npm run dev` for local work and
    `npm run build` to emit the production bundle.
-   **Hydration** – Astro server-renders pages and hydrates Svelte components in the browser. Put
    interactive code in `onMount`, mark hydrated roots with `data-hydrated="true"`, and prefer
    `client:visible` or `client:idle` to defer work.

### Accessibility and performance patterns

-   Prefer semantic HTML with `aria-*` attributes and visible `:focus-visible` states.
-   Defer work with `client:idle` or `client:visible` and `loading="lazy"` images to trim JS.
-   Use dynamic `import()` for heavy modules and lean on CSS for animations.
-   Mark ready components with `data-hydrated="true"` so tests can wait before interacting.
-   Provide visible focus outlines and descriptive `aria-label` values on interactive controls.
-   Disable actions until a selection is made to avoid accidental submissions.
-   Favor semantic HTML, visible focus states, and `prefers-reduced-motion` media queries for
    accessibility.
-   For performance, defer heavy components with `client:idle` or `client:visible` and lazily
    load images using `loading="lazy"` or Astro's `<Image>` component.

> **TL;DR**
>
> 1. Touch only the necessary files under `frontend/`.
> 2. Keep components accessible, responsive, and idiomatic.
> 3. Use `frontend/src/components` (`src/lib` for shared) and hydrate with `client:` directives,
>    setting `data-hydrated="true"` in `onMount`.
> 4. Update or add tests in `frontend/__tests__` when behavior changes.
> 5. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 6. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
> 7. Commit with an emoji prefix.

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

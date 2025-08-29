---
title: 'Accessibility Prompts'
slug: 'prompts-accessibility'
---

# Accessibility prompts for the _dspace_ repo

Codex can open this repository and run its own tests. Use this guide alongside
[Codex Prompts](/docs/prompts-codex) when improving accessibility so instructions stay
consistent. To keep the prompt docs evolving, see the
[Codex meta prompt](/docs/prompts-codex-meta). If templates drift, refresh them with the
[Codex Prompt Upgrader](/docs/prompts-codex-upgrader). For failing GitHub Actions runs, use
the [Codex CI-failure fix prompt](/docs/prompts-codex-ci-fix). The focus here is on semantic
HTML, ARIA attributes, keyboard navigation, sufficient color contrast, and minimum target sizes.

> **TL;DR**
>
> 1. Limit changes to files that impact user accessibility.
> 2. Follow WCAG 2.2 AA: provide focus states, semantic elements, ARIA labels, and adequate
>    target sizes.
> 3. Validate with tooling like `npm run lint`, `@testing-library/svelte`, or `axe-core`, and
>    perform screen‑reader checks when possible.
> 4. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 5. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
> 6. Commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Update files that affect user accessibility.
2. Follow WCAG 2.2 AA with semantic HTML, visible focus states, ARIA labels, and adequate target
   sizes.
3. Validate with linting and, when possible, screen-reader or keyboard checks.
4. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request improving accessibility with passing checks.
```

## Components and patterns

-   [`Button`](../../../components/Button.astro) – includes `aria-label` support and a
    `:focus-visible` ring.
-   [`Menu`](../../../components/svelte/Menu.svelte) – handles keyboard navigation for site
    sections.
-   [`SkipProcessButton`](../../../components/svelte/SkipProcessButton.svelte) – lets users bypass
    a step with a semantic button.

## Upgrader Prompt

Type: evergreen

Use this prompt to keep accessibility guidance current.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Confirm WCAG references and accessibility tooling are up to date.
2. Link to new patterns or components that influence accessibility.
3. Run the checks above.
4. Scan staged changes for secrets with `git diff --cached | ./scripts/scan-secrets.py`.
5. Commit with an emoji-prefixed message.

OUTPUT:
A pull request refining the accessibility prompt doc with passing checks.
```

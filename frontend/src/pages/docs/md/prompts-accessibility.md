---
title: 'Accessibility Prompts'
slug: 'prompts-accessibility'
---

# Accessibility prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run tests, and submit
ready-made pull requests. Use this guide alongside
[Codex Prompts](prompts-codex.md) when improving accessibility so instructions remain
consistent. To keep the prompt docs evolving, see the
[Codex meta prompt](prompts-codex-meta.md). If templates drift, refresh them with the
[Codex Prompt Upgrader](prompts-codex-upgrader.md). For failing GitHub Actions runs, use
the [Codex CI-failure fix prompt](prompts-codex-ci-fix.md). This doc focuses on semantic
HTML, ARIA attributes, keyboard navigation, and sufficient color contrast. As of 2024,
[WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) is the baseline standard.

Recent components like
[Button.astro](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/Button.astro)
and
[Menu.svelte](https://github.com/democratizedspace/dspace/blob/v3/frontend/src/components/svelte/Menu.svelte)
demonstrate built-in labels and keyboard support you can reuse. ESLint's accessibility rules
(`npm run lint`) and tests with `@testing-library/svelte` help keep these patterns in check.

> **TL;DR**
>
> 1. Limit changes to files that impact user accessibility.
> 2. Follow WCAG 2.2 AA: provide focus states, semantic elements, and ARIA labels.
> 3. Validate with ESLint's a11y rules (`npm run lint`) and screen‑reader checks when possible.
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
2. Follow WCAG 2.2 AA with semantic HTML, visible focus states, and ARIA labels.
3. Validate with linting and, when possible, screen-reader or keyboard checks.
4. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
5. Use an emoji-prefixed commit message.

OUTPUT:
A pull request improving accessibility with passing checks.
```

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

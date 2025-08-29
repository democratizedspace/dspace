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
HTML, ARIA attributes, keyboard navigation, and sufficient color contrast.

> **TL;DR**
>
> 1. Limit changes to files that impact user accessibility.
> 2. Follow WCAG 2.2 AA: provide focus states, semantic elements, and ARIA labels.
> 3. Reference accessible components like [Button][button-component]
>    and [Menu][menu-component] for ARIA and focus patterns.
> 4. Validate with tooling like `npm run lint` and screen‑reader checks when possible.
> 5. Run `npm run lint`, `npm run type-check`, `npm run build`, and `npm run test:ci`.
> 6. Scan staged changes with `git diff --cached | ./scripts/scan-secrets.py`.
> 7. Commit with an emoji prefix.

```text
SYSTEM:
You are an automated contributor for the DSPACE repository. Follow `AGENTS.md` and `README.md`.
Ensure `npm run lint`, `npm run type-check`, `npm run build`,
and `npm run test:ci` pass before committing.

USER:
1. Update files that affect user accessibility.
2. Follow WCAG 2.2 AA with semantic HTML, visible focus states, and ARIA labels.
3. Reference accessible components like [Button][button-component]
   and [Menu][menu-component] for examples.
4. Validate with linting and, when possible, screen-reader or keyboard checks.
5. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Use an emoji-prefixed commit message.

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

[button-component]: ../../../components/Button.astro
[menu-component]: ../../../components/svelte/Menu.svelte

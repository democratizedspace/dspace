# Accessibility prompts for the _dspace_ repo

Codex is a sandboxed engineering agent that can open this repository, run tests, and submit
ready-made pull requests. Use this guide alongside
[Codex Prompts](baseline.md) when improving accessibility so instructions remain
consistent. To keep the prompt docs evolving, see the
[Codex meta prompt](meta.md). If templates drift, refresh them with the
[Codex Prompt Upgrader](upgrader.md). For failing GitHub Actions runs, use
the [Codex CI-failure fix prompt](ci-fix.md). This doc focuses on semantic
HTML, ARIA attributes, keyboard navigation, sufficient color contrast, and minimum target sizes.
As of 2024, [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) is the baseline standard.

> **TL;DR**
>
> 1. Limit changes to files that impact user accessibility.
> 2. Follow [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/): provide focus states, semantic elements,
>    ARIA labels, adequate target sizes, and respect user preferences.
> 3. Reference accessible components like [Button][button-component] and [Menu][menu-component]
>    for ARIA and focus patterns.
> 4. Validate with tooling like `npm run lint`, Testing Library's
>    [`getByRole`](https://testing-library.com/docs/queries/byrole/), `@testing-library/svelte`,
>    or `axe-core`, and perform screen-reader and keyboard checks when possible.
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
2. Follow [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) with semantic HTML, visible focus states,
   ARIA labels, and adequate target sizes.
3. Reference accessible components like [Button][button-component] and [Menu][menu-component]
   for examples.
4. Validate with linting and, when possible, Testing Library's `getByRole`, screen-reader, or
   keyboard checks.
5. Run `git diff --cached | ./scripts/scan-secrets.py` before committing.
6. Use an emoji-prefixed commit message.

OUTPUT:
A pull request improving accessibility with passing checks.
```

## Components and patterns

- [`Button`](../../../components/Button.astro) – includes `aria-label` support and a
  `:focus-visible` ring.
- [`Menu`](../../../components/svelte/Menu.svelte) – handles keyboard navigation for site
  sections.
- [`SkipProcessButton`](../../../components/svelte/SkipProcessButton.svelte) – lets users bypass
  a step with a semantic button.
- [Chip](https://github.com/dspace/dspace/blob/main/frontend/src/components/svelte/Chip.svelte)
  provides button and link variants with disabled states.

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

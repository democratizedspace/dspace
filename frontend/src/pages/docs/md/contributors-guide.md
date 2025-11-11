---
title: 'Contributors Guide'
slug: 'contributors-guide'
---

# DSPACE Contributors Guide

Welcome! This guide walks you through the essentials for shipping high-quality
changes to DSPACE. Pair it with the [Developer Guide](../../../../../DEVELOPER_GUIDE.md)
and the [`CONTRIBUTING.md`](../../../../../CONTRIBUTING.md) checklist for full
coverage.

## 1. Environment setup

-   Use Node.js 20 LTS (`nvm use`) and run `pnpm install` at the repo root.
-   Install Playwright browsers with `npx playwright install chromium` if
    you plan to run end-to-end tests locally.
-   Enable the [recommended VS Code extensions](../../../../frontend/.vscode/extensions.json)
    for linting, formatting, and Svelte language support.

## 2. Branching & workflow

1. Create a feature branch from `main` (for example, `git checkout -b feature/my-change`).
2. Keep pull requests focused on a single concern and include tests plus docs.
3. Run `git diff --cached | ./scripts/scan-secrets.py` before every commit to
   avoid leaking credentials.
4. Follow the [pull request guide](/docs/prs) for message structure and review tips.

## 3. Testing checklist

Before pushing, run the scripts that CI enforces:

-   `npm run lint`
-   `npm run type-check`
-   `npm run build`
-   `npm run test:ci`
-   `npm run audit:ci`

Use `SKIP_E2E=1` only when browsers are unavailable and call it out in your PR.
Refer to the [Testing Guide](../../../../frontend/TESTING.md) for component,
integration, and
Playwright best practices.

## 4. Documentation updates

Every feature or fix should update the relevant docs:

-   Gameplay or quest changes belong in `/frontend/src/pages/docs/md`.
-   Developer tooling, architecture, or ops updates live under `/docs`.
-   Refresh screenshots when UI changes are visible and add them to
    `frontend/assets` or quest-specific folders.

## 5. Support & community

-   Join the [Discord](https://discord.gg/A3UAfYvnxM) `#contributors` channel
    for pairing and review requests.
-   Tag issues with `good first issue` when you notice approachable tasks.
-   Share lessons learned in the `docs/ops` notebooks so future contributors
    benefit from your experience.

Thanks for helping us democratize space exploration!

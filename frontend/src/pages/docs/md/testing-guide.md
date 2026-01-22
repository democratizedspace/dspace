---
title: 'Testing Guide'
slug: 'testing-guide'
---

# Testing Guide

This guide describes the mandatory checks to run before submitting a pull request and the
purpose of each test suite in DSPACE.

## Required pre-PR checks

Run these from the repository root:

```bash
npm run lint
npm run test:ci
```

- `npm run lint` runs frontend linting and formatting checks.
- `npm run test:ci` runs the root Vitest suite and the frontend PR prep script with E2E
  tests skipped.

## Link validation

Docs are validated by `scripts/link-check.mjs`. It verifies:

- Internal routes starting with `/` resolve to an Astro route.
- `/docs/<slug>` pages refer to an existing docs markdown entry.
- GitHub links that point to `democratizedspace/dspace` on the `v3` branch refer to a file
  that exists in the repo.

Run it manually with:

```bash
npm run link-check
```

## Additional test suites

- `npm test` runs the full suite, including E2E tests.
- `SKIP_E2E=1 npm test` skips the E2E suite if Playwright browsers are unavailable.
- `npm run build` performs an Astro production build.

## Related docs

- [UI Lifecycle Overview](/docs/ui-lifecycle)
- [Developer Guide](https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md)

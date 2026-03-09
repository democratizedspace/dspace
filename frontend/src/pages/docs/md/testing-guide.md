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


## Quest quality test catalog

Run these tests when quest content, gating, or quest tooling changes:

```bash
npx vitest run \
  frontend/__tests__/questQuality.test.js \
  frontend/__tests__/questCanonical.test.js \
  frontend/__tests__/questDependencies.test.js \
  frontend/__tests__/questSimulation.test.js \
  frontend/__tests__/questTemplateValidation.test.js \
  frontend/__tests__/questValidation.test.js \
  scripts/tests/questDependencies.test.ts \
  scripts/tests/questQuality.test.ts \
  tests/questCompletableItems.test.ts \
  tests/questCopyRegression.test.ts \
  tests/questDependencyReferences.test.ts \
  tests/questDialogueValidation.test.ts \
  tests/questGraphValidation.test.ts \
  tests/questPrerequisites.test.ts \
  tests/questProcessCoverage.test.ts \
  tests/questProcessNecessitySimulation.test.ts \
  tests/questQuizRetryCopyQuality.test.ts \
  tests/questRewardsValidation.test.ts \
  tests/questSchemaValidation.test.ts \
  tests/quest-title-unique.test.ts \
  tests/sysadminQuestQuality.test.ts
```

Keep this list in sync with `frontend/TESTING.md` whenever new quest quality gates are added.

## Additional test suites

- `npm test` runs the full suite, including E2E tests.
- `SKIP_E2E=1 npm test` skips the E2E suite if Playwright browsers are unavailable.
- `npm run build` performs an Astro production build.

## Related docs

- [UI Lifecycle Overview](/docs/ui-lifecycle)
- [Developer Guide](https://github.com/democratizedspace/dspace/blob/v3/DEVELOPER_GUIDE.md)

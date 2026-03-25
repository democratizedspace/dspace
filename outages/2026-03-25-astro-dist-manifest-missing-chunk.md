# Astro preview build retry missed manifest chunk import failures

## Summary
Playwright setup (`frontend/scripts/ensure-astro-build.mjs`) already retries with a clean `dist/`
build for ENOENT-style failures, but it did not treat Node's `Cannot find module ... dist/server/chunks/...`
errors as retryable. This left transient partial-build states unresolved and caused E2E bootstrap failures.

## User-visible impact
- `npm run test:e2e` could fail before tests execute, despite being recoverable by deleting `dist/`
  and rebuilding.
- QA checklist E2E boxes remained blocked by build-cache inconsistency rather than functional bugs.

## Regression window
- **Introduced:** retry detection limited to `ENOENT`/`no such file or directory` strings.
- **Detected:** 2026-03-25 during quest-map Playwright reruns in containerized QA workflow.
- **Fixed:** 2026-03-25.

## Root cause
When Astro emitted a manifest pointing to a missing chunk (`Cannot find module ...`), the script did
not classify it as a retryable missing-artifact error, so it skipped the existing clean-rebuild path.

## Resolution
- Expanded retry detection in `ensure-astro-build.mjs` to include `Cannot find module`.
- On this error class, the script now removes `dist/` and retries a single clean build automatically.

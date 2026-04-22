# Playwright sentinel ENOENT from hardcoded cwd

## Symptom
Playwright bootstrap unit tests printed ENOENT warnings while creating
`.playwright-deps-installed*` sentinel files under `/workspace/dspace/frontend`.

## Root cause
The tests hardcoded a workspace path that is valid in CI containers but not in all
local environments, so sentinel directory creation targeted a missing path.

## Fix
Use `process.cwd()` to resolve the effective frontend test root and keep sentinel
creation on a path that exists in the running environment.

## Verification
- `npm run test:root -- scripts/tests/ensurePlaywrightBrowsers.test.ts`
- `cd frontend && npm test -- tests/ensure-playwright-browsers.test.ts`

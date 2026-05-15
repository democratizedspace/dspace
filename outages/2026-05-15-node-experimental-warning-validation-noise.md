# Node ExperimentalWarning validation noise

## Symptom

The full validation sequence:

`npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`

printed repeated warning blocks shaped like:

`ExperimentalWarning: CommonJS module ... is loading ES Module ... using require()`

The repeated output appeared during npm invocation, lint/a11y lint, ESLint, and Playwright web server startup for grouped E2E runs.

## Root cause

The noise came from two known third-party interop paths rather than DSPACE application code:

- npm's bundled `debug/src/node.js` requiring `supports-color/index.js` as an ES module on newer Node/npm combinations.
- ESLint legacy eslintrc loading through `@eslint/eslintrc` requiring `svelte-eslint-parser` as an ES module while the repo still intentionally runs ESLint with `ESLINT_USE_FLAT_CONFIG=false`.

Nested `npm run`/`npx` calls repeated those toolchain warnings, and Playwright's managed web server inherited the same noisy startup path.

## Fix

Added a narrow preload filter for only those known `ExperimentalWarning` messages and routed lint, build, and Playwright child processes through it. The validation scripts also avoid recurring nested npm/npx calls where direct `node` tool invocations are available.

The filter does not disable all warnings: application/test warnings, assertion failures, lint errors, type errors, build failures, console errors, and Playwright failures still print and fail normally.

## Verification commands

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`

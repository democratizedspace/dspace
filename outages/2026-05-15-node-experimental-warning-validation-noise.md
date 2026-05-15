# Outage: Node ExperimentalWarning noise in validation output

- **Date:** 2026-05-15
- **Command:** `npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`
- **Diagnostic:** `ExperimentalWarning: CommonJS module ... is loading ES Module ... using require()`
- **Scope:** Local and CI validation logs for npm invocation, lint/a11y lint, ESLint, and Playwright web server output

## Impact

The validation sequence could pass while still printing repeated Node `ExperimentalWarning` blocks.
The repeated warnings made the output look unhealthy and obscured actionable lint, type-check, build,
test, or link-check failures.

## Root cause

Two third-party interop paths emitted the recurring warning blocks on newer Node/npm combinations:

1. nested `npm`/`npx` validation invocations loaded npm's CommonJS `debug` package, which required
   the ES module `supports-color`; and
2. legacy ESLint configuration loading routed through `@eslint/eslintrc`, which required
   `svelte-eslint-parser` as an ES module.

The repo also invoked `npm` from inside other repo scripts during lint/check/build/test orchestration,
and Playwright's managed web server used `npx astro preview`. Those nested tool invocations repeated
the same warning in each validation phase and each grouped E2E run.

## Fix

The validation scripts now avoid the noisy nested package-manager paths where practical:

- root lint/check/type-check/test helpers call repo scripts and local CLIs directly;
- frontend lint/check orchestration runs through Node helpers instead of chaining `npm run` and
  `npx eslint`;
- build orchestration invokes the docs-RAG, process-build, and Astro-build scripts directly; and
- Playwright's web server starts Astro through the local Astro CLI entrypoint instead of `npx`.

A narrow warning filter suppresses only the two known third-party `ExperimentalWarning` blocks for
npm `debug`/`supports-color` and `@eslint/eslintrc`/`svelte-eslint-parser` interop. It does not change
exit-code handling and does not filter test assertions, console errors, Playwright failures, or other
Node warnings.

## Verification

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`

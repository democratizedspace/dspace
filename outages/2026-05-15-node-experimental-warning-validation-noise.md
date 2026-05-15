# Outage: Node ExperimentalWarning noise in validation output

- **Date**: 2026-05-15
- **Severity**: low
- **Component**: repo validation command wrappers and Node warning filtering
- **Incident ID**: `2026-05-15-node-experimental-warning-validation-noise`

## Symptom

The combined validation command completed with recurring Node warning noise:

```bash
npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs
```

The repeated snippet was:

```text
ExperimentalWarning: CommonJS module ... is loading ES Module ... using require()
Support for loading ES Module in require() is an experimental feature and might change at any time
```

The warning appeared in several contexts:

- npm invocation output before or between validation steps
- `lint:a11y` output when invoked through npm
- ESLint output from `@eslint/eslintrc` and `svelte-eslint-parser` interop
- Playwright `[WebServer]` output, repeated for grouped E2E server startups

## Root cause

The warnings were emitted by third-party validation tooling under newer Node versions, not by DSPACE
application or test code.

Two known CommonJS-to-ESM interop paths were responsible:

1. npm's bundled `debug/src/node.js` required npm's bundled `supports-color/index.js`.
2. ESLint's legacy `@eslint/eslintrc` loader required `svelte-eslint-parser`.

The grouped Playwright runner starts Playwright through Node and lets Playwright manage Astro preview
web servers. Because the web server command inherited the same npm/tooling environment, the npm
`debug`/`supports-color` warning was printed again for each affected web server startup.

## Fix

Add a narrow repo preload at `scripts/node-warning-filter.cjs` and a frontend shim at
`frontend/scripts/node-warning-filter.cjs`. npm scripts load the preload with:

```text
--no-warnings --require=./scripts/node-warning-filter.cjs
```

The preload re-emits warnings by default, but skips only `ExperimentalWarning` entries whose message
and stack match one of the known third-party CommonJS-to-ESM paths:

- npm `debug` requiring npm `supports-color`
- `@eslint/eslintrc` requiring `svelte-eslint-parser`

The existing ESLint-specific `--disable-warning=ESLintRCWarning` intent remains in the lint and
lint-fix scripts. Test assertion failures, lint failures, build errors, console errors, Playwright
failures, and unrelated Node warnings still surface with useful output.

## Verification commands

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`
- `npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`

## Why this was warning-only

The validation commands were not failing because of these warnings. The issue was recurring
third-party tooling noise that reduced log signal and made clean local/CI validation harder to scan.

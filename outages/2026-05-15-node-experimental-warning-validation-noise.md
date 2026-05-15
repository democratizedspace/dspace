# Node ExperimentalWarning validation noise

## Symptom

The normal validation sequence:

```bash
npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs
```

repeatedly printed snippets like:

```text
ExperimentalWarning: CommonJS module ... is loading ES Module ... using require()
```

The noise showed up around npm invocation, lint and a11y lint startup, the ESLint process, and
Playwright `[WebServer]` output for each grouped E2E run.

## Root cause

The recurring warnings came from known third-party toolchain interop, not from application code:

- npm's own `debug/src/node.js` CommonJS entry loaded npm's `supports-color/index.js` ES module.
- ESLint's legacy `@eslint/eslintrc/dist/eslintrc.cjs` path loaded `svelte-eslint-parser/lib/index.js`.
- Several validation scripts nested `npm run`, `npx`, ESLint, and Playwright web server commands,
  causing the same third-party warning to be re-emitted across contexts.

## Fix

Added a targeted Node preload hook that suppresses only the known third-party
`ExperimentalWarning` messages above. The hook is passed into scripted child processes that run
frontend npm scripts, builds, setup helpers, grouped Playwright tests, and pre-PR checks. Frontend
validation scripts also avoid unnecessary nested npm setup calls, and Playwright starts Astro
preview through the local Astro CLI rather than `npx`.

The filter does not suppress unrelated warnings, assertion failures, lint failures, type errors,
build errors, console errors, or Playwright failures.

## Verification

Run:

```bash
npm run lint
npm run type-check
npm run build
npm test
node scripts/link-check.mjs
npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts
```

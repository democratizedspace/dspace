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

The noise showed up around lint/a11y lint startup, the ESLint process, pre-PR helpers, and
Playwright `[WebServer]` output.

## Root cause

The recurring warnings came from known third-party toolchain interop, not from application code:

- npm's own `debug/src/node.js` CommonJS entry loaded npm's `supports-color/index.js` ES module.
- ESLint's legacy `@eslint/eslintrc/dist/eslintrc.cjs` path loaded `svelte-eslint-parser/lib/index.js`.
- Validation entry points exported `NODE_OPTIONS`, so relative preload paths had to be avoided
  because child Node processes resolve them from each process working directory.

## Fix

Added a targeted Node preload hook that suppresses only the known third-party
`ExperimentalWarning` messages above. The hook is applied to the prompt-surface validation entry
points that emitted the noise: frontend lint/lint:fix, pre-PR shell helpers, and the Playwright
web server environment. All exported `NODE_OPTIONS` preload entries use absolute paths so child
process working directories do not affect module resolution.

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
npm run test:root -- tests/nodeWarningFilter.test.ts tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts
```

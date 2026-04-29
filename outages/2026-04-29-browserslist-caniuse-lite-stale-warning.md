# Browserslist caniuse-lite stale warning during build

## Symptom

`npm run build` emitted a warning that Browserslist browser data was stale (`caniuse-lite` reported as 10 months old), even though the build completed successfully.

## Root cause

The local dependency metadata used by Browserslist was behind the current caniuse-lite dataset. This was a warning-only condition from Browserslist and did not fail the build or CI gates.

## Fix

Refreshed Browserslist database metadata using the project-recommended updater command:

```bash
npx update-browserslist-db@latest
```

The updater reported `Latest version: 1.0.30001791` and completed successfully.

## Verification

```bash
npm run build
npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs
```

Result: no `Browserslist: browsers data (caniuse-lite) is ... old` warning observed in the build output, and this remained a warning-only maintenance issue rather than a failing gate.

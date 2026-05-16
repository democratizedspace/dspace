# Browserslist caniuse-lite metadata refresh for build output

## Symptom

`npm run build` completed the Astro production build, but printed the Browserslist stale-data
warning before the build summary:

```text
Browserslist: browsers data (caniuse-lite) is 11 months old
```

## Impact

This was warning-only build noise, not a compile failure. The warning made the standard validation
sequence harder to scan and left an outstanding issue in otherwise successful build output.

## Root cause

The repository lockfiles still resolved Browserslist consumers to `caniuse-lite` metadata older
than the latest published dataset. The pnpm override floor also still referenced the previous
metadata floor, so the pnpm lock path could keep reusing the older Browserslist database even after
running the normal build command.

## Fix

Refreshed the Browserslist database metadata to `caniuse-lite` `1.0.30001792` in both lockfiles and
raised the pnpm override floor to the same version. No browser support policy was changed and no
broad dependency upgrade was introduced.

## Verification

Run:

```bash
npm run build
npm run lint
npm run type-check
npm test
node scripts/link-check.mjs
npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts
```

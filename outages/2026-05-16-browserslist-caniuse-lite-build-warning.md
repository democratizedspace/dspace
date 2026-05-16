# Outage: Browserslist caniuse-lite build warning

## Symptom

`npm run build` completed, but the Astro build log printed:

```text
Browserslist: browsers data (caniuse-lite) is 11 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
```

## Impact

This was warning-only build noise, but it kept the normal local and CI verification sequence from
being clean and made it harder to spot real build regressions.

## Root cause

The repository uses pnpm as the declared package manager while retaining an npm lockfile for mixed
local workflows. The pnpm override floor and both lockfiles still resolved Browserslist consumers to
`caniuse-lite` `1.0.30001791`, so installs could continue to hydrate stale browser-compat metadata
for Astro/Vite build tooling.

## Fix

Ran the Browserslist database update flow for the pnpm workspace, then raised the repository
`caniuse-lite` override floor to `>=1.0.30001792` and refreshed the npm and pnpm lock metadata to
`caniuse-lite` `1.0.30001792`. A follow-up `npx update-browserslist-db@latest` check reported
`1.0.30001792` as the latest available dataset, so no browser support policy changed and no broad
dependency upgrades were introduced.

## Verification commands

- `npm run build`
- `npm run lint`
- `npm run type-check`
- `npm test`
- `node scripts/link-check.mjs`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`

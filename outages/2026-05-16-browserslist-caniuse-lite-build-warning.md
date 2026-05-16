# Browserslist caniuse-lite build warning

## Symptom

The normal build command completed successfully but printed stale Browserslist metadata noise:

```bash
npm run build
```

```text
Browserslist: browsers data (caniuse-lite) is 11 months old
```

## Impact

This was warning-only build noise, not an application build failure. It made the validation sequence
look unhealthy and could hide new warnings in otherwise successful Astro/Vite build logs.

## Root cause

The repository declares `pnpm@9.0.0` as its package manager and the root build delegates into the
frontend workspace. The Browserslist database update flow selected the pnpm updater path, then
reported `caniuse-lite` `1.0.30001792` as the current dataset.

The pnpm override floor and `pnpm-lock.yaml` still resolved `caniuse-lite` `1.0.30001791`. That
left normal pnpm-backed installs free to use stale Browserslist metadata, producing warnings such as
`Browserslist: browsers data (caniuse-lite) is 11 months old` during `npm run build` when the local
install had drifted behind the current database.

## Fix

Refreshed the Browserslist database through the repo's existing pnpm workflow, then made the minimal
persistent metadata change:

- bumped `pnpm.overrides.caniuse-lite` to `>=1.0.30001792`;
- regenerated only the related `pnpm-lock.yaml` `caniuse-lite` resolution/snapshot entries;
- aligned the existing `package-lock.json` `caniuse-lite` entry to the same dataset;
- left browser support policy and unrelated dependencies unchanged.

The root `package-lock.json` and `frontend/package.json` were inspected as part of the mixed
npm-script/pnpm-install setup. The durable install policy remains pnpm, while the checked-in npm
lockfile now mirrors the refreshed `caniuse-lite` dataset for consistency.

## Verification commands

```bash
npm run build
npm run lint
npm run type-check
npm test
node scripts/link-check.mjs
npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts
```

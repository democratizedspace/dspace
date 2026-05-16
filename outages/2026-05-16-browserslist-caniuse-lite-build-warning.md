# Browserslist caniuse-lite build warning

## Symptom

The normal production build command:

```bash
npm run build
```

completed successfully, but printed this warning before Astro build output:

```text
Browserslist: browsers data (caniuse-lite) is 11 months old
```

That made the validation sequence look noisy even though the application bundle was still built.

## Root cause

The repository's package-manager metadata is mixed at rest: root scripts are run with `npm`, but
`package.json` declares `pnpm@9.0.0` and the workspace dependency graph is resolved by
`pnpm-lock.yaml`. There is no separate Browserslist policy file in the repo, so consumers inherit
the defaults from build tooling.

The stale warning was caused by caniuse-lite metadata drift in the pnpm dependency graph. The repo
already uses a pnpm override floor for caniuse-lite to keep Browserslist data fresh, but that floor
and the lockfile entries had not been advanced to the latest dataset. Once the resolved dataset was
old enough, Browserslist warned during the Astro/Vite build path.

## Fix

Ran the Browserslist database update flow and kept the existing pnpm convention. The fix raises the
pnpm caniuse-lite override floor to `>=1.0.30001792` and refreshes the corresponding
`pnpm-lock.yaml` entries for `autoprefixer`, `browserslist`, and `caniuse-api` consumers. No browser
support policy was changed, and no broad dependency upgrade was introduced.

`package-lock.json` was inspected but left unchanged because the update flow selected pnpm from the
root `packageManager` declaration and the stale build path is governed by the pnpm workspace lock.

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

# Outage: npm update-notifier validation noise

## Symptom

The normal validation sequence:

```bash
npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs
```

could complete successfully, but npm printed an update-notifier banner during local verification:

```text
npm notice New major version of npm available! 10.9.0 -> 11.14.1
```

## Impact

This was warning-only command-output noise. It made otherwise-clean validation logs look like they
had outstanding follow-up work and made it harder to notice real script failures.

## Root cause

The repository already had root and frontend `.npmrc` files for repo-local npm behavior, but neither
file disabled npm's update notifier. Root scripts commonly delegate to nested frontend npm scripts
with `cd frontend && npm run ...`, so the frontend project-level npm config also needed the same
repo-local setting; otherwise npm commands launched from `frontend/` could still evaluate their own
configuration without the root project file.

## Fix

Added `update-notifier=false` to both the root and frontend `.npmrc` files. This disables only npm's
version-update banner for repo-local root and nested frontend workflows while preserving normal npm
script execution and failure output.

## Verification commands

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`

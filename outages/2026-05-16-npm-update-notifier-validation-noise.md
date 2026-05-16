# Outage: npm update-notifier validation noise

## Symptom

The normal validation sequence:

```bash
npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs
```

completed script startup but printed npm's update-notifier banner during validation output:

```text
npm notice New major version of npm available! 10.9.0 -> 11.14.1
```

## Impact

The notice was not a project failure, but it kept local and CI-style verification logs from being
clean and made it easier to miss real lint, type-check, build, test, or link-check failures.

## Root cause

The repository invokes npm from both the root package and nested `frontend` package scripts. Neither
repo-local npm config file disabled npm's update notifier, so npm could emit its global update banner
whenever the host's npm version lagged the latest published major release. The root `.npmrc` also
carried a duplicate `packageManager` entry even though the package-manager declaration belongs in
`package.json`, which could create unrelated nested npm config warnings during verification.

## Fix

Added the narrow repo-local npm setting `update-notifier=false` to both the root and frontend
`.npmrc` files. The duplicate `packageManager` npm config entry was removed from the root `.npmrc`
because `package.json` already declares the package manager. This suppresses npm's self-update
banner for commands run in either package while preserving normal npm script behavior and failure
output.

## Verification commands

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`

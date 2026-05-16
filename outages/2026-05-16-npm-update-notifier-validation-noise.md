# Outage: npm update-notifier validation noise

## Symptom

The normal local verification sequence completed without a repository failure, but npm could append
an update-notifier banner to the output:

```bash
npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs
```

```text
npm notice
npm notice New major version of npm available! 10.9.0 -> 11.14.1
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.14.1
npm notice To update run: npm install -g npm@11.14.1
npm notice
```

## Impact

The banner was informational, but it made the validation sequence look noisy after lint, type-check,
build, test, and link-check work had otherwise completed. It also obscured real failures in command
logs because the final output could be an unrelated global npm upgrade notice.

## Root cause

npm's update notifier is enabled by default. The root verification scripts invoke nested npm scripts
under `frontend/`, and neither the root `.npmrc` nor `frontend/.npmrc` disabled the notifier. Because
npm reads the project config for the current working directory, frontend script invocations needed a
frontend-local setting in addition to the root setting.

The investigation also found that the root `.npmrc` duplicated the pnpm package-manager pin that
already lives in `package.json`. Newer npm versions treat that `.npmrc` key as an unknown project
config, so keeping the pin in `package.json` avoids an additional npm warning while preserving the
repository package-manager declaration.

## Fix

Set `update-notifier=false` in both repository-local npm config files:

- `.npmrc` for root npm commands.
- `frontend/.npmrc` for nested commands that run after scripts change into `frontend/`.

Removed the duplicate `packageManager=pnpm@9.0.0` line from `.npmrc`; `package.json` remains the
Corepack package-manager source of truth. This keeps normal npm script behavior and stderr/stdout
from the underlying tools intact while only suppressing npm's own banner noise. It does not upgrade
global npm and does not hide real npm script or install errors.

## Verification commands

- `npm config get update-notifier`
- `npm --prefix frontend config get update-notifier`
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`

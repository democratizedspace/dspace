# Outage: npm update-notifier validation noise

## Symptom

The normal validation sequence:

```bash
npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs
```

completed far enough to reach lint output, but npm printed its update-notifier banner:

```text
npm notice New major version of npm available! 10.9.0 -> 11.14.1
```

## Impact

The notice was not a repo failure, but it made local and CI validation output noisy and obscured
whether the command sequence was clean. It also appeared during nested npm script execution, such as
root scripts that `cd frontend && npm run ...`.

## Root cause

The root `.npmrc` and `frontend/.npmrc` already carried repo-local npm behavior, but neither file
set `update-notifier=false`. When the installed npm CLI detected that npm `11.14.1` was available
while npm `10.9.0` was installed, npm emitted the upgrade banner even though the underlying script
was still behaving normally.

## Fix

Added `update-notifier=false` to the root `.npmrc` and the frontend `.npmrc`. The root setting covers
root-level commands such as `npm run type-check`, `npm run build`, and `npm test`; the frontend
setting covers nested frontend commands launched by root wrappers such as `npm run lint`.

This suppresses only npm's update-notifier banner. It does not redirect command output, hide npm
install or script errors, upgrade global npm, or change the package-manager convention.

## Verification commands

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm run test:root -- tests/outagesConventions.test.ts tests/docsPromptsOutages.test.ts`

# Browserslist caniuse-lite stale warning in v3.0.1 QA launch gate

## Symptom
During the v3.0.1 QA launch-gate run, `npm run build` completed successfully but logged a
Browserslist warning that `caniuse-lite` data was 10 months old.

## Impact
This was **not a test or build failure**. It was outstanding QA noise that obscured clean
launch-gate output and could hide regressions in warning-heavy logs.

## Root cause
`package-lock.json` still resolved `caniuse-lite` to `1.0.30001731`, which is old enough for
Browserslist to emit the stale-data warning in the build step.

## Fix
Refreshed lockfile metadata for `caniuse-lite` to `1.0.30001791` so Browserslist consumes current
browser-compat data during builds.

## Verification
- `npm run build` no longer emits the stale Browserslist/caniuse-lite warning.
- QA launch-gate logs are clean for this warning class while build/test pass behavior is unchanged.

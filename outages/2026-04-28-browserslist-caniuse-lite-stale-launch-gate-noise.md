# Browserslist caniuse-lite stale launch-gate warning noise

## Symptom
`npm run build` emitted:
`Browserslist: browsers data (caniuse-lite) is 10 months old. Please run: npx update-browserslist-db@latest`.

## Impact
This did **not** fail tests or the v3.0.1 launch-gate command sequence, but it left outstanding QA noise
in the build logs and reduced confidence in release readiness.

## Root cause
The npm dependency graph consumed by `package-lock.json` resolved `caniuse-lite` to an older version,
while Browserslist expected fresher browser data.

## Fix
Added an npm `overrides` pin for `caniuse-lite` (`>=1.0.30001791`) and regenerated `package-lock.json`
so npm-based builds resolve updated browser data without runtime warning.

## Verification
- `npm run build` completes without the stale Browserslist/caniuse-lite warning.
- QA launch-gate flow remains green; this change only removes warning noise.

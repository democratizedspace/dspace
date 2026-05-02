# Stale Browserslist/caniuse-lite warning during v3.0.1 launch-gate QA

## Symptom
`npm run build` completed successfully but emitted noisy warning output:
`Browserslist: browsers data (caniuse-lite) is 10 months old.`

## Impact
No functional build or test failure occurred.
This remained outstanding QA noise in the v3.0.1 launch-gate sequence and obscured signal in otherwise green logs.

## Root cause
`package-lock.json` still pinned an older `caniuse-lite` release in the npm dependency graph used by the QA build path.

## Fix
Refresh lockfile metadata for `caniuse-lite` so npm resolves current Browserslist browser data.

## Verification
- `npm run build` no longer prints the stale Browserslist/caniuse-lite warning line.

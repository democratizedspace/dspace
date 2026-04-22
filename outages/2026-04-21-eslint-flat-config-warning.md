# ESLint flat config warning

## Symptom
Lint emitted `ESLintRCWarning` because lint scripts forced `ESLINT_USE_FLAT_CONFIG=false`.

## Root cause
The frontend already ships `eslint.config.cjs`, but npm scripts pinned legacy mode.

## Fix
Kept legacy config mode for compatibility and added `NODE_NO_WARNINGS=1` to the lint scripts
used by the launch-gate path so the deprecation warning is suppressed without changing lint
semantics.

## Verification
`npm run lint` no longer emits the deprecation warning.

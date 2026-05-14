# Quest graph debug flag mismatch rebuild noise during test setup

## Symptom

After a successful `npm run build`, running `npm test` immediately logged:
`Quest graph debug flag mismatch detected. Rebuilding Astro app...` and ran a second Astro build.

## Root cause

`frontend/scripts/setup-test-env.js` force-set `PUBLIC_ENABLE_QUEST_GRAPH_DEBUG=true` even when
no test explicitly opted into quest-graph debug mode.

The normal root build path (`npm run build` via `scripts/build-with-sha.mjs`) keeps
`PUBLIC_ENABLE_QUEST_GRAPH_DEBUG` opt-in/off by default, so the existing build marker in
`frontend/dist/.quest-graph-debug-flag` was often `false`.

When test setup later forced the env flag to `true`, `frontend/scripts/ensure-astro-build.mjs`
correctly detected a build-time config mismatch and rebuilt.

## Fix

- Stopped forcing `PUBLIC_ENABLE_QUEST_GRAPH_DEBUG` inside `frontend/scripts/setup-test-env.js`.
- Kept mismatch-rebuild safeguard intact in `frontend/scripts/ensure-astro-build.mjs`.
- Added targeted tests for marker/env match and mismatch behavior.

## Verification commands

- `npm run build; npm test`
- `npm run test:e2e:groups`
- `npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`

## Why this was warning/noise rather than a gate failure

The safeguard-triggered rebuild was functioning as designed and tests still passed, so this was not
an incorrect result. The problem was determinism and runtime cost: launch-gate workflows paid for an
unnecessary second Astro build and emitted confusing mismatch logs despite no intentional flag change.

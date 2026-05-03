# Quest graph debug flag rebuild noise in grouped E2E setup

## Symptom
The QA launch-gate path (`npm run build` followed by `npm test`) logged:
`Quest graph debug flag mismatch detected. Rebuilding Astro app...` during
`frontend/scripts/setup-test-env.js`, even when a fresh build had just succeeded.

## Impact
Grouped E2E setup performed an avoidable second Astro build, adding runtime and
noise to QA diagnostics while making it harder to spot genuinely required rebuilds.

## Root cause
`frontend/scripts/ensure-astro-build.mjs` determines rebuild necessity using
`dist/.quest-graph-debug-flag`. The marker was only written when build was
triggered through `ensureAstroBuild()`, not when running the normal
`npm run build` path (`frontend/scripts/run-astro-build.mjs`).

As a result, the first setup pass after `npm run build` often saw a missing
marker and treated it as a debug-flag mismatch when
`PUBLIC_ENABLE_QUEST_GRAPH_DEBUG=true` for grouped E2E setup.

## Fix
Updated `frontend/scripts/run-astro-build.mjs` to write
`dist/.quest-graph-debug-flag` on successful Astro builds, using the current
`PUBLIC_ENABLE_QUEST_GRAPH_DEBUG` value. This aligns marker generation across
both build entry points.

## Verification
- `npm run build`
- `npm test`
- `npm --prefix frontend run test:e2e:groups`
- Confirmed setup no longer logs
  `Quest graph debug flag mismatch detected. Rebuilding Astro app...`
  in the normal launch-gate sequence.

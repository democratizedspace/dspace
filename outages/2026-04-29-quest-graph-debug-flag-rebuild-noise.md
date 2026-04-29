# Outage: quest graph debug flag mismatch caused unnecessary grouped-E2E rebuild

## Diagnostic
During QA launch-gate runs, grouped E2E setup printed:
`Quest graph debug flag mismatch detected. Rebuilding Astro app...`
immediately after a successful build, then rebuilt Astro before starting grouped Playwright tests.

## Impact
- QA/test execution incurred avoidable rebuild latency.
- Logs suggested a configuration drift even when app artifacts were otherwise valid.
- This added noise while triaging real build/setup regressions.

## Root cause
`frontend/scripts/ensure-astro-build.mjs` relies on a dist marker file
(`dist/.quest-graph-debug-flag`) to decide whether an existing build matches the expected
`PUBLIC_ENABLE_QUEST_GRAPH_DEBUG` mode.

The normal Astro build path (`frontend/scripts/run-astro-build.mjs`) did not write that marker.
As a result, setup-time validation often treated a fresh build as potentially mismatched and
triggered a defensive rebuild.

## Fix
- Updated `frontend/scripts/run-astro-build.mjs` to write
  `dist/.quest-graph-debug-flag` after successful Astro builds using the effective
  `PUBLIC_ENABLE_QUEST_GRAPH_DEBUG` value.
- Updated `frontend/scripts/ensure-astro-build.mjs` to read the quest-graph debug env flag at
  call time (instead of module-import time), making repeated invocations deterministic when env
  flags are set by setup scripts.

## Verification
- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm --prefix frontend run test:e2e:groups`

Expected result: grouped E2E setup no longer logs
`Quest graph debug flag mismatch detected. Rebuilding Astro app...`
unless a real build/debug-mode mismatch exists.

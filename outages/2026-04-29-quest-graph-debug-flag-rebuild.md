# Quest graph debug flag mismatch causes redundant grouped E2E rebuild

## Diagnostic
During `npm test` launch-gate runs, grouped E2E setup logged:
`Quest graph debug flag mismatch detected. Rebuilding Astro app...`

## Impact
- QA paid for an unnecessary second Astro build right before grouped Playwright E2E.
- This added avoidable latency/noise to otherwise healthy launch-gate runs.

## Root cause
- `frontend/scripts/ensure-astro-build.mjs` decides build compatibility using
  `dist/.quest-graph-debug-flag` plus `PUBLIC_ENABLE_QUEST_GRAPH_DEBUG`.
- Standard builds executed through `frontend/scripts/run-astro-build.mjs` did not write that marker.
- After `npm run build`, grouped E2E setup saw a missing marker as a mismatch and rebuilt,
  even when artifacts were already valid.

## Fix
- Updated `frontend/scripts/run-astro-build.mjs` to always persist
  `dist/.quest-graph-debug-flag` on successful Astro build completion.
- The marker value is derived from `PUBLIC_ENABLE_QUEST_GRAPH_DEBUG`, matching the
  same compatibility contract used by `ensure-astro-build.mjs`.

## Verification
- `npm run build` completes and writes the quest-graph marker as part of normal builds.
- `npm test` no longer triggers the grouped E2E setup-time mismatch rebuild in the normal
  launch-gate sequence.
- `npm --prefix frontend run test:e2e:groups` still passes with quest graph debug coverage enabled.

# Outage: quest graph debug marker caused grouped E2E rebuild loop

- **Date:** 2026-04-29
- **Diagnostic:** `Quest graph debug flag mismatch detected. Rebuilding Astro app...`
- **Scope:** QA launch-gate sequence (`npm test` followed by grouped E2E setup)

## Impact

Grouped E2E setup rebuilt Astro immediately after an already successful build. QA still passed,
but local/CI feedback loops were slower and logs were noisier.

## Root cause

`setup-test-env` verifies build compatibility through `ensure-astro-build`, which compares:

1. requested `PUBLIC_ENABLE_QUEST_GRAPH_DEBUG` state, and
2. `dist/.quest-graph-debug-flag` marker.

The marker was only written by `ensure-astro-build` when it performed the build itself. A normal
`npm run build` path (via `run-astro-build.mjs`) produced valid artifacts but no marker, so grouped
E2E setup treated this as mismatch and forced a rebuild.

## Fix

Updated `frontend/scripts/run-astro-build.mjs` to write `dist/.quest-graph-debug-flag` after any
successful Astro build using the current `PUBLIC_ENABLE_QUEST_GRAPH_DEBUG` value.

This makes build metadata deterministic across both build entry points and avoids redundant rebuilds
unless the debug flag genuinely differs.

## Verification

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm test`
- `node scripts/link-check.mjs`
- `npm --prefix frontend run test:e2e:groups`

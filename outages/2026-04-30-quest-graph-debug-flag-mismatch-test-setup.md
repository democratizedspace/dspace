# Outage: redundant Astro rebuild from quest graph debug mismatch during test setup

- **Date:** 2026-04-30
- **Symptom:** `npm test` printed `Quest graph debug flag mismatch detected. Rebuilding Astro app...` immediately after a successful `npm run build`.
- **Severity:** Warning / log noise (non-gating)

## Impact

Launch-gate runs paid an extra Astro rebuild during `setup-test-env`, which increased runtime and log noise.
Tests still passed, so this did not fail CI gates directly.

## Root cause

`frontend/scripts/setup-test-env.js` force-set `PUBLIC_ENABLE_QUEST_GRAPH_DEBUG=true` before calling
`ensure-astro-build`. After a standard `npm run build` (which typically bakes debug flag `false` unless
explicitly requested), this produced an artificial marker mismatch and triggered a redundant rebuild.

## Fix

1. Removed force-defaulting of `PUBLIC_ENABLE_QUEST_GRAPH_DEBUG` in `setup-test-env`.
2. Updated `frontend/scripts/ensure-astro-build.mjs` mismatch logic to treat the debug flag as
   **tri-state**:
   - `true` / `false` when explicitly requested,
   - `null` when unset (do not enforce marker mismatch in this mode).
3. Kept safeguard behavior: explicit debug flag changes still trigger rebuild.
4. Added focused tests for both no-flag skip behavior and explicit mismatch rebuild behavior.

## Verification commands

- `npm run build; npm test`
- `npm --prefix frontend run test:e2e:groups`
- `npm run lint; npm run type-check; npm run build; npm test; node scripts/link-check.mjs`

## Why this was warning/noise (not gate failure)

The rebuild path was functioning as designed once mismatch was detected, so the pipeline remained green.
The outage was unnecessary rebuild churn caused by inconsistent defaulting, not a correctness failure.

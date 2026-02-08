# Chat debug panel missing build SHA and PlayerState summary

## Impact
- `/chat` prompt debug panel on staging showed “App build SHA: missing” even when the build
  metadata was present, blocking app/docs sync verification.
- PlayerState summary fields displayed “included: no” with zero counts, obscuring the
  actual prompt payload context for authenticated players.

## Detection
- Reported after deploys that included PR #3408 when staging `/chat` debug output regressed.

## Root cause
- The chat debug UI treated any non-`vite` build SHA source as missing, which masked real
  build metadata and prevented display in staging/prod.
- PlayerState summary was only populated after a prompt submission and did not refresh from
  the live game state store, leaving the debug panel stuck at its empty default.

## Resolution
- Fixed build SHA resolution to treat placeholder SHAs as missing (instead of non-`vite`
  sources) and added a runtime build metadata endpoint with robust fallback lookup.
- Initialized and refreshed PlayerState summary from the game state store so the debug
  panel reflects real counts immediately.

## Prevention
- Added tests that assert runtime build metadata resolves to a real SHA and that PlayerState
  summary reflects stored quests/inventory.
- Keep runtime build metadata in a dedicated endpoint so the debug UI can cross-check build
  stamps even when client-side build artifacts are stale.

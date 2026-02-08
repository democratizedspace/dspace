# Outage: Chat debug build SHA + PlayerState regression

## Summary
The /chat “Chat prompt debug” panel on staging showed a missing App build SHA and reported
PlayerState as not included with zero counts. This made it impossible to validate build
provenance or verify prompt grounding for authenticated players. The issue did not affect
core gameplay, but it degraded debugging and incident response workflows for chat.

## Impact
- **Staging**: Debug panel showed “App build SHA: missing” even though builds included
  `build_meta.json`, and PlayerState summary values were zeroed.
- **Prompt payloads**: PlayerState was not visible in the debug summary, increasing the risk
  of misinterpreting prompt behavior during investigations.
- **Prod**: Potential to surface the same missing SHA behavior if runtime metadata wasn’t
  used.

## Detection
Detected after the staging deployment that followed PR #3408 when the debug panel values
were manually reviewed on https://staging.democratized.space/chat.

## Root cause
1. **App build SHA**: The debug UI only trusted `VITE_GIT_SHA` and treated all other sources
   as missing on staging/prod. This bypassed the runtime `build_meta.json` that was copied
   into the container, so the debug panel displayed “missing” even when the metadata existed.
2. **PlayerState summary**: The debug panel only populated PlayerState values after
   a prompt build, so the panel could show the default zeroed summary even when the game
   state had loaded (regression in how the debug panel was hydrated).

## Resolution
- Added a runtime build metadata endpoint that reads `build_meta.json` from the container,
  falls back to repo-generated metadata for local dev, and finally to env vars.
- Updated the chat debug UI to use the runtime metadata and to populate PlayerState summary
  immediately from the loaded game state.

## Prevention
- Added a runtime build metadata endpoint test to ensure a non-empty SHA is returned.
- Added a UI test to assert PlayerState summary is populated in the debug panel.
- Centralized build SHA resolution so future UI paths reuse the same fallback logic.

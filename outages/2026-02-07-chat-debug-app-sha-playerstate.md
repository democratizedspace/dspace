# Chat debug panel missing App build SHA and PlayerState summary

## Impact
- Staging `/chat` showed “App build SHA” as missing, preventing operators from verifying
  app/docs sync in the Chat prompt debug panel.
- The Chat prompt debug panel displayed `PlayerState included = no` with zero counts, even
  when users had valid local game state, reducing confidence in prompt payload diagnostics.

## Detection
- Reported after deploy of PR #3408 when QA reviewed the Chat prompt debug panel on staging.

## Root cause
- The chat debug UI treated any non-`vite` build source as “missing” on staging/prod, even when
  valid build metadata existed in the runtime image (`/app/build_meta.json`).
- The debug panel only populated `PlayerState` summary after a debug prompt build, leaving the
  summary blank on initial render despite a ready game state.

## Resolution
- Added a runtime build metadata endpoint that reads `/app/build_meta.json` (with repo/env
  fallbacks) and wired the chat debug UI to prefer this value when available.
- Updated the debug panel to consider a real SHA valid regardless of source and to populate
  `PlayerState` summary from the current game state at mount.

## Prevention
- Added UI tests to ensure runtime build metadata is preferred and `PlayerState` summary renders
  from local game state.
- Keep build metadata resolution centralized and validated via the new runtime endpoint to avoid
  UI-only fallbacks drifting from deployment reality.

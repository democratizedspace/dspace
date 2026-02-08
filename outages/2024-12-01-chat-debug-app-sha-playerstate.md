# Outage: Chat debug build metadata + PlayerState regression (staging)

## Summary
The /chat debug panel on staging showed a missing app build SHA and reported that PlayerState
was not included, even for logged-in users. This broke the ability to verify build/doc sync and
misled on prompt payload content in the chat debug view.

## Impact
- **Staging /chat** debug panel showed **“App build SHA” = missing**.
- **PlayerState included** displayed **“no”** with zero counts, masking real PlayerState
  data in the prompt debug UI.
- The production prompt payload remained unchanged, but the debugging view was unreliable.

## Detection
Observed by manual inspection after deploy of PR #3408.

## Root Cause
1. The debug UI relied on build metadata embedded at build time, but the runtime container stores
   build_meta.json at `/app/build_meta.json`. The client had no runtime resolver, so when build
   metadata in the bundle was missing/placeholder the UI showed “missing.”
2. The debug panel’s PlayerState summary only updated when a chat prompt was built, and it reset
   to a default “not included” state when debug was off. This meant the panel could show zeros
   even when real PlayerState existed.

## Resolution
- Added a runtime build metadata endpoint that reads `/app/build_meta.json`, falls back to the
  repo-generated build meta file, and then to env vars.
- Updated the chat debug panel to read runtime build metadata and to keep PlayerState summary
  in sync with the actual game state.
- Added regression coverage to assert runtime build SHA resolution and PlayerState inclusion.

## Prevention
- Keep build metadata resolution centralized via the runtime endpoint and reuse it in debug UI.
- Maintain regression tests for runtime build SHA and PlayerState summary updates.
- Consider additional log/alerting if the runtime build-meta endpoint returns “missing.”

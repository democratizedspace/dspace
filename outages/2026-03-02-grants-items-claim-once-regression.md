# grantsItems Claim button could be spammed indefinitely

## Impact
- `grantsItems` dialogue options were expected to be claim-once, but players could repeatedly click
  **Claim** and receive duplicate items.
- The issue was visible in staging on `/quests/aquaria/ph-strip-test` where "I need a strip"
  could be claimed indefinitely.

## Detection
- Reported during staging QA when the Claim button on `ph-strip-test` did not stay disabled after
  a successful claim.
- Reproduced by clicking Claim multiple times and observing inventory increase each click.

## Regression point (git blame)
- `git blame frontend/src/utils/gameState.js` points claim-tracking lines to
  commit `0969275` (2026-02-22).
- In that implementation:
  - `setItemsGranted` read `gameState.quests[questId].itemsClaimed` without guarding undefined
    quest progress.
  - `getItemsGranted` also read `gameState.quests[questId].itemsClaimed` directly.
  - `grantItems` called `addItems` before persisting claim state, so when the guard path threw,
    rewards were granted but claim status was never saved.

## Root cause
Missing null-safe access for quest-specific progress in claim tracking caused first-time claim
writes to fail for quests without an initialized `gameState.quests[questId]` entry.

## Resolution
- Updated `setCurrentDialogueStep` to merge with existing quest progress instead of replacing it.
- Updated `setItemsGranted` to initialize missing quest progress and deduplicate `itemsClaimed`.
- Updated `getItemsGranted` to use optional chaining and return a boolean without throwing.
- Added regression tests for:
  - first-time `grantItems` calls when quest progress does not exist,
  - preserving quest-specific fields when dialogue step updates,
  - safe false return for missing quest claim reads.

## Prevention
- Keep all quest progress writes merge-safe (`{ ...(existing || {}), ...updates }`).
- Add targeted regression tests whenever quest-level persistence logic changes.

# Multi-tab gameState stale overwrite

## Failure mode

When players opened multiple tabs, each tab could hold a stale in-memory snapshot of gameState.
Mutations (buy/sell/process/quest progress) applied against stale state and then persisted, allowing
newer changes from other tabs to be overwritten.

## User impact

- Sequential purchases from separate tabs could drop earlier purchases.
- dUSD displayed in long-lived tabs lagged behind real balance.
- Quest and process panels could render stale requirements/progress until manual refresh.

## Implemented solution

1. Added a stable checksum in `_meta.checksum` for each persisted gameState snapshot.
2. Added checksum-aware mutation helper to refresh from persistence before applying mutations when
   checksums diverge.
3. Added lightweight cross-tab polling (3s) in buy/sell, process, and quest chat UI surfaces to
   trigger refresh when another tab changed state.
4. Added unit and e2e coverage for mismatch reconciliation and two-tab purchase behavior.

## Validation

- Unit: `frontend/tests/gameStateChecksumSync.test.ts`
- E2E: `frontend/e2e/multi-tab-gamestate-sync.spec.ts`

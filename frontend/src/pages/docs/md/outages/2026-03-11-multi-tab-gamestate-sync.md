---
title: '2026-03-11 – Multi-tab gameState overwrite race'
slug: '2026-03-11-multi-tab-gamestate-sync'
summary: 'Fixed stale-tab gameState writes that overwrote purchases and process/quest progress.'
---

## Summary

- Opening multiple DSPACE tabs could load separate in-memory snapshots of `gameState`.
- Mutations (buy/sell/process/quest updates) were then applied to whichever snapshot a tab loaded
  initially, instead of re-checking the latest persisted state.
- If two tabs made sequential changes, the later write from a stale tab could overwrite earlier
  changes from another tab.

## Impact

- Inventory updates could be lost when users bought/sold items in different tabs.
- A stale tab could display old dUSD and attempt actions that should no longer be affordable.
- Process and quest surfaces could lag behind updates made elsewhere until a manual refresh.

## Resolution

- Added a persistent `gameState` checksum (`_meta.checksum` + `localStorage` mirror key) so each
  mutation can cheaply detect whether persisted state changed in another tab.
- Updated game-state loading to refresh from persisted storage automatically when checksums differ,
  preventing stale-tab overwrites.
- Added lightweight polling (`3s`) in item buy/sell, process, and quest chat flows that checks for
  persisted checksum drift and rehydrates in-memory state when needed.
- Added unit coverage for checksum determinism and checksum-triggered refresh behavior.
- Added Playwright E2E coverage for multi-tab purchase races and stale-balance purchase blocking.

## Lessons / Follow-ups

- Multi-tab correctness must be tested explicitly, not inferred from single-tab behavior.
- Treat persisted-state synchronization as a first-class invariant for any client-side simulation.
- Keep background reconciliation lightweight by polling checksums first and loading full state only
  on mismatch.

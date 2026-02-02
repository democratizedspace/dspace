---
title: 'v3 Release State'
slug: 'v3-release-state'
---

# v3 Release State

## Chat provider reality

- v3 ships **OpenAI-only chat** in production today.
- token.place is deferred to v3.1 because the token.place API v1 is not live yet; once it ships,
  v3.1 will enable the integration. See [/docs/token-place](/docs/token-place) for the
  authoritative integration status and opt-in details.

## v2-only mechanics removed / not applicable in v3

- **Blockchain/Web3 integration plans are removed in v3.** The v3 release notes explicitly
  remove blockchain integration plans and keep the virtual units (dWatt, dUSD, etc.) as plain
  progress metrics without tokenization. See [/changelog#20260301](/changelog#20260301).
- **Primary save storage moved from v2 localStorage to v3 IndexedDB.** v3 stores game state in
  IndexedDB, migrates legacy `gameState` from localStorage on first launch, and clears the legacy
  keys; localStorage is only a fallback when IndexedDB is unavailable. See
  [/docs/state-migration](/docs/state-migration).
- **Legacy behavior (historical): v2 localStorage keys are cleared during v2 → v3 migration.**
  The legacy storage guide notes that v3 deletes `gameState`/`gameStateBackup` during the
  migration flow; treat those keys as legacy artifacts, not current v3 behavior. See
  [/docs/legacy-save-storage](/docs/legacy-save-storage).

---
title: 'Game State Migration'
slug: 'state-migration'
---

# Game State Migration

DSPACE v3 stores quests, inventory and processes in IndexedDB instead of `localStorage`.
On first launch, the app checks localStorage for legacy v2 payloads using
`readLegacyV2LocalStorage`:

- primary key: `gameState`
- fallback key: `gameStateBackup`

If a legacy payload is detected and QA seeding skip mode is not enabled, `importV2V3`
runs automatically, including backup-only cases where `gameState` is missing but
`gameStateBackup` is present. Migration writes a validated v3 state first, then removes
legacy v2 keys when IndexedDB is active.

If IndexedDB is unavailable, DSPACE falls back to localStorage-backed persistence and
shows a warning that storage space may be limited.

## v2 migration semantics

- **Replace migration (`importV2V3`)**: replaces the current v3 state with normalized v2
  `quests`, `inventory`, `processes`, and `settings`.
- **Manual merge/replace persistence**: both migration actions persist a v3 snapshot via
  `saveGameState`, so `gameState`/`gameStateBackup` are rewritten as v3 mirrors rather
  than preserving raw legacy payloads.
- **In-progress v2 processes**: migration compensates in-progress entries by granting
  each process `createItems` outputs into inventory and removing those migrated process
  entries from the v3 `processes` map.
- **Re-run protection**: once migration completes, legacy v2 keys are removed (IndexedDB
  mode), which prevents automatic re-runs from the same legacy source.
- **Failure behavior**: legacy-key cleanup happens only after the v3 write succeeds. If the
  persistence write fails, legacy keys remain so users can retry migration instead of losing the
  source payload.

> **Note:** New persistence features should favor IndexedDB end-to-end. Use
> `localStorage` strictly as a resilience fallback when IndexedDB cannot be
> opened, and migrate any remaining direct `localStorage` reads or writes into
> IndexedDB-backed helpers.

```ts
import { importV2V3 } from '../utils/gameState.js';

importV2V3();
```

## Async game state

Because IndexedDB calls are asynchronous, wait for the shared `ready` promise before
reading or writing game data. Components that compute quest availability or export saves
should only run after this promise resolves.

```ts
import { ready } from '../utils/gameState/common.js';

await ready; // game state is now loaded
```

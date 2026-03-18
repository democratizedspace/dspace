---
title: 'Game State Migration'
slug: 'state-migration'
---

# Game State Migration

DSPACE v3 stores quests, inventory and processes in IndexedDB instead of `localStorage`.
On first launch, the app checks `localStorage` for legacy v2 payloads under both
`gameState` and `gameStateBackup`. If a legacy payload is found and the QA seed skip flag
(`legacyV2Seeded`) is not set, `importV2V3` copies the normalized state into v3 storage.
After the v3 write succeeds, it removes the legacy v2 keys when IndexedDB is active.

If IndexedDB is unavailable, the game falls back to `localStorage` and warns the player
that storage space will be limited. In fallback mode, legacy key cleanup is skipped to
avoid deleting the active save backend.

v2 in-progress process entries are migrated as-is (for example `startedAt` + `duration`),
so timers continue from their original timestamps after migration.

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

---
title: 'Game State Migration'
slug: 'state-migration'
---

# Game State Migration

DSPACE v3 stores quests, inventory and processes in IndexedDB instead of `localStorage`.
On first launch, the app checks legacy `localStorage` keys in this order:
`gameState`, then `gameStateBackup`. If a legacy v1/v2-shaped payload is found and no
IndexedDB data has been saved yet, the `importV2V3` helper copies the old state into
IndexedDB, upgrades it to v3 shape, then clears legacy v2 keys when IndexedDB is active.
The migration runs automatically and needs no manual action. If IndexedDB is unavailable, the game falls back to
`localStorage` and warns the player that storage space will be limited.

Manual migration from `/settings` uses the same parsing + normalization path as auto-migration.
Both **Merge v2** and **Replace with v2** clear legacy v2 keys after a successful write so the
legacy import does not re-run accidentally.

When a legacy v2 save includes unfinished processes (`startedAt` + `duration` and not finished),
v3 compensates by granting each process `createItems` output during migration.

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

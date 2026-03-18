---
title: 'Game State Migration'
slug: 'state-migration'
---

# Game State Migration

DSPACE v3 stores quests, inventory and processes in IndexedDB instead of `localStorage`.
On launch, the app checks legacy localStorage payloads in both `gameState` and
`gameStateBackup`. If either key contains a v1/v2-shaped payload, `importV2V3` normalizes it,
writes canonical v3 state, and stamps `versionNumberString: "3"`. In IndexedDB-capable browsers,
the migration persists to IndexedDB and also rewrites localStorage mirrors to v3-formatted
payloads (for resilience/fallback), so legacy keys are neutralized rather than left as v2 data.
If IndexedDB is unavailable, the game falls back to localStorage and warns the player that storage
space will be limited.

v2 imports also include launch compensation for unfinished legacy processes: for each migrated
process with `startedAt` + `duration`, v3 grants that process's `createItems` outputs to inventory
while still preserving the process entry.

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

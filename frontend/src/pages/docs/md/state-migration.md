---
title: 'Game State Migration'
slug: 'state-migration'
---

# Game State Migration

DSPACE v3 stores quests, inventory and processes in IndexedDB instead of `localStorage`.
On first launch, the app checks for the legacy `gameState` key in `localStorage`. If it
exists and no IndexedDB data has been saved yet, the `importV2V3` helper copies the old
state into IndexedDB and clears the legacy keys. The migration runs automatically and
needs no manual action.

```ts
import { importV2V3 } from '../utils/gameState.js';

importV2V3();
```

After migration, components should wait for the asynchronous game state to load before
reading data. Use the shared `ready` promise or subscribe to the `state` store to react
to updates.

```ts
import { ready, state } from '../utils/gameState/common.js';

onMount(async () => {
    await ready;
    const current = $state;
    // safe to use current game state
});
```

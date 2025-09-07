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

The IndexedDB-backed state loads asynchronously during startup. Helpers like
`saveGameState` wait for this initialization before writing changes so early saves
don't wipe existing progress.

```ts
import { importV2V3 } from '../utils/gameState.js';

importV2V3();
```

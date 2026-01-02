---
title: 'Game State Migration'
slug: 'state-migration'
---

# Game State Migration

DSPACE v3 stores quests, inventory and processes in IndexedDB instead of `localStorage`.
On first launch, the app checks for the legacy `gameState` key in `localStorage`. If it
exists and no IndexedDB data has been saved yet, the `importV2V3` helper copies the old
state into IndexedDB and clears the legacy keys. The migration runs automatically and
needs no manual action. If IndexedDB is unavailable, the game falls back to
`localStorage` and warns the player that storage space will be limited.

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

## Manual upgrades

Players can also upgrade legacy saves from the **Settings** page:

- **v1 → v3**: Detects cookie-based item saves and converts them (including the Early Adopter
  token) into the v3 IndexedDB format.
- **v2 → v3**: Converts `localStorage` saves into the v3 format and cleans up legacy keys.
- When v1/v2 and v3 saves are both present, players can merge the legacy data into the current
  save, replace the v3 save with the legacy data, or delete the legacy copy.

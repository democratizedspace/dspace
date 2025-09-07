---
title: 'Game State Migration'
slug: 'state-migration'
---

# Game State Migration

DSPACE v3 stores quests, inventory and processes in IndexedDB instead of `localStorage`.
On first launch, call `initGameState` to migrate any legacy `localStorage` data into
IndexedDB before accessing game state.

```ts
import { initGameState } from '../utils/gameState.js';

await initGameState();
```

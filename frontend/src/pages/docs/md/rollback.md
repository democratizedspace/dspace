---
title: 'Game State Rollback'
slug: 'rollback'
---

# Game State Rollback

DSPACE keeps a backup of the previous game state before every save. If a change corrupts your data,
you can revert to the last snapshot using `rollbackGameState()`.

```ts
import { rollbackGameState } from '../utils/gameState/common.js';

rollbackGameState();
```

The helper restores the most recently saved snapshot from `localStorage`. If no backup exists,
the call has no effect.

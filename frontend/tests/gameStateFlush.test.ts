import { describe, expect, test } from 'vitest';

import { flushGameStateWritesForTesting } from '../src/utils/gameState/common.js';

describe('flushGameStateWritesForTesting', () => {
    test('resolves when no queued writes are pending', async () => {
        await expect(flushGameStateWritesForTesting()).resolves.toBeUndefined();
    });
});

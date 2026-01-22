import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { seedLegacyV2LocalStorageSave } from '../src/utils/legacySaveSeeding';
import { loadGameState, resetGameState, saveGameState } from '../src/utils/gameState/common.js';

const LEGACY_SEED_KEY = 'gameState';

describe('legacy v2 seed persistence', () => {
    beforeEach(async () => {
        localStorage.clear();
        await resetGameState();
    });

    afterEach(() => {
        localStorage.clear();
    });

    test('preserves seeded legacy v2 storage when saving v3 state', async () => {
        seedLegacyV2LocalStorageSave('minimal');
        const seededValue = localStorage.getItem(LEGACY_SEED_KEY);
        expect(seededValue).toBeTruthy();

        const state = loadGameState();
        state.inventory.example = 1;
        await saveGameState(state);

        expect(localStorage.getItem(LEGACY_SEED_KEY)).toBe(seededValue);
    });
});

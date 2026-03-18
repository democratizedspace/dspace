import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const saveGameState = vi.fn();
const loadGameState = vi.fn(() => ({ quests: {}, inventory: {}, processes: {} }));

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
    loadGameState,
    saveGameState,
    validateGameState: (state: unknown) => state,
    isUsingLocalStorage: () => false,
    getGameStateChecksum: () => '',
    syncGameStateFromLocalIfStale: () => false,
}));

vi.mock('../frontend/src/utils/gameState/inventory.js', () => ({
    addItems: vi.fn(),
}));

describe('legacy migration persistence ordering', () => {
    beforeEach(() => {
        vi.resetModules();
        saveGameState.mockReset();
        loadGameState.mockClear();
    });

    afterEach(() => {
        // @ts-expect-error test cleanup
        delete globalThis.localStorage;
    });

    test('does not remove legacy keys when v2->v3 persistence fails', async () => {
        const removeItem = vi.fn();
        // @ts-expect-error test stub
        globalThis.localStorage = {
            getItem: vi.fn((key: string) =>
                key === 'legacyV2Seeded'
                    ? 'true'
                    : key === 'gameState'
                      ? JSON.stringify({ inventory: { 1: 1 } })
                      : null
            ),
            removeItem,
        };

        saveGameState.mockRejectedValueOnce(new Error('persist failed'));

        const { importV2V3 } = await import('../frontend/src/utils/gameState.js');

        await expect(importV2V3()).rejects.toThrow('persist failed');
        expect(removeItem).not.toHaveBeenCalledWith('gameState');
        expect(removeItem).not.toHaveBeenCalledWith('gameStateBackup');
    });
});

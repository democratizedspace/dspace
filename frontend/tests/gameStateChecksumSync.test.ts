import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('gameState checksum sync', () => {
    beforeEach(() => {
        vi.resetModules();
        localStorage.clear();
    });

    test('createGameStateChecksum is deterministic for equivalent states', async () => {
        const { createGameStateChecksum } = await import('../src/utils/gameState/common.js');

        const first = createGameStateChecksum({
            inventory: { a: 1, b: 2 },
            quests: {},
            processes: {},
            itemContainerCounts: {},
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: 10 },
        });
        const second = createGameStateChecksum({
            processes: {},
            settings: {},
            inventory: { b: 2, a: 1 },
            versionNumberString: '3',
            quests: {},
            itemContainerCounts: {},
            _meta: { lastUpdated: 10 },
        });

        expect(first).toBe(second);
    });

    test('syncGameStateWithPersistence refreshes in-memory state on checksum mismatch', async () => {
        const {
            saveGameState,
            loadGameState,
            syncGameStateWithPersistence,
            createGameStateChecksum,
        } = await import('../src/utils/gameState/common.js');

        await saveGameState({
            quests: {},
            inventory: { sampleItem: 1 },
            processes: {},
            itemContainerCounts: {},
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() },
        });

        const fresher = {
            quests: {},
            inventory: { sampleItem: 2 },
            processes: {},
            itemContainerCounts: {},
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() + 5000 },
        };
        fresher._meta.checksum = createGameStateChecksum(fresher);
        localStorage.setItem('gameState', JSON.stringify(fresher));
        localStorage.setItem('gameStateChecksum', fresher._meta.checksum);

        const changed = await syncGameStateWithPersistence();
        expect(changed).toBe(true);
        expect(loadGameState().inventory.sampleItem).toBe(2);
    });
});

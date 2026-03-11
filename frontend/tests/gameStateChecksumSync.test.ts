import 'fake-indexeddb/auto';
import { afterEach, describe, expect, test } from 'vitest';

import {
    closeGameStateDatabaseForTesting,
    getGameStateChecksum,
    loadGameState,
    resetGameState,
    runGameStateMutation,
    saveGameState,
} from '../src/utils/gameState/common.js';

const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const ITEM_ID = '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec';

async function writeStateDirectlyToIdb(state: Record<string, unknown>) {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('dspaceGameState', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('state', 'readwrite');
        tx.objectStore('state').put(state, 'root');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    db.close();
}

describe('runGameStateMutation checksum sync', () => {
    afterEach(async () => {
        await resetGameState();
        await closeGameStateDatabaseForTesting();
    });

    test('refreshes from persisted state when checksum mismatch is detected', async () => {
        await saveGameState({
            quests: {},
            inventory: { [DUSD_ID]: 100, [ITEM_ID]: 0 },
            processes: {},
            itemContainerCounts: {},
            settings: {},
            versionNumberString: '3',
        });

        const staleChecksum = getGameStateChecksum();

        await writeStateDirectlyToIdb({
            quests: {},
            inventory: { [DUSD_ID]: 95, [ITEM_ID]: 1 },
            processes: {},
            itemContainerCounts: {},
            settings: {},
            versionNumberString: '3',
            _meta: { lastUpdated: Date.now() + 1 },
        });

        await runGameStateMutation(
            (state) => {
                state.inventory[ITEM_ID] = (state.inventory[ITEM_ID] || 0) + 1;
            },
            { expectedChecksum: staleChecksum }
        );

        const latest = loadGameState();
        expect(latest.inventory[ITEM_ID]).toBe(2);
        expect(latest.inventory[DUSD_ID]).toBe(95);
    });
});

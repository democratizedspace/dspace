import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { importV2V3, mergeLegacyStateIntoCurrent, VERSIONS } from '../frontend/src/utils/gameState.js';
import {
    closeGameStateDatabaseForTesting,
    loadGameState,
    resetGameState,
    saveGameState,
} from '../frontend/src/utils/gameState/common.js';
import { V1_ITEM_ID_TO_V3_UUID } from '../frontend/src/utils/legacyV1ItemIdMap.js';

describe('legacy migration semantics', () => {
    const originalIndexedDB = globalThis.indexedDB;

    beforeEach(async () => {
        localStorage.clear();
        await resetGameState();
    });

    afterEach(async () => {
        globalThis.indexedDB = originalIndexedDB;
        await closeGameStateDatabaseForTesting();
        localStorage.clear();
    });

    test('importV2V3 reads gameStateBackup when gameState is absent', async () => {
        localStorage.setItem(
            'gameStateBackup',
            JSON.stringify({
                versionNumberString: '2.1',
                inventory: { 24: 11 },
                quests: { qBackup: { finished: true } },
                processes: {},
            })
        );

        const migrated = await importV2V3();
        const state = loadGameState();

        expect(migrated?.versionNumberString).toBe(VERSIONS.V3);
        expect(migrated?.inventory[V1_ITEM_ID_TO_V3_UUID[24]]).toBe(11);
        expect(state.quests.qBackup.finished).toBe(true);
    });

    test('importV2V3 compensates unfinished legacy processes with createItems', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({
                versionNumberString: '2.1',
                inventory: {},
                quests: {},
                processes: {
                    'outlet-dWatt-1e3': {
                        startedAt: Date.now() - 30_000,
                        duration: 60_000,
                    },
                    'outlet-dWatt-1e4': {
                        startedAt: Date.now() - 30_000,
                        duration: 60_000,
                        finished: true,
                    },
                },
            })
        );

        const migrated = await importV2V3();

        expect(migrated?.inventory['061fd221-404a-4bd1-9432-3e25b0f17a2c']).toBe(1000);
    });

    test('mergeLegacyStateIntoCurrent compensates inline createItems for unfinished processes only', async () => {
        await saveGameState({
            inventory: { alpha: 1 },
            _meta: { lastUpdated: Date.now() },
        });

        const merged = await mergeLegacyStateIntoCurrent({
            inventory: {},
            processes: {
                'custom/legacy-inline': {
                    startedAt: Date.now() - 1000,
                    duration: 60_000,
                    createItems: [{ id: 'custom-item', count: 2 }],
                },
                'custom/legacy-finished': {
                    startedAt: Date.now() - 1000,
                    duration: 60_000,
                    state: 'finished',
                    createItems: [{ id: 'custom-item', count: 5 }],
                },
            },
        });

        expect(merged?.versionNumberString).toBe(VERSIONS.V3);
        expect(merged?.inventory.alpha).toBe(1);
        expect(merged?.inventory['custom-item']).toBe(2);
    });

    test('keeps legacy localStorage state when IndexedDB is unavailable', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({ versionNumberString: '2.1', inventory: { 1: 1 }, quests: {}, processes: {} })
        );
        // @ts-expect-error intentionally disable IndexedDB for fallback path testing
        delete globalThis.indexedDB;
        window.alert = (() => undefined) as typeof window.alert;

        await importV2V3();

        expect(localStorage.getItem('gameState')).toContain('"versionNumberString":"3"');
        expect(localStorage.getItem('gameStateBackup')).toContain('"versionNumberString":"3"');
    });
});

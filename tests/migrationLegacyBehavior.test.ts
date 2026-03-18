import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
    closeGameStateDatabaseForTesting,
    loadGameState,
    resetGameState,
} from '../frontend/src/utils/gameState/common.js';
import { importV2V3, VERSIONS } from '../frontend/src/utils/gameState.js';
import { parseLegacyV2Raw } from '../frontend/src/utils/legacySaveParsing.js';
import { V1_ITEM_ID_TO_V3_UUID } from '../frontend/src/utils/legacyV1ItemIdMap.js';

describe('legacy v2 migration behavior', () => {
    beforeEach(async () => {
        localStorage.clear();
        await resetGameState();
    });

    afterEach(async () => {
        await closeGameStateDatabaseForTesting();
        localStorage.clear();
    });

    test('reads legacy data from gameStateBackup when gameState is absent', async () => {
        localStorage.setItem(
            'gameStateBackup',
            JSON.stringify({
                versionNumberString: '2.1',
                inventory: { 1: 2 },
                quests: {},
                processes: {},
            })
        );

        const migrated = await importV2V3();

        expect(migrated?.inventory[V1_ITEM_ID_TO_V3_UUID[1]]).toBe(2);
    });

    test('rewrites localStorage legacy keys to v3 payloads after migration', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({
                versionNumberString: '2.1',
                inventory: { 1: 1 },
                quests: {},
                processes: {},
            })
        );
        localStorage.setItem(
            'gameStateBackup',
            JSON.stringify({
                versionNumberString: '2.1',
                inventory: { 1: 3 },
                quests: {},
                processes: {},
            })
        );

        await importV2V3();

        const migratedStateRaw = localStorage.getItem('gameState');
        const migratedBackupRaw = localStorage.getItem('gameStateBackup');
        expect(migratedStateRaw).toBeTruthy();
        expect(migratedBackupRaw).toBeTruthy();
        expect(JSON.parse(migratedStateRaw as string).versionNumberString).toBe(VERSIONS.V3);
        expect(JSON.parse(migratedBackupRaw as string).versionNumberString).toBe(VERSIONS.V3);
        expect(parseLegacyV2Raw(migratedStateRaw as string).isLegacy).toBe(false);
        expect(parseLegacyV2Raw(migratedBackupRaw as string).isLegacy).toBe(false);
    });

    test('compensates unfinished legacy processes with createItems outputs', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({
                versionNumberString: '2.1',
                inventory: {},
                quests: {},
                processes: {
                    'outlet-dWatt-1e3': {
                        startedAt: 1700000000000,
                        duration: 3600000,
                    },
                },
            })
        );

        await importV2V3();
        const state = loadGameState();

        expect(state.inventory['061fd221-404a-4bd1-9432-3e25b0f17a2c']).toBe(1000);
    });
});

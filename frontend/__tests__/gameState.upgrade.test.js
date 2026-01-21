import 'fake-indexeddb/auto';
import { describe, expect, test, beforeEach, afterEach } from 'vitest';

import {
    closeGameStateDatabaseForTesting,
    loadGameState,
    inspectGameStateStorage,
    resetGameState,
    saveGameState,
} from '../src/utils/gameState/common.js';
import {
    importV1V3,
    importV2V3,
    mergeLegacyStateIntoCurrent,
    VERSIONS,
} from '../src/utils/gameState.js';
import items from '../src/pages/inventory/json/items';
import {
    V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID,
    V1_ITEM_ID_TO_V3_UUID,
} from '../src/utils/legacyV1ItemIdMap.js';

const LEGACY_V2_UPGRADE_TROPHY_ID = items.find((i) => i.name === 'V2 Upgrade Trophy').id;

beforeEach(async () => {
    localStorage.clear();
    await resetGameState();
});

afterEach(async () => {
    await closeGameStateDatabaseForTesting();
    localStorage.clear();
});

describe('game state upgrades', () => {
    test('importV2V3 migrates legacy localStorage data and stamps version', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({
                inventory: { 1: 3 },
                quests: { q1: { finished: true } },
            })
        );

        const migrated = await importV2V3();

        expect(migrated.versionNumberString).toBe(VERSIONS.V3);
        const state = loadGameState();
        expect(state.inventory['1']).toBe(3);
        expect(state.quests.q1.finished).toBe(true);
        expect(localStorage.getItem('gameState')).toContain(
            `"versionNumberString":"${VERSIONS.V3}"`
        );
    });

    test('mergeLegacyStateIntoCurrent preserves progress and merges missing fields', async () => {
        await saveGameState({
            inventory: { alpha: 1 },
            quests: { current: { finished: true } },
            processes: { active: { progress: 50 } },
            _meta: { lastUpdated: Date.now() },
        });

        const merged = await mergeLegacyStateIntoCurrent({
            inventory: { alpha: 2, beta: 1 },
            quests: { legacy: { finished: true }, current: { finished: false } },
            processes: { extra: { status: 'running' } },
        });

        expect(merged.versionNumberString).toBe(VERSIONS.V3);
        const state = loadGameState();
        expect(state.inventory.alpha).toBe(3);
        expect(state.inventory.beta).toBe(1);
        expect(state.quests.current.finished).toBe(true);
        expect(state.quests.legacy.finished).toBe(true);
        expect(state.processes.active.progress).toBe(50);
        expect(state.processes.extra.status).toBe('running');
        expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
    });

    test('importV2V3 awards V2 Upgrade Trophy when migrating legacy state', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({
                inventory: { 1: 3 },
                quests: { q1: { finished: true } },
            })
        );

        const migrated = await importV2V3();

        expect(migrated.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
        const state = loadGameState();
        expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
    });

    test('mergeLegacyStateIntoCurrent awards V2 Upgrade Trophy when merging', async () => {
        await saveGameState({
            inventory: { alpha: 1 },
            quests: { current: { finished: true } },
            processes: {},
            _meta: { lastUpdated: Date.now() },
        });

        const merged = await mergeLegacyStateIntoCurrent({
            inventory: { alpha: 2, beta: 1 },
            quests: { legacy: { finished: true } },
            processes: {},
        });

        expect(merged.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
        const state = loadGameState();
        expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
    });

    test('importV1V3 can replace existing state with converted items', async () => {
        await saveGameState({
            inventory: { stale: 9 },
            quests: { keep: { finished: true } },
            processes: {},
            _meta: { lastUpdated: Date.now() },
        });

        const migrated = await importV1V3(
            [
                { id: '1', count: 2 },
                { id: 'item-2', count: 0 },
            ],
            { replaceExisting: true, currencyBalances: [{ symbol: 'dUSD', balance: 5 }] }
        );

        expect(migrated.versionNumberString).toBe(VERSIONS.V3);
        const state = loadGameState();
        expect(state.inventory[V1_ITEM_ID_TO_V3_UUID[1]]).toBe(2);
        expect(state.inventory[V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID.dUSD]).toBe(5);
        expect(state.inventory.stale || 0).toBe(0);
        expect(state.quests.keep).toBeUndefined();
    });

    test('importV2V3 sanitizes legacy inventory artifacts', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({
                versionNumberString: '2.1',
                inventory: { '': 0, 1: 3 },
                quests: {},
                processes: {},
                openAI: { ['api' + 'Key']: 'REDACTED' },
            })
        );

        const migrated = await importV2V3();

        expect(migrated.inventory['']).toBeUndefined();
        expect(migrated.inventory['1']).toBe(3);
        expect(migrated.openAI).toBeUndefined();
    });

    test('v3 localStorage saves are not treated as legacy v2 upgrades', async () => {
        await saveGameState({
            inventory: { alpha: 1 },
            quests: { current: { finished: true } },
            processes: {},
            _meta: { lastUpdated: Date.now() },
        });

        const inspection = await inspectGameStateStorage();

        expect(inspection.localStorageState.versionNumberString).toBe(VERSIONS.V3);
        expect(inspection.hasLegacyV2Keys).toBe(false);
        expect(inspection.legacyV2State).toBeNull();
    });

    test('inspectGameStateStorage detects legacy v2 localStorage state', async () => {
        localStorage.setItem('gameState', JSON.stringify({ inventory: { 1: 1 } }));

        const inspection = await inspectGameStateStorage();

        expect(inspection.hasLegacyV2Keys).toBe(true);
        expect(inspection.legacyV2State).toEqual({
            quests: {},
            inventory: { 1: 1 },
            processes: {},
        });
    });
});

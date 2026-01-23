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
const EARLY_ADOPTER_ID = items.find((i) => i.name === 'Early Adopter Token').id;

beforeEach(async () => {
    localStorage.clear();
    await resetGameState();
});

afterEach(async () => {
    await closeGameStateDatabaseForTesting();
    localStorage.clear();
});

describe('game state upgrades', () => {
    test('fresh v3 state does not include the V2 Upgrade Trophy', async () => {
        const state = loadGameState();

        expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBeUndefined();
        expect(localStorage.getItem('gameState')).not.toContain(LEGACY_V2_UPGRADE_TROPHY_ID);
    });

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
        expect(state.inventory[V1_ITEM_ID_TO_V3_UUID[1]]).toBe(3);
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
        expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBeUndefined();
    });

    test('mergeLegacyStateIntoCurrent maps legacy v2 item ids and sums counts', async () => {
        const dUsdId = V1_ITEM_ID_TO_V3_UUID[24];
        await saveGameState({
            inventory: { [dUsdId]: 10 },
            _meta: { lastUpdated: Date.now() },
        });

        const merged = await mergeLegacyStateIntoCurrent({
            inventory: { 24: '2.5', [dUsdId]: 1 },
        });

        expect(merged.versionNumberString).toBe(VERSIONS.V3);
        const state = loadGameState();
        expect(state.inventory[dUsdId]).toBe(13.5);
    });

    test('mergeLegacyStateIntoCurrent preserves unmapped legacy v2 numeric ids', async () => {
        await saveGameState({
            inventory: { alpha: 1 },
            _meta: { lastUpdated: Date.now() },
        });

        const merged = await mergeLegacyStateIntoCurrent({
            inventory: { 85: 4 },
        });

        expect(merged.versionNumberString).toBe(VERSIONS.V3);
        const state = loadGameState();
        expect(state.inventory['85']).toBe(4);
        expect(state.inventory.alpha).toBe(1);
    });

    test('importV2V3 does not award V2 Upgrade Trophy without explicit upgrade', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({
                inventory: { 1: 3 },
                quests: { q1: { finished: true } },
            })
        );

        const migrated = await importV2V3();

        expect(migrated.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBeUndefined();
        const state = loadGameState();
        expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBeUndefined();
    });

    test('importV2V3 awards V2 Upgrade Trophy when explicitly upgrading', async () => {
        localStorage.setItem(
            'gameState',
            JSON.stringify({
                inventory: { 1: 3 },
                quests: { q1: { finished: true } },
            })
        );

        const migrated = await importV2V3(undefined, { grantUpgradeTrophy: true });

        expect(migrated.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
        const state = loadGameState();
        expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
    });

    test('mergeLegacyStateIntoCurrent awards V2 Upgrade Trophy when explicitly upgrading', async () => {
        await saveGameState({
            inventory: { alpha: 1 },
            quests: { current: { finished: true } },
            processes: {},
            _meta: { lastUpdated: Date.now() },
        });

        const merged = await mergeLegacyStateIntoCurrent(
            {
                inventory: { alpha: 2, beta: 1 },
                quests: { legacy: { finished: true } },
                processes: {},
            },
            { grantUpgradeTrophy: true }
        );

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

    test('importV1V3 awards upgrade trophies when explicitly upgrading', async () => {
        const migrated = await importV1V3([{ id: '1', count: 2 }], {
            grantUpgradeTrophy: true,
        });

        expect(migrated.inventory[EARLY_ADOPTER_ID]).toBe(1);
        expect(migrated.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
        const state = loadGameState();
        expect(state.inventory[EARLY_ADOPTER_ID]).toBe(1);
        expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
    });

    test('importV1V3 does NOT award V2 Upgrade Trophy by default', async () => {
        const migrated = await importV1V3([{ id: '1', count: 1 }]);

        expect(migrated.inventory[EARLY_ADOPTER_ID]).toBe(1);
        expect(migrated.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBeUndefined();
        const state = loadGameState();
        expect(state.inventory[EARLY_ADOPTER_ID]).toBe(1);
        expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBeUndefined();
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
        expect(migrated.inventory[V1_ITEM_ID_TO_V3_UUID[1]]).toBe(3);
        expect(migrated.openAI).toBeUndefined();
    });

    test('inspectGameStateStorage detects legacy v2 localStorage state', async () => {
        localStorage.setItem('gameState', JSON.stringify({ inventory: { 1: 1 } }));

        const inspection = await inspectGameStateStorage();

        expect(inspection.hasLegacyV2Keys).toBe(true);
        expect(inspection.legacyV2State).toEqual({
            quests: {},
            inventory: { [V1_ITEM_ID_TO_V3_UUID[1]]: 1 },
            processes: {},
        });
    });
});

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import items from '../../../pages/inventory/json/items';
import legacyV2Fixtures from '../../legacySaveFixtures/legacy_v2_localstorage_save.json';
import { V1_ITEM_ID_TO_V3_UUID } from '../../legacyV1ItemIdMap.js';
import {
    closeGameStateDatabaseForTesting,
    loadGameState,
    resetGameState,
    saveGameState,
} from '../common.js';
import { mergeLegacyStateIntoCurrent } from '../../gameState.js';

const LEGACY_V2_UPGRADE_TROPHY_ID = items.find((item) => item.name === 'V2 Upgrade Trophy')?.id;

describe('mergeLegacyStateIntoCurrent', () => {
    beforeEach(async () => {
        localStorage.clear();
        await resetGameState();
    });

    afterEach(async () => {
        await closeGameStateDatabaseForTesting();
        localStorage.clear();
    });

    test('maps legacy v2 inventory ids to v3 and sums counts', async () => {
        const legacyProfile = legacyV2Fixtures.profiles.minimal.gameState;

        const item3Id = V1_ITEM_ID_TO_V3_UUID[3];
        const item6Id = V1_ITEM_ID_TO_V3_UUID[6];
        const item10Id = V1_ITEM_ID_TO_V3_UUID[10];
        const item16Id = V1_ITEM_ID_TO_V3_UUID[16];
        const dusdId = V1_ITEM_ID_TO_V3_UUID[24];

        expect(item3Id).toBeTruthy();
        expect(dusdId).toBeTruthy();

        await saveGameState({
            ...loadGameState(),
            inventory: {
                [item3Id]: 10,
                [item6Id]: 2,
                [item10Id]: 1,
                [item16Id]: 0.5,
                [dusdId]: 12,
            },
        });

        await mergeLegacyStateIntoCurrent(legacyProfile, { grantUpgradeTrophy: true });

        const state = loadGameState();
        expect(state.inventory[item3Id]).toBeCloseTo(130.5, 5);
        expect(state.inventory[item6Id]).toBeCloseTo(3.5, 5);
        expect(state.inventory[item10Id]).toBeCloseTo(3, 5);
        expect(state.inventory[item16Id]).toBeCloseTo(4.5, 5);
        expect(state.inventory[dusdId]).toBeCloseTo(262.75, 5);
        if (LEGACY_V2_UPGRADE_TROPHY_ID) {
            expect(state.inventory[LEGACY_V2_UPGRADE_TROPHY_ID]).toBe(1);
        }
    });
});

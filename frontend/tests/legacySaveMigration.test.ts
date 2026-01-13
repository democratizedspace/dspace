import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    closeGameStateDatabaseForTesting,
    loadGameState,
    resetGameState,
} from '../src/utils/gameState/common.js';
import { importV1V3, importV2V3 } from '../src/utils/gameState.js';
import {
    V1_CURRENCY_SYMBOL_TO_V3_UUID,
    V1_ITEM_ID_EXCLUSIONS,
    V1_ITEM_ID_TO_V3_UUID,
} from '../src/utils/legacyV1ItemIdMap.js';

const clearCookies = () => {
    document.cookie.split(';').forEach((cookie) => {
        const name = cookie.split('=')[0]?.trim();
        if (!name) return;
        document.cookie = `${name}=; Max-Age=0; path=/`;
    });
};

describe('legacy save migrations', () => {
    beforeEach(async () => {
        clearCookies();
        localStorage.clear();
        await resetGameState();
    });

    afterEach(async () => {
        await closeGameStateDatabaseForTesting();
        clearCookies();
        localStorage.clear();
    });

    it('maps v1 numeric item IDs and currency balances to v3 UUIDs', async () => {
        const migrated = await importV1V3([
            { id: '3', count: 12.5, source: 'item' },
            { id: '10', count: 2, source: 'item' },
            { id: 'dUSD', count: 50, source: 'currency', currencySymbol: 'dUSD' },
            { id: '999', count: 4, source: 'item' },
        ]);

        expect(migrated).not.toBeNull();
        const state = loadGameState();
        expect(state.inventory[V1_ITEM_ID_TO_V3_UUID['3']]).toBe(12.5);
        expect(state.inventory[V1_ITEM_ID_TO_V3_UUID['10']]).toBe(2);
        expect(state.inventory[V1_CURRENCY_SYMBOL_TO_V3_UUID.dUSD]).toBe(50);
        expect(state.inventory['999']).toBeUndefined();
    });

    it('keeps the v1 mapping deterministic and exclusion-aware', () => {
        const mappedValues = Object.values(V1_ITEM_ID_TO_V3_UUID);
        const mappedKeys = Object.keys(V1_ITEM_ID_TO_V3_UUID);
        const exclusionIds = new Set(V1_ITEM_ID_EXCLUSIONS.map((entry) => entry.id));

        expect(new Set(mappedValues).size).toBe(mappedValues.length);
        mappedKeys.forEach((key) => {
            expect(exclusionIds.has(key)).toBe(false);
        });
        expect(V1_ITEM_ID_TO_V3_UUID['3']).toBeTruthy();
        expect(V1_ITEM_ID_TO_V3_UUID['10']).toBeTruthy();
    });

    it('sanitizes legacy v2 inventory and ignores unknown keys', async () => {
        await importV2V3({
            inventory: {
                '': null,
                '1': 3,
                '-2': -5,
            },
            quests: { q1: { finished: true } },
            processes: {},
            openAI: { apiKey: 'REDACTED (scan-secrets: ignore)' },
        });

        const state = loadGameState();
        expect(state.inventory['']).toBeUndefined();
        expect(state.inventory['1']).toBe(3);
        expect(state.inventory['-2']).toBeUndefined();
        expect(state.openAI).toBeUndefined();
    });
});

import { describe, expect, test } from 'vitest';

import {
    V1_CURRENCY_SYMBOL_TO_V3_UUID,
    V1_ITEM_ID_TO_V3_MAPPINGS,
    V1_ITEM_ID_TO_V3_UUID,
} from '../src/utils/legacyV1ItemIdMap';

describe('legacy v1 item mapping', () => {
    test('mapping is 1:1 and contains unique UUIDs', () => {
        expect(V1_ITEM_ID_TO_V3_MAPPINGS).toHaveLength(78);

        const v1Ids = new Set(V1_ITEM_ID_TO_V3_MAPPINGS.map((entry) => entry.v1Id));
        const v3Ids = new Set(V1_ITEM_ID_TO_V3_MAPPINGS.map((entry) => entry.v3Id));

        expect(v1Ids.size).toBe(78);
        expect(v3Ids.size).toBe(78);
        expect(Object.keys(V1_ITEM_ID_TO_V3_UUID)).toHaveLength(78);
    });

    test('currency mapping includes dUSD', () => {
        expect(V1_CURRENCY_SYMBOL_TO_V3_UUID.dUSD).toBeTruthy();
    });
});

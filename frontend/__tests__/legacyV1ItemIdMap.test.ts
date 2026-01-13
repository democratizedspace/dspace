import { describe, expect, test } from 'vitest';

import {
    LEGACY_V1_ITEM_MAPPINGS,
    V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID,
} from '../src/utils/legacyV1ItemIdMap.js';

describe('legacy v1 item ID mapping', () => {
    test('covers all audited v1 item IDs without duplicates', () => {
        const v1Ids = LEGACY_V1_ITEM_MAPPINGS.map((entry) => entry.v1Id);
        const v3Ids = LEGACY_V1_ITEM_MAPPINGS.map((entry) => entry.v3Id);

        expect(v1Ids).toHaveLength(78);
        expect(new Set(v1Ids).size).toBe(78);
        expect(new Set(v3Ids).size).toBe(78);
        expect(Math.min(...v1Ids)).toBe(0);
        expect(Math.max(...v1Ids)).toBe(77);
    });

    test('includes v1 currency mapping for dUSD', () => {
        expect(V1_CURRENCY_SYMBOL_TO_V3_ITEM_ID.dUSD).toBeTruthy();
    });
});

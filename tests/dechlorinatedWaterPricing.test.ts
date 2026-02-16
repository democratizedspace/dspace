import { describe, expect, it } from 'vitest';
import items from '../frontend/src/pages/inventory/json/items';

const DECHLORINATED_WATER_ID = '71efa72a-8c87-4dc2-8e2c-9119bb28fe50';

describe('dechlorinated tap water pricing regression', () => {
    it('keeps the 48-hour dechlorinated bucket unbuyable', () => {
        const item = items.find((candidate) => candidate.id === DECHLORINATED_WATER_ID);

        expect(item).toBeTruthy();
        expect(item?.name).toBe('5 gallon bucket of dechlorinated tap water');
        expect(item?.price).toBeUndefined();
        expect(item?.priceExemptionReason).toBe('SOULBOUND');
    });
});

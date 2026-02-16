import { describe, expect, it } from 'vitest';

import items from '../src/pages/inventory/json/items';

const DECHLORINATED_BUCKET_ID = '71efa72a-8c87-4dc2-8e2c-9119bb28fe50';

describe('time-gated item pricing', () => {
    it('keeps 5 gallon bucket of dechlorinated tap water non-buyable', () => {
        const item = items.find((entry) => entry.id === DECHLORINATED_BUCKET_ID);

        expect(item).toBeTruthy();
        expect(item?.name).toBe('5 gallon bucket of dechlorinated tap water');
        expect(item?.price).toBeUndefined();
        expect(item?.priceExemptionReason).toBe('TIME_GATED_PROCESS');
    });

    it('requires time-gated items to use an explicit exemption reason instead of price', () => {
        const timeGatedItems = items.filter((entry) => entry.priceExemptionReason === 'TIME_GATED_PROCESS');

        expect(timeGatedItems.length).toBeGreaterThan(0);
        for (const item of timeGatedItems) {
            expect(item.price, `${item.name} should remain non-buyable`).toBeUndefined();
        }
    });
});

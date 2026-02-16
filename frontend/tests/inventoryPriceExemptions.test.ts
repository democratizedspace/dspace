/** @jest-environment node */
import items from '../src/pages/inventory/json/items';
import { describe, it, expect } from 'vitest';

const ALLOWED_PRICE_EXEMPTION_REASONS = new Set([
    'BETA_PLACEHOLDER',
    'CURRENCY',
    'SOULBOUND',
    'TIME_GATED',
    'TROPHY',
]);

const getItemById = (id) => items.find((item) => item.id === id);

describe('inventory price exemption rules', () => {
    it('uses only known price exemption reason values', () => {
        for (const item of items) {
            if (!item.priceExemptionReason) {
                continue;
            }

            expect(
                ALLOWED_PRICE_EXEMPTION_REASONS.has(item.priceExemptionReason),
                `Unknown priceExemptionReason '${item.priceExemptionReason}' on item ${item.id}`
            ).toBe(true);
        }
    });

    it('keeps dechlorinated tap water process-gated and unbuyable', () => {
        const dechlorinatedWater = getItemById('71efa72a-8c87-4dc2-8e2c-9119bb28fe50');

        expect(dechlorinatedWater).toBeTruthy();
        expect(dechlorinatedWater.price).toBeFalsy();
        expect(dechlorinatedWater.priceExemptionReason).toBe('TIME_GATED');
    });
});

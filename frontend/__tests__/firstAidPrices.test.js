/** @jest-environment node */
import items from '../src/pages/inventory/json/items';
import { describe, it, expect } from 'vitest';

const priceOf = (name) => items.find((item) => item.name === name);

describe('first aid supply pricing', () => {
    it('prices first aid kit consumables without beta placeholders', () => {
        const consumables = [
            'adhesive bandages',
            'sterile gauze pads',
            'antiseptic wipes',
            'CPR pocket mask',
        ];

        for (const name of consumables) {
            const item = priceOf(name);
            expect(item, `missing inventory item: ${name}`).toBeTruthy();
            expect(
                item.priceExemptionReason,
                `${name} should not have a placeholder price`
            ).toBeFalsy();
            expect(item.price, `${name} should declare a price string`).toMatch(/\d/);
        }
    });
});

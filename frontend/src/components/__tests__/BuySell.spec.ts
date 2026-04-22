import { render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { dbGetMock } = vi.hoisted(() => ({
    dbGetMock: vi.fn(),
}));
let consoleErrorSpy;

vi.mock('../../utils/customcontent.js', () => ({
    ENTITY_TYPES: { ITEM: 'item' },
    db: { get: dbGetMock },
}));

vi.mock('../../pages/inventory/json/items', () => ({
    default: [
        { id: 'dusd-id', name: 'dUSD', price: '1 dUSD' },
        { id: 'dcarbon-id', name: 'dCarbon', price: '1 dUSD' },
    ],
}));

vi.mock('../../utils', () => ({
    getPriceStringComponents: (price: string) => {
        if (!price) {
            return { price: 0, symbol: '' };
        }

        const [amount, symbol] = price.split(' ');
        return { price: Number(amount), symbol: symbol ?? '' };
    },
}));

vi.mock('../../utils/gameState/inventory.js', () => ({
    buyItems: vi.fn(),
    sellItems: vi.fn(),
    getSalesTaxPercentage: vi.fn(() => 0),
}));

vi.mock('../../utils/gameState/common.js', () => ({
    getPersistedGameStateLightweight: vi.fn(async () => ({ checksum: '' })),
    syncGameStateFromLocalIfStale: vi.fn(),
}));

import BuySell from '../svelte/BuySell.svelte';

describe('BuySell expected IndexedDB errors', () => {
    beforeEach(() => {
        dbGetMock.mockReset();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    test('logs unexpected IndexedDB errors', async () => {
        dbGetMock.mockRejectedValueOnce(new Error('IndexedDB error'));

        const { findByText } = render(BuySell, {
            itemId: 'custom-item',
        });

        await findByText('Item not found');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to load item from IndexedDB in BuySell.svelte',
            expect.objectContaining({
                itemId: 'custom-item',
                entityType: 'item',
            })
        );
    });

    test('suppresses known missing-item IndexedDB errors', async () => {
        dbGetMock.mockRejectedValueOnce(new Error('item not found with id: custom-item'));

        const { findByText } = render(BuySell, {
            itemId: 'custom-item',
        });

        await findByText('Item not found');

        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });
});

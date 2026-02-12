import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockItems, mockSellItems } = vi.hoisted(() => ({
    mockItems: [
        { id: 'dusd-id', name: 'dUSD', price: '1 dUSD' },
        { id: 'dcarbon-id', name: 'dCarbon', price: '1 dUSD' },
        {
            id: 'taxed-item',
            name: 'Taxed Item',
            description: 'Taxable catalog item',
            image: '/taxed.png',
            price: '10 dUSD',
            unit: 'unit',
        },
    ],
    mockSellItems: vi.fn(),
}));

vi.mock('../src/pages/inventory/json/items', () => ({
    default: mockItems,
}));

vi.mock('../src/utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils')>();
    return {
        ...actual,
        getPriceStringComponents: vi.fn((price: string | null) => {
            if (!price) {
                return { price: 0, symbol: '' };
            }
            const [amount, symbol] = price.split(' ');
            return { price: Number(amount), symbol: symbol ?? '' };
        }),
    };
});

vi.mock('../src/utils/gameState/inventory.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/utils/gameState/inventory.js')>();
    return {
        ...actual,
        buyItems: vi.fn(),
        sellItems: mockSellItems,
        getSalesTaxPercentage: vi.fn(() => 20),
    };
});

vi.mock('../src/utils/customcontent.js', () => ({
    ENTITY_TYPES: { ITEM: 'item' },
    db: { get: vi.fn() },
}));

import BuySell from '../src/components/svelte/BuySell.svelte';

describe('BuySell sales tax regression', () => {
    beforeEach(() => {
        mockSellItems.mockReset();
    });

    test('passes base item price to sellItems so tax is not double-applied', async () => {
        const { findByText } = render(BuySell, { props: { itemId: 'taxed-item' } });

        const sellToggle = await findByText('Sell');
        await fireEvent.click(sellToggle.closest('button') as HTMLButtonElement);

        const sellAction = await findByText('Sell for 8 dUSD (-20%)');
        await fireEvent.click(sellAction.closest('button') as HTMLButtonElement);

        expect(mockSellItems).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'taxed-item',
                    quantity: 1,
                    price: 10,
                    symbol: 'dUSD',
                }),
            ])
        );
    });
});

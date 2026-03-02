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

    test('keeps root non-inverted while nested compact list container and buy CTA are inverted', async () => {
        const { container, findByTestId } = render(BuySell, { props: { itemId: 'taxed-item' } });

        const rootContainer = await findByTestId('buy-sell-root');
        expect(rootContainer.classList.contains('inverted')).toBe(false);

        const buyToggle = await findByTestId('buy-toggle');
        const sellToggle = await findByTestId('sell-toggle');
        const buyAction = await findByTestId('transaction-cta');
        const compactItemContainer = container.querySelector(
            '.buy-sell-wrapper > .Container nav .chip-container.static-container'
        );

        expect(buyAction.textContent).toContain('Buy for 10 dUSD');
        expect(buyAction.classList.contains('inverted')).toBe(true);
        expect(compactItemContainer?.classList.contains('inverted')).toBe(true);
        expect(buyToggle.classList.contains('inverted')).toBe(true);
        expect(sellToggle.classList.contains('inverted')).toBe(false);
    });

    test('passes base item price to sellItems so tax is not double-applied', async () => {
        const { findByTestId, findByText } = render(BuySell, { props: { itemId: 'taxed-item' } });

        const sellToggle = await findByTestId('sell-toggle');
        await fireEvent.click(sellToggle);

        await findByText('Sell for 8 dUSD (-20%)');
        const sellAction = await findByTestId('transaction-cta');
        expect(sellAction.classList.contains('red')).toBe(true);
        await fireEvent.click(sellAction);

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

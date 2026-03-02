import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import BuySell from '../svelte/BuySell.svelte';

const { mockItems } = vi.hoisted(() => ({
    mockItems: [
        { id: 'dusd-id', name: 'dUSD', price: '1 dUSD' },
        { id: 'dcarbon-id', name: 'dCarbon', price: '1 dUSD' },
        {
            id: 'contrast-item',
            name: 'Contrast Item',
            description: 'Catalog entry for contrast checks',
            image: '/contrast.png',
            price: '3 dUSD',
            unit: 'unit',
        },
    ],
}));

vi.mock('../../pages/inventory/json/items', () => ({
    default: mockItems,
}));

vi.mock('../../utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../utils')>();

    return {
        ...actual,
        getPriceStringComponents: (price: string | null) => {
            if (!price) {
                return { price: 0, symbol: '' };
            }
            const [amount, symbol] = price.split(' ');
            return { price: Number(amount), symbol: symbol ?? '' };
        },
    };
});

vi.mock('../../utils/gameState/inventory.js', () => ({
    buyItems: vi.fn(),
    sellItems: vi.fn(),
    getSalesTaxPercentage: vi.fn(() => 0),
    getItemCounts: vi.fn(() => ({
        'contrast-item': 0,
        'dusd-id': 0,
        'dcarbon-id': 0,
    })),
}));

vi.mock('../../utils/customcontent.js', () => ({
    ENTITY_TYPES: { ITEM: 'item' },
    db: { get: vi.fn() },
}));

describe('BuySell', () => {
    it('applies inverted contrast to compact items and active buy action', async () => {
        const { container, findByText } = render(BuySell, { props: { itemId: 'contrast-item' } });

        const buyLabel = await findByText('Buy for 3 dUSD');
        expect(buyLabel.closest('button')?.classList.contains('inverted')).toBe(true);

        const compactContainer = container.querySelector('.buy-sell-wrapper nav .chip-container');
        expect(compactContainer?.classList.contains('inverted')).toBe(true);
    });
});

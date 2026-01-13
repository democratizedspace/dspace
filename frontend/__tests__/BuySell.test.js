/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import BuySell from '../src/components/svelte/BuySell.svelte';
import { db, ENTITY_TYPES } from '../src/utils/customcontent.js';

const mockItems = [
    { id: 'dusd-id', name: 'dUSD', price: '1 dUSD' },
    { id: 'dcarbon-id', name: 'dCarbon', price: '1 dUSD' },
];

jest.mock('../src/utils/customcontent.js', () => ({
    ENTITY_TYPES: { ITEM: 'item' },
    db: { get: jest.fn() },
}));

jest.mock('../../pages/inventory/json/items', () => mockItems, { virtual: true });
jest.mock('../src/pages/inventory/json/items', () => mockItems);

jest.mock('../../utils', () => ({
    getPriceStringComponents: jest.fn((price) => {
        if (!price) {
            return { price: 0, symbol: '' };
        }
        const [amount, symbol] = price.split(' ');
        return { price: Number(amount), symbol: symbol ?? '' };
    }),
}));
jest.mock('../src/utils', () => ({
    getPriceStringComponents: jest.fn((price) => {
        if (!price) {
            return { price: 0, symbol: '' };
        }
        const [amount, symbol] = price.split(' ');
        return { price: Number(amount), symbol: symbol ?? '' };
    }),
}));

jest.mock('../../utils/gameState/inventory.js', () => ({
    buyItems: jest.fn(),
    sellItems: jest.fn(),
    getSalesTaxPercentage: jest.fn(() => 0),
}));
jest.mock('../src/utils/gameState/inventory.js', () => ({
    buyItems: jest.fn(),
    sellItems: jest.fn(),
    getSalesTaxPercentage: jest.fn(() => 0),
}));

describe('BuySell', () => {
    beforeEach(() => {
        db.get.mockReset();
        mockItems.splice(2, mockItems.length);
    });

    it('loads custom items from IndexedDB without crashing', async () => {
        db.get.mockResolvedValue({
            id: 'custom-item',
            name: 'Custom Item',
            description: 'Stored in IndexedDB',
            image: '/custom.png',
            price: '5 dUSD',
            unit: 'unit',
        });

        const { findByText, queryByText } = render(BuySell, {
            props: { itemId: 'custom-item' },
        });

        const buyLabel = await findByText('Buy for 5 dUSD');
        expect(buyLabel).toBeTruthy();
        expect(queryByText('Not tradeable')).toBeNull();
        expect(db.get).toHaveBeenCalledWith(ENTITY_TYPES.ITEM, 'custom-item');
    });

    it('shows an error message when IndexedDB fails', async () => {
        db.get.mockRejectedValue(new Error('IndexedDB error'));

        const { findByText } = render(BuySell, { props: { itemId: 'custom-item' } });

        const errorLabel = await findByText('Item not found');
        expect(errorLabel).toBeTruthy();
    });

    it('shows not tradeable when item has no price', async () => {
        db.get.mockResolvedValue({
            id: 'custom-item',
            name: 'Free Item',
            description: 'Stored in IndexedDB',
            image: '/custom.png',
            price: null,
            unit: 'unit',
        });

        const { findByText } = render(BuySell, { props: { itemId: 'custom-item' } });

        const notTradeableLabel = await findByText('Not tradeable');
        expect(notTradeableLabel).toBeTruthy();
    });

    it('uses catalog items without querying IndexedDB', async () => {
        mockItems.push({
            id: 'catalog-item',
            name: 'Catalog Item',
            description: 'Static catalog entry',
            image: '/catalog.png',
            price: '3 dUSD',
            unit: 'unit',
        });

        const { findByText } = render(BuySell, { props: { itemId: 'catalog-item' } });

        const buyLabel = await findByText('Buy for 3 dUSD');
        expect(buyLabel).toBeTruthy();
        expect(db.get).not.toHaveBeenCalled();
    });
});

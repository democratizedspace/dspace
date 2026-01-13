/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import BuySell from '../src/components/svelte/BuySell.svelte';
import { db, ENTITY_TYPES } from '../src/utils/customcontent.js';

jest.mock('../src/utils/customcontent.js', () => ({
    ENTITY_TYPES: { ITEM: 'item' },
    db: { get: jest.fn() },
}));

describe('BuySell', () => {
    it('loads custom items from IndexedDB without crashing', async () => {
        db.get.mockResolvedValue({
            id: 'custom-item',
            name: 'Custom Item',
            description: 'Stored in IndexedDB',
            image: '/custom.png',
            price: '5 dUSD',
            unit: 'unit',
        });

        const { findByText } = render(BuySell, { props: { itemId: 'custom-item' } });

        const buyLabel = await findByText('Buy for 5 dUSD');
        expect(buyLabel).toBeTruthy();
        expect(db.get).toHaveBeenCalledWith(ENTITY_TYPES.ITEM, 'custom-item');
    });
});

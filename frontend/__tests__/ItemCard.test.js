/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import ItemCard from '../src/components/svelte/ItemCard.svelte';

const longDescription =
    'A long-form description that should display fully without truncation in the inventory list.';

jest.mock('../src/pages/inventory/json/items', () => [
    {
        id: 'item-1',
        name: 'Item One',
        title: 'Item One',
        image: '/item.png',
        description: longDescription,
        price: '10 dUSD',
    },
]);

jest.mock('../src/utils/gameState/inventory.js', () => ({
    getItemCount: () => 3,
}));

describe('ItemCard', () => {
    it('renders the full item description without truncation', () => {
        const { getByText } = render(ItemCard, {
            props: { itemId: 'item-1' },
        });

        getByText(longDescription);
    });
});

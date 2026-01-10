/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import ItemCard from '../src/components/svelte/ItemCard.svelte';

const longDescription =
    'This is a deliberately long inventory description that should render in full without truncation.';
const mockItems = [
    {
        id: 'item-1',
        name: 'Test Item',
        title: 'Test Item',
        image: '/item.png',
        description: longDescription,
    },
];
const mockGetItemCount = jest.fn(() => 2);

jest.mock('../../pages/inventory/json/items', () => mockItems, { virtual: true });
jest.mock('../src/pages/inventory/json/items', () => mockItems);

jest.mock('../../utils/gameState/inventory.js', () => ({ getItemCount: mockGetItemCount }), {
    virtual: true,
});
jest.mock('../src/utils/gameState/inventory.js', () => ({ getItemCount: mockGetItemCount }));

describe('ItemCard component', () => {
    it('renders the full description without truncation', () => {
        const { getByText } = render(ItemCard, {
            props: {
                itemId: 'item-1',
            },
        });

        const descriptionNode = getByText(longDescription);
        expect(descriptionNode.textContent).toBe(longDescription);
        expect(descriptionNode.textContent).not.toContain('...');
    });
});

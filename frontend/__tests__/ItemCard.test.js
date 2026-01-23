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
        category: 'Tools',
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
                item: mockItems[0],
            },
        });

        const descriptionNode = getByText(longDescription);
        expect(descriptionNode.textContent).toBe(longDescription);
        expect(descriptionNode.textContent).not.toContain('...');
    });

    it('renders the category detail when present', () => {
        const { getByText } = render(ItemCard, {
            props: {
                item: mockItems[0],
            },
        });

        expect(getByText('Category:')).toBeTruthy();
        expect(getByText('Tools')).toBeTruthy();
    });

    it('renders the category label when present', () => {
        const { getByText } = render(ItemCard, {
            props: {
                item: {
                    ...mockItems[0],
                    categoryLabel: 'Components',
                },
            },
        });

        expect(getByText('Category:')).toBeTruthy();
        expect(getByText('Components')).toBeTruthy();
    });

    it('renders Custom when the item is custom without a category', () => {
        const { getByText } = render(ItemCard, {
            props: {
                item: {
                    ...mockItems[0],
                    category: undefined,
                    custom: true,
                },
            },
        });

        expect(getByText('Category:')).toBeTruthy();
        expect(getByText('Custom')).toBeTruthy();
    });

    it('falls back to Uncategorized when category is missing', () => {
        const { getByText } = render(ItemCard, {
            props: {
                item: {
                    ...mockItems[0],
                    category: undefined,
                },
            },
        });

        expect(getByText('Category:')).toBeTruthy();
        expect(getByText('Uncategorized')).toBeTruthy();
    });
});

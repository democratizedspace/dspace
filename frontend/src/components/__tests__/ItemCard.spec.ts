import { render } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';

vi.mock('../../utils/gameState/inventory.js', () => ({
    getItemCount: () => 0,
}));

import ItemCard from '../svelte/ItemCard.svelte';

describe('ItemCard', () => {
    test('renders the provided category', () => {
        const item = {
            id: 'alpha',
            name: 'Alpha',
            description: 'Alpha desc',
            image: '/alpha.png',
            category: 'Resource',
        };

        const { getByText } = render(ItemCard, { props: { item, count: 1 } });

        expect(getByText('Category:')).toBeTruthy();
        expect(getByText('Resource')).toBeTruthy();
    });

    test('renders Uncategorized when category is missing', () => {
        const item = {
            id: 'beta',
            name: 'Beta',
            description: 'Beta desc',
            image: '/beta.png',
        };

        const { getByText } = render(ItemCard, { props: { item, count: 1 } });

        expect(getByText('Category:')).toBeTruthy();
        expect(getByText('Uncategorized')).toBeTruthy();
    });

    test('renders the category label when provided', () => {
        const item = {
            id: 'gamma',
            name: 'Gamma',
            description: 'Gamma desc',
            image: '/gamma.png',
            categoryLabel: 'Components',
        };

        const { getByText } = render(ItemCard, { props: { item, count: 1 } });

        expect(getByText('Category:')).toBeTruthy();
        expect(getByText('Components')).toBeTruthy();
    });

    test('renders Custom when the item is custom without a category', () => {
        const item = {
            id: 'delta',
            name: 'Delta',
            description: 'Delta desc',
            image: '/delta.png',
            custom: true,
        };

        const { getByText } = render(ItemCard, { props: { item, count: 1 } });

        expect(getByText('Category:')).toBeTruthy();
        expect(getByText('Custom')).toBeTruthy();
    });
});

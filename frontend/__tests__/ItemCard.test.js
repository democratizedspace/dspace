/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';

import ItemCard from '../src/components/svelte/ItemCard.svelte';
import items from '../src/pages/inventory/json/items';

vi.mock('../src/utils/gameState/inventory.js', () => ({
    getItemCount: () => 1,
}));

describe('ItemCard description rendering', () => {
    it('renders the full description without truncation', () => {
        const longDescriptionItem = items.find((item) => item.description?.length > 100);

        if (!longDescriptionItem) {
            throw new Error('Test setup failed to locate a long-description item');
        }

        const { getByText } = render(ItemCard, {
            props: {
                itemId: longDescriptionItem.id,
            },
        });

        expect(getByText(longDescriptionItem.description)).toBeInTheDocument();
    });
});

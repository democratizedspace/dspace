/** @jest-environment jsdom */
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/svelte';

import ItemList from '../src/components/svelte/ItemList.svelte';
import items from '../src/pages/inventory/json/items';

describe('ItemList category filters', () => {
    it('filters displayed inventory items by category', async () => {
        const aquariumItem = items.find((item) => item.name === 'aquarium (150 L)');
        const toolItem = items.find((item) => item.name === 'entry-level FDM 3D printer');

        if (!aquariumItem || !toolItem) {
            throw new Error('Test setup failed to locate required inventory fixtures');
        }

        const inventory = {
            [aquariumItem.id]: { count: 1 },
            [toolItem.id]: { count: 2 },
        };

        const { getByText, getByRole, queryByText } = render(ItemList, { inventory });

        expect(getByText(aquariumItem.name)).toBeInTheDocument();
        expect(getByText(toolItem.name)).toBeInTheDocument();

        const toolsChip = getByRole('button', { name: 'Tools' });
        await fireEvent.click(toolsChip);

        expect(queryByText(aquariumItem.name)).not.toBeInTheDocument();
        expect(getByText(toolItem.name)).toBeInTheDocument();

        await fireEvent.click(toolsChip);

        expect(getByText(aquariumItem.name)).toBeInTheDocument();
        expect(getByText(toolItem.name)).toBeInTheDocument();
    });
});

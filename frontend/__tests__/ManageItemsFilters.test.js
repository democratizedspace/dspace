/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor } from '@testing-library/svelte';

import ManageItems from '../src/pages/inventory/svelte/ManageItems.svelte';
import items from '../src/pages/inventory/json/items';

vi.mock('../src/utils/customcontent.js', () => {
    return {
        db: {
            list: vi.fn().mockResolvedValue([]),
        },
        ENTITY_TYPES: {
            ITEM: 'item',
        },
    };
});

describe('ManageItems category filters', () => {
    it('filters managed inventory items by category', async () => {
        const aquariumItem = items.find((item) => item.name === 'aquarium (150 L)');
        const toolItem = items.find((item) => item.name === 'entry-level FDM 3D printer');

        if (!aquariumItem || !toolItem) {
            throw new Error('Unable to locate required inventory fixtures for test');
        }

        const { getByRole, getByText, queryByText } = render(ManageItems, {
            items: [aquariumItem, toolItem],
        });

        await waitFor(() => {
            expect(getByText(aquariumItem.name)).toBeInTheDocument();
            expect(getByText(toolItem.name)).toBeInTheDocument();
        });

        const toolsChip = getByRole('button', { name: 'Tools' });
        await fireEvent.click(toolsChip);

        expect(queryByText(aquariumItem.name)).not.toBeInTheDocument();
        expect(getByText(toolItem.name)).toBeInTheDocument();

        const allChip = getByRole('button', { name: 'All categories' });
        await fireEvent.click(allChip);

        expect(getByText(aquariumItem.name)).toBeInTheDocument();
        expect(getByText(toolItem.name)).toBeInTheDocument();
    });
});

import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { writable } from 'svelte/store';

const inventoryStore = vi.hoisted(() =>
    writable({
        inventory: {
            trophy: 1,
            custom: 0,
        },
    })
);

const mockItems = vi.hoisted(() => [
    {
        id: 'trophy',
        name: 'Trophy',
        description: 'A test trophy.',
        image: '/trophy.png',
        category: 'Awards',
    },
    {
        id: 'custom',
        name: 'Custom Item',
        description: 'A custom item.',
        image: '/custom.png',
        category: 'Custom',
    },
]);

vi.mock('../json/items', () => ({
    default: mockItems,
}));

vi.mock('../../utils/itemCatalog.js', () => ({
    getMergedItemCatalog: vi.fn(() => Promise.resolve(mockItems)),
}));

vi.mock('../../utils/gameState/common.js', () => ({
    state: inventoryStore,
}));

import Inventory from '../Inventory.svelte';

const settle = async () => {
    await tick();
    await Promise.resolve();
    await tick();
};

describe('Inventory page', () => {
    beforeEach(() => {
        inventoryStore.set({
            inventory: {
                trophy: 1,
                custom: 0,
            },
        });
    });

    test('hides zero-count items when show all items is unchecked', async () => {
        const { queryByText, unmount } = render(Inventory);

        await settle();

        expect(queryByText('Trophy')).not.toBeNull();
        expect(queryByText('Custom Item')).toBeNull();

        unmount();
    });

    test('shows zero-count items when show all items is checked', async () => {
        const { getByLabelText, queryByText, unmount } = render(Inventory);

        await settle();

        const checkbox = getByLabelText(/show all items/i);
        await fireEvent.click(checkbox);
        await tick();

        expect(queryByText('Custom Item')).not.toBeNull();

        unmount();
    });
});

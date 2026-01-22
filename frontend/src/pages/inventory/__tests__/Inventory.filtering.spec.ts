import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockItems = [
    {
        id: 'trophy',
        name: 'Trophy',
        description: 'A shiny trophy.',
        image: '/images/trophy.png',
        category: 'Awards',
    },
    {
        id: 'custom-alpha',
        name: 'Custom Alpha',
        description: 'Custom alpha item.',
        image: '/images/custom-alpha.png',
        category: 'Custom',
    },
    {
        id: 'custom-beta',
        name: 'Custom Beta',
        description: 'Custom beta item.',
        image: '/images/custom-beta.png',
        category: 'Custom',
    },
];

const mockRefs = vi.hoisted(() => ({
    state: null,
    setInventory: () => undefined,
}));

vi.mock('../json/items', () => ({ default: mockItems }));
vi.mock('../json/items/index.js', () => ({ default: mockItems }));

vi.mock('../../../utils/itemCatalog.js', () => ({
    getMergedItemCatalog: () => Promise.resolve(mockItems),
}));

vi.mock('../../../utils/gameState/common.js', async () => {
    const { writable } = await import('svelte/store');
    const store = writable({ inventory: {} });
    mockRefs.state = store;
    mockRefs.setInventory = (inventory) => store.set({ inventory });

    return {
        state: store,
    };
});

vi.mock('../../../utils/gameState/inventory.js', () => ({
    getItemCount: () => 0,
}));

import Inventory from '../Inventory.svelte';

afterEach(() => {
    cleanup();
});

describe('Inventory filtering', () => {
    beforeEach(() => {
        mockRefs.setInventory({});
    });

    it('hides zero-count items when show-all is unchecked (numeric inventory)', async () => {
        mockRefs.setInventory({
            trophy: 1,
            'custom-alpha': 0,
            'custom-beta': 0,
        });

        const { getByRole, getByText, queryByText } = render(Inventory);

        await waitFor(() => {
            expect(getByText('Trophy')).toBeTruthy();
        });

        expect(queryByText('Custom Alpha')).toBeNull();
        expect(queryByText('Custom Beta')).toBeNull();

        await fireEvent.click(getByRole('checkbox', { name: 'Show all items' }));

        await waitFor(() => {
            expect(getByText('Custom Alpha')).toBeTruthy();
            expect(getByText('Custom Beta')).toBeTruthy();
        });
    });

    it('hides zero-count items when show-all is unchecked (object inventory)', async () => {
        mockRefs.setInventory({
            trophy: { count: 1 },
            'custom-alpha': { count: 0 },
            'custom-beta': { count: 0 },
        });

        const { getByRole, getByText, queryByText } = render(Inventory);

        await waitFor(() => {
            expect(getByText('Trophy')).toBeTruthy();
        });

        expect(queryByText('Custom Alpha')).toBeNull();
        expect(queryByText('Custom Beta')).toBeNull();

        await fireEvent.click(getByRole('checkbox', { name: 'Show all items' }));

        await waitFor(() => {
            expect(getByText('Custom Alpha')).toBeTruthy();
            expect(getByText('Custom Beta')).toBeTruthy();
        });
    });
});

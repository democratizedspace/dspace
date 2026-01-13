/**
 * @jest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import BuySell from '../src/components/svelte/BuySell.svelte';

const mockGet = vi.fn(async () => ({
    id: 'custom-item-1',
    name: 'Custom Item',
    description: 'Custom item description',
    image: '/custom-item.png',
    price: '5 dUSD',
}));

vi.mock('../src/utils/customcontent.js', () => ({
    db: {
        get: mockGet,
    },
    ENTITY_TYPES: {
        ITEM: 'item',
    },
}));

describe('BuySell custom items', () => {
    it('renders without crashing for custom items loaded from IndexedDB', async () => {
        const { getByText } = render(BuySell, {
            props: {
                itemId: 'custom-item-1',
            },
        });

        await waitFor(() => {
            expect(mockGet).toHaveBeenCalledWith('item', 'custom-item-1');
            getByText('Buy for 5 dUSD');
        });
    });
});

/** @jest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/svelte';
import CompactItemList from '../src/components/svelte/CompactItemList.svelte';

const getItemCountsMock = vi.fn((list) => list.reduce((acc, { id }) => ({ ...acc, [id]: 0 }), {}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    getItemCounts: getItemCountsMock,
}));

describe('CompactItemList', () => {
    it('renders grant items even when the player inventory is empty', async () => {
        render(CompactItemList, {
            props: {
                itemList: [
                    { id: 'd88ef09c-9191-4c18-8628-a888bb9f926d', count: 10 },
                    { id: '5247a603-294a-4a34-a884-1ae20969b2a1', count: 100 },
                ],
                increase: true,
            },
        });

        await waitFor(() => expect(screen.getByAltText('dCarbon')).toBeVisible());
        expect(screen.getByAltText('dUSD')).toBeVisible();
        expect(screen.getByText(/10/)).toBeInTheDocument();
        expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('falls back to provided item properties when metadata is unavailable', async () => {
        render(CompactItemList, {
            props: {
                itemList: [{ id: 'custom-item', name: 'Custom Item', count: 2 }],
                increase: true,
            },
        });

        await waitFor(() => expect(screen.getByText('Custom Item')).toBeVisible());
        expect(getItemCountsMock).toHaveBeenCalled();
    });
});

/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import CompactItemList from '../src/components/svelte/CompactItemList.svelte';

let resolveReady;
const readyPromise = new Promise((resolve) => {
    resolveReady = resolve;
});

vi.mock('../src/utils/gameState/common.js', () => ({
    ready: readyPromise,
    isGameStateReady: vi.fn(() => false),
}));

vi.mock('../src/utils/gameState/inventory.js', () => ({
    getItemCounts: vi.fn(() => ({ 'test-item': 5 })),
}));

describe('CompactItemList inventory readiness', () => {
    it('shows a loading placeholder until inventory is ready', async () => {
        const { container, getByText, queryByText } = render(CompactItemList, {
            props: {
                itemList: [
                    { id: 'test-item', name: 'Test Item', count: 2, image: '/test.png' },
                ],
                decrease: true,
            },
        });

        getByText('Test Item');
        expect(container.querySelector('.count-loading')).not.toBeNull();
        expect(queryByText('5')).toBeNull();

        resolveReady();
        await readyPromise;
        await tick();

        getByText('5');
    });
});

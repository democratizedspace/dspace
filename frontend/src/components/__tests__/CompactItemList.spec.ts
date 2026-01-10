import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import CompactItemList from '../svelte/CompactItemList.svelte';

const getItemCountsMock = vi.fn();
const buildFullItemListMock = vi.fn();
const gameStateReadyMock = vi.fn();
let readyPromise;
let resolveReady;

vi.mock('../../utils/gameState/inventory.js', () => ({
    getItemCounts: (...args) => getItemCountsMock(...args),
}));

vi.mock('../../utils/gameState/common.js', () => ({
    get ready() {
        return readyPromise;
    },
    isGameStateReady: () => gameStateReadyMock(),
}));

vi.mock('../svelte/compactItemListHelpers.js', () => ({
    buildFullItemList: (...args) => buildFullItemListMock(...args),
}));

describe('CompactItemList', () => {
    beforeEach(() => {
        getItemCountsMock.mockReset();
        buildFullItemListMock.mockReset();
        gameStateReadyMock.mockReset();
        vi.useFakeTimers();
        readyPromise = new Promise((resolve) => {
            resolveReady = resolve;
        });
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    test('reuses keyed rows when item ids are unique', async () => {
        gameStateReadyMock.mockReturnValue(true);
        resolveReady();
        const items = [
            { id: 'alpha', name: 'Alpha', image: '/alpha.png', count: 1 },
            { id: 'beta', name: 'Beta', image: '/beta.png', count: 2 },
        ];

        getItemCountsMock.mockImplementation((list) =>
            Object.fromEntries(list.map((item) => [item.id, item.count ?? 0]))
        );
        buildFullItemListMock.mockImplementation((list, totals) =>
            list.map((item) => ({ ...item, total: totals[item.id] ?? 0 }))
        );

        const { container, rerender, unmount } = render(CompactItemList, {
            props: { itemList: items },
        });

        await tick();

        const initialRows = Array.from(container.querySelectorAll('.horizontal'));
        expect(initialRows).toHaveLength(2);
        expect(initialRows[0].textContent).toContain('Alpha');
        expect(initialRows[1].textContent).toContain('Beta');

        const swapped = [items[1], items[0]];
        buildFullItemListMock.mockImplementation((list, totals) =>
            list.map((item) => ({ ...item, total: totals[item.id] ?? 0 }))
        );

        await rerender({ itemList: swapped });
        await tick();

        const swappedRows = Array.from(container.querySelectorAll('.horizontal'));
        expect(swappedRows[0].textContent).toContain('Beta');
        expect(swappedRows[1].textContent).toContain('Alpha');
        expect(swappedRows[0]).toBe(initialRows[1]);
        expect(swappedRows[1]).toBe(initialRows[0]);

        unmount();
    });

    test('renders duplicate ids independently using index keys', async () => {
        gameStateReadyMock.mockReturnValue(true);
        resolveReady();
        const duplicateItems = [
            { id: 'repeat', name: 'First Repeat', image: '/repeat-1.png', count: 1 },
            { id: 'repeat', name: 'Second Repeat', image: '/repeat-2.png', count: 2 },
        ];

        getItemCountsMock.mockReturnValue({ repeat: 5 });
        buildFullItemListMock.mockImplementation((list, totals) =>
            list.map((item) => ({ ...item, total: totals[item.id] ?? 0 }))
        );

        const { container, rerender, unmount } = render(CompactItemList, {
            props: { itemList: duplicateItems },
        });

        await tick();

        const initialRows = Array.from(container.querySelectorAll('.horizontal'));
        expect(initialRows).toHaveLength(2);
        expect(initialRows[0].textContent).toContain('First Repeat');
        expect(initialRows[1].textContent).toContain('Second Repeat');

        const reversed = [...duplicateItems].reverse();
        buildFullItemListMock.mockImplementation((list, totals) =>
            list.map((item) => ({ ...item, total: totals[item.id] ?? 0 }))
        );

        await rerender({ itemList: reversed });
        await tick();

        const reversedRows = Array.from(container.querySelectorAll('.horizontal'));
        expect(reversedRows).toHaveLength(2);
        expect(reversedRows[0].textContent).toContain('Second Repeat');
        expect(reversedRows[1].textContent).toContain('First Repeat');
        expect(reversedRows[0]).toBe(initialRows[0]);
        expect(reversedRows[1]).toBe(initialRows[1]);

        unmount();
    });

    test('shows a loading placeholder until game state hydration completes', async () => {
        gameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockReturnValue({ alpha: 0 });
        buildFullItemListMock.mockImplementation((list, totals) =>
            list.map((item) => ({ ...item, total: totals[item.id] ?? 0 }))
        );

        const { container } = render(CompactItemList, {
            props: {
                itemList: [{ id: 'alpha', name: 'Alpha', image: '/alpha.png', count: 1 }],
                decrease: true,
            },
        });

        await tick();

        const placeholder = container.querySelector('.count-placeholder');
        expect(placeholder).not.toBeNull();

        getItemCountsMock.mockReturnValue({ alpha: 5 });
        gameStateReadyMock.mockReturnValue(true);
        resolveReady();

        await readyPromise;
        await tick();

        expect(container.textContent).toContain('5');
    });
});

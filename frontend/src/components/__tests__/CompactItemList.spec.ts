import { render, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

const getItemCountsMock = vi.fn();
const buildFullItemListMock = vi.fn();
const isGameStateReadyMock = vi.fn();
const getItemMapMock = vi.fn();
let readyPromise: Promise<void> = Promise.resolve();
let resolveReadyPromise = () => {};

vi.mock('../../utils/gameState/inventory.js', () => ({
    getItemCounts: (...args) => getItemCountsMock(...args),
}));

vi.mock('../../utils/gameState/common.js', () => ({
    get ready() {
        return readyPromise;
    },
    isGameStateReady: (...args) => isGameStateReadyMock(...args),
}));

vi.mock('../svelte/compactItemListHelpers.js', () => ({
    buildFullItemList: (...args) => buildFullItemListMock(...args),
}));

vi.mock('../../utils/itemResolver.js', () => ({
    getItemMap: (...args) => getItemMapMock(...args),
}));

import CompactItemList from '../svelte/CompactItemList.svelte';

describe('CompactItemList', () => {
    beforeEach(() => {
        getItemCountsMock.mockReset();
        buildFullItemListMock.mockReset();
        isGameStateReadyMock.mockReset();
        getItemMapMock.mockReset();
        resolveReadyPromise = () => {};
        readyPromise = new Promise((resolve) => {
            resolveReadyPromise = resolve;
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    test('reuses keyed rows when item ids are unique', async () => {
        const items = [
            { id: 'alpha', name: 'Alpha', image: '/alpha.png', count: 1 },
            { id: 'beta', name: 'Beta', image: '/beta.png', count: 2 },
        ];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockImplementation((list) =>
            Object.fromEntries(list.map((item) => [item.id, item.count ?? 0]))
        );
        getItemMapMock.mockResolvedValue(new Map());
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
        const duplicateItems = [
            { id: 'repeat', name: 'First Repeat', image: '/repeat-1.png', count: 1 },
            { id: 'repeat', name: 'Second Repeat', image: '/repeat-2.png', count: 2 },
        ];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ repeat: 5 });
        getItemMapMock.mockResolvedValue(new Map());
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

    test('shows loading spinners until game state is ready', async () => {
        const items = [{ id: 'alpha', name: 'Alpha', image: '/alpha.png', count: 1 }];
        let isReady = false;

        isGameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockImplementation(() => ({ alpha: isReady ? 5 : 0 }));
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockImplementation((list, totals) =>
            list.map((item) => ({ ...item, total: totals[item.id] ?? 0 }))
        );

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items },
        });

        await tick();

        expect(container.querySelectorAll('.count-placeholder')).toHaveLength(1);
        expect(container.querySelectorAll('.spinner')).toHaveLength(1);
        expect(container.textContent).not.toMatch(/\b0\b/);

        isReady = true;
        resolveReadyPromise();
        await Promise.resolve();
        await tick();

        expect(container.querySelectorAll('.spinner')).toHaveLength(0);
        expect(container.textContent).toContain('5');

        unmount();
    });

    test('renders name-count format while loading and after polling updates', async () => {
        const items = [{ id: 'dusd', name: 'dUSD', image: '/dusd.png' }];
        let isReady = false;

        isGameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockImplementation(() => ({ dusd: isReady ? 10 : 0 }));
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockImplementation((list, totals) =>
            list.map((item) => ({ ...item, total: totals[item.id] ?? 0, count: null }))
        );

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, nameCountFormat: true },
        });

        await tick();

        expect(container.textContent).toContain('dUSD:');
        expect(container.textContent).not.toContain('x dUSD');
        expect(container.querySelector('[aria-label="Loading inventory count"]')).not.toBeNull();

        isReady = true;
        resolveReadyPromise();
        await Promise.resolve();
        await tick();

        expect(container.textContent).toContain('dUSD: 10');
        expect(container.textContent).not.toContain('x dUSD');

        unmount();
    });

    test('renders loading placeholder with suffix + container context in default mode', async () => {
        const items = [
            {
                id: 'dusd',
                name: 'dUSD',
                image: '/dusd.png',
                count: null,
                containerName: 'Savings Jar',
            },
        ];

        isGameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items },
        });

        await tick();

        expect(container.querySelector('[aria-label="Loading inventory count"]')).not.toBeNull();
        expect(container.textContent).toContain('x dUSD');
        expect(container.textContent).toContain('in Savings Jar');

        unmount();
    });

    test('renders loading placeholder in name-count mode without suffix context', async () => {
        const items = [
            {
                id: 'dusd',
                name: 'dUSD',
                image: '/dusd.png',
                count: null,
                containerName: 'Savings Jar',
            },
        ];

        isGameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, nameCountFormat: true },
        });

        await tick();

        expect(container.querySelector('[aria-label="Loading inventory count"]')).not.toBeNull();
        expect(container.textContent).toContain('dUSD:');
        expect(container.textContent).not.toContain('x dUSD');
        expect(container.textContent).not.toContain('in Savings Jar');

        unmount();
    });

    test('renders loading decrease placeholder with pending delta', async () => {
        const items = [{ id: 'dusd', name: 'dUSD', image: '/dusd.png', count: 3 }];

        isGameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, decrease: true },
        });

        await tick();

        expect(container.querySelector('[aria-label="Loading inventory count"]')).not.toBeNull();
        expect(container.textContent).toContain('−3');
        expect(container.textContent).toContain('x dUSD');

        unmount();
    });

    test('renders loading increase placeholder with pending delta', async () => {
        const items = [{ id: 'dusd', name: 'dUSD', image: '/dusd.png', count: 3 }];

        isGameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, increase: true },
        });

        await tick();

        expect(container.querySelector('[aria-label="Loading inventory count"]')).not.toBeNull();
        expect(container.textContent).toContain('+3');
        expect(container.textContent).toContain('x dUSD');

        unmount();
    });

    test('renders loading decrease delta without negative styling when noRed is enabled', async () => {
        const items = [{ id: 'dusd', name: 'dUSD', image: '/dusd.png', count: 3 }];

        isGameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, decrease: true, noRed: true },
        });

        await tick();

        const delta = container.querySelector('.qty');
        expect(delta?.textContent).toContain('−3');
        expect(delta?.classList.contains('neg')).toBe(false);

        unmount();
    });

    test('keeps default count-name format when increase mode is enabled', async () => {
        const items = [{ id: 'dusd', name: 'dUSD', image: '/dusd.png', count: 3 }];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, increase: true, nameCountFormat: true },
        });

        await tick();

        expect(container.textContent).toContain('10');
        expect(container.textContent).toContain('+3');
        expect(container.textContent).toContain('x dUSD');
        expect(container.textContent).not.toContain('dUSD:');

        unmount();
    });

    test('keeps default count-name format when decrease mode is enabled', async () => {
        const items = [{ id: 'dusd', name: 'dUSD', image: '/dusd.png', count: 3 }];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, decrease: true, nameCountFormat: true },
        });

        await tick();

        expect(container.textContent).toContain('10');
        expect(container.textContent).toContain('−3');
        expect(container.textContent).toContain('x dUSD');
        expect(container.textContent).not.toContain('dUSD:');

        unmount();
    });

    test('renders container context only in default count-name mode', async () => {
        const items = [
            {
                id: 'dusd',
                name: 'dUSD',
                image: '/dusd.png',
                count: null,
                containerName: 'Savings Jar',
            },
        ];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, rerender, unmount } = render(CompactItemList, {
            props: { itemList: items },
        });

        await tick();

        expect(container.textContent).toContain('10 x dUSD');
        expect(container.textContent).toContain('in Savings Jar');

        await rerender({ itemList: items, nameCountFormat: true });
        await tick();

        expect(container.textContent).toContain('10 x dUSD');
        expect(container.textContent).toContain('in Savings Jar');

        unmount();
    });

    test('hides container context in ready name-count mode', async () => {
        const items = [
            {
                id: 'dusd',
                name: 'dUSD',
                image: '/dusd.png',
                count: null,
                containerName: 'Savings Jar',
            },
        ];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, nameCountFormat: true },
        });

        await tick();

        expect(container.textContent).toContain('dUSD: 10');
        expect(container.textContent).not.toContain('x dUSD');
        expect(container.textContent).not.toContain('in Savings Jar');

        unmount();
    });

    test('renders suffix and container context when name-count mode is disabled', async () => {
        const items = [
            {
                id: 'dusd',
                name: 'dUSD',
                image: '/dusd.png',
                count: null,
                containerName: 'Savings Jar',
            },
        ];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ dusd: 10 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, nameCountFormat: false },
        });

        await tick();

        expect(container.textContent).toContain('10 x dUSD');
        expect(container.textContent).toContain('in Savings Jar');
        expect(container.textContent).not.toContain('dUSD: 10');

        unmount();
    });

    test('falls back to index keys when items have no stable id', async () => {
        const items = [
            { id: null, name: 'Mystery A', image: '/a.png', count: 1 },
            { id: undefined, name: 'Mystery B', image: '/b.png', count: 1 },
        ];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({});
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items },
        });

        await tick();

        expect(container.querySelectorAll('.horizontal')).toHaveLength(2);
        expect(container.textContent).toContain('Mystery A');
        expect(container.textContent).toContain('Mystery B');

        unmount();
    });

    test('releases stale metadata images when a newer request wins', async () => {
        const staleReleaseImage = vi.fn();
        const alpha = [{ id: 'alpha', name: 'Alpha', image: '/alpha.png', count: null }];
        const beta = [{ id: 'beta', name: 'Beta', image: '/beta.png', count: null }];
        let resolveFirstMetadata;

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ alpha: 1, beta: 2 });
        getItemMapMock
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirstMetadata = resolve;
                    })
            )
            .mockResolvedValueOnce(
                new Map([['beta', { id: 'beta', name: 'Beta', image: '/beta.png' }]])
            );
        buildFullItemListMock.mockImplementation((list) => list);

        const { rerender, unmount } = render(CompactItemList, {
            props: { itemList: alpha, nameCountFormat: true },
        });

        await tick();
        await rerender({ itemList: beta, nameCountFormat: true });
        await tick();

        resolveFirstMetadata(
            new Map([
                [
                    'alpha',
                    {
                        id: 'alpha',
                        name: 'Alpha',
                        image: '/alpha.png',
                        releaseImage: staleReleaseImage,
                    },
                ],
            ])
        );

        await Promise.resolve();
        await Promise.resolve();

        expect(staleReleaseImage).toHaveBeenCalledTimes(1);

        unmount();
    });

    test('ignores game-state ready resolution after unmount', async () => {
        const items = [{ id: 'alpha', name: 'Alpha', image: '/alpha.png', count: null }];

        isGameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockReturnValue({ alpha: 3 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue(items);

        const { unmount } = render(CompactItemList, {
            props: { itemList: items, nameCountFormat: true },
        });

        await tick();
        unmount();

        resolveReadyPromise();
        await Promise.resolve();
        await Promise.resolve();

        expect(getItemCountsMock).not.toHaveBeenCalled();
    });

    test('renders placeholder icon when item metadata is loading', async () => {
        const items = [{ id: 'alpha', name: 'Alpha', image: '/alpha.png', count: 1 }];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ alpha: 3 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue([
            {
                id: 'alpha',
                name: 'Alpha',
                image: '/alpha.png',
                count: 1,
                loading: true,
            },
        ]);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items },
        });

        await tick();

        expect(container.querySelector('[aria-label="Loading item image"]')).not.toBeNull();
        expect(container.querySelectorAll('.spinner')).toHaveLength(1);

        unmount();
    });

    test('renders decrease counts with negative styling', async () => {
        const items = [{ id: 'alpha', name: 'Alpha', image: '/alpha.png', count: 2 }];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ alpha: 5 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockReturnValue([
            {
                id: 'alpha',
                name: 'Alpha',
                image: '/alpha.png',
                count: 2,
            },
        ]);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items, decrease: true },
        });

        await tick();

        expect(container.textContent).toContain('−2');
        expect(container.querySelector('.qty.neg')).not.toBeNull();

        unmount();
    });

    test('renders container-scoped requirements nested under the container item', async () => {
        const items = [
            {
                id: 'savings-jar',
                name: 'Savings Jar',
                image: '/savings-jar.png',
                count: 1,
            },
            {
                id: 'dusd',
                name: 'dUSD',
                image: '/dusd.png',
                count: 100,
                containerItemId: 'savings-jar',
            },
        ];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ 'savings-jar': 1, dusd: 100 });
        getItemMapMock.mockResolvedValue(
            new Map([
                [
                    'savings-jar',
                    {
                        id: 'savings-jar',
                        name: 'savings jar',
                        image: '/savings-jar.png',
                        releaseImage: null,
                    },
                ],
                [
                    'dusd',
                    {
                        id: 'dusd',
                        name: 'dUSD',
                        image: '/dusd.png',
                        releaseImage: null,
                    },
                ],
            ])
        );

        const { buildFullItemList } = await vi.importActual('../svelte/compactItemListHelpers.js');
        buildFullItemListMock.mockImplementation(buildFullItemList);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items },
        });

        await waitFor(() => {
            const rows = Array.from(container.querySelectorAll('.horizontal'));
            expect(rows).toHaveLength(2);
            expect(rows[0].textContent?.toLowerCase()).toContain('savings jar');
            expect(rows[1].textContent).toContain('dUSD');
            expect(rows[1].classList.contains('nested-requirement')).toBe(true);
            expect(rows[1].textContent).toContain('in savings jar');
        });

        unmount();
    });
    test('renders fallback metadata for unknown custom items', async () => {
        const items = [{ id: 'custom-item', count: 1 }];

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ 'custom-item': 0 });
        getItemMapMock.mockResolvedValue(
            new Map([
                [
                    'custom-item',
                    {
                        id: 'custom-item',
                        name: 'Unknown item',
                        image: '/favicon.ico',
                        releaseImage: null,
                    },
                ],
            ])
        );

        const { buildFullItemList } = await vi.importActual('../svelte/compactItemListHelpers.js');
        buildFullItemListMock.mockImplementation(buildFullItemList);

        const { container, unmount } = render(CompactItemList, {
            props: { itemList: items },
        });

        await tick();

        expect(container.textContent).toContain('Unknown item');

        unmount();
    });

    test('releases stale metadata images when a newer metadata request wins', async () => {
        const firstReleaseImage = vi.fn();
        const secondReleaseImage = vi.fn();
        const firstMap = new Map([
            [
                'dusd',
                {
                    id: 'dusd',
                    name: 'dUSD',
                    image: '/dusd.png',
                    releaseImage: firstReleaseImage,
                },
            ],
        ]);
        const secondMap = new Map([
            [
                'credits',
                {
                    id: 'credits',
                    name: 'Credits',
                    image: '/credits.png',
                    releaseImage: secondReleaseImage,
                },
            ],
        ]);

        let resolveFirstMap;
        let resolveSecondMap;

        const firstMapPromise = new Promise<Map<string, unknown>>((resolve) => {
            resolveFirstMap = resolve;
        });
        const secondMapPromise = new Promise<Map<string, unknown>>((resolve) => {
            resolveSecondMap = resolve;
        });

        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockImplementation((list) =>
            Object.fromEntries(list.map((item) => [item.id, item.count ?? 0]))
        );
        buildFullItemListMock.mockImplementation((list) => list);
        getItemMapMock.mockReturnValueOnce(firstMapPromise).mockReturnValueOnce(secondMapPromise);

        const { rerender, unmount } = render(CompactItemList, {
            props: { itemList: [{ id: 'dusd', name: 'dUSD', image: '/dusd.png', count: 100 }] },
        });

        await rerender({
            itemList: [{ id: 'credits', name: 'Credits', image: '/credits.png', count: 1 }],
        });

        resolveSecondMap(secondMap);
        await tick();

        resolveFirstMap(firstMap);
        await waitFor(() => {
            expect(firstReleaseImage).toHaveBeenCalledTimes(1);
        });

        expect(secondReleaseImage).not.toHaveBeenCalled();

        unmount();
        expect(secondReleaseImage).toHaveBeenCalledTimes(1);
    });

    test('does not start counts interval when unmounted before ready resolves', async () => {
        const items = [{ id: 'alpha', name: 'Alpha', image: '/alpha.png', count: 1 }];

        isGameStateReadyMock.mockReturnValue(false);
        getItemCountsMock.mockReturnValue({ alpha: 0 });
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockImplementation((list) => list);

        const { unmount } = render(CompactItemList, {
            props: { itemList: items },
        });

        await tick();
        unmount();

        resolveReadyPromise();
        await Promise.resolve();
        await tick();
        vi.advanceTimersByTime(2000);

        expect(getItemCountsMock).not.toHaveBeenCalled();
    });

    test('falls back to index keys when an item has no stable id', async () => {
        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({});
        getItemMapMock.mockResolvedValue(new Map());
        buildFullItemListMock.mockImplementation((list) => list);

        const { container, unmount } = render(CompactItemList, {
            props: {
                itemList: [
                    { id: 'alpha', name: 'Alpha', image: '/alpha.png', count: 1 },
                    { id: undefined, name: 'No ID Item', image: '/fallback.png', count: 1 },
                ],
            },
        });

        await waitFor(() => {
            const rows = Array.from(container.querySelectorAll('.horizontal'));
            expect(rows).toHaveLength(2);
            expect(rows[1].textContent).toContain('No ID Item');
        });

        unmount();
    });

    test('safely handles undefined item metadata maps', async () => {
        isGameStateReadyMock.mockReturnValue(true);
        getItemCountsMock.mockReturnValue({ alpha: 1 });
        getItemMapMock.mockResolvedValue(undefined);
        buildFullItemListMock.mockImplementation((list) => list);

        const { unmount } = render(CompactItemList, {
            props: { itemList: [{ id: 'alpha', name: 'Alpha', image: '/alpha.png', count: 1 }] },
        });

        await tick();
        expect(getItemMapMock).toHaveBeenCalledWith(['alpha']);

        expect(() => unmount()).not.toThrow();
    });
});

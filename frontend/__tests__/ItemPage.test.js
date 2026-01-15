import 'fake-indexeddb/auto';
import { render, waitFor } from '@testing-library/svelte';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import items from '../src/pages/inventory/json/items';
import ItemPage from '../src/pages/inventory/item/ItemPage.svelte';
import { db } from '../src/utils/customcontent.js';
import { resetItemResolverCache } from '../src/utils/itemResolver.js';

const getItemCountsMock = vi.fn();

vi.mock('../src/utils/gameState/inventory.js', () => ({
    getItemCounts: (...args) => getItemCountsMock(...args),
}));

vi.mock('../src/utils/gameState/processes.js', () => ({
    getProcessesForItem: () => ({}),
    ProcessItemTypes: {
        REQUIRE_ITEM: 'requireItem',
        CONSUME_ITEM: 'consumeItem',
        CREATE_ITEM: 'createItem',
    },
}));

vi.mock('../src/utils/itemDependencies.js', () => ({
    getQuestsForItem: () => ({ requires: [], rewards: [] }),
}));

const deleteDatabase = (name) =>
    new Promise((resolve) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
    });

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeAll(() => {
    URL.createObjectURL = vi.fn(() => 'blob:custom-item');
    URL.revokeObjectURL = vi.fn();
});

afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
});

beforeEach(async () => {
    await deleteDatabase('CustomContent');
    resetItemResolverCache();
    getItemCountsMock.mockImplementation((list) =>
        Object.fromEntries(list.map((item) => [item.id, item.count ?? 0]))
    );
});

describe('ItemPage', () => {
    it('renders built-in item details and hero image', async () => {
        const builtIn = items[0];

        const { getByTestId, unmount } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            expect(getByTestId('item-hero-title').textContent).toContain(builtIn.name);
        });

        const heroImage = getByTestId('item-hero-image');
        expect(heroImage.getAttribute('src')).toBe(builtIn.image);

        await waitFor(() => {
            const listIcon = getByTestId('item-compact-list').querySelector('img.icon');
            expect(listIcon?.getAttribute('src')).toBe(builtIn.image);
        });

        unmount();
    });

    it('renders custom item details and matching compact list icon', async () => {
        const customItem = {
            id: 'custom-item-detail-id',
            name: 'foobar',
            description: 'foo bar baz',
            image: null,
            imageBlob: new Blob(['custom'], { type: 'image/png' }),
        };

        await db.items.add(customItem);

        const { getByTestId, unmount } = render(ItemPage, {
            props: { itemId: customItem.id },
        });

        await waitFor(() => {
            expect(getByTestId('item-hero-title').textContent).toContain(customItem.name);
        });

        const heroImage = getByTestId('item-hero-image');
        const heroSrc = heroImage.getAttribute('src');

        expect(heroSrc).toBe('blob:custom-item');

        await waitFor(() => {
            const listIcon = getByTestId('item-compact-list').querySelector('img.icon');
            expect(listIcon?.getAttribute('src')).toBe(heroSrc);
        });

        unmount();
    });

    it('shows an item not found state when metadata is missing', async () => {
        const { getByTestId, unmount } = render(ItemPage, {
            props: { itemId: 'missing-item-id' },
        });

        await waitFor(() => {
            expect(getByTestId('item-not-found')).toBeTruthy();
        });

        unmount();
    });
});

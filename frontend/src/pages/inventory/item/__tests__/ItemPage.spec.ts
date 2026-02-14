import 'fake-indexeddb/auto';
import { render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import items from '../../json/items';
import ItemPage from '../ItemPage.svelte';
import { db } from '../../../../utils/customcontent.js';
import { clearItemResolverCache } from '../../../../utils/itemResolver.js';

const getItemCountsMock = vi.fn();
const isGameStateReadyMock = vi.fn();

vi.mock('../../../../utils/gameState/processes.js', () => {
    const ProcessItemTypes = {
        REQUIRE_ITEM: 'require',
        CONSUME_ITEM: 'consume',
        CREATE_ITEM: 'create',
    };

    return {
        ProcessItemTypes,
        getProcessesForItem: () => ({
            [ProcessItemTypes.REQUIRE_ITEM]: [],
            [ProcessItemTypes.CONSUME_ITEM]: [],
            [ProcessItemTypes.CREATE_ITEM]: [],
        }),
    };
});

vi.mock('../../../../utils/itemDependencies.js', () => ({
    getQuestsForItem: () => ({ requires: [], rewards: [] }),
}));

vi.mock('../../../../utils/gameState/inventory.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getItemCounts: (...args) => getItemCountsMock(...args),
    };
});

vi.mock('../../../../utils/gameState/common.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        ready: Promise.resolve(),
        isGameStateReady: (...args) => isGameStateReadyMock(...args),
    };
});

const TEST_IMAGE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

async function deleteCustomContentDb() {
    await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('CustomContent');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
    });
}

afterEach(async () => {
    clearItemResolverCache();
    await deleteCustomContentDb();
    getItemCountsMock.mockReset();
    isGameStateReadyMock.mockReset();
});

describe('ItemPage', () => {
    it('renders built-in item details', async () => {
        const builtIn = items.find((item) => !item.price) ?? items[0];

        getItemCountsMock.mockReturnValue({ [builtIn.id]: 1 });
        isGameStateReadyMock.mockReturnValue(true);

        const { container, getByRole } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            expect(getByRole('heading', { level: 2 }).textContent).toBe(builtIn.name);
        });

        const heroImage = container.querySelector('img:not(.icon)');
        expect(heroImage?.getAttribute('src')).toBe(builtIn.image);
    });

    it('renders custom item details and matching icon', async () => {
        const customId = 'custom-item-foobar';

        await db.items.add({
            id: customId,
            name: 'foobar',
            description: 'foo bar baz',
            image: TEST_IMAGE,
        });

        getItemCountsMock.mockReturnValue({ [customId]: 1 });
        isGameStateReadyMock.mockReturnValue(true);

        const { container, getByRole } = render(ItemPage, {
            props: { itemId: customId },
        });

        await waitFor(() => {
            expect(getByRole('heading', { level: 2 }).textContent).toBe('foobar');
        });

        const heroImage = container.querySelector('img:not(.icon)');

        expect(heroImage?.getAttribute('src')).toBe(TEST_IMAGE);

        await waitFor(() => {
            const iconImage = container.querySelector('img.icon');
            expect(iconImage?.getAttribute('src')).toBe(heroImage?.getAttribute('src'));
        });
    });

    it('renders item content in a text-selectable container instead of a button', async () => {
        const builtIn = items.find((item) => !item.price) ?? items[0];

        getItemCountsMock.mockReturnValue({ [builtIn.id]: 1 });
        isGameStateReadyMock.mockReturnValue(true);

        const { container, getByRole } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            expect(getByRole('heading', { level: 2 }).textContent).toBe(builtIn.name);
        });

        const heading = getByRole('heading', { level: 2 });
        expect(heading.closest('button')).toBeNull();

        const itemCard = container.querySelector('.item-card');
        expect(itemCard).not.toBeNull();
        expect(itemCard?.tagName).toBe('SECTION');
    });
});

import 'fake-indexeddb/auto';
import { render, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import items from '../../json/items';
import ItemPage from '../ItemPage.svelte';
import { db } from '../../../../utils/customcontent.js';
import { clearItemResolverCache } from '../../../../utils/itemResolver.js';

const getItemCountsMock = vi.fn();
const getContainedItemCountsMock = vi.fn();
const isGameStateReadyMock = vi.fn();
const getProcessesForItemMock = vi.fn();
const getProcessesForItemIncludingCustomMock = vi.fn();

vi.mock('../../../../utils/gameState/processes.js', async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        getProcessesForItem: (...args) => getProcessesForItemMock(...args),
        getProcessesForItemIncludingCustom: (...args) =>
            getProcessesForItemIncludingCustomMock(...args),
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
        getContainedItemCounts: (...args) => getContainedItemCountsMock(...args),
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

function ensureChipStaticOpacityStyle() {
    if (document.getElementById('chip-static-opacity-regression-style')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'chip-static-opacity-regression-style';
    style.textContent = 'nav .chip-container.static-container { opacity: 1; }';
    document.head.appendChild(style);
}

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

beforeEach(() => {
    const emptyMap = {
        requireItem: [],
        consumeItem: [],
        createItem: [],
    };
    getProcessesForItemMock.mockReturnValue(emptyMap);
    getProcessesForItemIncludingCustomMock.mockResolvedValue(emptyMap);
});

afterEach(async () => {
    clearItemResolverCache();
    await deleteCustomContentDb();
    getItemCountsMock.mockReset();
    getContainedItemCountsMock.mockReset();
    isGameStateReadyMock.mockReset();
    getProcessesForItemMock.mockReset();
    getProcessesForItemIncludingCustomMock.mockReset();
});

describe('ItemPage', () => {
    it('renders built-in item details', async () => {
        const builtIn = items.find((item) => !item.price) ?? items[0];

        getItemCountsMock.mockReturnValue({ [builtIn.id]: 1 });
        isGameStateReadyMock.mockReturnValue(true);

        ensureChipStaticOpacityStyle();

        const { container, getByRole, getByTestId } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            expect(getByRole('heading', { level: 2 }).textContent).toBe(builtIn.name);
        });

        const chipContainer = getByTestId('item-page-detail-chip');
        expect(chipContainer.tagName).toBe('DIV');
        expect(chipContainer.classList.contains('static-container')).toBe(true);
        expect(chipContainer.classList.contains('chip-container')).toBe(true);
        const staticChipStyle = getComputedStyle(chipContainer as HTMLElement);
        expect(staticChipStyle.opacity).toBe('1');

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

    it('renders process groups as collapsed details sections by default', async () => {
        const builtIn = items.find((item) => !item.price) ?? items[0];

        getItemCountsMock.mockReturnValue({ [builtIn.id]: 1 });
        isGameStateReadyMock.mockReturnValue(true);
        getProcessesForItemIncludingCustomMock.mockResolvedValue({
            requireItem: ['process-require-1', 'process-require-2'],
            consumeItem: ['process-consume-1'],
            createItem: [],
        });

        const { container, findByText } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await findByText('Processes:');

        const details = container.querySelectorAll('details.process-group');
        expect(details).toHaveLength(2);

        const firstSummary = details[0].querySelector('summary');
        expect(firstSummary?.textContent).toContain('Required for processes');
        expect(firstSummary?.textContent).toContain('2');

        details.forEach((section) => {
            expect(section.hasAttribute('open')).toBe(false);
        });
    });

    it('renders container item balances from itemCounts metadata', async () => {
        const savingsJar = items.find((item) => item.id === '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec');

        expect(savingsJar).toBeDefined();

        getItemCountsMock.mockReturnValue({ [savingsJar!.id]: 1 });
        getContainedItemCountsMock.mockReturnValue({
            '5247a603-294a-4a34-a884-1ae20969b2a1': 42,
        });
        isGameStateReadyMock.mockReturnValue(true);

        const { getByText } = render(ItemPage, {
            props: { itemId: savingsJar!.id },
        });

        await waitFor(() => {
            expect(getByText('Stored contents:')).toBeTruthy();
            expect(getByText(/dUSD: 42/)).toBeTruthy();
        });
    });
});

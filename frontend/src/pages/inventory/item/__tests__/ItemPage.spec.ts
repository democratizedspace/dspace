import 'fake-indexeddb/auto';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import items from '../../json/items';
import ItemPage from '../ItemPage.svelte';
import { db } from '../../../../utils/customcontent.js';
import { clearItemResolverCache } from '../../../../utils/itemResolver.js';

const getItemCountsMock = vi.fn();
const getContainedItemCountsMock = vi.fn();
const getItemCountMock = vi.fn();
const buyItemsMock = vi.fn();
const isGameStateReadyMock = vi.fn();
const mockProcessesByType = {
    requireItem: [],
    consumeItem: [],
    createItem: [],
};
const getQuestsForItemMock = vi.fn();

vi.mock('../../../../utils/gameState/processes.js', async (importOriginal) => {
    const actual = await importOriginal();

    return {
        ...actual,
        getProcessesForItem: () => mockProcessesByType,
        getProcessesForItemIncludingCustom: async () => mockProcessesByType,
    };
});

vi.mock('../../../../utils/itemDependencies.js', () => ({
    getQuestsForItem: (...args) => getQuestsForItemMock(...args),
}));

vi.mock('../../../../utils/gameState/inventory.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        getItemCounts: (...args) => getItemCountsMock(...args),
        getContainedItemCounts: (...args) => getContainedItemCountsMock(...args),
        getItemCount: (...args) => getItemCountMock(...args),
        buyItems: (...args) => buyItemsMock(...args),
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

function isInsideOpenProcessGroup(element: Element) {
    const group = element.closest('details.process-group');
    return group instanceof HTMLDetailsElement && group.open;
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

afterEach(async () => {
    clearItemResolverCache();
    await deleteCustomContentDb();
    getItemCountsMock.mockReset();
    getContainedItemCountsMock.mockReset();
    getItemCountMock.mockReset();
    buyItemsMock.mockReset();
    isGameStateReadyMock.mockReset();
    mockProcessesByType.requireItem = [];
    mockProcessesByType.consumeItem = [];
    mockProcessesByType.createItem = [];
    getQuestsForItemMock.mockReset();
});

describe('ItemPage', () => {
    it('renders built-in item details', async () => {
        const builtIn = items.find((item) => !item.price) ?? items[0];

        getQuestsForItemMock.mockReturnValue({ requires: [], rewards: [] });
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

        getQuestsForItemMock.mockReturnValue({ requires: [], rewards: [] });
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

    it('renders container item balances from itemCounts metadata', async () => {
        const savingsJar = items.find((item) => item.id === '830d74da-9de5-44c7-8b9f-83a1ed3aa8ec');

        expect(savingsJar).toBeDefined();

        getQuestsForItemMock.mockReturnValue({ requires: [], rewards: [] });
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

    it('keeps all process groups collapsed by default and allows multiple groups open', async () => {
        const builtIn = items[0];

        mockProcessesByType.requireItem = ['test-require-process'];
        mockProcessesByType.consumeItem = ['test-consume-process'];
        mockProcessesByType.createItem = ['test-create-process'];

        getQuestsForItemMock.mockReturnValue({ requires: [], rewards: [] });
        getItemCountsMock.mockReturnValue({ [builtIn.id]: 1 });
        isGameStateReadyMock.mockReturnValue(true);

        const { getByText, container } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            expect(getByText('Processes:')).toBeTruthy();
        });

        const details = Array.from(container.querySelectorAll('details.process-group'));
        expect(details).toHaveLength(3);

        const descriptions = Array.from(container.querySelectorAll('.process-group-description'));
        expect(descriptions).toHaveLength(3);

        const processContent = Array.from(container.querySelectorAll('.process-group-content'));
        expect(processContent).toHaveLength(3);

        for (const group of details) {
            expect(group.hasAttribute('open')).toBe(false);
        }
        for (const groupContent of processContent) {
            expect(isInsideOpenProcessGroup(groupContent)).toBe(false);
        }

        for (const description of descriptions) {
            expect(isInsideOpenProcessGroup(description)).toBe(false);
        }

        const [requiredSummary, consumedSummary, createdSummary] = Array.from(
            container.querySelectorAll('details.process-group > summary')
        );
        expect(requiredSummary).toBeTruthy();
        expect(consumedSummary).toBeTruthy();
        expect(createdSummary).toBeTruthy();

        await fireEvent.click(requiredSummary as HTMLElement);
        expect(details[0].hasAttribute('open')).toBe(true);
        expect(isInsideOpenProcessGroup(processContent[0])).toBe(true);
        expect(isInsideOpenProcessGroup(descriptions[0])).toBe(true);

        await fireEvent.click(consumedSummary as HTMLElement);
        expect(details[0].hasAttribute('open')).toBe(true);
        expect(details[1].hasAttribute('open')).toBe(true);
        expect(isInsideOpenProcessGroup(processContent[0])).toBe(true);
        expect(isInsideOpenProcessGroup(processContent[1])).toBe(true);
        expect(isInsideOpenProcessGroup(processContent[2])).toBe(false);

        await fireEvent.click(createdSummary as HTMLElement);
        expect(details[2].hasAttribute('open')).toBe(true);
        for (const groupContent of processContent) {
            expect(isInsideOpenProcessGroup(groupContent)).toBe(true);
        }

        expect(getByText('Required by processes')).toBeTruthy();
        expect(getByText('Consumed by processes')).toBeTruthy();
        expect(getByText('Created by processes')).toBeTruthy();

        const remount = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            expect(remount.getByText('Processes:')).toBeTruthy();
        });

        await waitFor(() => {
            expect(remount.container.querySelectorAll('details.process-group')).toHaveLength(3);
        });

        const remountDetails = Array.from(
            remount.container.querySelectorAll('details.process-group')
        );
        for (const group of remountDetails) {
            expect(group.hasAttribute('open')).toBe(false);
        }
    });

    it('renders a usable Buy required items action for processes embedded on the item page', async () => {
        const builtIn = items[0];
        const processId = 'outlet-dWatt-1e3';
        const pricedRequiredItemId = 'a5395e29-1862-4eb7-8517-5d161635e032';
        const currencyItemId = '5247a603-294a-4a34-a884-1ae20969b2a1';

        mockProcessesByType.requireItem = [processId];

        getQuestsForItemMock.mockReturnValue({ requires: [], rewards: [] });
        getItemCountsMock.mockReturnValue({
            [builtIn.id]: 1,
            [pricedRequiredItemId]: 0,
        });
        getItemCountMock.mockImplementation((itemId: string) => {
            if (itemId === pricedRequiredItemId) {
                return 0;
            }
            if (itemId === currencyItemId) {
                return 15;
            }
            return 0;
        });
        isGameStateReadyMock.mockReturnValue(true);

        const { container, getByRole } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            expect(getByRole('button', { name: 'Buy required items' })).toBeTruthy();
        });

        const requiredSummary = container.querySelector('details.process-group > summary');
        expect(requiredSummary).toBeTruthy();
        await fireEvent.click(requiredSummary as HTMLElement);

        const buyButton = getByRole('button', { name: 'Buy required items' });
        await fireEvent.click(buyButton);

        expect(buyItemsMock).toHaveBeenCalledWith([
            {
                id: pricedRequiredItemId,
                quantity: 1,
                price: 15,
                currencyId: currencyItemId,
            },
        ]);
    });

    it('canonicalizes legacy quest ids when rendering quest chips', async () => {
        const builtIn = items.find((item) => !item.price) ?? items[0];

        getQuestsForItemMock.mockReturnValue({
            requires: ['3dprinter/start'],
            rewards: [],
        });
        getItemCountsMock.mockReturnValue({ [builtIn.id]: 1 });
        isGameStateReadyMock.mockReturnValue(true);

        const { getByRole } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            expect(
                getByRole('link', { name: 'Set up your first 3D printer' }).getAttribute('href')
            ).toBe('/quests/3dprinting/start');
        });
    });

    it('renders clickable quest chips for required and reward quests', async () => {
        const builtIn = items.find((item) => !item.price) ?? items[0];

        getQuestsForItemMock.mockReturnValue({
            requires: ['welcome/howtodoquests'],
            rewards: ['hydroponics/bucket_10'],
        });
        getItemCountsMock.mockReturnValue({ [builtIn.id]: 1 });
        isGameStateReadyMock.mockReturnValue(true);

        const { getByRole, getByText } = render(ItemPage, {
            props: { itemId: builtIn.id },
        });

        await waitFor(() => {
            expect(getByRole('heading', { level: 2 }).textContent).toBe(builtIn.name);
        });

        expect(getByText('Required in:')).toBeTruthy();
        expect(getByRole('link', { name: 'How to do quests' }).getAttribute('href')).toBe(
            '/quests/welcome/howtodoquests'
        );
        expect(getByText('Rewards in:')).toBeTruthy();
        expect(getByRole('link', { name: "Bucket, we'll do it live!" }).getAttribute('href')).toBe(
            '/quests/hydroponics/bucket_10'
        );
    });
});

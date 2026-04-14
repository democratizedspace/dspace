import { expect, test, type Page } from '@playwright/test';
import { clearUserData, seedCustomQuest, waitForHydration } from './test-helpers';

type SeedProcessRecord = {
    id: string;
    title: string;
    duration: string;
    requireItems?: Array<{ id: string; count: number }>;
    consumeItems?: Array<{ id: string; count: number }>;
    createItems?: Array<{ id: string; count: number }>;
    custom?: boolean;
    entityType?: string;
    createdAt?: string;
};

const CUSTOM_CONTENT_DB_VERSION = 3;
const DUSD_ITEM_ID = 'e9b0752f-08ec-45c9-ad1f-5599339e76b0';

async function seedCustomProcess(page: Page, processRecord: SeedProcessRecord): Promise<void> {
    await page.evaluate(
        async ({ record, dbVersion }) => {
            const openDatabase = () =>
                new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open('CustomContent', dbVersion);

                    request.onupgradeneeded = () => {
                        const db = request.result;
                        if (!db.objectStoreNames.contains('meta')) {
                            db.createObjectStore('meta');
                        }
                        if (!db.objectStoreNames.contains('items')) {
                            db.createObjectStore('items', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('processes')) {
                            db.createObjectStore('processes', { keyPath: 'id' });
                        }
                        if (!db.objectStoreNames.contains('quests')) {
                            db.createObjectStore('quests', { keyPath: 'id' });
                        }
                    };

                    request.onerror = () => reject(request.error);
                    request.onsuccess = () => resolve(request.result);
                });

            const db = await openDatabase();
            try {
                await new Promise<void>((resolve, reject) => {
                    const tx = db.transaction('processes', 'readwrite');
                    const store = tx.objectStore('processes');
                    store.put({
                        ...record,
                        custom: true,
                        entityType: 'process',
                        createdAt: record.createdAt ?? new Date().toISOString(),
                    });
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error);
                });
            } finally {
                db.close();
            }
        },
        { record: processRecord, dbVersion: CUSTOM_CONTENT_DB_VERSION }
    );
}

test.describe('v3.0.1 critical launch flows', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('processes list keeps summary-first behavior while built-in and custom rows coexist', async ({
        page,
    }) => {
        await page.goto('/processes');
        await waitForHydration(page);

        const builtInRow = page.locator('.process-row').first();
        await expect(builtInRow).toBeVisible();
        const builtInProcessId = await builtInRow.getAttribute('data-process-id');
        expect(builtInProcessId).toBeTruthy();

        await expect(builtInRow).toContainText('Duration');
        await expect(builtInRow).toContainText('Requires');
        await expect(builtInRow).toContainText('Consumes');
        await expect(builtInRow).toContainText('Creates');
        await expect(builtInRow.getByRole('button', { name: 'Start' })).toHaveCount(0);
        await expect(builtInRow.getByRole('button', { name: 'Pause' })).toHaveCount(0);
        await expect(builtInRow.getByRole('button', { name: 'Resume' })).toHaveCount(0);
        await expect(builtInRow.getByRole('button', { name: 'Collect' })).toHaveCount(0);
        await expect(builtInRow.getByRole('button', { name: 'Buy required items' })).toHaveCount(0);

        const uniqueCustomProcessId = `custom-launch-${Date.now()}`;
        await seedCustomProcess(page, {
            id: uniqueCustomProcessId,
            title: `Launch custom process ${Date.now()}`,
            duration: '30m',
            requireItems: [{ id: DUSD_ITEM_ID, count: 2 }],
            consumeItems: [],
            createItems: [{ id: DUSD_ITEM_ID, count: 1 }],
        });

        await seedCustomProcess(page, {
            id: String(builtInProcessId),
            title: 'Collision process that must not hide built-in row',
            duration: '1m',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        });

        await page.reload();
        await waitForHydration(page);

        const builtInRowsAfterMerge = page.locator(
            `.process-row[data-process-id="${builtInProcessId}"]`
        );
        await expect(builtInRowsAfterMerge).toHaveCount(1);

        const customRow = page.locator(`.process-row[data-process-id="${uniqueCustomProcessId}"]`);
        await expect(customRow).toBeVisible();
        await expect(customRow.getByText('Custom')).toBeVisible();

        await expect(
            page
                .locator('.process-row')
                .filter({ hasText: 'Collision process that must not hide built-in row' })
        ).toHaveCount(0);

        await expect(
            page.locator(`.process-row[data-process-id="${builtInProcessId}"] .details-link`)
        ).toHaveAttribute('href', `/processes/${builtInProcessId}`);
        await expect(
            page.locator(`.process-row[data-process-id="${uniqueCustomProcessId}"] .details-link`)
        ).toHaveAttribute('href', `/processes/${uniqueCustomProcessId}`);

        await page.goto(`/processes/${builtInProcessId}`);
        await waitForHydration(page);
        await expect(page.getByRole('button', { name: 'Buy required items' })).toBeVisible();
        const startButton = page.getByRole('button', { name: 'Start' });
        await expect(startButton).toBeVisible();
        await startButton.click();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();

        await page.goto('/processes');
        await waitForHydration(page);
        await expect(
            page.locator(`.process-row[data-process-id="${builtInProcessId}"]`)
        ).toBeVisible();
        await expect(
            page.locator(`.process-row[data-process-id="${uniqueCustomProcessId}"]`)
        ).toBeVisible();

        await page.goto(`/processes/${uniqueCustomProcessId}`);
        await waitForHydration(page);
        await expect(page.getByRole('button', { name: 'Buy required items' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    });

    test('custom and built-in quests stay actionable together across merge, refresh, and routing', async ({
        page,
    }) => {
        const customQuestId = `launch-custom-quest-${Date.now()}`;
        const customQuestTitle = `Launch custom quest ${Date.now()}`;

        await seedCustomQuest(page, {
            id: customQuestId,
            title: customQuestTitle,
            description: 'Launch checklist quest for coexistence validation.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Start node',
                    options: [{ type: 'finish', text: 'Finish' }],
                },
            ],
            requiresQuests: [],
        });

        await page.goto('/quests');
        await waitForHydration(page);

        const builtInQuestCard = page.locator("a[data-questid='welcome/howtodoquests']").first();
        await expect(builtInQuestCard).toBeVisible();

        const customSection = page.getByTestId('custom-quests-section');
        await expect(customSection).toBeVisible();
        const customQuestCard = customSection.locator(`a[data-questid='${customQuestId}']`);
        await expect(customQuestCard).toBeVisible();

        await customQuestCard.click();
        await waitForHydration(page);
        await expect(page).toHaveURL(new RegExp(`/quests/.+/${customQuestId}$`));
        await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();

        await page.goto('/quests');
        await page.reload();
        await waitForHydration(page);
        await expect(page.locator("a[data-questid='welcome/howtodoquests']").first()).toBeVisible();
        await expect(page.getByTestId('custom-quests-section')).toContainText(customQuestTitle);

        await page.locator("a[data-questid='welcome/howtodoquests']").first().click();
        await waitForHydration(page);
        await expect(page).toHaveURL(/\/quests\/welcome\/howtodoquests$/);
        await expect(page.getByText(/How To Do Quests/i)).toBeVisible();
    });
});

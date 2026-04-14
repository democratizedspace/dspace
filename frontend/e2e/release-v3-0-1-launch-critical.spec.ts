import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearUserData, seedCustomQuest, waitForHydration } from './test-helpers';

type ProcessRecord = {
    id: string;
    title?: string;
    duration?: string;
    requireItems?: Array<{ id?: string; count?: number }>;
    consumeItems?: Array<{ id?: string; count?: number }>;
    createItems?: Array<{ id?: string; count?: number }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendRoot = join(__dirname, '..');
const generatedProcessesPath = join(frontendRoot, 'src', 'generated', 'processes.json');
const processes = JSON.parse(readFileSync(generatedProcessesPath, 'utf8')) as ProcessRecord[];
const startableBuiltInProcess = processes.find(
    (process) =>
        process?.id &&
        (process.requireItems?.length ?? 0) === 0 &&
        (process.consumeItems?.length ?? 0) === 0
);

if (!startableBuiltInProcess?.id) {
    throw new Error('Unable to find a built-in process that can start without requirements.');
}

const purchasableBuiltInProcessId = 'outlet-dWatt-1e3';

const builtInCollisionTarget = processes.find((process) => process?.id && process?.title);

if (!builtInCollisionTarget?.id || !builtInCollisionTarget?.title) {
    throw new Error('Unable to find a built-in process for custom-id collision coverage.');
}

async function seedCustomProcess(page: Page, process: ProcessRecord) {
    await page.evaluate(async (processData) => {
        const request = indexedDB.open('CustomContent', 3);

        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            request.onupgradeneeded = () => {
                const upgradeDb = request.result;
                if (!upgradeDb.objectStoreNames.contains('meta')) {
                    upgradeDb.createObjectStore('meta');
                }
                if (!upgradeDb.objectStoreNames.contains('items')) {
                    upgradeDb.createObjectStore('items', { keyPath: 'id' });
                }
                if (!upgradeDb.objectStoreNames.contains('processes')) {
                    upgradeDb.createObjectStore('processes', { keyPath: 'id' });
                }
                if (!upgradeDb.objectStoreNames.contains('quests')) {
                    upgradeDb.createObjectStore('quests', { keyPath: 'id' });
                }
            };
            request.onerror = () => reject(request.error ?? new Error('open failed'));
            request.onsuccess = () => resolve(request.result);
        });

        try {
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction('processes', 'readwrite');
                tx.objectStore('processes').put({
                    ...processData,
                    entityType: 'process',
                    custom: true,
                    createdAt: new Date().toISOString(),
                });
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error ?? new Error('write failed'));
            });
        } finally {
            db.close();
        }
    }, process);
}

test.describe('v3.0.1 launch-critical list/detail coverage', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('keeps built-in and custom quests coexisting during delayed merge and navigation', async ({
        page,
    }) => {
        const customQuestId = `launch-custom-quest-${Date.now()}`;
        const customQuestTitle = `Launch custom quest ${Date.now()}`;

        await seedCustomQuest(page, {
            id: customQuestId,
            title: customQuestTitle,
            description: 'Custom quest used for launch-critical coexistence coverage.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: '/assets/npc/dChat.jpg',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Start custom launch quest.',
                    options: [{ type: 'finish', text: 'Finish custom launch quest' }],
                },
            ],
            requiresQuests: [],
            route: `/quests/${customQuestId}`,
            custom: true,
        });

        await page.addInitScript(() => {
            (
                window as Window & { __questsCustomMergeDelayMs?: number }
            ).__questsCustomMergeDelayMs = 700;
        });

        await page.goto('/quests');
        await waitForHydration(page);

        const builtInGrid = page.getByTestId('quests-grid');
        const customMergeStatus = page.getByTestId('custom-quests-merge-status');
        const firstBuiltInQuest = builtInGrid.locator('[data-testid="quest-tile"]').first();

        await expect(firstBuiltInQuest).toBeVisible();
        const beforeBox = await firstBuiltInQuest.boundingBox();
        expect(beforeBox).not.toBeNull();

        await expect(customMergeStatus).toHaveAttribute('data-merge-complete', 'false');
        await expect(page.getByTestId('custom-quests-section')).toHaveCount(0);

        await expect(customMergeStatus).toHaveAttribute('data-merge-complete', 'true');
        await expect(page.getByTestId('custom-quests-section')).toContainText(customQuestTitle);

        const afterBox = await firstBuiltInQuest.boundingBox();
        expect(afterBox).not.toBeNull();
        expect(Math.abs((afterBox?.y ?? 0) - (beforeBox?.y ?? 0))).toBeLessThanOrEqual(1);

        await page.getByRole('link', { name: customQuestTitle }).click();
        await waitForHydration(page);
        await expect(page).toHaveURL(new RegExp(`/quests/${customQuestId}$`));
        await expect(page.getByText('Start custom launch quest.')).toBeVisible();
        await page.getByRole('button', { name: 'Finish custom launch quest' }).click();
        await expect(page).toHaveURL(new RegExp(`/quests/${customQuestId}/finished$`));
    });

    test('renders summary-first process rows and preserves built-in/custom coexistence routing', async ({
        page,
    }) => {
        const collisionTitle = `Collision override ${Date.now()}`;
        const customProcessId = `launch-custom-process-${Date.now()}`;
        const customProcessTitle = `Launch custom process ${Date.now()}`;

        await seedCustomProcess(page, {
            id: builtInCollisionTarget.id,
            title: collisionTitle,
            duration: '1m',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        });

        await seedCustomProcess(page, {
            id: customProcessId,
            title: customProcessTitle,
            duration: '15m',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        });

        await page.goto('/processes');
        await waitForHydration(page, '.processes-page');

        const firstRow = page.locator('[data-process-id]').first();
        await expect(firstRow).toBeVisible();
        await expect(firstRow.getByText('Duration')).toBeVisible();
        await expect(firstRow.getByText('Requires')).toBeVisible();
        await expect(firstRow.getByText('Consumes')).toBeVisible();
        await expect(firstRow.getByText('Creates')).toBeVisible();

        await expect(
            firstRow.getByRole('button', { name: /start|pause|resume|collect/i })
        ).toHaveCount(0);

        const collisionRows = page.locator(`[data-process-id="${builtInCollisionTarget.id}"]`);
        await expect(collisionRows).toHaveCount(1);
        await expect(collisionRows.first()).toContainText(builtInCollisionTarget.title);
        await expect(collisionRows.first()).not.toContainText(collisionTitle);

        const customRow = page.locator(`[data-process-id="${customProcessId}"]`);
        await expect(customRow).toBeVisible();
        await expect(customRow).toContainText(customProcessTitle);
        await expect(customRow.getByText('Custom')).toBeVisible();

        await expect(customRow.getByRole('link', { name: 'View details' })).toHaveAttribute(
            'href',
            `/processes/${customProcessId}`
        );

        await customRow.getByRole('link', { name: 'View details' }).click();
        await expect(page).toHaveURL(new RegExp(`/processes/${customProcessId}$`));
        await expect(page.getByRole('heading', { name: customProcessTitle })).toBeVisible();
    });

    test('keeps detail controls active and buy-required behavior working on built-in process detail', async ({
        page,
    }) => {
        await page.goto(`/processes/${startableBuiltInProcess.id}`);
        await waitForHydration(page);

        await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Buy required items' })).toBeVisible();

        await page.getByRole('button', { name: 'Start' }).click();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

        await page.goto(`/processes/${purchasableBuiltInProcessId}`);
        await waitForHydration(page);

        const buyRequiredButton = page.getByRole('button', { name: 'Buy required items' });
        await expect(buyRequiredButton).toBeVisible();
        const isDisabled = await buyRequiredButton.isDisabled();

        if (isDisabled) {
            await expect(buyRequiredButton).toHaveAttribute('aria-describedby', /buy-required/);
        } else {
            await buyRequiredButton.click();
            await expect(page.getByRole('status')).toContainText('Added', { timeout: 5000 });
        }
    });
});

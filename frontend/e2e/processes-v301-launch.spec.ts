import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearUserData, waitForHydration } from './test-helpers';
import type { Page } from '@playwright/test';

type ItemRecord = {
    id?: string;
    price?: string;
};

type ProcessRecord = {
    id?: string;
    title?: string;
    duration?: string;
    requireItems?: Array<{ id?: string; count?: number }>;
    consumeItems?: Array<{ id?: string; count?: number }>;
    createItems?: Array<{ id?: string; count?: number }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generatedProcessesPath = join(__dirname, '..', 'src', 'generated', 'processes.json');
const itemsDir = join(__dirname, '..', 'src', 'pages', 'inventory', 'json', 'items');
const itemJsonFiles = readdirSync(itemsDir).filter((fileName) => fileName.endsWith('.json'));
const allItems = itemJsonFiles.flatMap((fileName) => {
    const json = JSON.parse(readFileSync(join(itemsDir, fileName), 'utf8')) as ItemRecord[];
    return Array.isArray(json) ? json : [];
});

const itemById = new Map(
    allItems
        .filter((item) => typeof item?.id === 'string' && item.id.trim().length > 0)
        .map((item) => [String(item.id), item])
);

const DUSD_ITEM_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';

const builtInProcesses = JSON.parse(readFileSync(generatedProcessesPath, 'utf8')) as ProcessRecord[];

const purchasableRequirementProcess = builtInProcesses.find((process) => {
    const requirement = process.requireItems?.find((entry) => {
        const item = itemById.get(String(entry?.id ?? ''));
        return typeof item?.price === 'string' && /\bdusd\b/i.test(item.price);
    });
    return Boolean(process?.id && process?.title && requirement?.id);
});

if (!purchasableRequirementProcess?.id || !purchasableRequirementProcess?.title) {
    throw new Error('Could not find built-in process with at least one purchasable required item.');
}

const purchasableRequirement = purchasableRequirementProcess.requireItems?.find((entry) => {
    const item = itemById.get(String(entry?.id ?? ''));
    return typeof item?.price === 'string' && /\bdusd\b/i.test(item.price);
});

if (!purchasableRequirement?.id) {
    throw new Error('Could not resolve purchasable requirement item for buy-required-items test.');
}

const startableBuiltInProcess =
    builtInProcesses.find(
        (process) =>
            Boolean(process?.id && process?.title) &&
            (process.requireItems?.length ?? 0) === 0 &&
            (process.consumeItems?.length ?? 0) === 0
    ) ?? purchasableRequirementProcess;

async function seedCustomProcess(page: Page, process: Record<string, unknown>) {
    await page.evaluate(async (processData) => {
        const request = indexedDB.open('CustomContent', 3);
        const db = await new Promise((resolve, reject) => {
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
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('processes', 'readwrite');
            tx.objectStore('processes').put({
                ...processData,
                entityType: 'process',
                custom: true,
                createdAt: processData.createdAt ?? new Date().toISOString(),
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        db.close();
    }, process);
}

test.describe('/processes v3.0.1 launch gates', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('renders summary-first rows, merges custom rows, and preserves built-ins under ID collisions', async ({
        page,
    }) => {
        const customProcessId = `launch-custom-process-${Date.now()}`;
        const customProcessTitle = `Launch custom process ${Date.now()}`;
        const collisionTitle = `Collision custom process ${Date.now()}`;

        await page.goto('/');
        await seedCustomProcess(page, {
            id: customProcessId,
            title: customProcessTitle,
            duration: '15m',
            requireItems: [{ id: String(purchasableRequirement.id), count: 1 }],
            consumeItems: [],
            createItems: [],
        });

        await seedCustomProcess(page, {
            id: String(purchasableRequirementProcess.id),
            title: collisionTitle,
            duration: '10m',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        });

        await page.goto('/processes');
        await waitForHydration(page, '.processes-page');

        const builtInRow = page.locator(`[data-process-id="${String(purchasableRequirementProcess.id)}"]`);
        await expect(builtInRow).toBeVisible();
        await expect(builtInRow.getByRole('heading', { name: String(purchasableRequirementProcess.title) })).toBeVisible();

        await expect(builtInRow.getByText('Duration')).toBeVisible();
        await expect(builtInRow.getByText('Requires')).toBeVisible();
        await expect(builtInRow.getByText('Consumes')).toBeVisible();
        await expect(builtInRow.getByText('Creates')).toBeVisible();

        await expect(page.getByRole('button', { name: /start|pause|resume|collect|buy required items/i })).toHaveCount(0);

        const customRow = page.locator(`[data-process-id="${customProcessId}"]`);
        await expect(customRow).toBeVisible();
        await expect(customRow.getByText('Custom')).toBeVisible();

        await expect(page.getByText(collisionTitle)).toHaveCount(0);
        await expect(page.locator(`[data-process-id="${String(purchasableRequirementProcess.id)}"]`)).toHaveCount(1);

        await expect(customRow.getByRole('link', { name: 'View details' })).toHaveAttribute(
            'href',
            `/processes/${customProcessId}`
        );
        await expect(builtInRow.getByRole('link', { name: 'View details' })).toHaveAttribute(
            'href',
            `/processes/${String(purchasableRequirementProcess.id)}`
        );
    });

    test('keeps built-in active-process state and custom process routing working in the same session', async ({
        page,
    }) => {
        const customProcessId = `launch-mixed-custom-process-${Date.now()}`;
        const customProcessTitle = `Launch mixed custom process ${Date.now()}`;

        await page.goto('/');
        await seedCustomProcess(page, {
            id: customProcessId,
            title: customProcessTitle,
            duration: '5m',
            requireItems: [],
            consumeItems: [],
            createItems: [],
        });

        await page.goto(`/processes/${String(startableBuiltInProcess.id)}`);
        await waitForHydration(page, '.process-view');

        const startButton = page.getByRole('button', { name: 'Start' });
        await expect(startButton).toBeVisible();
        await startButton.click();

        await Promise.race([
            page.getByRole('button', { name: 'Cancel' }).waitFor({ state: 'visible', timeout: 10000 }),
            page.getByRole('button', { name: 'Collect' }).waitFor({ state: 'visible', timeout: 10000 }),
        ]);

        await page.goto('/processes');
        await waitForHydration(page, '.processes-page');
        await expect(page.locator(`[data-process-id="${String(startableBuiltInProcess.id)}"]`)).toBeVisible();
        await expect(page.locator(`[data-process-id="${customProcessId}"]`)).toBeVisible();

        await page.locator(`[data-process-id="${customProcessId}"] a.details-link`).click();
        await expect(page).toHaveURL(new RegExp(`/processes/${customProcessId}$`));
        await expect(page.getByRole('heading', { name: customProcessTitle })).toBeVisible();
    });

    test('preserves detail-route controls and buy-required-items behavior for purchasable requirements', async ({
        page,
    }) => {
        const processId = String(purchasableRequirementProcess.id);
        const requirementItemId = String(purchasableRequirement.id);

        await page.goto(`/processes/${processId}`);
        await waitForHydration(page, '.process-view');

        await page.evaluate(
            ({ currencyItemId, requiredItemId }) => {
                const raw = localStorage.getItem('gameState');
                const parsed = raw ? JSON.parse(raw) : { inventory: {} };
                parsed.inventory = parsed.inventory ?? {};
                parsed.inventory[currencyItemId] = 100_000;
                parsed.inventory[requiredItemId] = 0;
                localStorage.setItem('gameState', JSON.stringify(parsed));
            },
            {
                currencyItemId: DUSD_ITEM_ID,
                requiredItemId: requirementItemId,
            }
        );

        await page.reload();
        await waitForHydration(page, '.process-view');

        const buyRequiredItems = page.getByRole('button', { name: 'Buy required items' });
        await expect(buyRequiredItems).toBeEnabled();
        await buyRequiredItems.click();
        await expect(page.getByRole('status')).toContainText(/Added/i);

        const startButton = page.getByRole('button', { name: 'Start' });
        await expect(startButton).toBeVisible();
        await startButton.click();

        await Promise.race([
            page.getByRole('button', { name: 'Cancel' }).waitFor({ state: 'visible', timeout: 10000 }),
            page.getByRole('button', { name: 'Collect' }).waitFor({ state: 'visible', timeout: 10000 }),
        ]);

        const cancelButton = page.getByRole('button', { name: 'Cancel' });
        if (await cancelButton.isVisible().catch(() => false)) {
            await cancelButton.click();
            await expect(startButton).toBeVisible();
        }
    });
});

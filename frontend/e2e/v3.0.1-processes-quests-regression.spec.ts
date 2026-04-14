import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    clearUserData,
    seedCustomProcess,
    seedCustomQuest,
    waitForHydration,
} from './test-helpers';

type ProcessEntry = {
    id: string | number;
    title?: string;
    duration?: string;
    requireItems?: Array<{ id: string | number; count?: number }>;
    consumeItems?: Array<{ id: string | number; count?: number }>;
    createItems?: Array<{ id: string | number; count?: number }>;
};

type ItemEntry = {
    id: string | number;
    name?: string;
    price?: string;
};

import builtInItems from '../src/pages/inventory/json/items/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendRoot = join(__dirname, '..');
const normalizedBuiltInProcesses = JSON.parse(
    readFileSync(join(frontendRoot, 'src/generated/processes.json'), 'utf8')
) as ProcessEntry[];
const normalizedBuiltInItems = builtInItems as ItemEntry[];
const dUsdItem = normalizedBuiltInItems.find((item) => item.name === 'dUSD');
if (!dUsdItem) {
    throw new Error('Unable to find dUSD in built-in items catalog.');
}

const purchasableRequiredProcess = normalizedBuiltInProcesses.find((process) =>
    (process.requireItems ?? []).some((requirement) => {
        const item = normalizedBuiltInItems.find(
            (candidate) => String(candidate.id) === String(requirement.id)
        );
        if (!item?.price) {
            return false;
        }
        const [amount] = item.price.split(' ');
        const parsed = Number(amount);
        return Number.isFinite(parsed) && parsed > 0;
    })
);

if (!purchasableRequiredProcess) {
    throw new Error('Unable to find a built-in process with purchasable required items.');
}

const stableBuiltInProcess = normalizedBuiltInProcesses.find(
    (process) => String(process.id) !== String(purchasableRequiredProcess.id)
);

if (!stableBuiltInProcess) {
    throw new Error('Unable to find secondary built-in process for coexistence checks.');
}

test.describe('v3.0.1 launch regression checks for processes and quests', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('process list keeps summary-first rows and custom/built-in coexistence', async ({
        page,
    }) => {
        const customProcessId = `custom-process-${Date.now()}`;
        const customProcessTitle = `Custom QA Process ${Date.now()}`;
        const activeProcessId = String(stableBuiltInProcess.id);

        await page.addInitScript((processId) => {
            const preloadedState = {
                version: 3,
                inventory: {},
                activeProcesses: {
                    [processId]: {
                        startedAt: Date.now() - 5_000,
                    },
                },
                processHistory: {},
                completedQuestIds: [],
            };
            localStorage.setItem('gameState', JSON.stringify(preloadedState));
        }, activeProcessId);

        await page.goto('/');
        await seedCustomProcess(page, {
            id: customProcessId,
            title: customProcessTitle,
            duration: '15m',
            requireItems: [],
            consumeItems: [],
            createItems: [],
            route: `/processes/${customProcessId}`,
        });

        // Intentional collision: should never hide built-ins.
        await seedCustomProcess(page, {
            id: String(stableBuiltInProcess.id),
            title: 'Colliding custom process should be ignored',
            duration: '5m',
            requireItems: [],
            consumeItems: [],
            createItems: [],
            route: `/processes/${stableBuiltInProcess.id}`,
        });

        await page.goto('/processes');

        const builtInRow = page
            .locator(`[data-process-id="${stableBuiltInProcess.id}"]`)
            .filter({ hasNotText: 'Custom' })
            .first();
        await expect(builtInRow).toBeVisible();
        if (stableBuiltInProcess.title) {
            await expect(builtInRow).toContainText(stableBuiltInProcess.title);
        }
        await expect(
            page.locator(`[data-process-id="${stableBuiltInProcess.id}"]`, {
                hasText: 'Colliding custom process should be ignored',
            })
        ).toHaveCount(0);

        await expect(builtInRow).toContainText(/Duration/i);
        await expect(builtInRow).toContainText(/Requires/i);
        await expect(builtInRow).toContainText(/Consumes/i);
        await expect(builtInRow).toContainText(/Creates/i);

        await expect(
            builtInRow.getByRole('button', { name: /Start|Pause|Resume|Collect/i })
        ).toHaveCount(0);
        await expect(builtInRow.getByRole('button', { name: /Buy required items/i })).toHaveCount(
            0
        );

        const customRow = page.locator(`[data-process-id="${customProcessId}"]`).first();
        await expect(customRow).toBeVisible();
        await expect(customRow).toContainText('Custom');

        await expect(builtInRow.getByRole('link', { name: 'View details' })).toHaveAttribute(
            'href',
            `/processes/${stableBuiltInProcess.id}`
        );
        await expect(customRow.getByRole('link', { name: 'View details' })).toHaveAttribute(
            'href',
            `/processes/${customProcessId}`
        );

        await customRow.getByRole('link', { name: 'View details' }).click();
        await expect(page).toHaveURL(new RegExp(`/processes/${customProcessId}$`));
        await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

        await page.goto('/processes');
        await builtInRow.getByRole('link', { name: 'View details' }).click();
        await expect(page).toHaveURL(new RegExp(`/processes/${stableBuiltInProcess.id}$`));
        await expect(
            page.getByRole('button', { name: /Start|Pause|Resume|Collect/i })
        ).toBeVisible();

        await page.goto('/processes');
        await expect(
            page.locator(`[data-process-id="${stableBuiltInProcess.id}"]`).first()
        ).toBeVisible();
        await expect(page.locator(`[data-process-id="${customProcessId}"]`).first()).toBeVisible();
    });

    test('detail routes preserve interactive controls and buy-required behavior', async ({
        page,
    }) => {
        const processId = String(purchasableRequiredProcess.id);
        const requiredItem = (purchasableRequiredProcess.requireItems ?? []).find((entry) => {
            const item = normalizedBuiltInItems.find(
                (candidate) => String(candidate.id) === String(entry.id)
            );
            return Boolean(item?.price);
        });

        if (!requiredItem) {
            throw new Error('Unable to resolve required item for buy-required validation.');
        }

        await page.addInitScript(
            ({ dUsdId, targetItemId }) => {
                const preloadedState = {
                    version: 3,
                    inventory: {
                        [dUsdId]: 100000,
                        [targetItemId]: 0,
                    },
                    activeProcesses: {},
                    processHistory: {},
                    completedQuestIds: [],
                };
                localStorage.setItem('gameState', JSON.stringify(preloadedState));
            },
            { dUsdId: String(dUsdItem.id), targetItemId: String(requiredItem.id) }
        );

        await page.goto(`/processes/${processId}`);

        const buyRequiredButton = page.getByRole('button', { name: 'Buy required items' });
        await expect(buyRequiredButton).toBeVisible();
        await expect(buyRequiredButton).toBeEnabled();

        const beforeCount = await page.evaluate((itemId) => {
            const raw = localStorage.getItem('gameState');
            const parsed = raw ? JSON.parse(raw) : {};
            return Number(parsed?.inventory?.[itemId] ?? 0);
        }, String(requiredItem.id));

        await buyRequiredButton.click();

        await expect(page.getByRole('status')).toContainText(/Added/i, { timeout: 5000 });

        const afterCount = await page.evaluate((itemId) => {
            const raw = localStorage.getItem('gameState');
            const parsed = raw ? JSON.parse(raw) : {};
            return Number(parsed?.inventory?.[itemId] ?? 0);
        }, String(requiredItem.id));

        expect(afterCount).toBeGreaterThan(beforeCount);

        await expect(
            page.getByRole('button', { name: /Start|Pause|Resume|Collect/i })
        ).toBeVisible();

        const startButton = page.getByRole('button', { name: /^Start$/i }).first();
        await expect(startButton).toBeVisible();
        await startButton.click();
        await expect(page.getByRole('button', { name: /Pause|Collect/i }).first()).toBeVisible();

        const cancelButton = page.getByRole('button', { name: /Cancel/i }).first();
        if ((await cancelButton.count()) > 0) {
            await cancelButton.click();
            await expect(page.getByRole('button', { name: /^Start$/i }).first()).toBeVisible();
            await page
                .getByRole('button', { name: /^Start$/i })
                .first()
                .click();
        }

        await page.goto(`/process/${processId}`);
        await expect(page).toHaveURL(new RegExp(`/process/${processId}$`));
        await expect(
            page.getByRole('button', { name: /Start|Pause|Resume|Collect/i })
        ).toBeVisible();
    });

    test('custom quests merge after initial built-in render without regressing grid/list behavior', async ({
        page,
    }) => {
        const customQuestId = `custom-quest-${Date.now()}`;
        const customQuestTitle = `Custom QA Quest ${Date.now()}`;

        await page.goto('/');
        await seedCustomQuest(page, {
            id: customQuestId,
            title: customQuestTitle,
            description: 'Custom quest coexistence validation for launch gating.',
            route: `/quests/${customQuestId}`,
            image: '/assets/quests/howtodoquests.jpg',
            requiresQuests: [],
            dialogue: [
                {
                    id: 'start',
                    text: 'Custom quest launch gate check.',
                    options: [{ type: 'finish', text: 'Complete check' }],
                },
            ],
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
        await expect(builtInGrid).toBeVisible();

        const customMergeStatus = page.getByTestId('custom-quests-merge-status');
        await expect(customMergeStatus).toHaveAttribute('data-merge-complete', 'false');

        const builtInQuestCard = builtInGrid
            .locator("a[data-questid='welcome/howtodoquests']")
            .first();
        await expect(builtInQuestCard).toBeVisible();
        await expect(builtInQuestCard).toHaveAttribute('href', '/quests/welcome/howtodoquests');
        await expect(page.getByTestId('custom-quests-section')).toHaveCount(0);

        await builtInQuestCard.click();
        await expect(page).toHaveURL(/\/quests\/welcome\/howtodoquests$/);

        await page.goto('/quests');
        await expect(customMergeStatus).toHaveAttribute('data-merge-complete', 'true');
        await expect(customMergeStatus).toHaveAttribute('data-custom-count', '1');

        const customSection = page.getByTestId('custom-quests-section');
        await expect(customSection).toBeVisible();

        const customQuestCard = page.locator(`a[data-questid='${customQuestId}']`).first();
        await expect(customQuestCard).toBeVisible();
        await expect(builtInGrid.locator(`a[data-questid='${customQuestId}']`)).toHaveCount(0);
        await expect(builtInQuestCard).toBeVisible();

        await customQuestCard.click();
        await expect(page).toHaveURL(new RegExp(`/quests/${customQuestId}$`));

        await page.goto('/quests');
        await builtInQuestCard.click();
        await expect(page).toHaveURL(/\/quests\/welcome\/howtodoquests$/);

        await page.goto('/quests');
        await page.reload();
        await expect(page.getByTestId('custom-quests-merge-status')).toHaveAttribute(
            'data-merge-complete',
            'true'
        );
        await expect(page.locator("a[data-questid='welcome/howtodoquests']").first()).toBeVisible();
        await expect(page.locator(`a[data-questid='${customQuestId}']`).first()).toBeVisible();

        await page.locator(`a[data-questid='${customQuestId}']`).first().click();
        await expect(page).toHaveURL(new RegExp(`/quests/${customQuestId}$`));
    });
});

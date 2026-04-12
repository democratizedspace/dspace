import { expect, test } from '@playwright/test';
import generatedProcesses from '../src/generated/processes.json' assert { type: 'json' };
import items from '../src/pages/inventory/json/items';
import { clearUserData, waitForHydration } from './test-helpers';

type ProcessDefinition = {
    id: string;
    title?: string;
    requireItems?: Array<{ id?: string | number; count?: number }>;
    consumeItems?: Array<{ id?: string | number; count?: number }>;
    createItems?: Array<{ id?: string | number; count?: number }>;
};

const previewProcess = (generatedProcesses as ProcessDefinition[]).find((process) => {
    const previewEntries = [
        ...(process.requireItems ?? []),
        ...(process.consumeItems ?? []),
        ...(process.createItems ?? []),
    ];

    return previewEntries.some((entry) => entry?.id !== undefined && entry?.id !== null);
});

if (!previewProcess) {
    throw new Error('No process with preview entries found for metadata loading test.');
}

const previewEntries = [
    ...(previewProcess.requireItems ?? []),
    ...(previewProcess.consumeItems ?? []),
    ...(previewProcess.createItems ?? []),
];
const previewEntry = previewEntries.find((entry) => entry?.id !== undefined && entry?.id !== null);

if (!previewEntry) {
    throw new Error('Process metadata loading test requires at least one preview entry.');
}

const previewItemId = String(previewEntry.id);
const previewItemName = items.find((item) => String(item.id) === previewItemId)?.name;

if (!previewItemName) {
    throw new Error(`Unable to resolve preview item name for id: ${previewItemId}`);
}

test.describe('Processes metadata loading states', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('keeps preview item slots blank until metadata resolves after refresh', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            (
                window as Window & { __DSPACE_TEST_DELAY_ITEM_METADATA_MS__?: number }
            ).__DSPACE_TEST_DELAY_ITEM_METADATA_MS__ = 1200;
        });

        await page.goto('/processes');
        await waitForHydration(page);

        const targetRow = page.locator(`[data-process-id="${previewProcess.id}"]`);
        await expect(targetRow).toBeVisible();
        await expect(
            targetRow.getByRole('heading', { name: previewProcess.title ?? previewProcess.id })
        ).toBeVisible();

        await page.waitForTimeout(300);
        await expect(targetRow).not.toContainText(previewItemId);
        await expect(targetRow).toContainText('Duration');

        await expect(targetRow).toContainText(previewItemName, { timeout: 10000 });
        await expect(targetRow).not.toContainText(previewItemId);
    });
});

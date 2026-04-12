import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clearUserData, waitForHydration } from './test-helpers';

type ProcessCatalogEntry = {
    id?: string;
    requireItems?: Array<{ id?: string | number }>;
    consumeItems?: Array<{ id?: string | number }>;
    createItems?: Array<{ id?: string | number }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendRoot = join(__dirname, '..');
const generatedProcessesPath = join(frontendRoot, 'src', 'generated', 'processes.json');
const generatedProcesses = JSON.parse(
    readFileSync(generatedProcessesPath, 'utf8')
) as ProcessCatalogEntry[];

const targetProcess = generatedProcesses.find((process) => {
    const previewId = [
        process?.requireItems?.[0]?.id,
        process?.consumeItems?.[0]?.id,
        process?.createItems?.[0]?.id,
    ].find((id) => id !== undefined && id !== null);
    return Boolean(process?.id) && Boolean(previewId);
});

if (!targetProcess?.id) {
    throw new Error('No built-in process with preview metadata was found.');
}

const PROCESS_ID = String(targetProcess.id);
const PREVIEW_ITEM_ID = String(
    targetProcess.requireItems?.[0]?.id ??
        targetProcess.consumeItems?.[0]?.id ??
        targetProcess.createItems?.[0]?.id
);

test.describe('/processes metadata loading behavior', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('does not show preview item ids while metadata is still loading', async ({ page }) => {
        await page.goto(
            '/processes?__dspace_enable_test_hooks=1&__dspace_process_metadata_delay_ms=6000'
        );
        await waitForHydration(page, '.processes-page');

        const processRow = page.locator(`[data-process-id="${PROCESS_ID}"]`);
        await expect(processRow).toBeVisible();
        await expect(processRow.getByRole('link', { name: 'View details' })).toHaveAttribute(
            'href',
            `/processes/${PROCESS_ID}`
        );

        const pendingPreviewLine = processRow.locator('.item-preview-list li').first();
        await expect(pendingPreviewLine).toContainText(/x\s*$/);
        await expect(processRow).not.toContainText(PREVIEW_ITEM_ID);
        await expect(pendingPreviewLine).toContainText(/^(\d+(?:\.\d+)?)x\s*$/);

        await expect(pendingPreviewLine).not.toContainText(/^(\d+(?:\.\d+)?)x\s*$/, {
            timeout: 8000,
        });
        await expect(processRow).not.toContainText(PREVIEW_ITEM_ID);
    });
});

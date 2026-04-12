import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const PROCESS_ID = 'outlet-dWatt-1e3';
const PREVIEW_ITEM_ID = 'a5395e29-1862-4eb7-8517-5d161635e032';

test.describe('/processes metadata loading behavior', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('does not show preview item ids while metadata is still loading', async ({ page }) => {
        await page.addInitScript(() => {
            // @ts-expect-error test hook
            window.__DSPACE_PROCESS_METADATA_DELAY_MS__ = 1200;
        });

        await page.goto('/processes');
        await waitForHydration(page, '.processes-page');

        const processRow = page.locator(`[data-process-id="${PROCESS_ID}"]`);
        await expect(processRow).toBeVisible();
        await expect(processRow).toContainText('Buy 1 kWh of electricity from a wall outlet');

        await expect(processRow).not.toContainText(PREVIEW_ITEM_ID);

        await page.waitForTimeout(1400);

        await expect(processRow).toContainText(/smart plug/i);
        await expect(processRow).not.toContainText(PREVIEW_ITEM_ID);
    });
});

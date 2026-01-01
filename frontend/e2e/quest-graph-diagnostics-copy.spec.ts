import { expect, test } from '@playwright/test';

import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest graph diagnostics report copy', () => {
    test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('copies a structured diagnostics report to the clipboard', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        await page.getByRole('tab', { name: 'Diagnostics' }).click();

        const copyButton = page.getByTestId('copy-diagnostics-report');
        await expect(copyButton).toBeVisible();
        await copyButton.click();

        const feedback = page.locator('.copy-feedback');
        await expect(feedback).toContainText(/copied/i);

        const clipboardText = await page.evaluate(async () => {
            return navigator.clipboard.readText();
        });

        expect(clipboardText?.trim().length ?? 0).toBeGreaterThan(0);
        expect(() => JSON.parse(clipboardText)).not.toThrow();
    });
});

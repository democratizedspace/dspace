import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest graph diagnostics tools', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('copy report fills clipboard from Diagnostics tab', async ({ page }) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const origin = new URL(page.url()).origin;
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });

        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        await page.getByRole('tab', { name: 'Diagnostics' }).click();

        const copyButton = page.getByRole('button', { name: 'Copy report' });
        await expect(copyButton).toBeVisible();
        await copyButton.click();

        const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
        expect(clipboardText).toContain('"timestamp"');
        expect(clipboardText).toContain('"counts"');
        expect(clipboardText.trim().length).toBeGreaterThan(0);
    });
});

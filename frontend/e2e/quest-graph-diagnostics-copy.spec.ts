import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest graph diagnostics tools', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('copies a diagnostics report and supports jumping from diagnostics', async ({
        page,
        context,
    }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        const diagnosticsTab = page.getByRole('tab', { name: 'Diagnostics' });
        await diagnosticsTab.click();

        const origin = new URL(page.url()).origin;
        await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });

        const copyButton = page.getByTestId('copy-diagnostics-report');
        await expect(copyButton).toBeVisible();
        await copyButton.click();

        await expect
            .poll(async () => page.evaluate(async () => navigator.clipboard.readText()), {
                timeout: 5000,
            })
            .toMatch(/\S/);

        const clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
        expect(() => JSON.parse(clipboardText || '')).not.toThrow();

        const jumpButtons = page.getByRole('button', { name: 'Jump to node' });
        if ((await jumpButtons.count()) > 0) {
            await jumpButtons.first().click();
            const navigatorTab = page.getByRole('tab', { name: 'Navigator' });
            await expect(navigatorTab).toHaveAttribute('aria-selected', 'true');
        }
    });
});

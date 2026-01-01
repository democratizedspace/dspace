import { expect, test } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

const baseOrigin = process.env.BASE_URL?.replace(/\/$/, '') || 'http://127.0.0.1:4173';

test.describe('Quest graph diagnostics copy', () => {
    test.beforeEach(async ({ page, context }) => {
        await clearUserData(page);
        await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
            origin: baseOrigin,
        });
    });

    test('copies diagnostics report to clipboard', async ({ page }) => {
        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        const diagnosticsTab = page.getByRole('tab', { name: 'Diagnostics' });
        await diagnosticsTab.click();

        const copyButton = page.getByRole('button', { name: /Copy report/ });
        await expect(copyButton).toBeEnabled();

        await copyButton.click();

        const clipboardHandle = await page.waitForFunction(async () => {
            try {
                const text = await navigator.clipboard.readText();
                return text && text.trim().length > 0 ? text : null;
            } catch (error) {
                console.warn('Clipboard read failed', error);
                return null;
            }
        });

        const reportText = (await clipboardHandle.jsonValue<string>()) ?? '';
        expect(reportText.length).toBeGreaterThan(0);

        const parsed = JSON.parse(reportText);
        expect(parsed).toHaveProperty('timestamp');
        expect(parsed).toHaveProperty('diagnostics');
        expect(parsed.diagnostics).toHaveProperty('missingRefs');
    });
});

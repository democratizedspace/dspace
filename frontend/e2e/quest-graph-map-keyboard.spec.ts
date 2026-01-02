import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

declare global {
    interface Window {
        __questGraphCy?: unknown;
    }
}

test.describe('Quest graph map keyboard accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('uses keyboard to move focus and announces map selection', async ({ page }) => {
        await page.goto('/quests');
        await waitForHydration(page);

        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();

        const navigatorTab = page.getByRole('tab', { name: 'Navigator' });
        await navigatorTab.focus();

        await page.keyboard.press('ArrowRight');

        const mapTab = page.getByRole('tab', { name: 'Map' });
        await expect(mapTab).toBeFocused();

        await page.keyboard.press('Enter');
        await expect(mapTab).toHaveAttribute('aria-selected', 'true');

        const mapPanel = page.getByRole('tabpanel', { name: 'Map' });
        await expect(mapPanel).toBeVisible();
        await mapPanel.focus();

        await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10_000 });

        const focusStrip = page.getByTestId('focused-quest-strip');
        const focusKey = focusStrip.getByTestId('focused-quest-key');
        const initialKey = (await focusKey.innerText()).trim();

        await page.keyboard.press('ArrowDown');
        await expect(focusKey).not.toHaveText(initialKey);

        const childKey = (await focusKey.innerText()).trim();

        await page.keyboard.press('ArrowUp');
        await expect(focusKey).not.toHaveText(childKey);

        await page.keyboard.press('Enter');
        await expect(navigatorTab).toHaveAttribute('aria-selected', 'true');
    });
});

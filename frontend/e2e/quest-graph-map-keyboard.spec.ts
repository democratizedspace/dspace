import { test, expect } from '@playwright/test';
import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Quest graph map keyboard accessibility', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
    });

    test('keeps keyboard navigation and focus info in sync on the map tab', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        await page.goto('/quests');
        await page.waitForLoadState('networkidle');
        await waitForHydration(page);

        const visualizer = page.locator('.visualizer');
        await visualizer.scrollIntoViewIfNeeded();
        await expect(visualizer).toBeVisible();

        const navigatorTab = page.getByRole('tab', { name: 'Navigator' });
        const mapTab = page.getByRole('tab', { name: 'Map' });
        const mapPanel = page.getByRole('tabpanel', { name: 'Map' });

        await mapTab.focus();
        await page.keyboard.press('Enter');
        await expect(mapTab).toHaveAttribute('aria-selected', 'true');

        const mapCanvas = page.getByLabel('Quest map');
        await expect(mapCanvas).toBeVisible();
        await expect(mapPanel).toBeVisible();
        await mapPanel.focus();

        const infoStrip = page.getByTestId('focused-quest-info');
        await expect(infoStrip).toBeVisible();
        const titleLocator = page.getByTestId('focused-quest-title');
        const keyLocator = page.getByTestId('focused-quest-key');
        const liveRegion = page.getByTestId('focused-quest-live');
        const initialKey = (await keyLocator.textContent())?.trim() ?? '';
        const initialLive = (await liveRegion.textContent())?.trim() ?? '';

        await page.keyboard.press('ArrowDown');

        await expect
            .poll(async () => (await keyLocator.textContent())?.trim() ?? '')
            .not.toBe(initialKey);

        const updatedKey = (await keyLocator.textContent())?.trim() ?? '';
        const updatedTitle = (await titleLocator.textContent())?.trim() ?? '';
        const updatedLive = (await liveRegion.textContent())?.trim() ?? '';

        expect(updatedLive).not.toBe(initialLive);
        expect(updatedLive).toContain(updatedKey);
        expect(updatedLive).toContain(updatedTitle);

        await page.keyboard.press('Enter');
        await expect(navigatorTab).toHaveAttribute('aria-selected', 'true');
    });
});

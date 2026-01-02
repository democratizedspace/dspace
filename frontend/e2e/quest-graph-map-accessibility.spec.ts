import { expect, test } from '@playwright/test';
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

    test('updates focused quest details via keyboard navigation', async ({ page }) => {
        await page.goto('/quests');
        await waitForHydration(page);

        const mapTab = page.getByRole('tab', { name: 'Map' });
        await mapTab.focus();
        await page.keyboard.press('Enter');
        await expect(mapTab).toHaveAttribute('aria-selected', 'true');

        const mapPanel = page.getByRole('tabpanel', { name: 'Map' });
        await expect(mapPanel).toBeVisible();

        const mapCanvas = page.getByRole('region', { name: 'Quest graph map' });
        await expect(mapCanvas).toBeVisible();
        await page.waitForFunction(() => window.__questGraphCy != null, { timeout: 10_000 });

        const focusedKey = page.getByTestId('focused-quest-key');
        const initialKey = (await focusedKey.textContent())?.trim();
        expect(initialKey).toBeTruthy();

        await mapCanvas.focus();
        await page.keyboard.press('ArrowDown');
        await page.waitForFunction(
            ({ key }) =>
                document.querySelector('[data-testid="focused-quest-key"]')?.textContent?.trim() !==
                key,
            { key: initialKey },
            { timeout: 5_000 }
        );
        const afterFirstChange = (await focusedKey.textContent())?.trim();

        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(
            ({ previous }) =>
                document.querySelector('[data-testid="focused-quest-key"]')?.textContent?.trim() !==
                previous,
            { previous: afterFirstChange },
            { timeout: 5_000 }
        );

        await page.keyboard.press('Enter');
        const navigatorTab = page.getByRole('tab', { name: 'Navigator' });
        await expect(navigatorTab).toHaveAttribute('aria-selected', 'true');

        await mapTab.focus();
        await page.keyboard.press('Enter');
        await expect(mapTab).toHaveAttribute('aria-selected', 'true');
    });
});
